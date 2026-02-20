const state = JSON.parse(localStorage.getItem("etatJeu"));
const solution = state.solutionSelectionnee;
const eff = solution.consequences[state.consequenceIndex];;

if (!eff) {
  state.joueurActifIndex =
    (state.joueurActifIndex + 1) % state.joueurs.length;

  localStorage.setItem("etatJeu", JSON.stringify(state));
  window.location.href = "situation.html";
}

const routes = {
  vie: "result-vie.html",
  objet: "result-objet.html",
  statut: "result-statut.html",
  groupe: "result-groupe.html"
};

window.location.href = routes[eff.type];
