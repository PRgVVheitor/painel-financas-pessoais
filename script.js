const storageKey = "portfolio-finance-transactions";

const defaultTransactions = [
  { id: createId(), description: "Salario", category: "Renda", type: "income", amount: 3200 },
  { id: createId(), description: "Freelance landing page", category: "Renda", type: "income", amount: 850 },
  { id: createId(), description: "Aluguel", category: "Moradia", type: "expense", amount: 1100 },
  { id: createId(), description: "Mercado", category: "Alimentacao", type: "expense", amount: 540 },
  { id: createId(), description: "Internet", category: "Servicos", type: "expense", amount: 120 },
  { id: createId(), description: "Curso online", category: "Educacao", type: "expense", amount: 89 },
  { id: createId(), description: "Transporte", category: "Mobilidade", type: "expense", amount: 210 },
  { id: createId(), description: "Academia", category: "Saude", type: "expense", amount: 99 },
];

let transactions = loadTransactions();

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const elements = {
  balance: document.querySelector("#balance"),
  income: document.querySelector("#income"),
  expense: document.querySelector("#expense"),
  savingsRate: document.querySelector("#savingsRate"),
  categoryFilter: document.querySelector("#categoryFilter"),
  searchInput: document.querySelector("#searchInput"),
  transactionsTable: document.querySelector("#transactionsTable"),
  categoryBars: document.querySelector("#categoryBars"),
  largestExpense: document.querySelector("#largestExpense"),
  largestExpenseLabel: document.querySelector("#largestExpenseLabel"),
  form: document.querySelector("#transactionForm"),
  descriptionInput: document.querySelector("#descriptionInput"),
  categoryInput: document.querySelector("#categoryInput"),
  amountInput: document.querySelector("#amountInput"),
  typeInput: document.querySelector("#typeInput"),
};

function createId() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function loadTransactions() {
  const savedTransactions = localStorage.getItem(storageKey);
  return savedTransactions ? JSON.parse(savedTransactions) : defaultTransactions;
}

function saveTransactions() {
  localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function getTotals(items) {
  const income = items
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + item.amount, 0);

  const expense = items
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + item.amount, 0);

  return {
    income,
    expense,
    balance: income - expense,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
  };
}

function getFilteredTransactions() {
  const selectedCategory = elements.categoryFilter.value;
  const searchTerm = elements.searchInput.value.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesCategory =
      selectedCategory === "all" || transaction.category === selectedCategory;
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}

function renderSummary(items) {
  const totals = getTotals(items);

  elements.balance.textContent = currency.format(totals.balance);
  elements.income.textContent = currency.format(totals.income);
  elements.expense.textContent = currency.format(totals.expense);
  elements.savingsRate.textContent = `${totals.savingsRate}%`;
}

function renderCategoryOptions() {
  const currentValue = elements.categoryFilter.value;
  const categories = [...new Set(transactions.map((item) => item.category))].sort();

  elements.categoryFilter.innerHTML = '<option value="all">Todas</option>';

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  });

  elements.categoryFilter.value = categories.includes(currentValue) ? currentValue : "all";
}

function renderTransactions(items) {
  if (items.length === 0) {
    elements.transactionsTable.innerHTML = `
      <tr>
        <td colspan="5">Nenhuma transacao encontrada.</td>
      </tr>
    `;
    return;
  }

  elements.transactionsTable.innerHTML = items
    .map((transaction) => {
      const valueClass =
        transaction.type === "income" ? "value-income" : "value-expense";
      const signal = transaction.type === "income" ? "+" : "-";
      const typeLabel = transaction.type === "income" ? "Entrada" : "Saida";

      return `
        <tr>
          <td>${transaction.description}</td>
          <td><span class="tag">${transaction.category}</span></td>
          <td>${typeLabel}</td>
          <td class="${valueClass}">${signal} ${currency.format(transaction.amount)}</td>
          <td>
            <button class="ghost-button" type="button" data-remove="${transaction.id}">
              Remover
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderCategoryBars(items) {
  const expenses = items.filter((item) => item.type === "expense");
  const totalsByCategory = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
  const entries = Object.entries(totalsByCategory);
  const maxValue = Math.max(...Object.values(totalsByCategory), 1);

  if (entries.length === 0) {
    elements.categoryBars.innerHTML = "<p>Nenhum gasto para exibir.</p>";
    return;
  }

  elements.categoryBars.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([category, total]) => {
      const width = Math.round((total / maxValue) * 100);

      return `
        <div class="bar-row">
          <div class="bar-meta">
            <span>${category}</span>
            <strong>${currency.format(total)}</strong>
          </div>
          <div class="track">
            <div class="fill" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLargestExpense(items) {
  const largest = items
    .filter((item) => item.type === "expense")
    .sort((a, b) => b.amount - a.amount)[0];

  if (!largest) {
    elements.largestExpense.textContent = currency.format(0);
    elements.largestExpenseLabel.textContent = "Nenhuma despesa encontrada";
    return;
  }

  elements.largestExpense.textContent = currency.format(largest.amount);
  elements.largestExpenseLabel.textContent = largest.description;
}

function renderDashboard() {
  const filteredTransactions = getFilteredTransactions();

  renderCategoryOptions();
  renderSummary(filteredTransactions);
  renderTransactions(filteredTransactions);
  renderCategoryBars(filteredTransactions);
  renderLargestExpense(filteredTransactions);
}

function addTransaction(event) {
  event.preventDefault();

  const transaction = {
    id: createId(),
    description: elements.descriptionInput.value.trim(),
    category: elements.categoryInput.value.trim(),
    type: elements.typeInput.value,
    amount: Number(elements.amountInput.value),
  };

  transactions = [transaction, ...transactions];
  saveTransactions();
  elements.form.reset();
  renderDashboard();
}

function removeTransaction(event) {
  const button = event.target.closest("[data-remove]");

  if (!button) {
    return;
  }

  transactions = transactions.filter((item) => item.id !== button.dataset.remove);
  saveTransactions();
  renderDashboard();
}

elements.categoryFilter.addEventListener("change", renderDashboard);
elements.searchInput.addEventListener("input", renderDashboard);
elements.form.addEventListener("submit", addTransaction);
elements.transactionsTable.addEventListener("click", removeTransaction);

renderDashboard();
