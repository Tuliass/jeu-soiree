  const state = JSON.parse(localStorage.getItem("etatJeu"));
  if (!state) {
    window.location.href = "index.html";
  }
  init();
// ===============================
  // 🔁 Sécurité / navigation
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
  



function init() {
  // ===============================
  // 📦 Données
  // ===============================
  const solution = state.solutionSelectionnee;
  const consequence = solution.consequences[state.consequenceIndex];

  const groupe =
    state.groupesSituation[consequence.groupNb - 1];

  const membreNom =
    state.contexteSituation[`membreGroupe${consequence.groupNb}`];

  const membre = state.joueurs.find(j => j.nom === membreNom);

  let objetId = consequence.objetId;
  const objetAction = consequence.objetAction;


  // ===============================
  // 🎯 Gestion objetId == 0
  // ===============================

  if (objetId === 0) {
      
    if (objetAction === "perte") {
      if (!membre.objet) {
        skip(state);
        return;
      }
      objetId = membre.objet;
    }

    if (objetAction === "gain") {
      if (!state.contexteSituation[`objetNom`]) {      
        skip(state);
        return;
      }
      objetId = state.objets.find(o => o.objetNom === state.contexteSituation[`objetNom`]).objetId;
    }
  }

  const objet = state.objets.find(o => o.objetId === objetId);
  if (!objet) {
    skip(state);
    return;
  }

  state.contexteSituation[`objetNom`] = objet.objetNom;

  // ===============================
  // 🎨 DOM
  // ===============================
  document.getElementById("player-name").textContent = membre.nom;

  document.getElementById("result-description").textContent =
    applyTemplate(consequence.description, state.contexteSituation);

  document.getElementById("objet-icon").src = `assets/${objet.objetIcone}`;
  document.getElementById("objet-name").textContent = objet.objetNom;

  const confirmBtn = document.getElementById("confirm-btn");

  const takeBtn = document.getElementById("keep-btn");
  const giveBtn = document.getElementById("give-btn");
  const discardBtn = document.getElementById("drop-btn");
  const select = document.getElementById("give-select");

  // ===============================
  // 🎯 Cas perte simple
  // ===============================
  if (objetAction === "perte") {
    document.getElementById("choices").innerHTML =
      `<div class="loss-message">
        ${membre.nom} a perdu l'objet : ${objet.objetNom}
      </div>`;

    membre.objet = null;

    const confirmBtn = document.getElementById("confirm-btn");
    confirmBtn.disabled = false;
    confirmBtn.onclick = () => {
      state.consequenceIndex++;
      localStorage.setItem("etatJeu", JSON.stringify(state));
      redirectNext(state);
    };
  }


  // ===============================
  // 🎁 Cas gain
  // ===============================
  if (objetAction === "gain") {

    const choices = document.getElementById("choices");
    choices.classList.remove("hidden");

    const cardKeep = document.getElementById("card-keep");
    const cardGive = document.getElementById("card-give");
    const cardDiscard = document.getElementById("card-discard");
    const select = document.getElementById("give-select");

    const confirmBtn = document.getElementById("confirm-btn");
    confirmBtn.disabled = true;

    let selectedAction = null;

    // 🔎 Joueurs pouvant recevoir l'objet (sans objet)
    const eligiblePlayers = groupe.filter(j => 
      j.id !== membre.id && !j.objet
    );

    select.innerHTML = "";

    eligiblePlayers.forEach(j => {
      const opt = document.createElement("option");
      opt.value = j.id;
      opt.textContent = j.nom;
      select.appendChild(opt);
    });

    if (eligiblePlayers.length === 0) {
      cardGive.classList.add("disabled");
    }

    function clearSelection() {
      document.querySelectorAll(".choice-card").forEach(c =>
        c.classList.remove("selected")
      );
    }

    function selectCard(card, action) {
      if (card.classList.contains("disabled")) return;
      clearSelection();
      card.classList.add("selected");
      selectedAction = action;
      confirmBtn.disabled = false;
    }

    cardKeep.onclick = () => selectCard(cardKeep, "keep");
    cardDiscard.onclick = () => selectCard(cardDiscard, "discard");
    cardGive.onclick = () => {
      if (eligiblePlayers.length > 0)
        selectCard(cardGive, "give");
    };

    confirmBtn.onclick = () => {

      if (!selectedAction) return;

      if (selectedAction === "keep") {
        membre.objet = objet.objetId;
      }

      if (selectedAction === "give") {
        const targetId = parseInt(select.value);
        const target = state.joueurs.find(j => j.id === targetId);
        if (target) {
          target.objet = objet.objetId;
        }
      }

      if (selectedAction === "discard") {
        // rien à faire
      }

      state.consequenceIndex++;
      localStorage.setItem("etatJeu", JSON.stringify(state));
      redirectNext(state);
    };
  }

  syncGroupes();

  // ===============================
  // ✅ Confirmation
  // ===============================
  confirmBtn.onclick = () => {
    state.consequenceIndex++;
    localStorage.setItem("etatJeu", JSON.stringify(state));
    redirectNext(state);
  };

}

// ===============================
// 🔀 Utils
// ===============================
function skip(state) {
  state.consequenceIndex++;
  localStorage.setItem("etatJeu", JSON.stringify(state));
  redirectNext(state);
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
  