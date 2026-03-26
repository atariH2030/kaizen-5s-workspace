const categoryMap = [
  { name: "Gastos Fixos", listId: "list-gastos-fixos", totalId: "total-gastos-fixos" },
  { name: "Gastos Variáveis", listId: "list-gastos-variaveis", totalId: "total-gastos-variaveis" },
  { name: "Reserva de Emergência", listId: "list-reserva-emergencia", totalId: "total-reserva-emergencia" },
  { name: "Investimentos", listId: "list-investimentos", totalId: "total-investimentos" },
];

let activePeriod = "mes";
let financeChart = null;
let allTransactions = [];
let supabaseClient = null;
let currentUserId = null;

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getPeriodLabel() {
  if (activePeriod === "semestre") {
    return "Semestre";
  }
  if (activePeriod === "ano") {
    return "Ano";
  }
  return "Mês";
}

function parseTransactionDate(transaction) {
  return new Date(transaction.data);
}

function getFilteredTransactions() {
  const now = new Date();

  return allTransactions.filter((transaction) => {
    const transactionDate = parseTransactionDate(transaction);

    if (activePeriod === "mes") {
      return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
    }

    if (activePeriod === "semestre") {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return transactionDate >= cutoff && transactionDate <= now;
    }

    if (activePeriod === "ano") {
      return transactionDate.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

function normalizeTransaction(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    valor: Number(row.valor || 0),
    descricao: row.descricao || "Sem descrição",
    data: row.data_transacao,
  };
}

function getGlobalUserId() {
  return window.AUTH_USER_ID || window.__AUTH_USER_ID__ || sessionStorage.getItem("kaizen_user_id") || null;
}

async function resolveUserId() {
  const globalUserId = getGlobalUserId();
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

function setLoadingState(isLoading) {
  if (!isLoading) {
    return;
  }

  categoryMap.forEach((category) => {
    const listElement = document.getElementById(category.listId);
    if (listElement) {
      listElement.innerHTML = '<li class="quadrant-empty">⏳ Carregando...</li>';
    }
  });
}

function renderFetchError(message) {
  categoryMap.forEach((category) => {
    const listElement = document.getElementById(category.listId);
    const totalElement = document.getElementById(category.totalId);

    if (totalElement) {
      totalElement.textContent = formatCurrency(0);
    }

    if (listElement) {
      listElement.innerHTML = `<li class="quadrant-empty">${escapeHtml(message)}</li>`;
    }
  });
}

async function fetchTransactions() {
  if (!supabaseClient) {
    renderFetchError("Supabase não configurado para o módulo financeiro.");
    return;
  }

  setLoadingState(true);

  try {
    currentUserId = await resolveUserId();

    if (!currentUserId) {
      renderFetchError("Sessão expirada. Faça login novamente.");
      return;
    }

    const { data, error } = await supabaseClient
      .from("finance_transactions")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("is_archived", false)
      .order("data_transacao", { ascending: false });

    if (error) {
      throw error;
    }

    allTransactions = Array.isArray(data) ? data.map(normalizeTransaction) : [];
    renderAll();
  } catch (error) {
    renderFetchError(error?.message || "Falha ao carregar transações.");
  }
}

function getCategoryTotals(transactions) {
  return categoryMap.reduce((accumulator, category) => {
    const total = transactions
      .filter((item) => item.tipo === "Saída" && item.categoria === category.name)
      .reduce((sum, item) => sum + Number(item.valor), 0);

    accumulator[category.name] = total;
    return accumulator;
  }, {});
}

function renderSummary() {
  const filteredTransactions = getFilteredTransactions();

  const totalEntradas = filteredTransactions
    .filter((transaction) => transaction.tipo === "Entrada")
    .reduce((sum, transaction) => sum + Number(transaction.valor), 0);

  const totalSaidas = filteredTransactions
    .filter((transaction) => transaction.tipo === "Saída")
    .reduce((sum, transaction) => sum + Number(transaction.valor), 0);

  const saldoAtual = totalEntradas - totalSaidas;

  const summarySaldo = document.getElementById("summarySaldo");
  const summaryEntradas = document.getElementById("summaryEntradas");
  const summarySaidas = document.getElementById("summarySaidas");

  if (summarySaldo) {
    summarySaldo.textContent = formatCurrency(saldoAtual);
  }

  if (summaryEntradas) {
    summaryEntradas.textContent = formatCurrency(totalEntradas);
  }

  if (summarySaidas) {
    summarySaidas.textContent = formatCurrency(totalSaidas);
  }
}

function renderChart() {
  const canvas = document.getElementById("expenseDonutChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  const filteredTransactions = getFilteredTransactions();
  const categoryTotals = getCategoryTotals(filteredTransactions);
  const labels = categoryMap.map((category) => category.name);
  const values = labels.map((label) => categoryTotals[label] || 0);

  const rootStyles = getComputedStyle(document.documentElement);
  const textMain = rootStyles.getPropertyValue("--text-main").trim() || "#f4f6ff";
  const neonCyan = rootStyles.getPropertyValue("--neon-cyan").trim() || "#00e5ff";
  const neonLime = rootStyles.getPropertyValue("--neon-lime").trim() || "#9cff00";
  const neonPink = rootStyles.getPropertyValue("--neon-pink").trim() || "#ff3ebf";

  if (financeChart) {
    financeChart.destroy();
  }

  financeChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [neonCyan, neonLime, neonPink, "#6c7cff"],
          borderWidth: 1,
          borderColor: "#0f1117",
          hoverOffset: 10,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: textMain,
            usePointStyle: true,
            boxWidth: 10,
            boxHeight: 10,
            padding: 16,
          },
        },
      },
    },
  });

  const chartPeriodLabel = document.getElementById("chartPeriodLabel");
  if (chartPeriodLabel) {
    chartPeriodLabel.textContent = getPeriodLabel();
  }
}

function renderCategoryLists() {
  const filteredTransactions = getFilteredTransactions();
  const hasAnyExpense = filteredTransactions.some((transaction) => transaction.tipo === "Saída");

  categoryMap.forEach((category) => {
    const listElement = document.getElementById(category.listId);
    const totalElement = document.getElementById(category.totalId);

    if (!listElement || !totalElement) {
      return;
    }

    const items = filteredTransactions.filter((transaction) => transaction.tipo === "Saída" && transaction.categoria === category.name);

    const totalCategory = items.reduce((sum, item) => sum + Number(item.valor), 0);
    totalElement.textContent = formatCurrency(totalCategory);

    if (!items.length) {
      listElement.innerHTML = hasAnyExpense
        ? '<li class="quadrant-empty">Sem lançamentos neste período.</li>'
        : '<li class="quadrant-empty">Nenhum gasto registrado. Comece no botão +</li>';
      return;
    }

    listElement.innerHTML = items
      .map(
        (item) => `
          <li>
            <div class="item-meta">
              <span class="item-name">${escapeHtml(item.descricao)}</span>
              <span class="item-value">${formatCurrency(item.valor)}</span>
            </div>
            <div class="item-actions">
              <button type="button" class="item-action-btn item-note-btn" data-note="${escapeHtml(item.descricao)}" aria-label="Ver observação">📝</button>
              <button type="button" class="item-action-btn item-delete-btn" data-id="${item.id}" aria-label="Apagar item">🗑</button>
            </div>
          </li>
        `
      )
      .join("");
  });
}

async function addTransaction(payload) {
  if (!supabaseClient) {
    alert("Supabase não configurado para salvar transações.");
    return;
  }

  const userId = currentUserId || (await resolveUserId());
  if (!userId) {
    alert("Sessão inválida. Faça login novamente.");
    return;
  }

  const { error } = await supabaseClient.from("finance_transactions").insert([
    {
      user_id: userId,
      tipo: payload.tipo,
      categoria: payload.categoria,
      descricao: payload.descricao,
      valor: payload.valor,
      data_transacao: `${payload.data}T12:00:00`,
      is_archived: false,
    },
  ]);

  if (error) {
    throw error;
  }

  await fetchTransactions();
  renderChart();
}

async function openAddModal(categoria) {
  const descricao = window.prompt(`Descrição do lançamento em ${categoria}:`);
  if (!descricao || !descricao.trim()) {
    return;
  }

  const valorRaw = window.prompt("Valor (R$):", "0,00");
  if (!valorRaw) {
    return;
  }

  const valor = Number(valorRaw.replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) {
    alert("Informe um valor válido maior que zero.");
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const data = window.prompt("Data da transação (AAAA-MM-DD):", today) || today;

  try {
    await addTransaction({
      tipo: "Saída",
      categoria,
      descricao: descricao.trim(),
      valor,
      data,
    });
  } catch (error) {
    alert(error?.message || "Não foi possível salvar a transação.");
  }
}

async function deleteTransaction(transactionId) {
  if (!supabaseClient) {
    alert("Supabase não configurado para exclusão.");
    return;
  }

  if (!window.confirm("Deseja realmente apagar este lançamento?")) {
    return;
  }

  const userId = currentUserId || (await resolveUserId());
  if (!userId) {
    alert("Sessão inválida. Faça login novamente.");
    return;
  }

  const { error } = await supabaseClient
    .from("finance_transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);

  if (error) {
    alert(error?.message || "Não foi possível apagar o lançamento.");
    return;
  }

  await fetchTransactions();
  renderChart();
}

function bindEvents() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const quickAddButtons = document.querySelectorAll(".quick-add-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activePeriod = button.dataset.period || "mes";

      filterButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      renderAll();
    });
  });

  quickAddButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const categoria = button.dataset.addCategory || "";
      await openAddModal(categoria);
    });
  });

  document.addEventListener("click", async (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const deleteButton = target.closest(".item-delete-btn");
    if (!deleteButton) {
      return;
    }

    const transactionId = deleteButton.getAttribute("data-id");
    if (transactionId) {
      await deleteTransaction(transactionId);
    }
  });
}

function renderAll() {
  renderSummary();
  renderChart();
  renderCategoryLists();
}

async function initFinanceDashboard() {
  supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
  bindEvents();
  await fetchTransactions();
}

initFinanceDashboard();
