const express = require('express');
const router = express.Router();
const cmcController = require('../controller/cmcController');

//Route pour obtenir les dates de début et de fin par defaut ainsi que la liste de tous les forums
router.get('/default', cmcController.getDefault);

// Route pour obtenir le nombre total de points pour une période donnée
router.get('/total', cmcController.getTotal);

// Route pour obtenir le nombre de points correspondant aux interactions générées pour une période donnée
router.get('/generated', cmcController.getGeneratedInteractions);

// Route pour obtenir le nombre de points correspondant aux interactions avec les autres pour une période donnée
router.get('/others', cmcController.getInteractionsWithOthers);

// Route pour obtenir le nombre de points correspondant au temps consacré aux autres  pour une période donnée
router.get('/spent', cmcController.getTimeSpent);

// Route pour obtenir le nombre de points correspondant au temps reçu des autres pour une période donnée
router.get('/received', cmcController.getTimeReceived);



module.exports = router;
