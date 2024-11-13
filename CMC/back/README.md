### README Back-End

# Backend - Analyse outil CMC

## Description
Ce projet est une application Express qui fournit des API pour déterminer les étudiants les plus intéractifs (qualité et quantité) représentant ainsi les potentiel leaders. Ceci peut être fait en suivant 04 différents axes (les intéractions générées, les intéractions que l'on a avec les autres, le temps que l'on met à écrire et lire les autres et enfin le temps que les autres mettent à nous écrire/répondre) qui sont également accumulable en un total, et en fonction des forums. 

## Prérequis
- **Node.js** version 16 ou supérieure
- **npm** (Node Package Manager)

## Installation

1. **Cloner le dépôt :**
   ```bash
   git clone <url_du_dépôt>
   cd <répertoire_du_projet>
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Structure des fichiers :**
   ```
   ├── index.js
   ├── route/ 
   │   ├── cmcRoute.js (fichier de définition des routes d'api)
   ├── controller/
   │   ├── cmcRoute.js (fichier de définition de la logique des apis)
   ├── service/
   │   ├── cmcService.js (fichier de définission du point d'entrée des services)
   │   ├── calculPoint.js (fichier de calcul des points correspondant aux différents scores)
   │   ├── generatedInteractions.js
   │   ├── interactionsWithOthers.js
   │   ├── timeReceived.js
   │   └── timeSpent.js
   ```

## Lancer le projet

1. **Démarrer le serveur :**
   ```bash
   node index.js
   ```
   
   Le serveur Express démarre sur le **port 4000** modifiable dans le fichier `index.js`.

## Routes disponibles
- Entête des requêttes: 
    ```
    Content-Type :application/json
    ```
- Paramètres des requêttes: 
    ```
    "startDate": "yyyy-mm-dd" 
    "endDate": "yyyy-mm-dd",
    "forum" : int
    ```
    `Exemple :`
     ?endDate=2009-05-12&startDate=2009-01-12&forum=7'

1. **/total** (GET) : 
   - Retourne les totaux de points par jour des 5 étudiants avec le plus de points.
   - Données d'entrée : Aucune donnée d'entrée requise, utilise le fichier `modele.json`.
   - Visualisable sur le front via HighCharts ou par simple appel d'API.
   
2. **/generated** (GET) :
   - Retourne les points par étudiants correspondant aux intéractions générées par  jour (pour les 5 ayant le plus de points sur la plage)
   - Données d'entrée : Aucune donnée d'entrée requise, utilise le fichier `modele.json`.
   - Visualisable sur le front via HighCharts ou par simple appel d'API.

3. **/others** (GET) :
   - Retourne les points par étudiants correspondant aux intéractions avec les autres par  jour (pour les 5 ayant le plus de points sur la plage)
   - Données d'entrée : Aucune donnée d'entrée requise, utilise le fichier `modele.json`.
   - Visualisable sur le front via HighCharts ou par simple appel d'API.
   
4. **/spent** (GET) :
   - Retourne les points par étudiants correspondant au temps passé à lire/écrire aux autres par  jour (pour les 5 ayant le plus de points sur la plage)
   - Données d'entrée : Aucune donnée d'entrée requise, utilise le fichier `modele.json`.
   - Visualisable sur le front via HighCharts ou par simple appel d'API.
   
5. **/received** (GET) :
   - Retourne les points par étudiants correspondant au temps que les autres passent à nous lire/écrire par  jour (pour les 5 ayant le plus de points sur la plage)
   - Données d'entrée : Aucune donnée d'entrée requise, utilise le fichier `modele.json`.
   - Visualisable sur le front via HighCharts ou par simple appel d'API.

## Utilisation
- Lancer le backend avant de lancer le frontend pour permettre la communication entre les deux.
