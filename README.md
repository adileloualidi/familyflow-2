# FamilyFlow — coeur applicatif (v1)

Application Next.js 14 / TypeScript / Tailwind CSS / Firebase (Auth + Firestore + Storage),
livree comme base **reellement fonctionnelle** — aucune fonctionnalite listee ci-dessous n'est
simulee : chaque bouton declenche un vrai appel Firestore/Storage.

## Ce que couvre cette v1

- Authentification email/mot de passe (creation d'espace familial = compte administrateur)
- Modele multi-membres : admin / adulte / enfant / invite, avec profil actif ("qui es-tu ?")
  commute localement sur l'appareil familial partage (les enfants n'ont pas de compte Firebase
  Auth propre dans cette v1 — voir "Limites connues")
- Taches : creation, groupes, types, sous-taches, statuts complets (A faire -> En cours ->
  A valider -> Terminee / Refusee / Annulee), commentaires
- Attribution manuelle **et** automatique par algorithme reel (charge actuelle, disponibilite,
  competences, preferences, equite historique) — voir `src/lib/family.ts`, teste unitairement
  dans `src/lib/family.test.ts`
- Points, badges, catalogue de recompenses avec validation admin
- Tableau de bord (mes taches, classement familial, statistiques de base)
- Planning des repas de la semaine (`/meals`), avec synchronisation automatique des
  ingredients vers la liste de courses
- Liste de courses groupee par rayon avec icones, case "dans le caddie" (`/shopping`)
- Inventaire / stock avec seuil d'alerte bas (`/stock`) : quand un article passe sous
  son seuil, il est automatiquement ajoute a la liste de courses
- Assistant IA (Gemini) sur la page Stock : mise a jour du stock par phrase libre
  ("il reste presque plus de lait") et suggestions de repas a partir du stock actuel —
  voir la section "Assistant IA (Gemini)" plus bas
- Regles de securite Firestore/Storage reelles (`firestore.rules`, `storage.rules`)

## Ce qui n'est PAS encore livre (prochaines iterations)

- **Preuve photo** — desactivee volontairement : Firebase Storage exige desormais le forfait
  payant "Blaze" (meme pour un usage minime), et l'objectif est de rester 100% gratuit. Le
  champ `Task.proofUrls` reste dans le modele de donnees ; il suffira de reactiver
  `firebase/storage` dans `src/lib/firebase.ts` et `uploadTaskProof` dans
  `src/lib/firestore-helpers.ts` (encore presents en commentaire) si tu passes un jour a Blaze.
  `storage.rules` est conserve dans le depot pour ce jour-la, mais n'est pas deploye.
- Notifications push Android/iOS/Web (Firebase Cloud Messaging) — la structure de donnees
  le permet, il manque le service worker + l'ecran d'abonnement
- Synchronisation Google Calendar / Outlook (necessite OAuth + Cloud Functions)
- Defis familiaux collectifs, calendrier visuel
- Comptes Firebase Auth individuels pour les enfants (custom claims + regles par role)
- Suite de tests fonctionnels/integration/E2E, rapport de tests, rapport de performance

## Installation

```bash
npm install
cp .env.local.example .env.local
# colle tes cles Firebase dans .env.local (voir plus bas)
npm run dev
```

Ouvre http://localhost:3000 — tu seras redirige vers `/login`. Le premier compte que tu crees
devient administrateur et cree automatiquement l'espace familial.

## Configuration Firebase

1. https://console.firebase.google.com -> ton projet -> icone engrenage -> Parametres du projet
2. Section "Vos applications" -> app Web -> copie les valeurs dans `.env.local`
3. Active dans le menu "Build" : Authentication (methode Email/Mot de passe), Firestore Database
   (mode production). Storage n'est pas requis pour cette v1 (voir "Ce qui n'est PAS encore
   livre" — il exige le forfait payant Blaze, donc volontairement laisse de cote).
4. Deploie les regles de securite Firestore (necessite la CLI Firebase :
   `npm install -g firebase-tools`) :

```bash
firebase login
firebase use --add        # choisis ton projet
firebase deploy --only firestore:rules
```

Sans cette etape, Firestore reste en mode "production" ferme par defaut et l'app ne pourra
rien lire/ecrire — ou, si tu as choisi le mode test, tout le monde peut lire/ecrire tant que
les regles ne sont pas deployees. Deploie-les avant d'inviter d'autres personnes.

## Deploiement (production) — Cloudflare Pages

Le projet est configure en export statique (`output: "export"` dans `next.config.js`) :
tout devient du HTML/JS pur, sans serveur Node necessaire cote hebergeur. Comme la
construction locale (`next build`/`next dev`) peut etre bloquee par un antivirus
d'entreprise sur certains PC Windows, le plus simple est de laisser Cloudflare
construire le projet lui-meme, a partir d'un depot GitHub :

1. Cree un compte gratuit sur github.com si tu n'en as pas.
2. Cree un nouveau depot (bouton "New repository"), nom libre (ex. `familyflow`),
   visibilite "Private" recommandee.
3. Pousse le code de ce projet dans ce depot (voir "Envoyer le code sur GitHub" ci-dessous).
4. Sur dash.cloudflare.com : **Workers & Pages > Create > Pages > Connect to Git**,
   choisis ton depot `familyflow`.
5. Configuration de build :
   - Framework preset : `Next.js (Static HTML Export)`
   - Build command : `npm run build`
   - Build output directory : `out`
6. Dans "Environment variables", ajoute les 6 variables `NEXT_PUBLIC_FIREBASE_*`
   (les memes valeurs que dans ton `.env.local`), plus `GEMINI_API_KEY` si tu veux
   activer l'assistant IA (voir section "Assistant IA (Gemini)" plus bas — peut aussi
   etre ajoute plus tard).
7. Clique sur "Save and Deploy". Cloudflare construit le projet sur ses serveurs
   (pas sur ton PC), detecte automatiquement le dossier `functions/` (Pages Functions)
   et te donne une URL du type `familyflow.pages.dev`.
8. Ouvre cette URL sur vos telephones, puis utilise "Ajouter a l'ecran d'accueil"
   (menu du navigateur) pour obtenir une icone d'application.

### Envoyer le code sur GitHub (une seule fois)

Depuis PowerShell, dans le dossier du projet :
```powershell
git init
git add .
git commit -m "Premiere version"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/familyflow.git
git push -u origin main
```
(remplace l'URL par celle de ton depot, visible sur la page GitHub apres sa creation ;
Git peut demander de se connecter a ton compte GitHub lors du `push`, suis les instructions
a l'ecran). Si `git` n'est pas reconnu, installe-le depuis git-scm.com/download/win.

Autres options possibles (non couvertes en detail ici) : Vercel (le plus simple avec
Next.js, gere le SSR sans export statique) ou Firebase Hosting.

## Assistant IA (Gemini)

La page Stock (`/stock`) propose deux fonctionnalites IA, gratuites (le niveau gratuit de
l'API Gemini suffit largement a un usage familial) :

1. **Mise a jour du stock par phrase libre** : tu tapes "il reste presque plus de lait" et
   l'IA identifie l'article, estime la nouvelle quantite et met a jour l'inventaire.
2. **Suggestions de repas** a partir du stock actuellement disponible.

### Pourquoi une "Cloudflare Pages Function" et pas une route API Next.js ?

Le projet est en export 100% statique (`output: "export"`) pour pouvoir etre construit et
heberge gratuitement sur Cloudflare Pages sans serveur Node. Next.js ne peut donc pas
executer de route API classique (`src/app/api/...`) en production. A la place, le fichier
`functions/api/ai.ts` est reconnu automatiquement par Cloudflare Pages (convention
"Pages Functions") et sert de petit serveur independant a l'adresse
`https://<ton-site>.pages.dev/api/ai` — c'est lui qui appelle Gemini avec la cle secrete,
jamais le navigateur directement (la cle ne doit jamais apparaitre cote client).

### Configuration (une seule fois)

1. Cree une cle API gratuite sur https://aistudio.google.com/apikey (connecte-toi avec le
   compte Google qui a deja acces a Gemini).
2. Sur dash.cloudflare.com : **Workers & Pages > ton projet familyflow > Settings >
   Environment variables > Production** -> "Add variable" :
   - Nom : `GEMINI_API_KEY`
   - Valeur : la cle copiee a l'etape 1
   - Coche "Encrypt" si l'option est proposee.
3. Redeploie (Cloudflare redeploie automatiquement a chaque `git push`, ou clique sur
   "Retry deployment" dans l'onglet Deployments).

**Important** : ces fonctionnalites IA ne fonctionnent qu'une fois deployees sur Cloudflare
Pages. En local (`npm run dev`), le bouton "Analyser" affichera une erreur car
`/api/ai` n'existe que sur l'infrastructure Cloudflare — c'est normal, pas un bug.

### Cout / consommation

Cette integration n'utilise **pas** ton compte Claude — elle appelle directement l'API
Gemini avec ta propre cle, dans la limite gratuite de Google AI Studio (largement
suffisante pour un usage familial ponctuel). Aucun token Claude n'est consomme par ces
deux fonctionnalites.

## Tests

```bash
npm test
```

Couvre pour l'instant la logique metier pure (calcul de streak, algorithme d'attribution
equitable, attribution des badges) — c'est la partie la plus sensible aux regressions.
Les tests d'integration Firestore (via l'emulateur Firebase) et les tests end-to-end
(Playwright) sont a ajouter dans une iteration suivante.

## Structure

```
src/
  app/            routes Next.js (App Router) : login, dashboard, tasks, meals, shopping,
                  stock, family, rewards
  components/     composants partages (AppShell, modales de tache/membre)
  context/        AuthContext (session Firebase + donnees temps reel de la famille)
  lib/            firebase.ts (init SDK), firestore-helpers.ts (CRUD), family.ts (logique pure),
                  categories.ts (rayons/icones courses+stock), ai.ts (client vers /api/ai)
  types/          types TypeScript partages
functions/
  api/ai.ts       Cloudflare Pages Function : proxy serveur vers l'API Gemini
firestore.rules   regles de securite Firestore
storage.rules     regles de securite Storage (photos de preuve)
```

## Limites connues (a lire avant mise en production reelle)

- Les enfants utilisent un profil local ("qui es-tu ?") sur l'appareil familial, pas un
  compte Firebase Auth individuel : c'est adapte a une tablette/ordinateur partage au sein
  du foyer, mais ne fournit pas une isolation de securite par personne au niveau serveur.
  Les regles Firestore actuelles verifient l'appartenance a la famille (via le compte adulte
  connecte), pas le role precis — un enfant ayant acces a l'appareil pourrait techniquement
  appeler les memes fonctions qu'un admin cote client. Pour une isolation stricte, il faut
  des comptes individuels + Cloud Functions avec custom claims.
- Le champ `OPENAI_API_KEY` est present dans `.env.local.example` mais aucune route API ne
  l'utilise encore — ne rien coder cote client qui l'appelle directement (cle secrete).
- Aucun test d'integration/E2E n'est encore ecrit ; les tests unitaires ne couvrent que la
  logique pure (`src/lib/family.ts`).
