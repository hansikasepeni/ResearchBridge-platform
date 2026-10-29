import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://kmjwiawmxzxoikpbeuyg.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttandpYXdteHp4b2lrcGJldXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MTU5NjksImV4cCI6MjEwODM5MTk2OX0.qmc9y-1muS1qk5-wOJRw7alg-FwZHKPbP1p7gSiszRE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
