/***********************
 * 🔁 ÉTAT DU JEU
 ***********************/
const savedState = localStorage.getItem("etatJeu");
if (!savedState) {
  window.location.href = "index.html";
}
Object.assign(state, JSON.parse(savedState));

if (state && state.groupes) {

  // Récupère tous les joueurs vivants
  const joueursVivants = state.groupes
    .flat()
    .filter(joueur => joueur.pv > 0);

  if (joueursVivants.length === 1) {

    // Sauvegarde le gagnant
    localStorage.setItem("gagnant", JSON.stringify(joueursVivants[0]));

    // Redirection vers page gagnant
    window.location.href = "gagnant.html";
    
  }
}


/***********************
 * 🎯 DOM
 ***********************/
const playerNameEl = document.getElementById("player-name");
const situationDescEl = document.getElementById("situation-description");
const solutionsContainer = document.getElementById("solutions-container");
const confirmButton = document.getElementById("confirm-solution");
confirmButton.disabled = true;

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


/***********************
 * 📦 DATA CACHE
 ***********************/
const dataCache = {};

async function chargerData() {
  if (dataCache.loaded) return dataCache;

  const [situations, solutions] = await Promise.all([
    fetch("./data/situations.json").then(r => r.json()),
    fetch("./data/solutions.json").then(r => r.json())
  ]);

  dataCache.situations = situations;
  dataCache.solutions = solutions;
  dataCache.loaded = true;

  return dataCache;
}

/***********************
 * 🚀 LOGIQUE PRINCIPALE
 ***********************/
chargerData().then(({ situations, solutions }) => {
  let joueurActif;
  let situation;
  let groupesSelectionnes;
  let contexte;

  // 🔁 CONTEXTE EXISTANT
  if (state.situationEnCours) {
    joueurActif = state.joueurs.find(j => j.id === state.joueurActifId);
    situation = state.situationActuelle;
    groupesSelectionnes = state.groupesSituation;
    contexte = state.contexteSituation;
  } 
  // 🆕 NOUVELLE SITUATION
  else {
    groupePrincipal=state.groupes[Math.floor(Math.random() * state.groupes.length)];
    joueurActif = groupePrincipal[Math.floor(Math.random() * groupePrincipal.length)];
    

    const situationsTheme = situations.filter(
      s =>
        s.themeId === state.themeActuel.themeId &&
        s.nbGroupes <= state.groupes.length
    );

    situation =
      situationsTheme[Math.floor(Math.random() * situationsTheme.length)]||situations.filter(s => s.themeId === state.themeActuel.themeId)[0];

    groupesSelectionnes = [groupePrincipal];

    if (situation.nbGroupes > 1) {
      const autresGroupes = state.groupes.filter(g => g !== groupePrincipal);
      shuffleArray(autresGroupes);
      groupesSelectionnes.push(
        ...autresGroupes.slice(0, situation.nbGroupes - 1)
      );
    }
    situation=situationsTheme[13];

    contexte = buildContext(groupesSelectionnes, joueurActif);

    // 💾 Sauvegarde du contexte
    state.situationEnCours = true;
    state.joueurActifId = joueurActif.id;
    state.situationActuelle = situation;
    state.groupesSituation = groupesSelectionnes;
    state.contexteSituation = contexte;

    localStorage.setItem("etatJeu", JSON.stringify(state));

    // ===============================
    // 🔥 RÈGLE : un seul groupe restant
    // ===============================
    if (state.groupes.length === 1) {

      const consequenceScission = {
        groupsNb: [1],
        type: "groupe",
        groupAction: "scission",
        description:
          "Au fil du temps un climat de méfiance se créé entre {{membreGroupe1}} et {{groupe1}}. D'un commun accord, vous préférez vous séparer plutôt que de risquer de vous entretuer."
      };

      state.solutionSelectionnee = {
        consequences: [consequenceScission]
      };

      state.consequenceIndex = 0;
      state.situationEnCours = false;

      localStorage.setItem("etatJeu", JSON.stringify(state));

      window.location.href = "result.html";
      return;
    }

    // ===============================
    // 🔥 RÈGLE : Décompte des durée des statuts
    // ===============================
    let endStatus=[];
    state.joueurs.forEach(j => {
      if(j.statut.statutDuree>0){
        j.statut.statutDuree--;
        syncGroupes();
      }
      if(j.statut.statutDuree!=null && j.statut.statutDuree<=0){
        endStatus.push({
          joueurId: j.id,
          type: "statut",
          statutAction: "perte",
          statutId: 0,
          description:
            "L'état de santé du joueur revient à la normale."
        });
      }
    });
    if(endStatus.length>0){
      state.consequenceIndex = 0;
      state.solutionSelectionnee = {
        consequences: endStatus
      };

      localStorage.setItem("etatJeu", JSON.stringify(state));

      window.location.href = "result.html";
      return;
    }
    
  }

  playerNameEl.textContent = joueurActif.nom;
  situationDescEl.textContent = applyTemplate(
    situation.situationDescription,
    contexte
  );

  const solutionsSituation = solutions.filter(
    sol => sol.situationId === situation.situationId
  );
  
  let solutionSelectionnee = null;
  
  solutionsSituation.forEach(solution => {
    const card = document.createElement("div");
    card.classList.add("solution-card");
  
    const p = document.createElement("p");
    p.textContent = applyTemplate(solution.solutionDescription, contexte);
    card.appendChild(p);
  
    // 🧩 Gestion condition
    let conditionValide = true;
  
    if (
      solution.solutionCondition &&
      (solution.solutionCondition.objetId || solution.solutionCondition.statutId)
    ) {
      const icon = document.createElement("img");
      icon.classList.add("condition-icon");
  
      // 🎒 Condition objet
      if (solution.solutionCondition.objetId) {
        const objet = state.objets.find(
          o => o.objetId === solution.solutionCondition.objetId
        );
        if (objet) {
          icon.src = `./assets/${objet.objetIcone}`;
        }
      }
  
      // 🧠 Condition statut
      if (solution.solutionCondition.statutId) {
        const statut = state.statuts.find(
          s => s.statutId === solution.solutionCondition.statutId
        );
        if (statut) {
          icon.src = `./assets/${statut.statutIcone}`;
        }
      }
  
      card.appendChild(icon);
  
      conditionValide = groupeRemplitCondition(
        solution.solutionCondition,
        groupesSelectionnes[0] // groupe du joueur actif
      );
    }
  
    // 🚫 Désactivation si condition non remplie
    if (!conditionValide) {
      card.classList.add("disabled");
    } else {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(".solution-card")
          .forEach(c => c.classList.remove("selected"));
  
        card.classList.add("selected");
        solutionSelectionnee = solution;
        confirmButton.disabled = false;
      });
    }
  
    solutionsContainer.appendChild(card);
  });


  // ===============================
  // 🎒 Gestion du statut bourre
  // ===============================
  if(joueurActif.statut.statutId==5){
    const solutionsCards=document.getElementsByClassName("solution-card");
    let checkValide= false;
    let solutionByDefault;
    while(!checkValide){
      solutionByDefault= solutionsCards[Math.floor(Math.random() * solutionsCards.length)];
      if(!solutionByDefault.classList.contains("disabled")){
        solutionByDefault.click();
        checkValide=true;
      }
      
    }
    for (let i = 0; i < solutionsCards.length; i++) {
      solutionsCards[i].classList.add("disabled");
    }
    situationDescEl.innerText+="\n \n Vous êtes bourré. Vous n'êtes plus maître de vos choix."

  }
  

  confirmButton.addEventListener("click", () => {

    state.contexteSituation = contexte;
    state.consequenceIndex = 0;

    // Clone propre pour éviter mutation JSON d'origine
    const solutionFinale = JSON.parse(JSON.stringify(solutionSelectionnee));

    // ===============================
    // 🎒 Gestion casse d'objet
    // ===============================
    if (
      solutionFinale.solutionCondition &&
      solutionFinale.solutionCondition.objetId
    ) {
      const objetId = solutionFinale.solutionCondition.objetId;

      const objet = state.objets.find(o => o.objetId === objetId);
            

      if (objet) {
        const probCasse = objet.objetResistance || 0;
        if (Math.random() > probCasse) {

          const consequenceCasse = {
            groupNb: 1,
            type: "objet",
            objetAction: "perte",
            description:
              objet.objetNom+" se casse juste après que vous l'ayez utilisé.",
            objetId: objet.objetId
          };

          // Injection en début de chaîne
          solutionFinale.consequences = [
            consequenceCasse,
            ...(solutionFinale.consequences || [])
          ];
        }
      }
    }

    // ===============================
    // 🎒 Gestion statut PV (blessé ou chanceux)
    // ===============================
    if(joueurActif.statut.statutId==2){  //blessé
      const consequenceBlesse = {
        groupNb: 1,
        type: "vie",
        nbVie: -1,
        description:
          joueurActif.nom+" est blessé. Retirez lui 1 PV",
      };

      // Injection en début de chaîne
      solutionFinale.consequences = [
        consequenceBlesse,
        ...(solutionFinale.consequences || [])
      ];
    }
    if(joueurActif.statut.statutId==6){  //reposé
      const consequenceRepose = {
        groupNb: 1,
        type: "vie",
        nbVie: 1,
        description:
          joueurActif.nom+" est reposé. Ajoutez lui 1 PV",
      };

      // Injection en début de chaîne
      solutionFinale.consequences = [
        consequenceRepose,
        ...(solutionFinale.consequences || [])
      ];
    }

  state.solutionSelectionnee = solutionFinale;

  localStorage.setItem("etatJeu", JSON.stringify(state));

  window.location.href = "result.html";
});

});

/***********************
 * 🧠 CONTEXTE
 ***********************/
function buildContext(groupes, joueurActif) {
  const context = {};

  groupes.forEach((groupe, index) => {
    const i = index + 1;

    const noms = groupe
      .map(j => j.nom);

    context[`groupe${i}`] = formatNoms(noms);
    context[`membreGroupe${i}`] =
      groupe[Math.floor(Math.random() * groupe.length)].nom;
  });

  return context;
}

/***********************
 * ✨ FORMATAGE NOMS
 ***********************/
function formatNoms(noms) {
  if (noms.length === 0) return "";
  if (noms.length === 1) return noms[0];
  if (noms.length === 2) return `${noms[0]} et ${noms[1]}`;

  return (
    noms.slice(0, -1).join(", ") +
    " et " +
    noms[noms.length - 1]
  );
}

/***********************
 * 🔧 UTILS
 ***********************/
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

function applyTemplate(text, context) {
  return text.replace(/{{(.*?)}}/g, (_, key) => context[key] ?? "");
}

function groupeRemplitCondition(solutionCondition, groupe) {
  if (!solutionCondition) return true;

  if (solutionCondition.objetId) {
    return groupe.filter(j=>j.statut.statutId!=3).some(joueur => joueur.objet === solutionCondition.objetId); //Les joueurs épuisés (statutId=3) ne peuvent pas utiliser leur objet
  }

  if (solutionCondition.statutId) {
    return groupe.some(joueur => joueur.statut.statutId === solutionCondition.statutId);
  }

  return true;
}

function syncGroupes() {
    // groupes "permanents"
    state.groupes = state.groupes.map(groupe =>
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
