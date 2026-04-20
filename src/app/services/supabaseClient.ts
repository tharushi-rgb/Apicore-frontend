import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

type FetchArgs = Parameters<typeof fetch>;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function getMethod(input: FetchArgs[0], init?: FetchArgs[1]) {
  const initMethod = init?.method;
  if (initMethod) return initMethod.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return 'GET';
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetryableNetworkError(error: unknown) {
  // Browser fetch failures typically surface as TypeError('Failed to fetch')
  if (!(error instanceof Error)) return false;
  if (error.name === 'AbortError') return false;
  const msg = error.message.toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed');
}

function createConcurrencyLimitedFetch(fetchImpl: typeof fetch, concurrency: number): typeof fetch {
  let inFlight = 0;
  const queue: Array<{
    input: FetchArgs[0];
    init?: FetchArgs[1];
    resolve: (value: Response) => void;
    reject: (reason: unknown) => void;
  }> = [];

  const runNext = () => {
    while (inFlight < concurrency && queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      inFlight += 1;
      fetchImpl(item.input, item.init)
        .then(item.resolve, item.reject)
        .finally(() => {
          inFlight -= 1;
          runNext();
        });
    }
  };

  return ((input: FetchArgs[0], init?: FetchArgs[1]) => {
    return new Promise<Response>((resolve, reject) => {
      queue.push({ input, init, resolve, reject });
      runNext();
    });
  }) as typeof fetch;
}

function createResilientFetch(fetchImpl: typeof fetch) {
  let globalBackoffUntil = 0;

  return (async (input: FetchArgs[0], init?: FetchArgs[1]) => {
    const method = getMethod(input, init);
    const isIdempotent = method === 'GET' || method === 'HEAD';
    const maxAttempts = isIdempotent ? 3 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const now = Date.now();
      if (now < globalBackoffUntil) {
        await sleep(globalBackoffUntil - now);
      }

      try {
        const res = await fetchImpl(input, init);

        if (isIdempotent && attempt < maxAttempts && isRetryableStatus(res.status)) {
          const base = 250 * Math.pow(2, attempt - 1);
          const jitter = Math.floor(Math.random() * 150);
          await sleep(Math.min(2000, base + jitter));
          continue;
        }

        return res;
      } catch (error) {
        if (!isIdempotent || attempt >= maxAttempts || !isRetryableNetworkError(error)) {
          throw error;
        }

        // Global backoff helps avoid request storms when the network is down.
        const backoffBase = 300 * Math.pow(2, attempt - 1);
        const backoffJitter = Math.floor(Math.random() * 200);
        globalBackoffUntil = Date.now() + Math.min(2500, backoffBase + backoffJitter);
        await sleep(Math.min(2000, backoffBase + backoffJitter));
      }
    }

    // Should be unreachable, but TS wants a return.
    return fetchImpl(input, init);
  }) as typeof fetch;
}

const limitedFetch = createConcurrencyLimitedFetch((input, init) => fetch(input, init), 4);
const resilientFetch = createResilientFetch(limitedFetch);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: resilientFetch,
  },
});
