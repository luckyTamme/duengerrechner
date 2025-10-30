var systemTheme = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
const convTable = {
  cao: { to: "ca", factor: 0.715 },
  k2o: { to: "k", factor: 0.8302 },
  mgo: { to: "mg", factor: 0.603 },
  no3: { to: "n", factor: 0.226 },
  p2o5: { to: "p", factor: 0.436 },
  po4: { to: "p", factor: 0.326 },
  so4: { to: "s", factor: 0.334 },
};
var waterData = getWaterData();
var waterLimits = {
  kh: 10,
  n: 50,
  p: 5,
  k: 10,
  ca: 120,
  mg: 50,
  s: 65,
  na: 115,
  cl: 140,
};
var persistFertilizers = getPersistFertilizers();
var isLoadingFertilizers = false;

// Helper function to attach dropdown blur handler
const attachDropdownBlurHandler = (inputElement) => {
  inputElement.addEventListener("blur", (event) => {
    const input = event.currentTarget;
    const dropdown = input.closest("div").querySelector("ul.dropdown-list");

    // Small delay to allow click events on dropdown items to complete
    setTimeout(() => {
      if (dropdown) {
        dropdown.classList.add("hidden");
      }
    }, 150);
  });
};

// Helper function to attach keyboard navigation handler
const attachDropdownKeyboardHandler = (inputElement) => {
  inputElement.addEventListener("keydown", (event) => {
    const dropdown = event.currentTarget.closest("div").querySelector("ul.dropdown-list");
    if (!dropdown || dropdown.classList.contains("hidden")) return;

    const items = dropdown.querySelectorAll("li:not(.no-items)");
    if (items.length === 0) return;

    const highlighted = dropdown.querySelector("li.highlighted");
    let currentIndex = highlighted ? Array.from(items).indexOf(highlighted) : -1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        items.forEach((item) => item.classList.remove("highlighted"));
        items[currentIndex].classList.add("highlighted");
        items[currentIndex].scrollIntoView({ block: "nearest" });
        break;

      case "ArrowUp":
        event.preventDefault();
        currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        items.forEach((item) => item.classList.remove("highlighted"));
        items[currentIndex].classList.add("highlighted");
        items[currentIndex].scrollIntoView({ block: "nearest" });
        break;

      case "Enter":
        event.preventDefault();
        if (highlighted) {
          const itemName = highlighted.dataset.itemName;
          if (itemName) {
            event.currentTarget.value = itemName;
            event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
            dropdown.classList.add("hidden");
          }
        }
        break;

      case "Escape":
        event.preventDefault();
        dropdown.classList.add("hidden");
        break;
    }
  });
};

// Init
const init = () => {
  populateWaterModalForm();

  const checklistRow = document.querySelector("#checklist-table tbody tr");
  checklistRow.addEventListener("input", (event) => updateChecklistRow(event.currentTarget));

  const fertRow = document.querySelector("#fertilizer-table tr");
  fertRow.addEventListener("input", (event) => updateFertRow(event.currentTarget, checklistRow));

  const fertRowSearchInput = fertRow.querySelector("input[name=fertilizer]");
  fertRowSearchInput.addEventListener("focus", (event) => {
    event.currentTarget.select();
    renderDropdownItems(event.currentTarget, allFertData(), event.currentTarget.value.toLowerCase());
  });
  fertRowSearchInput.addEventListener("input", (event) => {
    renderDropdownItems(event.currentTarget, allFertData(), event.currentTarget.value.toLowerCase());
  });
  attachDropdownBlurHandler(fertRowSearchInput);
  attachDropdownKeyboardHandler(fertRowSearchInput);

  const waterRow = document.querySelector("#water-row");
  waterRow.addEventListener("input", (event) => updateWaterRow(event.currentTarget));
  updateWaterRow(waterRow);

  // Theme
  const toggleThemeButton = document.querySelector("#toggle-theme-button");
  if (systemTheme() === "light") toggleThemeButton.classList.add("theme-toggle--toggled");
  toggleThemeButton.addEventListener("click", (event) => toggleTheme(event));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (_) => {
    if (!document.documentElement.dataset.theme) toggleThemeButton.classList.toggle("theme-toggle--toggled");
  });

  // Date in Print View
  const dateElem = document.querySelector("header > div > hgroup > p");
  dateElem.textContent = dateElem.textContent.replace(
    "TT.MM.JJJJ",
    new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
  );

  // Initialize persistence toggle state
  const persistToggle = document.querySelector("#persist-fertilizers-toggle");
  persistToggle.checked = persistFertilizers;

  // Load saved fertilizers if persistence is enabled
  if (persistFertilizers) {
    loadSavedFertilizers();
  }
};

const toggleTheme = (event) => {
  event.currentTarget.classList.toggle("theme-toggle--toggled");
  const { documentElement: html } = document;
  if (!html.dataset.theme) html.dataset.theme = systemTheme();
  html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
};

// Main Table
const addFertilizer = (data) => {
  const id = 1000 + customFertData.length;
  customFertData.push({ id: id, ...data });
  setCustomFertData(customFertData);
};

const addFertRow = (numRows = 1) => {
  const rowButtons = document.querySelector("#fertilizer-row-buttons");
  const tbody = document.querySelector("#fertilizer-table");
  for (let i = 0; i < numRows; i++) {
    const checklistRow = addRow(document.querySelector("#checklist-table tbody"), (event) =>
      updateChecklistRow(event.currentTarget)
    );
    const row = addRow(tbody, (event) => updateFertRow(event.currentTarget, checklistRow), rowButtons);
    const rowSearchInput = row.querySelector("input[name=fertilizer]");
    rowSearchInput.addEventListener("focus", (event) => {
      event.currentTarget.select();
      renderDropdownItems(event.currentTarget, allFertData(), event.currentTarget.value.toLowerCase());
    });
    rowSearchInput.addEventListener("input", (event) => {
      renderDropdownItems(event.currentTarget, allFertData(), event.currentTarget.value.toLowerCase());
    });
    attachDropdownBlurHandler(rowSearchInput);
    attachDropdownKeyboardHandler(rowSearchInput);
  }
  rowButtons.querySelectorAll("button")[1].disabled = false;
};

const updateFertRow = (row, checklistRow) => {
  const data = allFertData().find((item) => item.name == row.querySelector("input[name=fertilizer]").value);
  if (data === undefined) return;
  const dose = toFloat(row.querySelector("input[name=dose]").value);
  const inputContainer = row.querySelector("div.input-container");
  inputContainer.classList.remove("milliliter", "gram");
  inputContainer.classList.add(data.u === "g" ? "gram" : "milliliter");
  updateRow(row, { dose: `${formatValue(dose, 2, data.u)}`, ...data }, dose);
  updateChecklistRow(checklistRow, { dose, ...data });
  updateSums();

  // Auto-save if persistence is enabled (but not during initial load)
  if (persistFertilizers && !isLoadingFertilizers) {
    saveFertilizers();
  }
};

const removeFertRow = () => {
  const rowButtons = document.querySelector("#fertilizer-row-buttons");
  const tbody = document.querySelector("#fertilizer-table");
  removeRow(tbody, rowButtons);
  if (tbody.querySelectorAll("tr").length === 1) rowButtons.querySelectorAll("button")[1].disabled = true;
  removeRow(document.querySelector("#checklist-table tbody"));
  updateSums();

  // Auto-save if persistence is enabled (but not during initial load)
  if (persistFertilizers && !isLoadingFertilizers) {
    saveFertilizers();
  }
};

const updateWaterRow = (row) => {
  if (Object.keys(waterData).length === 0) return;
  const data = {
    gh: calcGH(waterData.ca, waterData.mg),
    kh: calcKH(waterData.ks),
    ...waterData,
  };
  const dilution = toFloat(row.querySelector("input[name=dilution]").value);
  const dilutionStr = dilution === 0 ? "unverdünnt" : formatValue(dilution, 0, "%");
  updateRow(row, { dilution: dilutionStr, ...data }, 1 - dilution / 100, waterLimits);
  updateSums();
};

const updateSums = () => {
  let nSum;
  ["n", "n-no3", "n-nh4", "n-nu", "n-org", "p", "k", "ca", "mg", "s", "b", "cu", "fe", "mn", "mo", "zn"].forEach(
    (name) => {
      let value = Array.from(
        document.querySelectorAll(`span[name=${name}]`),
        (elem) => parseFloat(elem.dataset.value) || 0
      ).reduce((a, c) => a + c, 0);
      if (name === "n") nSum = value;
      document.querySelector(`#${name}-sum`).textContent = ["n-no3", "n-nh4", "n-nu", "n-org"].includes(name)
        ? `${formatValue((value / nSum) * 100, 0, "%", "0")}`
        : formatValue(value, decimals(name));
    }
  );
};

const changeOptRanges = () => {
  document.querySelectorAll("#opt-ranges em[data-stage]").forEach((em) => em.classList.toggle("hidden"));
};

const showMicros = (event) => {
  document.querySelectorAll(".macro").forEach((elem) => elem.classList.add("hidden"));
  document.querySelectorAll(".micro").forEach((elem) => elem.classList.remove("hidden"));
  toggleScrollButtons(event);
};

const showMacros = (event) => {
  document.querySelectorAll(".macro:not(.n-form)").forEach((elem) => elem.classList.remove("hidden"));
  document.querySelectorAll(".micro").forEach((elem) => elem.classList.add("hidden"));
  toggleScrollButtons(event);
};

const toggleScrollButtons = (event) => {
  const {
    currentTarget: activeButton,
    currentTarget: { parentNode: scrollButtons },
  } = event;
  const disabledButton = scrollButtons.querySelector("button[disabled]");
  activeButton.disabled = true;
  disabledButton.disabled = false;
};

const toggleNForm = (event) => {
  document.querySelectorAll(".n-form").forEach((elem) => elem.classList.toggle("hidden"));
  event.currentTarget.toggleAttribute("toggled");
};

// New Fertilizer Modal
const changePhase = (u) => {
  if (u.value == "g") {
    u.form.density.value = 1;
    u.form.density.readOnly = true;
  } else u.form.density.readOnly = false;
};

const saveNewFertilizerForm = (event) => {
  const data = saveModalForm(event);
  if (!data) return;
  const density = toFloat(data.get("density"));
  data.delete("density");
  let res = {};
  for (const [k, v] of data.entries()) {
    if (convTable[k]) {
      res[convTable[k].to] = round(v * convTable[k].factor * 10 * density);
    } else res[k] = isNaN(v) ? v : round(v * 10 * density);
  }
  addFertilizer(res);
  toggleModal(event);
  event.currentTarget.reset();
};

// Water Modal
const populateWaterModalForm = () => {
  const form = document.getElementById("water-modal-form");
  form.querySelectorAll("input[type=number]:not([disabled])").forEach((input) => {
    if (convTable[input.name]) {
      input.value = round(waterData[convTable[input.name].to] / convTable[input.name].factor, 1);
    } else input.value = waterData[input.name];
  });
  updateCalculatedValues(form);
};

const convertValue = (event) => {
  const {
    currentTarget: {
      form,
      value: convFac,
      dataset: { target },
    },
  } = event;
  form[target].value = (toFloat(form[target].value) / convFac).toFixed(convFac < 1 ? 1 : 3);
  form[target].setAttribute("step", convFac < 1 ? "0.1" : "0.001");
};

const updateCalculatedValuesEventHandler = (event) => {
  const {
    currentTarget: { form },
  } = event;
  updateCalculatedValues(form);
};

const updateCalculatedValues = (form) => {
  const ks = toFloat(form.querySelector("input[name=ks]").value);
  const [ca, mg] = ["ca", "mg"].map((name) => {
    const val = toFloat(form.querySelector(`input[name=${name}]`).value);
    const convFac = toFloat(form.querySelector(`select[name=${name}-u]`).value);
    return val * (convFac > 1 ? convFac : 1);
  });
  form.querySelector("input[name=gh]").value = calcGH(ca, mg).toFixed(1);
  form.querySelector("input[name=kh]").value = calcKH(ks).toFixed(1);
};

const saveWaterModalForm = (event) => {
  const data = saveModalForm(event);
  if (!data) return;
  let res = {};
  for (const key of data.keys()) {
    if (key.match(/-/g)) continue;
    const value = toFloat(data.get(key));
    const convFac = toFloat(data.get(`${key}-u`));
    res[key] = value * (convFac < 1 ? 1 : convFac);
  }
  for (const [k, v] of Object.entries(res)) {
    if (convTable[k]) {
      waterData[convTable[k].to] = round(v * convTable[k].factor, 3);
    } else waterData[k] = v;
  }
  setWaterData(waterData);
  updateWaterRow(document.querySelector("#water-row"));
  toggleModal(event);
};

// Checklist Modal
const updateChecklistRow = (row, data) => {
  const quantSpan = row.querySelector("span[name=quantity]");
  const uSpan = row.querySelector("span[name=u]");
  const qualSelect = row.querySelector("select[name=quality]");
  const quality = toFloat(qualSelect.selectedOptions[0].value);
  const checklistMultiplier = toFloat(
    document.querySelector("#checklist-modal input[name=checklist-multiplier]").value,
    1
  );

  // If checked off
  const checkedOff = row.querySelector("[name=check-off]").checked;
  if (checkedOff) row.classList.add("checked-off");
  else row.classList.remove("checked-off");
  qualSelect.disabled = checkedOff;

  // If updated externally by change of the underlying fert table row
  if (data) {
    row.querySelector("span[name=name]").textContent = data.name;
    quantSpan.dataset.original = data.dose;
    uSpan.dataset.original = data.u;
  }

  quantSpan.textContent = formatValue(round(quantSpan.dataset.original * quality * checklistMultiplier));
  uSpan.textContent = quality === 1 ? uSpan.dataset.original : "ml";
};

// Reset Modal
const resetCalculator = (event) => {
  clearAllStorage();
  location.reload();
};

const updateChecklistMultiplier = (event) => {
  document.querySelectorAll("#checklist-table tbody tr").forEach((row) => updateChecklistRow(row));
};

// Fertilizer Persistence Functions
const toggleFertilizerPersistence = (event) => {
  persistFertilizers = event.currentTarget.checked;
  setPersistFertilizers(persistFertilizers);

  if (persistFertilizers) {
    // Save current state when enabling
    saveFertilizers();
  } else {
    // Clear saved data when disabling
    clearSavedFertilizers();
  }
};

const saveFertilizers = () => {
  const tbody = document.querySelector("#fertilizer-table");
  const rows = tbody.querySelectorAll("tr[data-type=fertilizer]");
  const fertilizers = [];

  rows.forEach((row) => {
    const fertInput = row.querySelector("input[name=fertilizer]");
    const doseInput = row.querySelector("input[name=dose]");

    if (fertInput && doseInput && fertInput.value) {
      fertilizers.push({
        name: fertInput.value,
        dose: doseInput.value,
      });
    }
  });

  setSavedFertilizers(fertilizers);
};

const loadSavedFertilizers = () => {
  try {
    const savedData = getSavedFertilizers();
    if (!savedData || savedData.length === 0) return;

    // Set flag to prevent auto-save during load
    isLoadingFertilizers = true;

    const tbody = document.querySelector("#fertilizer-table");

    // Add additional rows if needed (subtract 1 because we already have one row)
    const rowsToAdd = savedData.length - 1;
    if (rowsToAdd > 0) {
      addFertRow(rowsToAdd);
    }

    // Populate the rows with saved data
    const rows = tbody.querySelectorAll("tr[data-type=fertilizer]");
    const checklistRows = document.querySelectorAll("#checklist-table tbody tr");

    savedData.forEach((fert, index) => {
      if (index < rows.length) {
        const row = rows[index];
        const checklistRow = checklistRows[index];

        // Set fertilizer name
        const fertInput = row.querySelector("input[name=fertilizer]");
        if (fertInput) {
          fertInput.value = fert.name;
        }

        // Set dose
        const doseInput = row.querySelector("input[name=dose]");
        if (doseInput) {
          doseInput.value = fert.dose;
        }

        // Manually trigger the row update without dispatching input events
        updateFertRow(row, checklistRow);
      }
    });
  } catch (error) {
    console.error("Error loading saved fertilizers:", error);
    // Clear corrupted data
    clearSavedFertilizers();
  } finally {
    // Reset flag after load is complete
    isLoadingFertilizers = false;
  }
};
