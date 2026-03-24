/**
 * Kaizen 5S - Módulo de Estudos
 * Lógica de Interface focada em UX e princípios 5S
 */

// Estado mockado enquanto não conecta com Supabase (Seguindo schema.sql)
let mockSubjects = [
  {
    id: "uuid-subj-1",
    nome_materia: "Cálculo Numérico",
    link_google_drive: "https://drive.google.com/drive/folders/mock1",
  },
  {
    id: "uuid-subj-2",
    nome_materia: "Banco de Dados",
    link_google_drive: "https://drive.google.com/drive/folders/mock2",
  },
  {
    id: "uuid-subj-3",
    nome_materia: "Engenharia de Software",
    link_google_drive: "https://drive.google.com/drive/folders/mock3",
  }
];

let mockTasks = [
  {
    id: "uuid-task-1",
    subject_id: "uuid-subj-1",
    descricao_tarefa: "Resolver Lista 03 de Derivadas",
    status: "Pendente"
  },
  {
    id: "uuid-task-2",
    subject_id: "uuid-subj-2",
    descricao_tarefa: "Modelar MER do projeto",
    status: "Pendente"
  }
];

let userProfile = {
  experiencia_xp: 120, // XP inicial mockado
  nivel: 2
};

// Referências da DOM
const subjectsGrid = document.getElementById("subjectsGrid");
const tasksList = document.getElementById("tasksList");
const subjectSelect = document.getElementById("subjectSelect");
const newTaskInput = document.getElementById("newTaskInput");
const toastContainer = document.getElementById("toastContainer");

// Elementos do Foco (Overlay)
const focusOverlay = document.getElementById("focusOverlay");
const focusTaskTitle = document.getElementById("focusTaskTitle");
const focusTimerDisplay = document.getElementById("focusTimerDisplay");

// Variáveis de Estado do Temporizador (Pomodoro 5S)
let focusInterval = null;
let timeLeft = 25 * 60; // 25 Minutos em segundos
let currentFocusTaskId = null;

/**
 * Busca Matérias e renderiza na interface
 */
async function fetchSubjects() {
  // Simulação de chamada async (Supabase)
  const subjects = await new Promise((resolve) => setTimeout(() => resolve(mockSubjects), 300));
  
  // Limpar containers
  subjectsGrid.innerHTML = "";
  subjectSelect.innerHTML = '<option value="" disabled selected>Selecione a Matéria</option>';

  if (subjects.length === 0) {
    subjectsGrid.innerHTML = `<p style="color: var(--text-soft); font-size: 0.9rem;">Nenhuma matéria cadastrada.</p>`;
    return;
  }

  subjects.forEach(subject => {
    // Adicionar à grid de Cards
    const card = document.createElement("div");
    card.className = "subject-card";
    card.innerHTML = `
      <h3>${subject.nome_materia}</h3>
      <a href="${subject.link_google_drive}" target="_blank" rel="noopener noreferrer" class="btn-quick-access">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        Acesso Rápido
      </a>
    `;
    subjectsGrid.appendChild(card);

    // Adicionar ao Select de 2S (Captura Rápida)
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.nome_materia;
    subjectSelect.appendChild(option);
  });
}

/**
 * Busca Tarefas pendentes e renderiza na interface
 */
async function fetchTasks() {
  // Simula busca no banco filtrando as não arquivadas (que vamos considerar que a API já faria)
  const tasks = await new Promise((resolve) => setTimeout(() => resolve(mockTasks), 400));
  
  tasksList.innerHTML = "";

  const pendingTasks = tasks.filter(t => t.status === "Pendente");

  if (pendingTasks.length === 0) {
    tasksList.innerHTML = `<li style="color: var(--text-soft); font-size: 0.9rem; text-align: center; padding: 20px;">Nenhuma tarefa pendente. Tempo de descanso!</li>`;
    return;
  }

  pendingTasks.forEach(task => {
    const subject = mockSubjects.find(s => s.id === task.subject_id);
    const subjectName = subject ? subject.nome_materia : "Desconhecido";

    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.taskId = task.id;

    // A estrutura conta com o checkbox, as informações ao lado e o botão de foco
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" onchange="completeTask('${task.id}')" />
      <div class="task-content">
        <span class="task-text">${task.descricao_tarefa}</span>
        <span class="task-badge">${subjectName}</span>
      </div>
      <button class="btn-focus" onclick="startFocus('${task.id}')" title="Entrar em Foco">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        Foco
      </button>
    `;

    tasksList.appendChild(li);
  });
}

/**
 * Completa a tarefa (Atualização no Banco)
 * 5S: Shitsuke (Disciplina) - Premia o usuário por completar uma tarefa
 */
async function completeTask(id) {
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) return;

  // 1. Encontra o elemento visual
  const taskElement = document.querySelector(`.task-item[data-task-id="${id}"]`);
  
  if (taskElement) {
    // 2. Feedback visual IMEDIATO na UI
    taskElement.classList.add("completed");
    
    // Pequeno atraso para a animação de "marcado" rodar antes de sumir
    setTimeout(() => {
      // 3. Atualizar no banco (Mock)
      mockTasks[taskIndex].status = "Concluída";
      
      // Remove do DOM
      taskElement.style.display = "none";
      
      // 4. Se a lista ficou vazia, re-renderizar para mensagem de empty state
      if (!mockTasks.some(t => t.status === "Pendente")) {
        fetchTasks();
      }

      // 5. Ganho de XP e Feedback Positivo (Gamificação)
      awardXP(25);
    }, 500); 
  }
}

/**
 * Concede XP ao usuário (Gamificação) e mostra Alerta visual
 */
function awardXP(points) {
  // Incrementa no Profile do Usuário
  userProfile.experiencia_xp += points;
  
  // Confere Level Up (Mock logic - ex: cada 100 xp avança nivel)
  const newLevel = Math.floor(userProfile.experiencia_xp / 100) + 1;
  const levelUp = newLevel > userProfile.nivel;
  if(levelUp) userProfile.nivel = newLevel;

  // Cria visual toast
  const toast = document.createElement("div");
  toast.className = "toast-xp";
  
  let msg = `+${points} XP Ganho!`;
  if(levelUp) msg += ` 🎉 Level Up (${newLevel})!`;
  
  toast.textContent = msg;

  toastContainer.appendChild(toast);

  // Remove o elemento após a animação terminar (3s)
  setTimeout(() => {
    if(toastContainer.contains(toast)) {
      toastContainer.removeChild(toast);
    }
  }, 3000);
}

/**
 * Captura Rápida de Atividades (2S - Event Listener do Enter)
 */
newTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    
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

    // Criar nova Task
    const newTask = {
      id: `uuid-task-${Date.now()}`,
      subject_id: subjectId,
      descricao_tarefa: text,
      status: "Pendente"
    };

    mockTasks.push(newTask);
    
    // Resetar campos
    newTaskInput.value = "";
    
    // Atualizar UI
    fetchTasks();
  }
});

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  fetchSubjects();
  fetchTasks();
});

// ==========================================
// 3S: Temporizador de Foco Gamificado (Seiso)
// Oculta tudo na tela focado apenas em 1 tarefa
// ==========================================

/**
 * Inicia a sessão de hiperfoco
 */
function startFocus(taskId) {
  const task = mockTasks.find(t => t.id === taskId);
  if (!task) return;

  currentFocusTaskId = taskId;
  timeLeft = 25 * 60; // Resetar para 25min (ou substitua para testes rápidos: ex: 5s)
  
  focusTaskTitle.textContent = `Em foco: ${task.descricao_tarefa}`;
  updateTimerDisplay();
  
  // Mostrar modal em tela cheia cobrindo o site
  focusOverlay.classList.add("active");
  toggleTempoClimaWidget(true);

  // Iniciar relógio
  focusInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      finishFocus();
    }
  }, 1000);
}

/**
 * Formata os segundos em MM:SS no ecrã
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");
  
  focusTimerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
  
  // Altera a cor se tiver acabando (menos de 1 minuto)
  if(timeLeft < 60) {
    focusTimerDisplay.style.color = "var(--neon-pink)";
    focusTimerDisplay.style.textShadow = "0 0 20px rgba(255, 62, 191, 0.3)";
  } else {
    focusTimerDisplay.style.color = "var(--neon-cyan)";
    focusTimerDisplay.style.textShadow = "0 0 20px rgba(0, 229, 255, 0.3)";
  }
}

/**
 * Finaliza o foco com sucesso (Shitsuke/Disciplina)
 */
function finishFocus() {
  clearInterval(focusInterval);
  focusInterval = null;
  
  focusOverlay.classList.remove("active");
  toggleTempoClimaWidget(false);
  
  // Chama a conclusão normal da tarefa, passando o ID focado
  if(currentFocusTaskId) {
    completeTask(currentFocusTaskId);
    currentFocusTaskId = null;
  }
  
  // Bônus explícito de disciplina fora o gain normal
  setTimeout(() => {
     awardXP(25); // O completeTask ja dá 25, enviamos +25 como bônus (Total: 50XP)
     showToast("Foco Concluído! Bônus de Hiperfoco Aplicado.", "var(--neon-lime)");
  }, 1000);
}

/**
 * Utilizador desiste a meio do pomodoro
 */
function abandonFocus() {
  if(!confirm("Atenção! Interromper o foco agora resultará na perda do bônus. Tens a certeza?")) return;
  
  clearInterval(focusInterval);
  focusInterval = null;
  currentFocusTaskId = null;
  
  focusOverlay.classList.remove("active");
  toggleTempoClimaWidget(false);
  showToast("Foco interrompido.", "var(--neon-pink)");
}

/**
 * Função utilitária para Toast genérico (além do XP)
 */
function showToast(mensagem, cor) {
  const toast = document.createElement("div");
  toast.className = "toast-xp";
  toast.style.background = cor;
  toast.style.boxShadow = `0 4px 12px ${cor.replace(')', ', 0.3)').replace('rgb', 'rgba')}`;
  toast.textContent = mensagem;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if(toastContainer.contains(toast)) {
      toastContainer.removeChild(toast);
    }
  }, 3000);
}

function toggleTempoClimaWidget(hide) {
  if (window.KaizenWidgets) {
    window.KaizenWidgets.setGroupVisible("ambient", !hide);
    return;
  }

  const comboWidget = document.getElementById("widget-tempo-clima");
  if (!comboWidget) return;

  comboWidget.classList.toggle("widget-hidden", hide);
}