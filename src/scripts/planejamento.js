let currentDragId = null;
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

function getTaskColumnStatus(task) {
  if (task.status === "Concluído" || task.status === "Concluída") {
    return "done";
  }

  if (task.status === "Em Andamento") {
    return "doing";
  }

  return "todo";
}

function clearColumns() {
  ["kanban-todo", "kanban-doing", "kanban-done"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) {
      node.innerHTML = "";
    }
  });
}

function createTaskCard(task, status) {
  const card = document.createElement("article");
  card.className = "kanban-card";
  card.id = task.id;
  card.setAttribute("draggable", "true");
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.dataset.status = status;

  if (status === "done") {
    card.classList.add("is-completed");
  }

  const subject = subjectsState.find((item) => item.id === task.subject_id);
  const tagText = subject?.nome_materia || "Geral";

  card.innerHTML = `
    <div class="kanban-card__content">
      <h3 class="kanban-card__title">${escapeHtml(task.descricao_tarefa)}</h3>
      <span class="kanban-card__tag">${escapeHtml(tagText)}</span>
    </div>
    <button type="button" class="kanban-card__remove" aria-label="Apagar tarefa">×</button>
  `;

  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

  const removeButton = card.querySelector(".kanban-card__remove");
  removeButton?.addEventListener("click", async () => {
    await deleteTask(task.id);
  });

  return card;
}

function renderKanban() {
  clearColumns();

  const columns = {
    todo: document.getElementById("kanban-todo"),
    doing: document.getElementById("kanban-doing"),
    done: document.getElementById("kanban-done"),
  };

  tasksState.forEach((task) => {
    const columnStatus = getTaskColumnStatus(task);
    const column = columns[columnStatus];
    if (!column) {
      return;
    }

    column.appendChild(createTaskCard(task, columnStatus));
  });
}

async function fetchSubjects() {
  const { data, error } = await supabaseClient
    .from("study_subjects")
    .select("id, nome_materia")
    .eq("user_id", currentUserId)
    .eq("is_archived", false)
    .order("data_criacao", { ascending: true });

  if (error) {
    return;
  }

  subjectsState = Array.isArray(data) ? data : [];
}

async function fetchTasks() {
  const { data, error } = await supabaseClient
    .from("study_tasks")
    .select("id, subject_id, descricao_tarefa, status")
    .eq("user_id", currentUserId)
    .eq("is_archived", false)
    .order("data_criacao", { ascending: false });

  if (error) {
    clearColumns();
    return;
  }

  tasksState = Array.isArray(data) ? data : [];
  renderKanban();
}

async function updateTaskStatus(taskId, columnStatus) {
  const nextStatus = columnStatus === "done"
    ? "Concluído"
    : columnStatus === "doing"
      ? "Em Andamento"
      : "Pendente";

  const { error } = await supabaseClient
    .from("study_tasks")
    .update({ status: nextStatus })
    .eq("id", taskId)
    .eq("user_id", currentUserId);

  if (error) {
    return false;
  }

  const localTask = tasksState.find((item) => item.id === taskId);
  if (localTask) {
    localTask.status = nextStatus;
  }

  return true;
}

async function deleteTask(taskId) {
  const { error } = await supabaseClient
    .from("study_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", currentUserId);

  if (error) {
    return;
  }

  tasksState = tasksState.filter((item) => item.id !== taskId);
  renderKanban();
}

function handleDragStart(event) {
  const card = event.currentTarget;
  currentDragId = card.id;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.id);
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("is-dragging");
  document.querySelectorAll(".kanban-dropzone").forEach((zone) => {
    zone.classList.remove("is-drag-over");
  });
}

function allowDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function dragEnter(event) {
  event.preventDefault();
  document.querySelectorAll(".kanban-dropzone").forEach((zone) => {
    zone.classList.remove("is-drag-over");
  });

  const zone = event.currentTarget.closest(".kanban-dropzone");
  if (zone) {
    zone.classList.add("is-drag-over");
  }
}

async function dropCard(event) {
  event.preventDefault();

  const zone = event.currentTarget.closest(".kanban-dropzone");
  if (!zone) {
    return;
  }

  const draggedId = event.dataTransfer.getData("text/plain") || currentDragId;
  if (!draggedId) {
    return;
  }

  const previousStatus = getTaskColumnStatus(tasksState.find((task) => task.id === draggedId) || { status: "Pendente", id: draggedId });
  const nextStatus = zone.dataset.status || "todo";
  const updated = await updateTaskStatus(draggedId, nextStatus);
  if (!updated) {
    zone.classList.remove("is-drag-over");
    return;
  }

  if (previousStatus !== "done" && nextStatus === "done" && typeof window.awardProfileProgress === "function") {
    const progress = await window.awardProfileProgress({ userId: currentUserId, xp: 20, coins: 5 });
    if (progress?.ok) {
      alert("XP Recebido!");
    }
  }

  zone.classList.remove("is-drag-over");
  renderKanban();
}

async function createTaskFromPrompt() {
  const title = window.prompt("Título da tarefa:");
  if (!title || !title.trim()) {
    return;
  }

  if (!subjectsState.length) {
    alert("Cadastre ao menos uma matéria em Estudos antes de criar tarefas no Planejamento.");
    return;
  }

  const optionsText = subjectsState.map((subject, index) => `${index + 1}. ${subject.nome_materia}`).join("\n");
  const selected = window.prompt(`Selecione a matéria pelo número:\n${optionsText}`, "1");
  const selectedIndex = Number(selected) - 1;
  const subject = subjectsState[selectedIndex] || subjectsState[0];

  const { error } = await supabaseClient.from("study_tasks").insert([
    {
      user_id: currentUserId,
      subject_id: subject.id,
      descricao_tarefa: title.trim(),
      status: "Pendente",
      is_archived: false,
    },
  ]);

  if (error) {
    alert(error.message || "Não foi possível criar a tarefa.");
    return;
  }

  await fetchTasks();
}

async function initPlanejamento() {
  supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
  if (!supabaseClient) {
    return;
  }

  currentUserId = await resolveUserId();
  if (!currentUserId) {
    return;
  }

  await Promise.all([fetchSubjects(), fetchTasks()]);

  document.querySelectorAll(".kanban-dropzone").forEach((zone) => {
    zone.addEventListener("dragleave", () => {
      zone.classList.remove("is-drag-over");
    });
  });

  const addTaskButton = document.getElementById("btnNovaTarefa");
  if (addTaskButton) {
    addTaskButton.addEventListener("click", createTaskFromPrompt);
  }
}

window.allowDrop = allowDrop;
window.dragEnter = dragEnter;
window.dropCard = dropCard;

document.addEventListener("DOMContentLoaded", initPlanejamento);
