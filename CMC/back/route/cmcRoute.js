const express = require('express');
const router = express.Router();
const cmcController = require('../controller/cmcController');

// Exemple de route pour obtenir les données analysées
router.get('/data', cmcController.getDataAnalysis);

module.exports = router;
