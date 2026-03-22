import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nckolanwqyeecteqlbqp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ja29sYW53cXllZWN0ZXFsYnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODk2NTAsImV4cCI6MjA4NzE2NTY1MH0.VtGeTBoVZ-ueB8NiWWZJTZH_MMpkvXjxhnUAJBOZnbc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
