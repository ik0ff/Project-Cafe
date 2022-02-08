//import { request } from "express";
//
// Liste de tous les <select> pour les commandes
let selects = document.querySelectorAll('.commande select');



/**
 * Modifie l'état d'une commande sur le serveur.
 * @param {InputEvent} event Objet d'information sur l'événement.
 */
const modifyEtatCommande = async (event) => {
    let data = {
        idCommande: parseInt(event.target.parentNode.parentNode.dataset.idCommande),
        idEtatCommande: parseInt(event.target.value)
    };

    await fetch('/commande', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Ajoute l'exécution de la fonction "modifyEtatCommande" pour chaque <select> 
// lorsque son état change.
for (let select of selects) {
    select.addEventListener('change', modifyEtatCommande)
}

// Ajouter les commande en temps reel a la page commande 
let source = new EventSource('/commandeConnec');

source.addEventListener('add-commande', (event) => {
    let data = JSON.parse(event.data);
    console.log( data.newCommande);
    commandes.innerText = data.newCommande;
});

source.addEventListener('new-etat', (event) => {
    let data = JSON.parse(event.data);
    console.log(data.newEtat  + " " + data.commandeid);
    // console.log(document.getElementById("option-" + data.commandeid).value)
    document.getElementById("option-" + data.commandeid).value = data.newEtat;
});
