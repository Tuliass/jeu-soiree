// ===============================
// 🔁 Chargement état
// ===============================
const savedState = JSON.parse(localStorage.getItem("etatJeu"));
if (!savedState) {
  window.location.href = "index.html";
}

// ===============================
  // 🔁 Sécurité / navigation
  // ===============================
  document.getElementById("back-home").addEventListener("click", () => {
    if (confirm("Revenir à l'accueil ? La partie sera réinitialisée.")) {
      localStorage.clear();
      window.location.href = "index.html";
    }
  });
  
const descriptionEl = document.getElementById("result-description");


const state = savedState;

const solution = state.solutionSelectionnee;
const consequence = solution.consequences[state.consequenceIndex];
const groupesConcernés = consequence.groupsNb; // ex [1,2]
const action = consequence.groupAction; // "fusion" ou "scission"
descriptionEl.textContent = applyTemplate(
  consequence.description,
  state.contexteSituation
);

if (!groupesConcernés || !action) {
  redirectNext();
}

// ===============================
// 🔄 Application action
// ===============================
// ===============================
// 🔐 Sécurité anti double exécution
// ===============================
if (!state.actionGroupeDejaAppliquee) {

  let nouveauxGroupes = [];

  if (action === "fusion") {
    nouveauxGroupes = fusionnerGroupes(groupesConcernés);
  }

  if (action === "scission") {
    nouveauxGroupes = scinderGroupe(groupesConcernés[0]);
  }

  state.groupesSituation = state.groupes;
  //mettreAJourContexte();

  state.actionGroupeDejaAppliquee = true;
  state._nouveauxGroupesAffiches = nouveauxGroupes;

  localStorage.setItem("etatJeu", JSON.stringify(state));
}

// On récupère les groupes déjà créés pour affichage
const groupesAAfficher = state._nouveauxGroupesAffiches || [];

renderGroups(groupesAAfficher);


const modal = document.getElementById("groups-modal");
const openBtn = document.getElementById("open-groups");
const closeBtn = document.getElementById("close-groups");
const container = document.getElementById("groups-container");

openBtn.addEventListener("click", () => {
  renderGroupsModal();
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// ===============================
// ▶️ Continuer
// ===============================
document.getElementById("continue-btn")
  .addEventListener("click", () => {

    delete state.actionGroupeDejaAppliquee;
    delete state._nouveauxGroupesAffiches;

    state.consequenceIndex++;
    localStorage.setItem("etatJeu", JSON.stringify(state));
    redirectNext();
  });

// ===============================
// 🔥 Fusion
// ===============================
function fusionnerGroupes(indexes) {

  let nouveauGroupe = [];

  // Récupérer groupes concernés
  indexes
    .sort((a,b)=>b-a) // important pour suppression propre
    .forEach(index => {
      const groupe = state.groupesSituation[index - 1];
      if (groupe) {
        nouveauGroupe = nouveauGroupe.concat(groupe);
        state.groupes.splice(index - 1, 1);
      }
    });

  state.groupes.push(nouveauGroupe);
  return [nouveauGroupe];
}

// ===============================
// ✂️ Scission
// ===============================
function scinderGroupe(index) {

  const groupe = state.groupesSituation[index - 1];
  if (!groupe) return [];

  // supprimer groupe original
  state.groupes.splice(index - 1, 1);

  const groupesCrees = [];

  groupe.forEach(joueur => {
    const solo = [joueur];
    state.groupes.push(solo);
    groupesCrees.push(solo);
  });

  return groupesCrees;
}

/*
// ===============================
// 🔄 Mise à jour contexteSituation
// ===============================
function mettreAJourContexte() {

  if (!state.contexteSituation) return;

  // Nettoyage anciennes clés groupeX
  Object.keys(state.contexteSituation).forEach(key => {
    if (key.startsWith("groupe") || key.startsWith("membreGroupe")) {
      delete state.contexteSituation[key];
    }
  });

  // Recréation dynamique
  state.groupes.forEach((groupe, index) => {

    const noms = groupe.map(j => j.nom);

    state.contexteSituation["groupe" + (index + 1)] =
      noms.join(" et ");

    const random =
      groupe[Math.floor(Math.random() * groupe.length)];

    state.contexteSituation["membreGroupe" + (index + 1)] =
      random.nom;
  });
}*/

// ===============================
// 🎨 Rendu groupes
// ===============================
function renderGroups(groupes) {

  const mainContainer =
    document.getElementById("main-groups-container");

  mainContainer.innerHTML = "";

  groupes.forEach((groupe, index) => {

    const groupBlock = document.createElement("div");
    groupBlock.classList.add("group-block");

    const title = document.createElement("div");
    title.classList.add("group-title");
    title.textContent = `Nouveau Groupe ${index + 1}`;
    groupBlock.appendChild(title);

    groupe.forEach(joueur => {

      const row = document.createElement("div");
      row.classList.add("player-row");

      const name = document.createElement("div");
      name.classList.add("player-name");
      name.textContent = joueur.nom;
      row.appendChild(name);

      // ❤️ PV
      const hearts = document.createElement("div");
      hearts.classList.add("hearts");

      for (let i = 0; i < 10; i++) {
        const heart = document.createElement("span");
        heart.textContent = "♥";
        heart.classList.add("heart");
        if (i >= joueur.pv) heart.classList.add("empty");
        hearts.appendChild(heart);
      }

      row.appendChild(hearts);

      // 🎒 Statut + objet
      const icons = document.createElement("div");
      icons.classList.add("player-icons");

      if (joueur.statut.statutId) {
        const statut =
          state.statuts.find(s => s.statutId === joueur.statut.statutId);
        if (statut) {
          const img = document.createElement("img");
          img.src = `./assets/${statut.statutIcone}`;
          icons.appendChild(img);
        }
      }

      if (joueur.objet) {
        const objet =
          state.objets.find(o => o.objetId === joueur.objet);
        if (objet) {
          const img = document.createElement("img");
          img.src = `./assets/${objet.objetIcone}`;
          icons.appendChild(img);
        }
      }

      row.appendChild(icons);
      groupBlock.appendChild(row);
    });

    mainContainer.appendChild(groupBlock);
  });
}

function applyTemplate(text, context) {
  let result = text;
  Object.keys(context).forEach(k => {
    result = result.replaceAll(`{{${k}}}`, context[k]);
  });
  return result;
}

// ===============================
// 🔀 Redirection
// ===============================
function redirectNext() {
  const s = state.solutionSelectionnee;

  if(!s.consequences[state.consequenceIndex]){
    // Fin → nouvelle situation
    state.consequenceIndex=null;
    state.contexteSituation=null;
    state.groupesSituation=null;
    state.joueurActifId=null;
    state.joueurActifIndex=null;
    state.situationEnCours=false;
    state.solutionSelectionnee=null;
    state.tour++;
    localStorage.setItem("etatJeu", JSON.stringify(state));
    window.location.href = "situation.html";
  }
  if (s.consequences[state.consequenceIndex].type=="vie") {
    window.location.href = "result-vie.html";
    return;
  }

  if (s.consequences[state.consequenceIndex].type=="objet") {
    window.location.href = "result-objet.html";
    return;
  }

  if (s.consequences[state.consequenceIndex].type=="statut") {
    window.location.href = "result-statut.html";
    return;
  }

  if (s.consequences[state.consequenceIndex].type=="groupe") {
    window.location.href = "result-groupe.html";
    return;
  }
}

function renderGroupsModal() {
  
    container.innerHTML = "";

  
    state.groupes.forEach((groupe, index) => {

      const groupBlock = document.createElement("div");
      groupBlock.classList.add("group-block");
  
      const title = document.createElement("div");
      title.classList.add("group-title");
      title.textContent = `Groupe ${index + 1}`;
      groupBlock.appendChild(title);
  
      groupe.forEach(joueur => {
        const row = document.createElement("div");
        row.classList.add("player-row");
  
        // Nom
        const name = document.createElement("div");
        name.classList.add("player-name");
        name.textContent = joueur.nom;
        row.appendChild(name);
  
        // Vie
        const hearts = document.createElement("div");
        hearts.classList.add("hearts");
  
        for (let i = 0; i < 10; i++) {
          const heart = document.createElement("span");
          heart.classList.add("heart");
          heart.textContent = "♥";
          if (i >= joueur.pv) heart.classList.add("empty");
          hearts.appendChild(heart);
        }
  
        row.appendChild(hearts);
  
        // Icônes
        const icons = document.createElement("div");
        icons.classList.add("player-icons");
  
        if (joueur.statut.statutId) {
          const statut = state.statuts.find(s => s.statutId === joueur.statut.statutId);
          if (statut) {
            const img = document.createElement("img");
            img.src = `./assets/${statut.statutIcone}`;
            icons.appendChild(img);
          }
        }
  
        if (joueur.objet) {
          const objet = state.objets.find(o => o.objetId === joueur.objet);
          if (objet) {
            const img = document.createElement("img");
            img.src = `./assets/${objet.objetIcone}`;
            icons.appendChild(img);
          }
        }
  
        row.appendChild(icons);
        groupBlock.appendChild(row);
      });
  
      container.appendChild(groupBlock);
    });
  }
  