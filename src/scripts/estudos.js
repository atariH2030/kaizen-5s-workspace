const subjectsGrid = document.getElementById("subjectsGrid");
const tasksList = document.getElementById("tasksList");
const subjectSelect = document.getElementById("subjectSelect");
const newTaskInput = document.getElementById("newTaskInput");
const toastContainer = document.getElementById("toastContainer");

const focusOverlay = document.getElementById("focusOverlay");
const focusTaskTitle = document.getElementById("focusTaskTitle");
const focusTimerDisplay = document.getElementById("focusTimerDisplay");

let focusInterval = null;
let timeLeft = 25 * 60;
let currentFocusTaskId = null;

let supabaseClient = null;
let currentUserId = null;
let subjectsState = [];
let tasksState = [];

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function resolveUserId() {
  const globalUserId = window.AUTH_USER_ID || window.__AUTH_USER_ID__ || sessionStorage.getItem("kaizen_user_id") || null;
  if (globalUserId) {
    return globalUserId;
  }

  if (!supabaseClient) {
    return null;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    return null;
  }

  const user = data?.session?.user || null;
  if (!user?.id) {
    return null;
  }

  sessionStorage.setItem("kaizen_user_id", user.id);
  window.AUTH_USER_ID = user.id;
  window.__AUTH_USER_ID__ = user.id;

  return user.id;
}

function renderSubjects() {
  subjectsGrid.innerHTML = "";
  subjectSelect.innerHTML = '<option value="" disabled selected>Selecione a Matéria</option>';

  if (!subjectsState.length) {
    subjectsGrid.innerHTML = '<p class="subjects-grid__loading">Nenhuma matéria cadastrada.</p>';
    return;
  }

  subjectsState.forEach((subject) => {
    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `
      <h3>${escapeHtml(subject.nome_materia)}</h3>
      <a href="${escapeHtml(subject.link_google_drive || "#")}" target="_blank" rel="noopener noreferrer" class="btn-quick-access">
        Acesso Rápido
      </a>
    `;
    subjectsGrid.appendChild(card);

    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.nome_materia;
    subjectSelect.appendChild(option);
  });
}

function renderTasks() {
  tasksList.innerHTML = "";
  const pendingTasks = tasksState.filter((task) => task.status === "Pendente" || task.status === "Em Andamento");

  if (!pendingTasks.length) {
    tasksList.innerHTML = '<li class="tasks-list__loading">Nenhuma tarefa pendente. Tempo de descanso!</li>';
    return;
  }

  pendingTasks.forEach((task) => {
    const subject = subjectsState.find((item) => item.id === task.subject_id);
    const subjectName = subject ? subject.nome_materia : "Sem matéria";

    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.taskId = task.id;

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" onchange="completeTask('${task.id}')" />
      <div class="task-content">
        <span class="task-text">${escapeHtml(task.descricao_tarefa)}</span>
        <span class="task-badge">${escapeHtml(subjectName)} • ${escapeHtml(task.status)}</span>
      </div>
      <button class="btn-focus" onclick="startFocus('${task.id}')" title="Entrar em Foco">Foco</button>
    `;

    tasksList.appendChild(li);
  });
}

async function fetchSubjects() {
  const { data, error } = await supabaseClient
    .from("study_subjects")
    .select("id, nome_materia, link_google_drive")
    .eq("user_id", currentUserId)
    .eq("is_archived", false)
    .order("data_criacao", { ascending: true });

  if (error) {
    subjectsGrid.innerHTML = `<p class="subjects-grid__loading">${escapeHtml(error.message)}</p>`;
    return;
  }

  subjectsState = Array.isArray(data) ? data : [];
  renderSubjects();
}

async function fetchTasks() {
  const { data, error } = await supabaseClient
    .from("study_tasks")
    .select("id, subject_id, descricao_tarefa, status")
    .eq("user_id", currentUserId)
    .eq("is_archived", false)
    .in("status", ["Pendente", "Em Andamento", "Concluído", "Concluída"])
    .order("data_criacao", { ascending: false });

  if (error) {
    tasksList.innerHTML = `<li class="tasks-list__loading">${escapeHtml(error.message)}</li>`;
    return;
  }

  tasksState = Array.isArray(data) ? data : [];
  renderTasks();
}

function showToast(message, color) {
  const toast = document.createElement("div");
  toast.className = "toast-xp";
  if (color) {
    toast.style.background = color;
  }
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toastContainer.contains(toast)) {
      toastContainer.removeChild(toast);
    }
  }, 3000);
}

async function awardTaskProgress(xp, coins, message) {
  if (typeof window.awardProfileProgress === "function") {
    const result = await window.awardProfileProgress({ userId: currentUserId, xp, coins });
    if (!result.ok) {
      showToast("Tarefa concluída, mas o progresso não foi persistido.", "var(--neon-pink)");
      return;
    }
  }

  showToast(message, "var(--neon-lime)");
}

async function completeTask(id) {
  const taskElement = document.querySelector(`.task-item[data-task-id="${id}"]`);
  if (taskElement) {
    taskElement.classList.add("completed");
  }

  const { error } = await supabaseClient
    .from("study_tasks")
    .update({ status: "Concluído" })
    .eq("id", id)
    .eq("user_id", currentUserId);

  if (error) {
    showToast("Erro ao concluir tarefa.", "var(--neon-pink)");
    if (taskElement) {
      taskElement.classList.remove("completed");
    }
    return;
  }

  await fetchTasks();
  await awardTaskProgress(25, 5, "+25 XP • +5 Moedas");
}

async function createTaskFromInput() {
  const text = newTaskInput.value.trim();
  const subjectId = subjectSelect.value;

  if (!text) {
    alert("Por favor, digite a descrição da tarefa.");
    return;
  }

  if (!subjectId) {
    alert("Por favor, selecione uma matéria para vincular.");
    subjectSelect.focus();
    return;
  }

  const { error } = await supabaseClient.from("study_tasks").insert([
    {
      user_id: currentUserId,
      subject_id: subjectId,
      descricao_tarefa: text,
      status: "Pendente",
      is_archived: false,
    },
  ]);

  if (error) {
    alert(error.message || "Não foi possível criar a tarefa.");
    return;
  }

  newTaskInput.value = "";
  await fetchTasks();
}

function startFocus(taskId) {
  const task = tasksState.find((item) => item.id === taskId && item.status === "Pendente");
  if (!task) {
    return;
  }

  currentFocusTaskId = taskId;
  timeLeft = 25 * 60;
  focusTaskTitle.textContent = `Em foco: ${task.descricao_tarefa}`;
  updateTimerDisplay();

  focusOverlay.classList.add("active");
  toggleTempoClimaWidget(true);

  focusInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      finishFocus();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  focusTimerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (timeLeft < 60) {
    focusTimerDisplay.style.color = "var(--neon-pink)";
    focusTimerDisplay.style.textShadow = "0 0 20px rgba(255, 62, 191, 0.3)";
  } else {
    focusTimerDisplay.style.color = "var(--neon-cyan)";
    focusTimerDisplay.style.textShadow = "0 0 20px rgba(0, 229, 255, 0.3)";
  }
}

async function finishFocus() {
  clearInterval(focusInterval);
  focusInterval = null;

  focusOverlay.classList.remove("active");
  toggleTempoClimaWidget(false);

  if (!currentFocusTaskId) {
    return;
  }

  const taskId = currentFocusTaskId;
  currentFocusTaskId = null;
  await completeTask(taskId);
  await awardTaskProgress(25, 10, "Foco concluído • bônus aplicado");
}

function abandonFocus() {
  if (!confirm("Atenção! Interromper o foco agora resultará na perda do bônus. Tens a certeza?")) {
    return;
  }

  clearInterval(focusInterval);
  focusInterval = null;
  currentFocusTaskId = null;

  focusOverlay.classList.remove("active");
  toggleTempoClimaWidget(false);
  showToast("Foco interrompido.", "var(--neon-pink)");
}

function toggleTempoClimaWidget(hide) {
  if (window.KaizenWidgets) {
    window.KaizenWidgets.setGroupVisible("ambient", !hide);
    return;
  }

  const comboWidget = document.getElementById("widget-tempo-clima");
  if (!comboWidget) {
    return;
  }

  comboWidget.classList.toggle("widget-hidden", hide);
}

async function initEstudos() {
  supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!supabaseClient) {
    tasksList.innerHTML = '<li class="tasks-list__loading">Supabase não configurado para Estudos.</li>';
    return;
  }

  currentUserId = await resolveUserId();
  if (!currentUserId) {
    tasksList.innerHTML = '<li class="tasks-list__loading">Sessão inválida. Faça login novamente.</li>';
    return;
  }

  await Promise.all([fetchSubjects(), fetchTasks()]);
}

newTaskInput.addEventListener("keypress", async (event) => {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  await createTaskFromInput();
});

window.completeTask = completeTask;
window.startFocus = startFocus;
window.abandonFocus = abandonFocus;

document.addEventListener("DOMContentLoaded", initEstudos);