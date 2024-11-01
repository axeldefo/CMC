const express = require('express');
const cmcRoute = require('./route/cmcRoute');
const helmet = require('helmet');
const { totalPoints } = require('./service/cmcService');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(helmet()); // Sécurité de base


app.use(express.json()); // pour traiter les JSON
app.use('/api/cmc', cmcRoute); // Utiliser le routeur défini dans cmcRoute

const PORT = process.env.PORT || 3000;

// Remplacez par les dates de votre choix
const startDate = "2009-02-20";
const endDate = "2009-03-02";

const results = totalPoints();

//ecrire les resultats dans un fichier JSON à ./data/results.json
const resultsPath = path.join(__dirname, 'data', 'results.json');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
