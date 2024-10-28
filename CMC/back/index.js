const express = require('express');
const cmcRoute = require('./route/cmcRoute');
const helmet = require('helmet');

const app = express();
app.use(helmet()); // Sécurité de base


app.use(express.json()); // pour traiter les JSON
app.use('/api/cmc', cmcRoute); // Utiliser le routeur défini dans cmcRoute

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
});
