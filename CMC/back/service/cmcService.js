const fs = require('fs');
const path = require('path');
const { calculatePointsForGeneratedInteractions, calculatePointsForInteractionsWithOthers,calculatePointsForTimeSpent, calculatePointsForTimeReceived} = require('./calculPoints');

// Fonction pour charger et analyser les données JSON
const loadData = () => {
    const jsonFilePath = path.join(__dirname, '../data/mdd.json');  // Chemin vers ton fichier JSON
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');  // Lecture du fichier
    return JSON.parse(jsonData);  // Parse le contenu JSON
};

// Fonction pour récupérer tous les utilisateurs uniques présents dans les données
const allUsers = (data) => {
    const users = new Set();
    data.forEach(item => {
        const user = item.Operation.User.Name;
        if (user) {
            users.add(user);
        }
    });
    return Array.from(users);  // Retourner une liste d'utilisateurs uniques
};

// Fonction utilitaire pour convertir une date en format standard (AAAA-MM-JJ HH:MM:SS) en objet Date
const parseDate = (dateStr) => new Date(dateStr);

// Fonction pour récupérer la plus petite et la plus grande date du fichier JSON
const getMinMaxDates = (data) => {
    const dates = data.map(item => parseDate(item.Operation.Action.Date));
    return {
        minDate: new Date(Math.min(...dates)),
        maxDate: new Date(Math.max(...dates))
    };
};

//Nombre de points pour les interactions générées par utilisateur par jour à partir de load data, pour tous les utilisateurs et de la date de début à la date de fin
exports.pointsForGeneratedInteractions = (startDateStr = null, endDateStr = null) => {
    
    const data = loadData();
    
    const { minDate, maxDate } = getMinMaxDates(data);

    // Utiliser les dates min et max par défaut si elles ne sont pas fournies
    const startDate = startDateStr ? parseDate(startDateStr) : minDate;
    const endDate = endDateStr ? parseDate(endDateStr) : maxDate;

    const users = allUsers(data);
    const points = calculatePointsForGeneratedInteractions(users, data, startDate, endDate);
    return points;
}

//Nombre de points pour les interactions avec les autres par utilisateur par jour à partir de load data, pour tous les utilisateurs et de la date de début à la date de fin
exports.pointsForInteractionsWithOthers = (startDateStr = null, endDateStr = null) => {
    const data = loadData();
    
    const { minDate, maxDate } = getMinMaxDates(data);

    // Utiliser les dates min et max par défaut si elles ne sont pas fournies
    const startDate = startDateStr ? parseDate(startDateStr) : minDate;
    const endDate = endDateStr ? parseDate(endDateStr) : maxDate;


    const users = allUsers(data);
    const points = calculatePointsForInteractionsWithOthers(users, data, startDate, endDate);
    return points;
}

//Nombre de points pour le temps passé par utilisateur par jour à partir de load data, pour tous les utilisateurs et de la date de début à la date de fin
exports.pointsForTimeSpent = (startDateStr = null, endDateStr = null) => {
    const data = loadData();
    
    const { minDate, maxDate } = getMinMaxDates(data);

    // Utiliser les dates min et max par défaut si elles ne sont pas fournies
    const startDate = startDateStr ? parseDate(startDateStr) : minDate;
    const endDate = endDateStr ? parseDate(endDateStr) : maxDate;


    const users = allUsers(data);
    const points = calculatePointsForTimeSpent(users, data, startDate, endDate);
    return points;
}

//Nombre de points pour le temps reçu par utilisateur par jour à partir de load data, pour tous les utilisateurs et de la date de début à la date de fin
exports.pointsForTimeReceived = (startDateStr = null, endDateStr = null) => {
    const data = loadData();
    
    const { minDate, maxDate } = getMinMaxDates(data);

    // Utiliser les dates min et max par défaut si elles ne sont pas fournies
    const startDate = startDateStr ? parseDate(startDateStr) : minDate;
    const endDate = endDateStr ? parseDate(endDateStr) : maxDate;


    const users = allUsers(data);
    const points = calculatePointsForTimeReceived(users, data, startDate, endDate);
    return points;
}

// Nombre de points total par utilisateur par jour à partir de load data, pour un utilisateur et de la date de début à la date de fin
exports.totalPoints = (startDate = null, endDate = null) => {
    const generatedPoints = this.pointsForGeneratedInteractions(startDate, endDate);
    const interactionPoints = this.pointsForInteractionsWithOthers(startDate, endDate);
    const timeSpentPoints = this.pointsForTimeSpent(startDate, endDate);
    const timeReceivedPoints = this.pointsForTimeReceived(startDate, endDate);

    // Créer un objet pour stocker les points totaux
    const totalPoints = {};

    // Obtenir tous les utilisateurs uniques à partir de toutes les sources
    const allUsers = new Set([
        ...Object.keys(generatedPoints),
        ...Object.keys(interactionPoints),
        ...Object.keys(timeSpentPoints),
        ...Object.keys(timeReceivedPoints)
    ]);

    // Initialiser les points pour chaque utilisateur
    allUsers.forEach(user => {
        totalPoints[user] = {}; // Initialiser l'objet pour chaque utilisateur
        
        // Pour chaque date, initialiser les points à 0
        const allDates = new Set([
            ...Object.keys(generatedPoints[user] || {}),
            ...Object.keys(interactionPoints[user] || {}),
            ...Object.keys(timeSpentPoints[user] || {}),
            ...Object.keys(timeReceivedPoints[user] || {})
        ]);

        allDates.forEach(date => {
            totalPoints[user][date] = 0;  // Initialiser les points pour chaque date
        });
        
        // Additionner les points pour chaque catégorie
        if (generatedPoints[user]) {
            Object.keys(generatedPoints[user]).forEach(date => {
                totalPoints[user][date] += generatedPoints[user][date];  // Ajouter les points générés
            });
        }
        
        if (interactionPoints[user]) {
            Object.keys(interactionPoints[user]).forEach(date => {
                totalPoints[user][date] += interactionPoints[user][date];  // Ajouter les points d'interaction
            });
        }
        
        if (timeSpentPoints[user]) {
            Object.keys(timeSpentPoints[user]).forEach(date => {
                totalPoints[user][date] += timeSpentPoints[user][date];  // Ajouter les points de temps passé
            });
        }
        
        if (timeReceivedPoints[user]) {
            Object.keys(timeReceivedPoints[user]).forEach(date => {
                totalPoints[user][date] += timeReceivedPoints[user][date];  // Ajouter les points de temps reçu
            });
        }
    });

    // Créer un tableau pour stocker les résultats triés
    const sortedResults = {};

    // Rassembler les points totaux et calculer le total pour chaque utilisateur
    Object.keys(totalPoints).forEach(user => {
        const userTotal = Object.values(totalPoints[user]).reduce((sum, points) => sum + points, 0);
        sortedResults[user] = {
            totalPoints: userTotal,
            pointsPerDate: totalPoints[user]
        };
    });

    // Trier les utilisateurs par total de points (du plus élevé au plus bas)
    const sortedUsers = Object.entries(sortedResults).sort((a, b) => b[1].totalPoints - a[1].totalPoints);

    // Convertir le résultat trié dans le format souhaité
    const finalResult = {};
    sortedUsers.forEach(([user, data]) => {
        finalResult[user] = data.pointsPerDate; // Conserver seulement les points par date
    });

    // Retourner les résultats triés
    return finalResult;
};

