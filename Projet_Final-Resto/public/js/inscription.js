let inputCourriel = document.getElementById('input-courriel');
let inputMotDePasse = document.getElementById('input-mot-de-passe');
let formInscription = document.getElementById('form-inscription');




formInscription.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Les noms des variables doivent être les mêmes
    // que celles spécifié dans les configuration de
    // passport dans le fichier "authentification.js"
    const data = {
        courriel: inputCourriel.value,
        motDePasse: inputMotDePasse.value
    };

    let response = await fetch('/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        // Si la création de compte est réussi, on
        // redirige vers la page de connexion
        window.location.replace('/connexion');
    }
    else if (response.status === 409) {
        // Afficher qu'il y a un conflit
    }
});