import connectionPromise from '../connection.js';

/**
 * Retourne une liste de tous les produits, leur quantite et leur total dans 
 * le panier dans la base de données.
 * @returns Une liste de tous les produits, leur quantite et leur total.
 */
export const getPanier = async (idUtilisateur) => {
    let connection = await connectionPromise;

    let results = await connection.all(
        `SELECT panier.id_produit, nom, chemin_image, printf("%.2f", prix) AS prix,
            quantite, printf("%.2f", prix * quantite) AS total
        FROM panier INNER JOIN produit ON panier.id_produit = produit.id_produit WHERE id_utilisateur = ?;`,[idUtilisateur]
    );

    return results;
}

/**
 * Ajoute un produit dans le panier dans la base de données.
 * @param {Number} idProduit L'identifiant du produit à ajouter.
 * @param {Number} quantite La quantité du produit à ajouter.
 * @param {Number} idUtilisateur L'id de l'utilisateur
 */
export const addToPanier = async (idUtilisateur, idProduit, quantite) => {
    let connection = await connectionPromise;

    // On recherche si le produit en paramètre existe déjà dans notre panier
    let entreePanier = await connection.get(
        'SELECT quantite FROM panier WHERE id_produit = ? AND id_utilisateur = ?;',
        [idProduit, idUtilisateur]
    );

    if (entreePanier) {
        // Si le produit existe déjà dans le panier, on incrémente sa quantité
        await connection.run(
            `UPDATE panier SET quantite = ?
            WHERE id_produit = ? AND id_utilisateur = ?;`,
            [quantite + entreePanier.quantite, idProduit, idUtilisateur]
        );
    }
    else {
        // Si le produit n'existe pas dans le panier, on l'insère dedans
        let result = await connection.run(
            `INSERT INTO panier(id_utilisateur, id_produit, quantite)
            VALUES(?, ?, ?);`,
            [ idUtilisateur, idProduit, quantite]
        );
    }
}

/**
 * Retire un produit du panier dans la base de données.
 * @param {Number} idProduit L'identifiant du produit à retirer.
 */
export const removeFromPanier = async (idProduit, idUtilisateur) => {
    let connection = await connectionPromise;

    await connection.run(
        'DELETE FROM panier WHERE id_produit = ?  AND id_utilisateur = ?;',
        [idProduit, idUtilisateur]
    );
}

/**
 * Vide le panier dans la base de données
 */
export const emptyPanier = async (idUtilisateur) => {
    let connection = await connectionPromise;

    await connection.run(
        'DELETE FROM panier WHERE id_utilisateur = ?;',
        [idUtilisateur]
    );
}