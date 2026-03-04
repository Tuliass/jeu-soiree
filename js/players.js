const theme = JSON.parse(localStorage.getItem("themeSelectionne"));

const themeTitle = document.getElementById("theme-title");
const themeDescription = document.getElementById("theme-description");
const playersContainer = document.getElementById("players-container");
const addPlayerButton = document.getElementById("add-player");
const startButton = document.getElementById("start-game");

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;

let joueurs = [];

// Sécurité
if (!theme) {
  window.location.href = "index.html";
}

Promise.all([
    fetch("./data/objets.json").then(r => r.json()),
    fetch("./data/statuts.json").then(r => r.json())
  ]).then(([objets, statuts]) => {
    state.objets = objets;
    state.statuts = statuts;
  }).catch(error => {
    console.error("Erreur de chargement des données :", error);
});
  


// Affichage du thème
themeTitle.textContent = theme.themeNom;
themeDescription.textContent = theme.themeIntro;

// Initialisation avec 3 joueurs
for (let i = 0; i < MIN_PLAYERS; i++) {
  ajouterJoueur();
}

// Ajouter un joueur
addPlayerButton.addEventListener("click", () => {
  if (joueurs.length < MAX_PLAYERS) {
    ajouterJoueur();
  }
  mettreAJourBoutons();
});

// Fonction ajout
function ajouterJoueur() {
  const id = joueurs.length + 1;
  joueurs.push({
    id,
    nom: `Joueur ${id}`
  });
  renderJoueurs();
}

// Supprimer un joueur
function supprimerJoueur(index) {
  if (joueurs.length > MIN_PLAYERS) {
    joueurs.splice(index, 1);
    renderJoueurs();
  }
  mettreAJourBoutons();
}

// Affichage
function renderJoueurs() {
  playersContainer.innerHTML = "";

  joueurs.forEach((joueur, index) => {
    const row = document.createElement("div");
    row.classList.add("player-row");

    const input = document.createElement("input");
    input.type = "text";
    input.value = joueur.nom;

    input.addEventListener("input", () => {
      joueur.nom = input.value;
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.disabled = joueurs.length <= MIN_PLAYERS;

    removeBtn.addEventListener("click", () => {
      supprimerJoueur(index);
    });

    row.appendChild(input);
    row.appendChild(removeBtn);
    playersContainer.appendChild(row);
  });

  mettreAJourBoutons();
}

// Boutons actifs/inactifs
function mettreAJourBoutons() {
  addPlayerButton.disabled = joueurs.length >= MAX_PLAYERS;
}

// Lancer la partie
startButton.addEventListener("click", () => {
  const joueursFinal = joueurs.map((joueur, index) => ({
    id: index + 1,
    nom: joueur.nom || `Joueur ${index + 1}`,
    pv: 10,
    objet: null,
    statut: null
  }));
  
  //joueursFinal[0].statut=3;
  /*joueursFinal[1].statut=3;
  joueursFinal[2].statut=3;
  joueursFinal[0].statut=3;*/
  joueursFinal[0].statut=4;
  joueursFinal[2].statut=4;
  /*
    
  joueursFinal[0].objet=5;
  joueursFinal[1].objet=5;
  joueursFinal[2].objet=5;
  joueursFinal[3].objet=5;
  joueursFinal[4].objet=5;
  joueursFinal[5].objet=5;
  joueursFinal[4].statut=1;
  joueursFinal[1].pv=2;
  joueursFinal[3].pv=5;*/
  //const groupesFinal = [[joueursFinal[0],joueursFinal[1]],[joueursFinal[2],joueursFinal[3],joueursFinal[4]],[joueursFinal[5]]];
  const groupesFinal = [[joueursFinal[0],joueursFinal[1]],[joueursFinal[2]]];
  state.joueurs = joueursFinal;
  state.groupes = groupesFinal;
  state.themeActuel = theme;

  localStorage.setItem("etatJeu", JSON.stringify(state));

  window.location.href = "situation.html";
});

document.getElementById("back-home").addEventListener("click", () => {
    if (confirm("Revenir à l'accueil ? La partie sera réinitialisée.")) {
      localStorage.clear();
      window.location.href = "index.html";
    }
  });
  