(function initKaizenConfig() {
  const DEFAULT_SUPABASE_URL = "https://kisuabnfirljkoehmezk.supabase.co";
  const DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc3VhYm5maXJsamtvZWhtZXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjYwMzIsImV4cCI6MjA4OTYwMjAzMn0.mf0VjU5BM6IbjElx32_scGGZnzGKAAhdwGpYzaWiJ9s";

  const metaUrl = document.querySelector('meta[name="supabase-url"]')?.content || "";
  const metaAnonKey = document.querySelector('meta[name="supabase-anon-key"]')?.content || "";
  const runtimeConfig = window.__SUPABASE_CONFIG__ || {};

  const SUPABASE_URL = (runtimeConfig.url || runtimeConfig.SUPABASE_URL || window.SUPABASE_URL || metaUrl || DEFAULT_SUPABASE_URL || "").trim();
  const SUPABASE_ANON_KEY = (runtimeConfig.anonKey || runtimeConfig.SUPABASE_ANON_KEY || runtimeConfig.SUPABASE_KEY || window.SUPABASE_ANON_KEY || window.SUPABASE_KEY || metaAnonKey || DEFAULT_SUPABASE_KEY || "").trim();

  let supabaseClientInstance = null;

  function getSupabaseClient() {
    if (supabaseClientInstance) {
      return supabaseClientInstance;
    }

    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return null;
    }

    supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClientInstance;
  }

  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.SUPABASE_KEY = SUPABASE_ANON_KEY;
  window.__SUPABASE_CONFIG__ = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    SUPABASE_KEY: SUPABASE_ANON_KEY,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  };

  window.KaizenConfig = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_KEY: SUPABASE_ANON_KEY,
    getSupabaseClient,
  };

  window.getSupabaseClient = getSupabaseClient;
})();
