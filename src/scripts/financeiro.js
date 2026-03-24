const mockFinancialData = {
  transactions: [
    { id: "t1", tipo: "Entrada", categoria: "Salário", valor: 6200, descricao: "Salário mensal líquido", data: "2026-03-05" },
    { id: "t2", tipo: "Entrada", categoria: "Freelance", valor: 1300, descricao: "Projeto pontual de front-end", data: "2026-03-12" },
    { id: "t3", tipo: "Saída", categoria: "Gastos Fixos", valor: 1800, descricao: "Aluguel", data: "2026-03-02" },
    { id: "t4", tipo: "Saída", categoria: "Gastos Fixos", valor: 220, descricao: "Internet e telefone", data: "2026-03-04" },
    { id: "t5", tipo: "Saída", categoria: "Gastos Variáveis", valor: 580, descricao: "Supermercado da semana", data: "2026-03-10" },
    { id: "t6", tipo: "Saída", categoria: "Gastos Variáveis", valor: 210, descricao: "Mobilidade e apps", data: "2026-03-13" },
    { id: "t7", tipo: "Saída", categoria: "Reserva de Emergência", valor: 700, descricao: "Aporte automático", data: "2026-03-08" },
    { id: "t8", tipo: "Saída", categoria: "Investimentos", valor: 900, descricao: "ETF internacional", data: "2026-03-15" },
    { id: "t9", tipo: "Saída", categoria: "Investimentos", valor: 320, descricao: "Renda fixa pós-fixada", data: "2026-02-16" },
    { id: "t10", tipo: "Saída", categoria: "Gastos Variáveis", valor: 160, descricao: "Lazer de fim de semana", data: "2026-01-20" },
    { id: "t11", tipo: "Entrada", categoria: "Bônus", valor: 850, descricao: "Bônus por performance", data: "2026-01-28" },
    { id: "t12", tipo: "Saída", categoria: "Reserva de Emergência", valor: 500, descricao: "Reforço trimestral", data: "2025-11-25" },
  ],
};

const categoryMap = [
  { name: "Gastos Fixos", listId: "list-gastos-fixos", totalId: "total-gastos-fixos" },
  { name: "Gastos Variáveis", listId: "list-gastos-variaveis", totalId: "total-gastos-variaveis" },
  { name: "Reserva de Emergência", listId: "list-reserva-emergencia", totalId: "total-reserva-emergencia" },
  { name: "Investimentos", listId: "list-investimentos", totalId: "total-investimentos" },
];

let activePeriod = "mes";
let financeChart = null;

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

function getFilteredTransactions() {
  const now = new Date();

  return mockFinancialData.transactions.filter((transaction) => {
    const transactionDate = new Date(`${transaction.data}T00:00:00`);

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
      listElement.innerHTML = '<li class="quadrant-empty">Sem lançamentos neste período.</li>';
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

function openAddModal(categoria) {
}

function deleteTransaction(transactionId) {
  mockFinancialData.transactions = mockFinancialData.transactions.filter((transaction) => transaction.id !== transactionId);
  renderAll();
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
    button.addEventListener("click", () => {
      const categoria = button.dataset.addCategory || "";
      openAddModal(categoria);
    });
  });

  document.addEventListener("click", (event) => {
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
      deleteTransaction(transactionId);
    }
  });
}

function renderAll() {
  renderSummary();
  renderChart();
  renderCategoryLists();
}

bindEvents();
renderAll();
