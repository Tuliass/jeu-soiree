// ===============================
// 📦 STATE
// ===============================
const state = JSON.parse(localStorage.getItem("themeSelectionne"));

if (!state) {
  window.location.href = "index.html";
}

// ===============================
// 📧 EMAILJS INIT
// ===============================

// ⚠️ REMPLACE CES VALEURS
const EMAILJS_PUBLIC_KEY = "9DfhIS9l-O7zKuzfo";
const EMAILJS_SERVICE_ID = "service_uokqx2x";
const EMAILJS_TEMPLATE_ID = "template_8ckm7wr";
const RECEIVER_EMAIL = "william.saunders.t@gmail.com";

emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
});

// ===============================
// 🎯 DOM
// ===============================
const solutionsContainer = document.getElementById("solutions-container");
const nbGroupesInput = document.getElementById("nb-groupes");
nbGroupesInput.addEventListener("change", updateAllGroupSelects);
const form = document.getElementById("question-form");
const submitBtn = document.getElementById("submit-btn");

// ===============================
// 🔙 RETOUR
// ===============================
document.getElementById("back-home").addEventListener("click", () => {
  window.location.href = "players.html";
});

// ===============================
// 📦 DATA
// ===============================
let situations = [];
let solutions = [];
let objets = [];
let statuts = [];

// ===============================
// 🚀 INIT
// ===============================
init();

async function init() {

  const [situationsData, solutionsData, objetsData, statutsData] =
    await Promise.all([
      fetch("./data/situations.json").then(r => r.json()),
      fetch("./data/solutions.json").then(r => r.json()),
      fetch("./data/objets.json").then(r => r.json()),
      fetch("./data/statuts.json").then(r => r.json())
    ]);

  situations = situationsData;
  solutions = solutionsData;
  objets = objetsData;
  statuts = statutsData;

  renderSolutions();
  validateForm();
}

// ===============================
// 🎲 SOLUTIONS
// ===============================
function renderSolutions() {

  for (let i = 1; i <= 3; i++) {

    const block = document.createElement("section");
    block.classList.add("form-section", "solution-block");

    block.innerHTML = `
      <div class="solution-title">Solution ${i}</div>

      <label>Description</label>
      <textarea class="solution-description" required></textarea>

      ${i === 3 ? renderConditionSelect() : ""}

      <div class="consequences-container"></div>

      <button type="button" class="add-btn">
        + Ajouter une conséquence
      </button>
    `;

    solutionsContainer.appendChild(block);

    const addBtn = block.querySelector(".add-btn");
    const container = block.querySelector(".consequences-container");

    addBtn.addEventListener("click", () => {
      addConsequence(container);
      validateForm();
    });

    addConsequence(container);
  }
}

// ===============================
// 🎯 CONDITION SELECT
// ===============================
function renderConditionSelect() {

  let html = `
    <label>Condition</label>
    <select class="condition-select">
      <option value="">Aucune</option>
  `;

  statuts.forEach(s => {
    html += `
      <option value="statut-${s.statutId}">
        Statut : ${s.statutNom}
      </option>
    `;
  });

  objets.forEach(o => {
    html += `
      <option value="objet-${o.objetId}">
        Objet : ${o.objetNom}
      </option>
    `;
  });

  html += `</select>`;

  return html;
}

// ===============================
// ➕ AJOUT CONSEQUENCE
// ===============================
function addConsequence(container) {

  const card = document.createElement("div");
  card.classList.add("consequence-card");

  card.innerHTML = `
    <div class="consequence-header">
      <strong>Conséquence</strong>
      <button type="button" class="remove-btn">✖</button>
    </div>

    <label>Description</label>
    <textarea class="consequence-description" required></textarea>

    <label>Type</label>
    <select class="consequence-type">
      <option value="vie">Vie</option>
      <option value="statut">Statut</option>
      <option value="objet">Objet</option>
      <option value="groupe">Groupe</option>
    </select>

    <div class="dynamic-fields"></div>
  `;

  container.appendChild(card);

  const typeSelect = card.querySelector(".consequence-type");
  const dynamicFields = card.querySelector(".dynamic-fields");

  typeSelect.addEventListener("change", () => {
    renderDynamicFields(typeSelect.value, dynamicFields);
    validateForm();
  });

  renderDynamicFields("vie", dynamicFields);

  card.querySelector(".remove-btn").addEventListener("click", () => {

    if (container.children.length <= 1) {
      alert("Une solution doit avoir au moins une conséquence.");
      return;
    }

    card.remove();
    validateForm();
  });

  card.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", validateForm);
    el.addEventListener("change", validateForm);
  });
}

// ===============================
// 🎯 FIELDS DYNAMIQUES
// ===============================
function renderDynamicFields(type, container) {

  const nbGroupes = parseInt(nbGroupesInput.value);

  const groupOptions = Array.from(
    { length: nbGroupes },
    (_, i) => `<option value="${i + 1}">${i + 1}</option>`
  ).join("");

  if (type === "vie") {

    container.innerHTML = `
      <label>Nombre de vie (mettre en négatif pour enlever des vies)</label>
      <input type="number" class="nb-vie" required />

      <label>Groupe concerné</label>
      <select class="group-select">
        ${groupOptions}
      </select>
    `;
  }

  if (type === "statut") {

    container.innerHTML = `
      <label>Action</label>

      <div class="radio-group">
        <label class="inline-option">
          <input type="radio" name="statut-action-${Date.now()}" value="gain" checked>
          Gain
        </label>

        <label class="inline-option">
          <input type="radio" name="statut-action-${Date.now()}" value="perte">
          Perte
        </label>
      </div>

      <label>Groupe concerné</label>
      <select class="group-select">
        ${groupOptions}
      </select>

      <label>Statut</label>
      <select class="statut-select">
        ${statuts.map(s => `
          <option value="${s.statutId}">${s.statutNom}</option>
        `).join("")}
      </select>
    `;
  }

  if (type === "objet") {

    container.innerHTML = `
      <label>Action</label>

      <div class="radio-group">
        <label class="inline-option">
          <input type="radio" name="objet-action-${Date.now()}" value="gain" checked>
          Gain
        </label>

        <label class="inline-option">
          <input type="radio" name="objet-action-${Date.now()}" value="perte">
          Perte
        </label>
      </div>

      <label>Groupe concerné</label>
      <select class="group-select">
        ${groupOptions}
      </select>

      <label>Objet</label>
      <select class="objet-select">
        ${objets.map(o => `
          <option value="${o.objetId}">${o.objetNom}</option>
        `).join("")}
      </select>
    `;
  }

  if (type === "groupe") {

    container.innerHTML = `
      <label>Action</label>

      <div class="radio-group">
        <label class="inline-option">
          <input type="radio" name="groupe-action-${Date.now()}" value="fusion" checked>
          Fusion
        </label>

        <label class="inline-option">
          <input type="radio" name="groupe-action-${Date.now()}" value="scission">
          Scission
        </label>
      </div>

      <label>Groupes concernés</label>
      <select class="groups-select" multiple>
        ${groupOptions}
      </select>
    `;
  }

  container.querySelectorAll("input, textarea, select").forEach(el => {
    el.addEventListener("input", validateForm);
    el.addEventListener("change", validateForm);
  });
}

function updateAllGroupSelects() {

  const nbGroupes = parseInt(nbGroupesInput.value);

  // Génération des options
  const optionsHTML = Array.from(
    { length: nbGroupes },
    (_, i) => `<option value="${i + 1}">${i + 1}</option>`
  ).join("");

  // ===============================
  // 🎯 group-select simples
  // ===============================
  document.querySelectorAll(".group-select").forEach(select => {

    const oldValue = select.value;

    select.innerHTML = optionsHTML;

    // restaurer valeur si possible
    if (oldValue <= nbGroupes) {
      select.value = oldValue;
    }
  });

  // ===============================
  // 🎯 groups-select multiples
  // ===============================
  document.querySelectorAll(".groups-select").forEach(select => {

    // anciennes valeurs sélectionnées
    const selectedValues = Array.from(select.selectedOptions)
      .map(o => parseInt(o.value));

    select.innerHTML = optionsHTML;

    // restaurer les sélections possibles
    Array.from(select.options).forEach(option => {

      if (selectedValues.includes(parseInt(option.value))) {
        option.selected = true;
      }
    });
  });
}

// ===============================
// ✅ VALIDATION
// ===============================
function validateForm() {

  const allRequired = document.querySelectorAll("textarea, input[required]");

  let valid = true;

  allRequired.forEach(el => {
    if (!el.value.trim()) {
      valid = false;
    }
  });

  submitBtn.disabled = !valid;
}

// ===============================
// 📤 SUBMIT
// ===============================
form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const payload = generateJSON();

  try {

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        email: RECEIVER_EMAIL,
        message: JSON.stringify(payload, null, 2),
        theme: state.themeNom,
      }
    );

    alert("Question envoyée avec succès !");

    window.location.href = "players.html";

  } catch (err) {

    console.error(err);
    alert("Erreur lors de l'envoi du mail.");
  }
});

// ===============================
// 🧠 GENERATION JSON
// ===============================
function generateJSON() {

  const situationId =
    Math.max(...situations.map(s => s.situationId)) + 1;

  let solutionId =
    Math.max(...solutions.map(s => s.solutionId)) + 1;

  const situation = {
    situationId,
    themeId: state.themeId,
    situationDescription:
      document.getElementById("situation-description").value,
    nbGroupes: parseInt(nbGroupesInput.value)
  };

  const generatedSolutions = [];

  document.querySelectorAll(".solution-block").forEach((block, index) => {

    const desc = block.querySelector(".solution-description").value;

    let condition = {
      statutId: null,
      objetId: null
    };

    const conditionSelect = block.querySelector(".condition-select");

    if (conditionSelect && conditionSelect.value) {

      const [type, id] = conditionSelect.value.split("-");

      if (type === "statut") {
        condition.statutId = parseInt(id);
      }

      if (type === "objet") {
        condition.objetId = parseInt(id);
      }
    }

    const consequences = [];

    block.querySelectorAll(".consequence-card").forEach(card => {

      const type = card.querySelector(".consequence-type").value;
      const description =
        card.querySelector(".consequence-description").value;

      if (type === "vie") {

        consequences.push({
          groupNb: parseInt(card.querySelector(".group-select").value),
          type: "vie",
          nbVie: parseInt(card.querySelector(".nb-vie").value),
          description
        });
      }

      if (type === "statut") {

        consequences.push({
          groupNb: parseInt(card.querySelector(".group-select").value),
          type: "statut",
          statutAction: card.querySelector("input[type='radio']:checked").value,
          statutId: parseInt(card.querySelector(".statut-select").value),
          description
        });
      }

      if (type === "objet") {

        consequences.push({
          groupNb: parseInt(card.querySelector(".group-select").value),
          type: "objet",
          objetAction: card.querySelector("input[type='radio']:checked").value,
          objetId: parseInt(card.querySelector(".objet-select").value),
          description
        });
      }

      if (type === "groupe") {

        consequences.push({
          groupsNb: Array.from(
            card.querySelector(".groups-select").selectedOptions
          ).map(o => parseInt(o.value)),
          type: "groupe",
          groupAction: card.querySelector("input[type='radio']:checked").value,
          description
        });
      }
    });

    generatedSolutions.push({
      solutionId: solutionId++,
      situationId,
      solutionDescription: desc,
      solutionCondition: condition,
      consequences
    });
  });

  return {
    situation,
    solutions: generatedSolutions
  };
}
