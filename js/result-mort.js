// ===============================
// 🔁 Chargement de l'état du jeu
// ===============================
const savedState = JSON.parse(localStorage.getItem("etatJeu"));
if (!savedState) {
  window.location.href = "index.html";
}


const state = savedState;

// ===============================
// 🎨 DOM
// ===============================
const listEl = document.getElementById("dead-players-list");
const continueBtn = document.getElementById("continue-btn");

// ===============================
// 🪦 Affichage des joueurs morts
// ===============================
if (!state.joueursMorts || state.joueursMorts.length === 0) {
  // sécurité
  redirectNext();
}

state.joueursMorts.forEach(joueur => {
  const li = document.createElement("li");
  li.textContent = joueur.nom;
  listEl.appendChild(li);
});


removeDeadPlayers();


// ===============================
// ▶️ Continuer
// ===============================
continueBtn.addEventListener("click", () => {

  state.joueursMorts = [];
  localStorage.setItem("etatJeu", JSON.stringify(state));
  redirectNext();
});

// ===============================
// 🧹 Suppression globale des morts
// ===============================
function removeDeadPlayers() {
  const groupesAvant = state.groupes.length;
  const deadIds = state.joueursMorts.map(j => j.id);
  const deadNames = state.joueursMorts.map(j => j.nom);

  // ===============================
  // 1️⃣ Suppression globale des joueurs
  // ===============================
  state.joueurs = state.joueurs.filter(j => !deadIds.includes(j.id));

  // ===============================
  // 2️⃣ Groupes permanents
  // ===============================
  state.groupes = state.groupes
    .map(groupe => groupe.filter(j => !deadIds.includes(j.id)))
    .filter(groupe => groupe.length > 0);

  // ===============================
  // 3️⃣ Groupes situation
  // ===============================
  state.groupesSituation = state.groupesSituation
    .map(groupe => groupe.filter(j => !deadIds.includes(j.id)))
    .filter(groupe => groupe.length > 0);

  // ===============================
  // 4️⃣ 🔄 Mise à jour dynamique du contexteSituation
  // ===============================
  if (!state.contexteSituation) return;

  Object.keys(state.contexteSituation).forEach(key => {

    // ---------------------------
    // 🧩 Cas des groupeX
    // ---------------------------
    if (key.startsWith("groupe")) {

      const groupIndex = parseInt(key.replace("groupe", "")) - 1;
      const groupe = state.groupesSituation[groupIndex];

      if (!groupe || groupe.length === 0) {
        delete state.contexteSituation[key];
        return;
      }

      // Reformater le texte "Joueur A et Joueur B"
      const noms = groupe.map(j => j.nom);
      state.contexteSituation[key] = noms.join(" et ");
    }

    // ---------------------------
    // 👤 Cas des membreGroupeX
    // ---------------------------
    if (key.startsWith("membreGroupe")) {

      const membreNom = state.contexteSituation[key];

      // Si le membre est mort
      if (deadNames.includes(membreNom)) {

        const groupIndex = parseInt(key.replace("membreGroupe", "")) - 1;
        const groupe = state.groupesSituation[groupIndex];

        if (groupe && groupe.length > 0) {
          const random =
            groupe[Math.floor(Math.random() * groupe.length)];

          state.contexteSituation[key] = random.nom;
        } else {
          delete state.contexteSituation[key];
        }
      }
    }
  });
    // ===============================
  // 🧨 5️⃣ Vérification groupes vides
  // ===============================
  // Nettoyage sécurité (au cas où)
  state.groupes = state.groupes.filter(g => g.length > 0);
  

  if (state.groupes.length < groupesAvant) {

    // 👉 On ignore toutes les conséquences restantes
    state.consequenceIndex=null;
    state.contexteSituation=null;
    state.groupesSituation=null;
    state.joueurActifId=null;
    state.joueurActifIndex=null;
    state.situationEnCours=false;
    state.solutionSelectionnee=null;
    state.tour++;

    state.joueursMorts = [];

    localStorage.setItem("etatJeu", JSON.stringify(state));

    // 👉 Retour direct à une nouvelle situation
   window.location.href = "situation.html";
  }

}

// ===============================
// 🔀 Redirection vers la suite
// ===============================
function redirectNext() {
  /*const s = state.solutionSelectionnee;

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
  }*/
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
  