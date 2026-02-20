// ===============================
// 🔁 Chargement de l'état du jeu
// ===============================
const savedState = JSON.parse(localStorage.getItem("etatJeu"));
if (!savedState) {
  window.location.href = "index.html";
}

document.getElementById("back-home").addEventListener("click", () => {
    if (confirm("Revenir à l'accueil ? La partie sera réinitialisée.")) {
      localStorage.clear();
      window.location.href = "index.html";
    }
  });
  

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
  

const state = savedState;

// ===============================
// 📦 Récupération de la conséquence
// ===============================
const solution = state.solutionSelectionnee;
const consequence = solution.consequences[state.consequenceIndex];

const groupe =
  state.groupesSituation[consequence.groupNb - 1];

const totalPv = consequence.nbVie;
let restant = Math.abs(totalPv);
// ===============================
// 🧠 Ajustement si retrait impossible total
// ===============================
let maxPossible = Math.abs(totalPv);

if (maxPossible === 0) {
  state.consequenceIndex++;
  localStorage.setItem("etatJeu", JSON.stringify(state));
  redirectNext();
}


if (totalPv < 0) {
  const totalDisponible = groupe.reduce(
    (sum, j) => sum + j.pv,
    0
  );

  maxPossible = Math.min(Math.abs(totalPv), totalDisponible);
}

restant = maxPossible;


// ===============================
// 🎨 DOM
// ===============================
const descriptionEl = document.getElementById("result-description");
const pvTotalEl = document.getElementById("pv-total");
const playersContainer = document.getElementById("players-container");
const confirmButton = document.getElementById("confirm-btn");
const playerNameEl = document.getElementById("player-name");

// ===============================
// 📝 Description
// ===============================
playerNameEl.textContent=state.joueurs.find(j => j.id===state.joueurActifId).nom
descriptionEl.textContent = applyTemplate(
  consequence.description,
  state.contexteSituation
);

pvTotalEl.textContent =
  totalPv > 0
    ? `PV à distribuer : ${totalPv}`
    : `PV à retirer : ${Math.abs(totalPv)}`;

// ===============================
// 📊 Initialisation des répartitions
// ===============================
const repartition = {};
groupe.forEach(joueur => {
  repartition[joueur.id] = 0;
});

// ===============================
// 👥 Affichage des joueurs
// ===============================
groupe.forEach(joueur => {
  const row = document.createElement("div");
  row.classList.add("player-row");

  const info = document.createElement("div");
info.classList.add("player-info");

const name = document.createElement("span");
name.classList.add("player-name");
name.textContent = joueur.nom;

const hearts = document.createElement("div");
hearts.classList.add("hearts");
hearts.textContent = "❤️".repeat(joueur.pv);

info.append(name, hearts);


  const minus = document.createElement("button");
  minus.textContent = "−";

  const value = document.createElement("span");
  value.textContent = "0";

  const plus = document.createElement("button");
  plus.textContent = "+";

  minus.addEventListener("click", () => {
    if (repartition[joueur.id] > 0) {
      repartition[joueur.id]--;
      restant++;
      value.textContent = repartition[joueur.id];
      updateConfirm();
    }
  });

  plus.addEventListener("click", () => {
    if (restant > 0) {
      // empêcher PV négatif
      if (totalPv < 0 && joueur.pv - (repartition[joueur.id] + 1) < 0) return;

      repartition[joueur.id]++;
      restant--;
      value.textContent = repartition[joueur.id];
      updateConfirm();
    }
  });

  row.append(info, minus, value, plus);
  playersContainer.appendChild(row);
});

// ===============================
// ✅ Validation
// ===============================
function updateConfirm() {

  const distribue = Object.values(repartition)
    .reduce((sum, val) => sum + val, 0);

  // Autoriser validation si on a distribué le maximum possible
  if (distribue === maxPossible) {
    confirmButton.disabled = false;
  } else {
    confirmButton.disabled = true;
  }
}


confirmButton.disabled = true;

// ===============================
// 🔥 Appliquer les PV
// ===============================
confirmButton.addEventListener("click", () => {
    groupe.forEach(joueur => {
        const delta =
            totalPv > 0
            ? repartition[joueur.id]
            : -repartition[joueur.id];
        
        // 🔁 joueur global
        const joueurGlobal = state.joueurs.find(j => j.id === joueur.id);
        if (!joueurGlobal) return;
        
        joueurGlobal.pv += delta;
        
        if (joueurGlobal.pv <= 0) {
            state.joueursMorts.push(joueurGlobal);
        }
    });
      

  // 🔁 Passage à la conséquence suivante
  state.consequenceIndex++;
  syncGroupes();
  localStorage.setItem("etatJeu", JSON.stringify(state));

  // ☠️ Joueur mort
  if (state.joueursMorts.length>0) {
    window.location.href = "result-mort.html";
    return;
  }

  // ➜ autre conséquence
  redirectNext();
});

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

// ===============================
// 🧩 Template
// ===============================
function applyTemplate(text, context) {
  let result = text;
  Object.keys(context).forEach(key => {
    result = result.replaceAll(`{{${key}}}`, context[key]);
  });
  return result;
}

function syncGroupes() {
    // groupes "permanents"
    state.groupes = state.groupes.map(groupe =>
        groupe.map(j =>
        state.joueurs.find(joueur => joueur.id === j.id)
        )
    );

    // groupes liés à la situation
    state.groupesSituation = state.groupesSituation.map(groupe =>
        groupe.map(j =>
        state.joueurs.find(joueur => joueur.id === j.id)
        )
    );
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
  
        if (joueur.statut) {
          const statut = state.statuts.find(s => s.statutId === joueur.statut);
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
  