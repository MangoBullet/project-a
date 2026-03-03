(function initConfirmButtons() {
  const forms = document.querySelectorAll('form[data-confirm]');

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      const message = form.getAttribute('data-confirm') || 'Are you sure?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });
})();

(function initEquipmentRows() {
  const rowsContainer = document.querySelector('[data-equipment-rows]');
  const addButton = document.querySelector('[data-add-equipment-row]');

  if (!rowsContainer || !addButton) {
    return;
  }

  addButton.addEventListener('click', () => {
    const firstRow = rowsContainer.querySelector('.equipment-row');
    if (!firstRow) {
      return;
    }

    const newRow = firstRow.cloneNode(true);
    const inputs = newRow.querySelectorAll('input, select');
    inputs.forEach((field) => {
      if (field.tagName === 'SELECT') {
        field.value = 'available';
      } else if (field.name === 'quantity') {
        field.value = '0';
      } else {
        field.value = '';
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-cancel';
    removeBtn.textContent = 'Remove Row';
    removeBtn.addEventListener('click', () => {
      newRow.remove();
    });

    newRow.appendChild(removeBtn);
    rowsContainer.appendChild(newRow);
  });
})();

(function initBorrowRows() {
  const rowsContainer = document.querySelector('[data-borrow-rows]');
  const addButton = document.querySelector('[data-add-borrow-row]');

  if (!rowsContainer || !addButton) {
    return;
  }

  addButton.addEventListener('click', () => {
    const firstRow = rowsContainer.querySelector('.borrow-row');
    if (!firstRow) {
      return;
    }

    const newRow = firstRow.cloneNode(true);
    const fields = newRow.querySelectorAll('input, select');
    fields.forEach((field) => {
      if (field.name === 'borrow_status') {
        field.value = 'borrowed';
      } else {
        field.value = '';
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-cancel';
    removeBtn.textContent = 'Remove Row';
    removeBtn.addEventListener('click', () => {
      newRow.remove();
    });

    newRow.appendChild(removeBtn);
    rowsContainer.appendChild(newRow);
  });
})();
