// Description: Contient la logique métier des routes pour les points CMC.
const cmcService = require('../service/cmcService');


//Api pour obtenir les dates de début et de fin par defaut ainsi que la liste de tous les forums
exports.getDefault = async (req, res) => {
    try {
        const { minDate, maxDate, forums } = cmcService.defaultData();
        res.status(200).json({ minDate, maxDate, forums });
    } catch (error) {
        res.status(500).send(error.message);
    }
}
//Api pour obtenir le nombre total de points pour une période donnée
exports.getTotal = async (req, res) => {
    try {
        const { startDate, endDate, forum } = req.query;
        const points = cmcService.totalPoints(startDate, endDate, forum);
        res.status(200).json(points);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}
//Api pour obtenir le nombre de points correspondant aux interactions générées pour une période donnée
exports.getGeneratedInteractions = async (req, res) => {
    try {
       
        const { startDate, endDate, forum } = req.query;
        const points = cmcService.pointsForGeneratedInteractions(startDate, endDate, forum);
        res.json(points);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}

//Api pour obtenir le nombre de points correspondant aux interactions avec les autres pour une période donnée
exports.getInteractionsWithOthers = async (req, res) => {
    try {

        
        const { startDate, endDate, forum } = req.query;
        const points = cmcService.pointsForInteractionsWithOthers(startDate, endDate, forum);
        res.status(200).json(points);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}

//Api pour obtenir le nombre de points correspondant au temps consacré aux autres  pour une période donnée
exports.getTimeSpent = async (req, res) => {
    try {
        
        const { startDate, endDate, forum } = req.query;
        const points = cmcService.pointsForTimeSpent(startDate, endDate, forum);
        res.status(200).json(points);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}

//Api pour obtenir le nombre de points correspondant au temps reçu des autres pour une période donnée
exports.getTimeReceived = async (req, res) => {
    try {
        
        const { startDate, endDate, forum } = req.query;
        const points = cmcService.pointsForTimeReceived(startDate, endDate, forum);
        res.status(200).json(points);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}
