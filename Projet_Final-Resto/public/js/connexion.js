let inputCourriel = document.getElementById('input-courriel');
let inputMotDePasse = document.getElementById('input-mot-de-passe');
let formConnexion = document.getElementById('form-connexion');

formConnexion.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Les noms des variables doivent être les mêmes
    // que celles spécifié dans les configuration de
    // passport dans le fichier "authentification.js"
    const data = {
        courriel: inputCourriel.value,
        motDePasse: inputMotDePasse.value
    };

    let response = await fetch('/connexion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        // Si l'authentification est réussi, on
        // redirige vers une autre page
        window.location.replace('/');
    }
    else if (response.status === 401) {
        // Si l'authentification ne réussi pas, on
        // a le message d'erreur dans l'objet "data"
        let data = await response.json()

        // Utiliser "data" pour afficher l'erreur ;a
        // l'utilisateur ici ...
    }
});