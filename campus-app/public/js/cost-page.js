
    const form = document.getElementById('cost-form');
    const status = document.getElementById('status');
    const total = document.getElementById('total');
    const breakdown = document.getElementById('breakdown');
    const fields = Array.from(form.querySelectorAll('input'));

    function showError(message) {
      status.textContent = message;
      status.className = 'alert error';
      total.textContent = 'Total: —';
      breakdown.replaceChildren();
    }

    function renderBreakdown(items) {
      breakdown.replaceChildren();
      const table = document.createElement('table');
      table.className = 'table';
      const head = document.createElement('thead');
      const headerRow = document.createElement('tr');
      ['Category', 'Quantity', 'Amount'].forEach(function (heading) {
        const cell = document.createElement('th');
        cell.textContent = heading;
        headerRow.appendChild(cell);
      });
      head.appendChild(headerRow);
      table.appendChild(head);

      const body = document.createElement('tbody');
      items.forEach(function (item) {
        const row = document.createElement('tr');
        [item.label, item.quantity, item.amount_azn + ' AZN'].forEach(function (value) {
          const cell = document.createElement('td');
          cell.textContent = String(value);
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      table.appendChild(body);
      breakdown.appendChild(table);
    }

    async function calculate(event) {
      if (event) event.preventDefault();
      const params = new URLSearchParams();
      fields.forEach(function (field) {
        params.set(field.name, field.value);
      });
      status.textContent = 'Calculating...';
      status.className = 'alert info';
      try {
        const response = await fetch('/api/cost-estimate?' + params.toString());
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || 'Cost request failed');
        status.textContent = 'Estimate ready.';
        status.className = 'alert success';
        total.textContent = 'Total: ' + body.total_azn + ' AZN';
        renderBreakdown(body.breakdown);
      } catch (err) {
        showError('Could not load the cost estimate.');
      }
    }

    form.addEventListener('submit', calculate);
    fields.forEach(function (field) {
      field.addEventListener('change', calculate);
    });
    calculate();
  