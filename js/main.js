const themesContainer = document.getElementById("themes-container");

async function chargerJSON(url, messageErreur) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(messageErreur);
    }
    return response.json();
}
  
chargerJSON("./data/themes.json", "Fichier themes.json introuvable")
.then(afficherThemes)
.catch(error => {
    console.error(error);
    themesContainer.innerHTML = "<p>Erreur de chargement des thèmes.</p>";
});

    

function afficherThemes(themes) {
  themes.forEach(theme => {
    const card = document.createElement("div");
    card.classList.add("theme-card");

    card.innerHTML = `
      <img src="./assets/${theme.themeIcone}" alt="${theme.themeNom}">
      <h2>${theme.themeNom}</h2>
      <p>${theme.themeDescription}</p>
    `;

    card.addEventListener("click", () => {
      choisirTheme(theme);
    });

    themesContainer.appendChild(card);
  });
}

function choisirTheme(theme) {
    localStorage.setItem("themeSelectionne", JSON.stringify(theme));
    window.location.href = "players.html";
  }
  