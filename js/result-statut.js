// ===============================
// 🔁 Chargement état
// ===============================
const savedState = JSON.parse(localStorage.getItem("etatJeu"));
if (!savedState) {
  window.location.href = "index.html";
}
const state = savedState;

// ===============================
// 🎯 Récupération données solution
// ===============================
const solution = state.solutionSelectionnee;
const consequence = solution.consequences[state.consequenceIndex];
const groupNb = consequence.groupNb;
const statutId = consequence.statutId;
const action = consequence.statutAction;

const descriptionEl = document.getElementById("result-description");
descriptionEl.textContent = applyTemplate(
  consequence.description,
  state.contexteSituation
);


// ===============================
// 👤 Récupérer joueur concerné
// ===============================
const joueurNom =
  state.contexteSituation["membreGroupe" + groupNb];

if (!joueurNom) {
  state.consequenceIndex++;
  localStorage.setItem("etatJeu", JSON.stringify(state));
  redirectNext();
}

let statut;
if(statutId!=0){ //Si c'est un gain de statut on récupère le statut à gagner
   statut = state.statuts.find(s => s.statutId === statutId);
  if (!statut) {
    state.consequenceIndex++;
    localStorage.setItem("etatJeu", JSON.stringify(state));
    redirectNext();
  }
}
else{ //Sinon on récupère le statut actueldu joueur.
  const joueur= state.joueurs.find(j => j.nom === joueurNom);
  statut = state.statuts.find(s => s.statutId === joueur.statut);
}

// ===============================
// 🎨 Affichage
// ===============================
renderResult(joueurNom, statut, action);

// ===============================
// ▶️ Continuer
// ===============================
document
  .getElementById("continue-btn")
  .addEventListener("click", () => {
    // ===============================
    // 🔄 Mise à jour joueur
    // ===============================
    updateStatut(joueurNom, statutId, action);

    state.consequenceIndex++;
    localStorage.setItem("etatJeu", JSON.stringify(state));
    redirectNext();
  });

// ===============================
// 🔄 Fonction update
// ===============================
function updateStatut(nom, statutId, action) {
  let nouveauStatut;
  if(action === "gain"){
    nouveauStatut=statutId;
  }
  if(action === "perte"){
    nouveauStatut=null;
  }
  // joueurs globaux
  state.joueurs.forEach(j => {
    if (j.nom === nom) {
      j.statut = nouveauStatut;
    }
  });

  // groupes permanents
  state.groupes.forEach(groupe => {
    groupe.forEach(j => {
      if (j.nom === nom) {
        j.statut = nouveauStatut;
      }
    });
  });

  // groupes situation
  state.groupesSituation.forEach(groupe => {
    groupe.forEach(j => {
      if (j.nom === nom) {
        j.statut = nouveauStatut;
      }
    });
  });

  localStorage.setItem("etatJeu", JSON.stringify(state));
}

// ===============================
// 🎨 Rendu UI
// ===============================
function renderResult(nom, statut, action) {

  const container =
    document.getElementById("result-content");

  container.innerHTML = "";

  const img = document.createElement("img");
  img.src = `./assets/${statut.statutIcone}`;
  img.classList.add("statut-icon");

  const text = document.createElement("p");
  if(action==="gain"){
    text.innerHTML =
    `<strong>${nom}</strong> est maintenant : <strong>${statut.statutNom}</strong>`;
  }
  if(action==="perte"){
    text.innerHTML =
    `<strong>${nom}</strong> n'est plus : <strong>${statut.statutNom}</strong>`;
  }
  
  const description = document.createElement("p");
  description.innerHTML =
    `${statut.statutDescription}`;

  container.appendChild(img);
  container.appendChild(text);
  container.appendChild(description);
}

// ===============================
// 🔀 Redirection suite
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
// 🏠 Retour accueil
// ===============================
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
  
function applyTemplate(text, context) {
  let result = text;
  Object.keys(context).forEach(k => {
    result = result.replaceAll(`{{${k}}}`, context[k]);
  });
  return result;
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
  