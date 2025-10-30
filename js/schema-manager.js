// Fertilizer Schema Management Module
// Handles saving, loading, and deleting fertilizer schemas

const getCurrentSchema = () => {
  const tbody = document.querySelector('#fertilizer-table');
  const rows = tbody.querySelectorAll('tr[data-type=fertilizer]');
  const fertilizers = [];

  rows.forEach(row => {
    const fertInput = row.querySelector('input[name=fertilizer]');
    const doseInput = row.querySelector('input[name=dose]');

    if (fertInput && doseInput && fertInput.value) {
      fertilizers.push({
        name: fertInput.value,
        dose: doseInput.value,
      });
    }
  });

  // Get water dilution value
  const waterRow = document.querySelector('#water-row');
  const dilutionInput = waterRow.querySelector('input[name=dilution]');
  const dilution = dilutionInput ? dilutionInput.value : '0';

  return {
    fertilizers,
    waterDilution: dilution,
  };
};

const saveSchema = event => {
  event.preventDefault();
  const form = event.currentTarget;
  const nameInput = form.querySelector('input[name=schema-name]');
  const schemaName = nameInput.value.trim();

  // Clear any existing error message
  const existingError = form.querySelector('.schema-error');
  if (existingError) existingError.remove();

  if (!schemaName) return;

  // Check for duplicate names
  const existingSchemas = getFertilizerSchemas();
  if (existingSchemas.some(s => s.name === schemaName)) {
    showSchemaError(form, `Ein Schema mit dem Namen "${schemaName}" existiert bereits.`);
    nameInput.focus();
    return;
  }

  const schema = getCurrentSchema();

  if (schema.fertilizers.length === 0) {
    showSchemaError(form, 'Keine Dünger ausgewählt. Bitte wähle mindestens einen Dünger aus.');
    return;
  }

  const newSchema = {
    name: schemaName,
    ...schema,
    createdAt: new Date().toISOString(),
  };

  addFertilizerSchema(newSchema);
  nameInput.value = '';
  renderSchemaList();
};

const showSchemaError = (form, message) => {
  const errorDiv = document.createElement('small');
  errorDiv.className = 'schema-error';
  errorDiv.style.color = 'var(--pico-del-color)';
  errorDiv.style.display = 'block';
  errorDiv.style.marginTop = '0.5rem';
  errorDiv.textContent = message;
  form.appendChild(errorDiv);
};

const loadSchema = schemaName => {
  const schemas = getFertilizerSchemas();
  const schema = schemas.find(s => s.name === schemaName);

  if (!schema) {
    alert('Schema nicht gefunden.');
    return;
  }

  // Set loading flag to prevent auto-save
  isLoadingFertilizers = true;

  try {
    const tbody = document.querySelector('#fertilizer-table');

    // Clear existing rows except the first one
    while (tbody.querySelectorAll('tr').length > 1) {
      removeFertRow();
    }

    // Add rows if needed
    const rowsToAdd = schema.fertilizers.length - 1;
    if (rowsToAdd > 0) {
      addFertRow(rowsToAdd);
    }

    // Populate the rows
    const rows = tbody.querySelectorAll('tr[data-type=fertilizer]');
    const checklistRows = document.querySelectorAll('#checklist-table tbody tr');

    schema.fertilizers.forEach((fert, index) => {
      if (index < rows.length) {
        const row = rows[index];
        const checklistRow = checklistRows[index];

        const fertInput = row.querySelector('input[name=fertilizer]');
        if (fertInput) {
          fertInput.value = fert.name;
        }

        const doseInput = row.querySelector('input[name=dose]');
        if (doseInput) {
          doseInput.value = fert.dose;
        }

        updateFertRow(row, checklistRow);
      }
    });

    // Set water dilution
    const waterRow = document.querySelector('#water-row');
    const dilutionInput = waterRow.querySelector('input[name=dilution]');
    if (dilutionInput && schema.waterDilution !== undefined) {
      dilutionInput.value = schema.waterDilution;
      dilutionInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Close modal
    const modal = document.querySelector('#schema-modal');
    if (modal) {
      modal.querySelector("button[aria-label='Close']").click();
    }
  } finally {
    isLoadingFertilizers = false;
  }
};

const deleteSchema = schemaName => {
  // Find the schema article element
  const listContainer = document.querySelector('#schema-list');
  const articles = Array.from(listContainer.querySelectorAll('article'));
  const schemaArticle = articles.find(article => {
    const strong = article.querySelector('strong');
    return strong && strong.textContent === schemaName;
  });

  if (!schemaArticle) return;

  // Find the button container
  const buttonContainer = schemaArticle.querySelector("div[style*='display: flex; gap: 0.5rem']");
  if (!buttonContainer) return;

  // Replace buttons with confirmation buttons
  buttonContainer.innerHTML = `
    <button
      class="outline"
      onclick="event.stopPropagation(); cancelDeleteSchema('${schemaName.replace(/'/g, "\\'")}')">
      Abbrechen
    </button>
    <button
      class="secondary"
      onclick="event.stopPropagation(); confirmDeleteSchema('${schemaName.replace(/'/g, "\\'")}')">
      Bestätigen
    </button>
  `;
};

const confirmDeleteSchema = schemaName => {
  deleteFertilizerSchema(schemaName);
  renderSchemaList();
};

const cancelDeleteSchema = () => {
  renderSchemaList();
};

const renderSchemaList = () => {
  const schemas = getFertilizerSchemas();
  const listContainer = document.querySelector('#schema-list');

  if (!listContainer) return;

  if (schemas.length === 0) {
    listContainer.innerHTML = '<p style="color: var(--pico-muted-color); font-style: italic;">Keine Schemas gespeichert</p>';
    return;
  }

  listContainer.innerHTML = schemas
    .map(
      schema => `
      <article style="margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <strong>${schema.name}</strong>
            <br />
            <small style="color: var(--pico-muted-color);">
              ${schema.fertilizers.length} Dünger,
              Wasser: ${schema.waterDilution}% verdünnt
            </small>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button
              class="outline"
              onclick="event.stopPropagation(); loadSchema('${schema.name.replace(/'/g, "\\'")}')">
              Laden
            </button>
            <button
              class="outline secondary"
              onclick="event.stopPropagation(); deleteSchema('${schema.name.replace(/'/g, "\\'")}')">
              Löschen
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join('');
};
