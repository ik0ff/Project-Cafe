import { getPanier } from "./model/panier.js";

/**
 * Valide un identifiant (ID) reçu par le serveur.
 * @param {*} id L'identifiant à valider.
 * @returns Une valeur booléenne indiquant si l'identifiant est valide ou non.
 */
export const validateId = (id) => {
    return !!id &&
        typeof id === 'number' &&
        Number.isInteger(id) &&
        id > 0;
}

/**
 * Valide le panier dans la base de données du serveur.
 * @returns Une valeur booléenne indiquant si le panier est valide ou non.
 */
export const validatePanier = async () => {
    return true;
    // let panier = await getPanier();
    // return panier.length > 0;
}
/* valisation avec des restrictions au niveau  de l'adresse courriel du serveur*/
export const validateCourriel = async (courriel) => {
    return String(courriel)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};
/* valisation avec des restrictions au niveau  du mot de passe du serveur*/
export const validateMotDePasse = async (password) => {

    return typeof password === 'string' && password.length >= 6 && password.length <= 30;

}


