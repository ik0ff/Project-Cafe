// Aller chercher les configurations de l'application
import 'dotenv/config';

// Importer securite
import https from 'https';
import { readFile } from 'fs/promises';
import redirectToHTTPS from './redirect-to-https.js';

// Importer les fichiers et librairies
import express, { json, request, response, urlencoded } from 'express';
import expressHandlebars from 'express-handlebars';
//importation de session pour session
import session from 'express-session';
// importaion de passport
import passport from 'passport';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
//importation de memorystore pour session
import { MemoryStore } from 'express-session';
import cspOption from './csp-options.js'
import { getProduit } from './model/produit.js';
import { getPanier, addToPanier, removeFromPanier, emptyPanier } from './model/panier.js';
import { getCommande, addCommande, modifyEtatCommande, getEtatCommande } from './model/commande.js';
import { validateId, validatePanier, validateCourriel, validateMotDePasse } from './validation.js';

// importer "real time update"
import middlewareSse from './middleware-sse.js';

// importation du fichier d'authentification
import './authentification.js';

import { getUtilisateur, addUtilisateur } from './model/utilisateur.js';

// Création du serveur
const app = express();
app.engine('handlebars', expressHandlebars({
    helpers: {
        equals: (valeur1, valeur2) => valeur1 === valeur2
    }
}));
app.set('view engine', 'handlebars');
//ici
// const MemoryStore= MemoryStore(session);

// Ajout de middlewares
app.use(redirectToHTTPS);
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(middlewareSse());
app.use(express.static('public'));
//ici
app.use(session({
    cookie: { maxAge: 36000000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 3600000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));
// ici
// app.use(session({ ... });
app.use(passport.initialize());
app.use(passport.session());

// Routes
// Route de la page du menu
app.get('/', async (request, response) => {
    response.render('menu', {
        title: 'Menu',
        produit: await getProduit(),
        user: request.user,
        admin: request?.user?.id_type_utilisateur == 2,
        user: request?.user
    });
});

// Route de la page du panier
app.get('/panier', async (request, response) => {
    //verifie si on est connecté et nous redirige sinon
    if (request.user) {
        let panier = await getPanier(request.user.id_utilisateur)
        response.render('panier', {
            title: 'Panier',
            produit: panier,
            estVide: panier.length <= 0,
            admin: request?.user?.id_type_utilisateur == 2,
            user: request.user
        });

    } else {
        response.redirect('/connexion');
    }
});

// Route pour ajouter un élément au panier
app.post('/panier', async (request, response) => {
    if (request.user) {
        if (validateId(request.body.idProduit)) {
            addToPanier(request.user.id_utilisateur, request.body.idProduit, 1);
            response.sendStatus(201);
        }
        else {
            response.sendStatus(400);
        }
    } else { response.sendStatus(400); }
});

// Route pour supprimer un élément du panier
app.patch('/panier', async (request, response) => {
    if (validateId(request.body.idProduit)) {
        removeFromPanier(request.body.idProduit, request.user.id_utilisateur);
        response.sendStatus(200);
    }
    else {
        response.sendStatus(400);
    }
});

// Route pour vider le panier
app.delete('/panier', async (request, response) => {

  //  if (await validatePanier()) {
        emptyPanier(request.user.id_utilisateur);
        response.sendStatus(200);
  //  }
  //  else {
      //  response.sendStatus(400);
  //  }
});


// Initialiser le stream de données
app.get('/commandeConnec', (request, response) => {
    response.initStream();
});

// Route de la page des commandes
app.get('/commande', async (request, response) => {
    // pas utiliser pour l'instant
    //seulement pour admin
    if (!request.user) {
        response.redirect('/connexion');
         
    }
    else if (request.user.id_type_utilisateur == 1) {
        response.sendStatus(403);

    }
    else {
        response.render('commande', {
            title: 'Commandes',
            commande: await getCommande(),
            etatCommande: await getEtatCommande(),
            admin: request?.user?.id_type_utilisateur == 2,
            user: request.user
        });

    }

});

// route get Connexion
app.get('/connexion', (request, response) => {
    response.render('connexion', {
        title: 'Connexion'
    });
});

// route get Inscription
app.get('/inscription', (request, response) => {
    response.render('inscription', {
        title: 'Inscription'
    });
});

// Route pour soumettre le panier
app.post('/commande', async (request, response) => {
    if (await validatePanier()) {
        // Broadcast de l'évènement
        addCommande(request.user.id_utilisateur);
        
        //response.pushJson({ newCommande: getCommande() }, 'add-commande'); // non utiliser 
        response.sendStatus(201);
    }
    else {
        response.sendStatus(400);
    }
});

// Route pour modifier l'état d'une commande
app.patch('/commande', async (request, response) => {
    if (await validateId(request.body.idCommande) &&
        await validateId(request.body.idEtatCommande)) {
        modifyEtatCommande(
            request.body.idCommande,
            request.body.idEtatCommande
        );
        response.pushJson({ newEtat: request.body.idEtatCommande , commandeid: request.body.idCommande }, 'new-etat');
        response.sendStatus(200);
    }
    else {
        response.sendStatus(400);
    }
});

// route d'inscription
app.post('/inscription', async (request, response, next) => {
    // On vérifie le le courriel et le mot de passe
    // envoyé sont valides
    if (validateCourriel(request.body.email) &&
        validateMotDePasse(request.body.password)) {
        try {
            // Si la validation passe, on crée l'utilisateur
            await addUtilisateur(request.body.courriel, request.body.motDePasse);
            response.sendStatus(201);
        }
        catch (error) {
            // S'il y a une erreur de SQL, on regarde
            // si c'est parce qu'il y a conflit
            // d'identifiant
            if (error.code === 'SQLITE_CONSTRAINT') {
                response.sendStatus(409);
            }
            else {
                next(error);
            }
        }
    }
    else {
        response.sendStatus(400);
    }
});

//route de connection
app.post('/connexion', (request, response, next) => {
    // On vérifie le le courriel et le mot de passe
    // envoyé sont valides

    if (validateCourriel(request.body.email) &&
        validateMotDePasse(request.body.password)) {
        // On lance l'authentification avec passport.js
        passport.authenticate('local', (error, user, info) => {

            if (error) {
                // S'il y a une erreur, on la passe
                // au serveur
                next(error);
            }
            else if (!user) {
                // Si la connexion échoue, on envoit
                // l'information au client avec un code
                // 401 (Unauthorized)
                response.status(401).json(info);

            }
            else {

                // Si tout fonctionne, on ajoute
                // l'utilisateur dans la session et
                // on retourne un code 200 (OK)
                request.logIn(user, (error) => {
                    if (error) {
                        next(error);
                    }

                    response.sendStatus(200);
                });
            }
        })(request, response, next);
    }
    else {
        response.sendStatus(400);
    }
});

// route deconnection
app.post('/deconnexion', (request, response) => {
    // Déconnecter l'utilisateur
    request.logout();

    // Rediriger l'utilisateur vers une autre page
    response.redirect('/');
});



// Renvoyer une erreur 404 pour les routes non définies
app.use(function (request, response) {
    // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
    response.status(404).send(request.originalUrl + ' not found.');
});

// Démarrage du serveur
// app.listen(process.env.PORT);
// console.info(`Serveurs démarré:`);
// console.info(`http://localhost:${ process.env.PORT }`);
if (process.env.NODE_ENV === 'production') {
    app.listen(process.env.PORT);
    console.info(`Serveurs démarré:`);
    console.info(`http://localhost:${process.env.PORT}`);
}
else {
    const credentials = {
        key: await readFile('./security/localhost.key'),
        cert: await readFile('./security/localhost.cert')
    };

    https.createServer(credentials, app).listen(process.env.PORT);
    console.info(`Serveurs démarré:`);
    console.info(`https://localhost:${process.env.PORT}`);
}