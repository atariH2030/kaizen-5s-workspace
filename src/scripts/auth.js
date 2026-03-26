const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const submitAuthBtn = document.getElementById("submitAuthBtn");
const toggleModeBtn = document.getElementById("toggleModeBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const termsWrap = document.getElementById("termsWrap");
const termsAcceptedInput = document.getElementById("termsAccepted");
const authError = document.getElementById("authError");
const authSuccess = document.getElementById("authSuccess");
const openTermsBtn = document.getElementById("openTermsBtn");
const closeTermsBtn = document.getElementById("closeTermsBtn");
const termsModal = document.getElementById("termsModal");
const termsModalBody = document.getElementById("termsModalBody");

let isSignUpMode = false;
let termsLoaded = false;
let termsLoading = false;

function clearFeedback() {
  authError.textContent = "";
  authSuccess.textContent = "";
}

function showError(message) {
  authSuccess.textContent = "";
  authError.textContent = message;
}

function showSuccess(message) {
  authError.textContent = "";
  authSuccess.textContent = message;
}

function setLoadingState(isLoading) {
  emailInput.disabled = isLoading;
  passwordInput.disabled = isLoading;
  submitAuthBtn.disabled = isLoading;
  toggleModeBtn.disabled = isLoading;
  if (termsAcceptedInput) {
    termsAcceptedInput.disabled = isLoading;
  }
  submitAuthBtn.textContent = isLoading ? "Aguarde..." : isSignUpMode ? "Criar Conta" : "Entrar";
}

const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
const hasSupabase = Boolean(supabaseClient);

if (!hasSupabase) {
  showError("Configuração Supabase ausente. Defina URL e ANON KEY para autenticar.");
}

async function handleSignUp(email, password) {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

async function handleLogin(email, password) {
  if (!supabaseClient) {
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

function updateAuthMode() {
  clearFeedback();

  authTitle.textContent = isSignUpMode ? "Criar Conta" : "Entrar";
  submitAuthBtn.textContent = isSignUpMode ? "Criar Conta" : "Entrar";
  toggleModeBtn.textContent = isSignUpMode ? "Já tenho conta" : "Ainda não tenho conta";
  termsWrap.classList.toggle("is-hidden", !isSignUpMode);

  passwordInput.setAttribute("autocomplete", isSignUpMode ? "new-password" : "current-password");

  if (!isSignUpMode && termsAcceptedInput) {
    termsAcceptedInput.checked = false;
  }
}

async function fetchTermsMarkdown() {
  const paths = ["/TERMOS_E_PRIVACIDADE.md", "../../TERMOS_E_PRIVACIDADE.md"];
  let lastError = null;

  for (const path of paths) {
    try {
      const response = await fetch(path, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Falha ao carregar termos (${response.status}).`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Não foi possível carregar os termos.");
}

async function loadTerms() {
  if (!termsModalBody || termsLoading || termsLoaded) {
    return;
  }

  termsLoading = true;
  termsModalBody.innerHTML = "<p>Carregando Termos de Uso e Política de Privacidade...</p>";

  try {
    const markdownContent = await fetchTermsMarkdown();
    const parsedHtml = window.marked?.parse ? window.marked.parse(markdownContent) : markdownContent;
    termsModalBody.innerHTML = parsedHtml;
    termsLoaded = true;
  } catch (error) {
    termsModalBody.innerHTML = "<p>Não foi possível carregar os Termos de Uso agora. Tente novamente mais tarde.</p>";
  } finally {
    termsLoading = false;
  }
}

function openTermsModal() {
  if (!termsModal) {
    return;
  }

  termsModal.classList.remove("is-hidden");
  termsModal.setAttribute("aria-hidden", "false");
  loadTerms();
}

function closeTermsModal() {
  if (!termsModal) {
    return;
  }

  termsModal.classList.add("is-hidden");
  termsModal.setAttribute("aria-hidden", "true");
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearFeedback();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Preencha e-mail e senha.");
    return;
  }

  if (isSignUpMode && termsAcceptedInput && !termsAcceptedInput.checked) {
    showError("Você precisa aceitar os Termos de Uso e Política de Privacidade.");
    return;
  }

  if (!supabaseClient) {
    showError("Supabase não configurado. Atualize as variáveis de ambiente no front-end.");
    return;
  }

  try {
    setLoadingState(true);

    if (isSignUpMode) {
      await handleSignUp(email, password);
      showSuccess("Conta criada. Verifique seu e-mail para confirmar o cadastro.");
      isSignUpMode = false;
      updateAuthMode();
    } else {
      await handleLogin(email, password);
      window.location.href = "estudos.html";
    }
  } catch (error) {
    const message = error?.message || "Não foi possível concluir a autenticação.";
    showError(message);
  } finally {
    setLoadingState(false);
  }
});

toggleModeBtn.addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;
  updateAuthMode();
});

openTermsBtn.addEventListener("click", openTermsModal);
closeTermsBtn.addEventListener("click", closeTermsModal);

termsModal.addEventListener("click", (event) => {
  if (event.target === termsModal) {
    closeTermsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTermsModal();
  }
});

updateAuthMode();
