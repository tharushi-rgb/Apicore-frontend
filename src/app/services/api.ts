// api.ts — legacy REST wrapper, kept for compatibility.
// All services now use supabaseClient.ts directly.
// This file is intentionally empty and will be removed in a future cleanup.

export const api = {
  get: async <T>(_path: string): Promise<T> => { throw new Error('REST API removed. Use Supabase client.'); },
  post: async <T>(_path: string, _body?: unknown): Promise<T> => { throw new Error('REST API removed. Use Supabase client.'); },
  put: async <T>(_path: string, _body?: unknown): Promise<T> => { throw new Error('REST API removed. Use Supabase client.'); },
  patch: async <T>(_path: string, _body?: unknown): Promise<T> => { throw new Error('REST API removed. Use Supabase client.'); },
  delete: async <T>(_path: string): Promise<T> => { throw new Error('REST API removed. Use Supabase client.'); },
};
