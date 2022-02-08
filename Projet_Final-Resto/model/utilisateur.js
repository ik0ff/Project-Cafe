import connectionPromise from "../connection.js";
import bcrypt from 'bcrypt';


// Pour creer un utilisateur
export async function addUtilisateur(courriel, motDePasse) {
    let connection = await connectionPromise;

    let motDePasseEncrypte = await bcrypt.hash(motDePasse, 10);
    // automatiquement niveau 1 ( utilisateur )
    await connection.run(
        `INSERT INTO utilisateur(id_type_utilisateur, email, password)
        VALUES (2, ?, ?)`,
        [courriel, motDePasseEncrypte]
    );
};

// Requête pour chercher un utilisateur par son identifiant
export async function getUtilisateur(courriel) {
    let connection = await connectionPromise;

    const result = await connection.get(
        `SELECT id_utilisateur , id_type_utilisateur, email, password 
        FROM utilisateur
        WHERE  email = ?`,
        [courriel]
    );
    console.log(result);
    return result;
};