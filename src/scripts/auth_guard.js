(function initAuthGuard() {
  const LOGIN_PAGE = "login.html";
  const STORAGE_USER_KEY = "kaizen_user_id";

  const pathname = window.location.pathname || "";
  const currentPage = pathname.split("/").pop() || "";
  const isLoginPage = currentPage.toLowerCase() === LOGIN_PAGE;

  const root = document.documentElement;
  if (!isLoginPage) {
    root.style.visibility = "hidden";
  }

  function revealPage() {
    root.style.visibility = "";
  }

  function clearSessionState() {
    try {
      sessionStorage.removeItem(STORAGE_USER_KEY);
    } catch (_) {
      // noop
    }
    window.__AUTH_USER_ID__ = null;
    window.AUTH_USER_ID = null;
  }

  function persistUserState(user) {
    const userId = user?.id || null;

    if (!userId) {
      clearSessionState();
      return;
    }

    try {
      sessionStorage.setItem(STORAGE_USER_KEY, userId);
    } catch (_) {
      // noop
    }

    window.__AUTH_USER_ID__ = userId;
    window.AUTH_USER_ID = userId;
  }

  function redirectToLogin() {
    clearSessionState();
    if (!isLoginPage) {
      window.location.replace(LOGIN_PAGE);
    }
  }

  const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;

  window.handleLogout = async function handleLogout() {
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
    } finally {
      clearSessionState();
      window.location.replace(LOGIN_PAGE);
    }
  };

  if (!supabaseClient) {
    redirectToLogin();
    return;
  }

  supabaseClient.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        redirectToLogin();
        return;
      }

      const user = data?.session?.user || null;

      if (!user && !isLoginPage) {
        redirectToLogin();
        return;
      }

      if (user) {
        persistUserState(user);
        if (isLoginPage) {
          window.location.replace("estudos.html");
          return;
        }
      } else {
        clearSessionState();
      }

      revealPage();
    })
    .catch(() => {
      redirectToLogin();
    });

  supabaseClient.auth.onAuthStateChange((event, session) => {
    const user = session?.user || null;

    if (!user) {
      clearSessionState();
      if (!isLoginPage) {
        window.location.replace(LOGIN_PAGE);
      }
      return;
    }

    persistUserState(user);
  });
})();
