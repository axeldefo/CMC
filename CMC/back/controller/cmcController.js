const cmcService = require('../service/cmcService');

// Fonction pour récupérer et analyser les données JSON
exports.getDataAnalysis = (req, res) => {
    try {
        const data = cmcService.analyzeData();  // Appel à la fonction service
        res.status(200).json(data);  // Retourne les données sous format JSON
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'analyse des données', error });
    }
};
