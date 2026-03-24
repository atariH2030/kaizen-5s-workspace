const mockUserProfile = {
  nome: "Rafael Kaizen",
  nivel: 15,
  idRegional: "KZN-SP-8492",
  xpAtual: 1280,
  xpProximoNivel: 1500,
  moedasKaizen: 2420,
  pontuacaoTemporada: 890,
  xpTotal: 7340,
  rankingSemanal: "3o Lugar",
  amigos: ["KZN-RJ-1204", "KZN-PR-7711", "KZN-MG-4410"],
  mailbox: [
    {
      titulo: "Convite de amizade recebido",
      descricao: "KZN-RS-0908 quer conectar com voce para desafios semanais."
    },
    {
      titulo: "Ganhaste 50 moedas bonus!",
      descricao: "Disciplina 5S mantida por 7 dias consecutivos."
    }
  ],
  historico: [
    {
      titulo: "Subida para Nivel 15",
      data: "22 mar 2026",
      descricao: "Concluiu 5 ciclos de foco completos na semana.",
      xp: 300
    },
    {
      titulo: "Meta de Temporada Atingida",
      data: "18 mar 2026",
      descricao: "Ultrapassou 800 pontos na temporada atual.",
      xp: 220
    },
    {
      titulo: "Streak de Disciplina 5S",
      data: "12 mar 2026",
      descricao: "Manteve organizacao diaria por 10 dias.",
      xp: 180
    }
  ]
};

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function renderProfile() {
  const nameNode = document.getElementById("profileName");
  const levelNode = document.getElementById("profileLevel");
  const idNode = document.getElementById("profileRegionalId");
  const avatarNode = document.getElementById("profileAvatar");

  if (!nameNode || !levelNode || !idNode || !avatarNode) return;

  nameNode.textContent = mockUserProfile.nome;
  levelNode.textContent = `Lvl ${mockUserProfile.nivel}`;
  idNode.textContent = mockUserProfile.idRegional;
  avatarNode.textContent = getInitials(mockUserProfile.nome) || "K5";
}

function renderStats() {
  const xpText = document.getElementById("xpText");
  const xpPercent = document.getElementById("xpPercent");
  const xpFill = document.getElementById("xpFill");
  const coinsValue = document.getElementById("coinsValue");
  const seasonVsTotal = document.getElementById("seasonVsTotal");
  const weeklyRank = document.getElementById("weeklyRank");
  const friendsCount = document.getElementById("friendsCount");

  const ratio = Math.min(
    100,
    Math.round((mockUserProfile.xpAtual / mockUserProfile.xpProximoNivel) * 100)
  );

  if (xpText) {
    xpText.textContent = `${formatNumber(mockUserProfile.xpAtual)} / ${formatNumber(mockUserProfile.xpProximoNivel)}`;
  }

  if (xpPercent) {
    xpPercent.textContent = `${ratio}% concluido`;
  }

  if (xpFill) {
    xpFill.style.width = `${ratio}%`;
  }

  if (coinsValue) {
    coinsValue.textContent = formatNumber(mockUserProfile.moedasKaizen);
  }

  if (seasonVsTotal) {
    seasonVsTotal.textContent = `${formatNumber(mockUserProfile.pontuacaoTemporada)} / ${formatNumber(mockUserProfile.xpTotal)}`;
  }

  if (weeklyRank) {
    weeklyRank.textContent = mockUserProfile.rankingSemanal;
  }

  if (friendsCount) {
    friendsCount.textContent = String(mockUserProfile.amigos.length);
  }
}

function renderMailbox() {
  const mailboxList = document.getElementById("mailboxList");
  if (!mailboxList) return;

  mailboxList.innerHTML = "";

  mockUserProfile.mailbox.forEach((mail) => {
    const item = document.createElement("li");
    item.className = "mailbox-item";
    item.innerHTML = `<strong>${mail.titulo}</strong><p>${mail.descricao}</p>`;
    mailboxList.appendChild(item);
  });
}

function renderTimeline() {
  const timelineList = document.getElementById("timelineList");
  if (!timelineList) return;

  timelineList.innerHTML = "";

  mockUserProfile.historico.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "timeline-item";
    item.innerHTML = `
      <span class="timeline-marker" aria-hidden="true"></span>
      <div class="timeline-content">
        <div class="timeline-title">${entry.titulo}</div>
        <div class="timeline-meta">${entry.data} | +${entry.xp} XP</div>
        <div class="timeline-meta">${entry.descricao}</div>
      </div>
    `;

    timelineList.appendChild(item);
  });
}

async function copyProfileId() {
  const copyFeedback = document.getElementById("copyFeedback");
  const value = mockUserProfile.idRegional;

  try {
    await navigator.clipboard.writeText(value);
  } catch (_error) {
    const temp = document.createElement("textarea");
    temp.value = value;
    temp.setAttribute("readonly", "");
    temp.style.position = "absolute";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    document.body.removeChild(temp);
  }

  if (copyFeedback) {
    copyFeedback.textContent = "Copiado!";
    setTimeout(() => {
      if (copyFeedback.textContent === "Copiado!") {
        copyFeedback.textContent = "";
      }
    }, 1500);
  }
}

function handleAddFriend() {
  const input = document.getElementById("friendIdInput");
  const status = document.getElementById("friendStatus");
  const friendsCount = document.getElementById("friendsCount");
  if (!input || !status || !friendsCount) return;

  const friendId = input.value.trim().toUpperCase();

  if (!friendId) {
    status.style.color = "var(--neon-pink)";
    status.textContent = "Informe um ID valido para adicionar.";
    return;
  }

  if (!/^KZN-[A-Z]{2}-\d{4}$/.test(friendId)) {
    status.style.color = "var(--neon-pink)";
    status.textContent = "Formato esperado: KZN-UF-0000";
    return;
  }

  if (mockUserProfile.amigos.includes(friendId)) {
    status.style.color = "var(--text-soft)";
    status.textContent = "Este amigo ja esta na sua rede.";
    return;
  }

  mockUserProfile.amigos.push(friendId);
  friendsCount.textContent = String(mockUserProfile.amigos.length);
  input.value = "";

  status.style.color = "var(--neon-lime)";
  status.textContent = `${friendId} adicionado com sucesso.`;
}

function bindActions() {
  const copyBtn = document.getElementById("copyProfileIdBtn");
  const addFriendBtn = document.getElementById("addFriendBtn");
  const friendIdInput = document.getElementById("friendIdInput");

  if (copyBtn) {
    copyBtn.addEventListener("click", copyProfileId);
  }

  if (addFriendBtn) {
    addFriendBtn.addEventListener("click", handleAddFriend);
  }

  if (friendIdInput) {
    friendIdInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleAddFriend();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  renderStats();
  renderMailbox();
  renderTimeline();
  bindActions();
});
