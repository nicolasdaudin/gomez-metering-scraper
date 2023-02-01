# Gomez Metering Scraper

Cet outil permet d'extraire depuis la page de Gomez Metering Group les lectures à distance des dispositifs installés dans les maisons pour contrôler la consommation des radiateurs.

Additionnellement, il envoie tous les jours par email (email codé en dur) le résultat des dernières lectures et offre une interface pour voir les dernières lectures et un résumé par jour, par mois, et par appareil de la consommation.

Il s'agit d'un side-project, qui m'a permis de pratiquer TypeScript et notamment la manipulation d'interfaces, ainsi que MongoDB et Mongoose grâce aux aggregate. Mon objectif était de monter en compétences sur ces aspects, et d'avoir un projet en production et dans un état stable.

Il y a évidemment plein de features manquantes (voir ci-dessous) mais le projet est en production et fonctionne, et m'envoit un email tous les jours avec les dernières lectures.

Retrouvez le projet ici : [Gomez Metering Scraper](https://gomez-metering-scraper.herokuapp.com/summary/yesterday)

### Tech stack

Cet outil a été développé en TypeScript, et utilise [Playwright](https://playwright.dev/) pour le webscrape ([Puppeteer](https://pptr.dev/) avait d'abord été considéré comme premier choix mais a donné trop de problèmes pendant la phase de test)

Une base de données sur MongoDB Atlas permet de stocker les mesures au fur et à mesure de leurs extractions, et l'usage de Mongoose permet notamment d'agréger les données et les présenter soit par email, soit par API rest, soit via l'interface.

Pug est utilisé pour renderer l'interface depuis le serveur.

Le tout est déployé sur Heroku, sur une [dyno Eco](https://devcenter.heroku.com/articles/eco-dyno-hours) (qui donc, s'endort au bout de [30 minutes sans activité](https://devcenter.heroku.com/articles/eco-dyno-hours#dyno-sleeping)).

Un cron Heroku, qui utilise le script [wake_up_cron.js](/wake_up_cron.js), permet de réveiller le serveur toutes les nuits pour aller chercher les nouvelles lectures disponibles.

### Login chez Gomez Metering Group

Cet outil nécessite d'avoir un compte chez [Gomez Metering Group](https://ov.gomezgroupmetering.com/) et de rajouter deux variables d'environnement:

```
GOMEZ_USER=<le login utilisé pour Gomez Metering Group>
GOMEZ_PASSWORD=<le login utilisé pour Gomez Metering Group>
```

### Envoi quotidien par Whatsapp

Il est également possible de recevoir via Whatsapp le résultat des dernières lectures (cette feature est implémentée et a été testée mais n'est pas en usage en production).

Pour cela, il faut créer un compte chez [Twilio](https://www.twilio.com/try-twilio) avec votre numéro de téléphone, et rajouter deux variables d'environnement:

```
TWILIO_ACCOUNT_SID=<à demander à Twilio>
TWILIO_AUTH_TOKEN=<à demander à Twilio>
```

Pour l'instant, cet outil ne fonctionne qu'avec les credentials de son auteur.

### Usage de Playwright

Playwright est l'outil de scraping qui permet de se connecter à la page distante de Gomez Metering Group, aller sur la page qui présente les dernières mesures, et les extraire.

Playwright a une feature vraiment pratique, il s'agit du générateur de code. On utilise un navigateur et on montre à Playwright ce qu'il doit faire, et c'est traduit en code.

Voici comment l'utiliser

```
npx playwright codegen <url>
```

### Features manquantes

Voici les principales features manquantes:

- rajouter pour chaque jour la température qu'il faisait (l'extraire de OpenWeather par exemple)
- des tests solides (non développés car je souhaitais me concentrer sur TypeScript et sur Mongoose)
- des routes API et Interface pour voir le résumé par appareil de mesure, par jour en particulier, ....
- une meilleure gestion des cas d'erreurs (notamment si le login au niveau du scrape faile)
- le rendre extensible à d'autres use-cases, par exemple pouvoir extraire des données d'un autre fournisseur de compteurs, pouvoir lire depuis autre chose qu'un radiateur, ...
- des screenshots stockés sur Dropbox ou ailleurs pour chaque extraction de données (au cas où l'extraction n'a pas été possible)

Toutes les prochaines tâches sont disponibles sur le projet Github.
