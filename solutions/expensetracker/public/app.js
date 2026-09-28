(() => {
  const form = document.querySelector('[data-expense-form]');
  const monthInput = document.querySelector('[data-month]');
  const dateInput = document.querySelector('[data-date-input]');
  const categorySelect = document.querySelector('[data-category-select]');
  const formError = document.querySelector('[data-form-error]');
  const list = document.querySelector('[data-expense-list]');
  const listEmpty = document.querySelector('[data-list-empty]');
  const confirmDialog = document.querySelector('[data-confirm-dialog]');
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  let summaryRequest = 0;
  let expensesRequest = 0;

  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const payload = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(payload?.error || 'The request could not be completed.');
    return payload;
  }

  function formattedMonth(month) {
    if (!/^\d{4}-\d{2}$/.test(month)) return 'THIS MONTH';
    const [year, monthNumber] = month.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1)).toUpperCase();
  }

  function renderCategories(totals) {
    const container = document.querySelector('[data-category-chart]');
    const empty = document.querySelector('[data-category-empty]');
    const rows = ExpenseCharts.buildCategoryRows(totals);
    empty.hidden = rows.length > 0;
    container.replaceChildren(...rows.map((item, index) => {
      const row = document.createElement('div');
      row.className = 'category-row';
      const heading = document.createElement('div');
      heading.className = 'category-row-heading';
      const label = document.createElement('span');
      label.className = 'category-name';
      const dot = document.createElement('span');
      dot.className = `category-dot category-color-${index % 6}`;
      label.append(dot, document.createTextNode(item.category));
      const amount = document.createElement('strong');
      amount.textContent = money.format(item.total);
      heading.append(label, amount);
      const track = document.createElement('div');
      track.className = 'category-track';
      const fill = document.createElement('span');
      fill.className = `category-fill category-color-${index % 6}`;
      fill.style.width = `${item.percentage}%`;
      track.append(fill);
      row.append(heading, track);
      return row;
    }));
  }

  function renderDaily(totals) {
    const container = document.querySelector('[data-daily-chart]');
    const empty = document.querySelector('[data-daily-empty]');
    const bars = ExpenseCharts.buildDailyBars(totals);
    empty.hidden = bars.some((bar) => bar.total > 0);
    container.replaceChildren(...bars.map((item) => {
      const column = document.createElement('div');
      column.className = 'daily-column';
      const value = document.createElement('span');
      value.className = 'daily-value';
      value.textContent = item.total > 0 ? money.format(item.total) : '';
      const track = document.createElement('div');
      track.className = 'daily-track';
      const fill = document.createElement('span');
      fill.className = item.total > 0 ? 'daily-fill has-value' : 'daily-fill';
      fill.style.height = `${item.height}%`;
      track.append(fill);
      const day = document.createElement('span');
      day.className = 'daily-label';
      day.textContent = item.date.slice(-2);
      column.append(value, track, day);
      if (item.total > 0) column.title = `${item.date}: ${money.format(item.total)}`;
      return column;
    }));
  }

  function renderExpenses(expenses) {
    const rows = expenses.map((expense) => {
      const row = document.createElement('tr');
      const description = document.createElement('td');
      description.className = 'description-cell';
      const marker = document.createElement('span');
      marker.className = 'expense-marker';
      marker.textContent = expense.category.slice(0, 1).toUpperCase();
      const text = document.createElement('span');
      text.textContent = expense.description;
      description.append(marker, text);
      const category = document.createElement('td');
      const pill = document.createElement('span');
      pill.className = 'category-pill';
      pill.textContent = expense.category;
      category.append(pill);
      const date = document.createElement('td');
      date.className = 'date-cell';
      date.textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${expense.date}T00:00:00.000Z`));
      const amount = document.createElement('td');
      amount.className = 'amount-cell';
      amount.textContent = money.format(expense.amount);
      const action = document.createElement('td');
      action.className = 'action-cell';
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-row-button';
      deleteButton.type = 'button';
      deleteButton.setAttribute('aria-label', `Delete ${expense.description}`);
      deleteButton.title = 'Delete expense';
      deleteButton.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6h12M8 6V4h4v2m-7 0 1 10h8l1-10m-7 3v4m3-4v4"/></svg>';
      deleteButton.addEventListener('click', async () => {
        if (typeof confirmDialog.showModal === 'function') confirmDialog.showModal();
        else if (!window.confirm(`Delete ${expense.description}?`)) return;
        if (confirmDialog.open) {
          await new Promise((resolve) => confirmDialog.addEventListener('close', resolve, { once: true }));
          if (confirmDialog.returnValue !== 'delete') return;
        }
        deleteButton.disabled = true;
        try {
          await requestJson(`/api/expenses/${encodeURIComponent(expense.id)}`, { method: 'DELETE' });
          await refreshDashboard();
        } catch (error) {
          deleteButton.disabled = false;
          showError(error.message);
        }
      });
      action.append(deleteButton);
      row.append(description, category, date, amount, action);
      return row;
    });
    list.replaceChildren(...rows);
    listEmpty.hidden = expenses.length > 0;
    document.querySelector('[data-list-count]').textContent = `${expenses.length} ${expenses.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
  }

  async function refreshDashboard() {
    const month = monthInput.value;
    const currentSummaryRequest = ++summaryRequest;
    const currentExpensesRequest = ++expensesRequest;
    document.querySelector('[data-panel-month]').textContent = formattedMonth(month);
    document.querySelector('[data-month-caption]').textContent = formattedMonth(month);
    try {
      const [summary, expenses] = await Promise.all([
        requestJson(`/api/summary?month=${encodeURIComponent(month)}`),
        requestJson(`/api/expenses?month=${encodeURIComponent(month)}`),
      ]);
      if (currentSummaryRequest !== summaryRequest || currentExpensesRequest !== expensesRequest) return;
      document.querySelector('[data-month-total]').textContent = money.format(summary.total);
      document.querySelector('[data-expense-count]').textContent = summary.expenseCount;
      document.querySelector('[data-top-category]').textContent = summary.categoryTotals[0]?.category || '—';
      document.querySelector('[data-top-category-total]').textContent = summary.categoryTotals[0]
        ? `${money.format(summary.categoryTotals[0].total)} this month`
        : 'No spending yet';
      renderCategories(summary.categoryTotals);
      renderDaily(summary.dailyTotals);
      renderExpenses(expenses);
    } catch (error) {
      showError(error.message);
    }
  }

  async function loadCategories() {
    const categories = await requestJson('/api/categories');
    categorySelect.replaceChildren(...categories.map((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      return option;
    }));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.hidden = true;
    const values = new FormData(form);
    const expense = {
      amount: Number(values.get('amount')),
      category: values.get('category'),
      date: values.get('date'),
      description: String(values.get('description')).trim(),
    };
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await requestJson('/api/expenses', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(expense),
      });
      form.reset();
      dateInput.value = localDate();
      await refreshDashboard();
    } catch (error) {
      showError(error.message);
    } finally {
      submit.disabled = false;
    }
  });

  monthInput.addEventListener('change', refreshDashboard);
  document.querySelector('[data-refresh]').addEventListener('click', refreshDashboard);
  monthInput.value = localDate().slice(0, 7);
  dateInput.value = localDate();
  Promise.all([loadCategories(), refreshDashboard()]).catch((error) => showError(error.message));
})();