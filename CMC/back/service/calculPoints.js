const { countUniqueInteractorsForUsersAsSender, countInteractionsAndDownloadsForUser } = require('./interactionGenerated');
const { countPostsByUser, countUniqueAuthorsUserInteractedWith, countInteractionsByUser } = require('./interactionWithOthers');
const { calculateWritingTimeByUser, calculateReadingTimeByUser, calculateScrollTimeByUser } = require('./timeSpent');
const { calculateWritingTimeByOthersForUser, calculateReadingTimeReceivedByUser, calculateScrollTimeReceivedByUser } = require('./timeReceived');

// Fonction utilitaire pour convertir une date en format standard (AAAA-MM-JJ HH:MM:SS) en objet Date
const parseDate = (dateStr) => new Date(dateStr);

// Fonction pour récupérer les données entre deux dates
const getDataBetweenDates = (data, startDateStr, endDateStr) => {

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    return data.filter(item => {
        const actionDate = parseDate(item.Operation.Action.Date);
        return actionDate >= startDate && actionDate <= endDate;
    });
};

// Fonction pour calculer les points correspondant aux interactions générées par user par jour sur une période donnée
exports.calculatePointsForGeneratedInteractions = (users, data, startDate, endDate) => {

    // Filtrer les données en fonction de la période
    const filteredData = getDataBetweenDates(data, startDate, endDate);

    const interactionsData = countInteractionsAndDownloadsForUser(users, filteredData);  // Appeler avec la liste des utilisateurs
    const uniqueInteractorsData = countUniqueInteractorsForUsersAsSender(users, filteredData);  // Appeler avec la liste des utilisateurs

    const result = {};

    // Créer une liste de toutes les dates entre startDate et endDate
    const currentDate = new Date(startDate);
    const dateList = [];

    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculer les points par utilisateur et par jour
    users.forEach(user => {
        result[user] = {};
        dateList.forEach(date => {
            result[user][date] = 0; // Initialiser les points à 0 pour chaque date
        });

        // Parcourir les dates d'interactions
        Object.keys(interactionsData[user] || {}).forEach(date => {
            const interactionsCount = interactionsData[user][date].interactionsCount || 0;
            const downloadsCount = interactionsData[user][date].downloadsCount || 0;
            const uniqueInteractorsCount = uniqueInteractorsData[user][date] || 0;

            // Calculer les points pour cette date
            const totalPoints = interactionsCount + downloadsCount + uniqueInteractorsCount;

            // Stocker les points par date
            result[user][date] = totalPoints;
        });
    });

    return result;  // Retourner chaque utilisateur avec son nombre de points par jour
};


// Fonction pour calculer les points correspondant aux interactions d'un user avec les autres sur une période donnée 
exports.calculatePointsForInteractionsWithOthers = (users, data, startDate, endDate) => {
    // Filtrer les données en fonction de la période
    const filteredData = getDataBetweenDates(data, startDate, endDate);

    // Appeler les fonctions en passant la liste complète des utilisateurs
    const postsData = countPostsByUser(users, filteredData);
    const uniqueAuthorsData = countUniqueAuthorsUserInteractedWith(users, filteredData);
    const responseData = countInteractionsByUser(users, filteredData);
    
    const result = {};

    // Créer une liste de toutes les dates entre startDate et endDate
    const currentDate = new Date(startDate);
    const dateList = [];

    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Initialiser le résultat pour chaque utilisateur et chaque date
    users.forEach(user => {
        result[user] = {};
        dateList.forEach(date => {
            result[user][date] = 0; // Initialiser les points à 0 pour chaque date
        });

        // Accumuler les points pour chaque date d'interactions
        dateList.forEach(date => {
            const postsCount = postsData[user]?.[date] || 0; // Nombre de posts pour la date
            const uniqueAuthorsCount = uniqueAuthorsData[user]?.[date] || 0; // Nombre d'auteurs uniques pour la date
            const responseCount = responseData[user]?.[date] || 0; // Nombre de réponses pour la date

            // Calculer les points pour cette date
            const totalPoints = (3 * postsCount) + uniqueAuthorsCount + responseCount;

            // Ajouter les points au résultat
            result[user][date] = totalPoints;
        });
    });

    return result;  // Retourner chaque utilisateur avec son nombre de points par jour
};


// Fonction pour calculer les points correspondant au temps que l'utilisateur consacre aux autres 
// 1 point pour chaque 10% de la moyenne en plus de la moyenne pour le temps de rédaction, lecture et scroll
exports.calculatePointsForTimeSpent = (users, data, startDate, endDate) => {

    // Créer une liste de toutes les dates entre startDate et endDate
    const dateList = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filtrer les données en fonction de la période
    const filteredData = getDataBetweenDates(data, startDate, endDate);

    // Calculer les temps d'écriture, de lecture et de scroll pour tous les utilisateurs
    const writingTimes = calculateWritingTimeByUser(users, filteredData);
    const readingTimes = calculateReadingTimeByUser(users, filteredData);
    const scrollTimes = calculateScrollTimeByUser(users, filteredData);


    // Calculer la moyenne globale sur toute la durée
    const totalWritingTime = Object.values(writingTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalReadingTime = Object.values(readingTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalScrollTime = Object.values(scrollTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalUsers = users.length;
    const avgWritingTime = totalUsers ? totalWritingTime / totalUsers : 0;
    const avgReadingTime = totalUsers ? totalReadingTime / totalUsers : 0;
    const avgScrollTime = totalUsers ? totalScrollTime / totalUsers : 0;

    // Calculer les points pour chaque utilisateur par jour
    const userPoints = {};

    users.forEach(user => {
        userPoints[user] = {};
        dateList.forEach(date => {
            userPoints[user][date] = 0; // Initialiser les points à 0 pour chaque date

            const userWritingTime = writingTimes[user]?.[date] || 0;
            const userReadingTime = readingTimes[user]?.[date] || 0;
            const userScrollTime = scrollTimes[user]?.[date] || 0;

            // Calcul des points pour le temps de rédaction
            if (userWritingTime > avgWritingTime) {
                userPoints[user][date] += Math.floor((userWritingTime - avgWritingTime) / (0.1 * avgWritingTime));
            }

            // Calcul des points pour le temps de lecture
            if (userReadingTime > avgReadingTime) {
                userPoints[user][date] += Math.floor((userReadingTime - avgReadingTime) / (0.1 * avgReadingTime));
            }

            // Calcul des points pour le temps de scroll
            if (userScrollTime > avgScrollTime) {
                userPoints[user][date] += Math.floor((userScrollTime - avgScrollTime) / (0.1 * avgScrollTime));
            }
        });
    });

    return userPoints; // Retourner les points par utilisateur pour chaque jour
};


// Fonction pour calculer les points correspondant au temps que l'utilisateur reçoit des autres 
// 1 point pour chaque 10% de la moyenne en plus de la moyenne pour le temps de rédaction, lecture et scroll
exports.calculatePointsForTimeReceived = (users, data, startDate, endDate) => {

    // Filtrer les données en fonction de la période
    const filteredData = getDataBetweenDates(data, startDate, endDate);

    // Créer une liste de toutes les dates entre startDate et endDate
    const dateList = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculer les temps de rédaction, lecture et scroll reçus pour tous les utilisateurs
    const writingTimes = calculateWritingTimeByOthersForUser(users, filteredData);
    const readingTimes = calculateReadingTimeReceivedByUser(users, filteredData);
    const scrollTimes = calculateScrollTimeReceivedByUser(users, filteredData);

    // Calculer la moyenne globale sur toute la durée
    const totalWritingTime = Object.values(writingTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalReadingTime = Object.values(readingTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalScrollTime = Object.values(scrollTimes).reduce((sum, times) => {
        return sum + Object.values(times).reduce((a, b) => a + (b || 0), 0);
    }, 0);

    const totalUsers = users.length;
    const avgWritingTime = totalUsers ? totalWritingTime / totalUsers : 0;
    const avgReadingTime = totalUsers ? totalReadingTime / totalUsers : 0;
    const avgScrollTime = totalUsers ? totalScrollTime / totalUsers : 0;

    // Calculer les points pour chaque utilisateur par jour
    const userPoints = {};

    users.forEach(user => { // Parcourir tous les utilisateurs
        userPoints[user] = {};
        dateList.forEach(date => {  
            userPoints[user][date] = 0; // Initialiser les points à 0 pour chaque date

            const userWritingTime = writingTimes[user]?.[date] || 0;
            const userReadingTime = readingTimes[user]?.[date] || 0;
            const userScrollTime = scrollTimes[user]?.[date] || 0;

            // Calcul des points pour le temps de rédaction reçu
            if (userWritingTime > avgWritingTime) {
                userPoints[user][date] += Math.floor((userWritingTime - avgWritingTime) / (0.1 * avgWritingTime));
            }

            // Calcul des points pour le temps de lecture reçu
            if (userReadingTime > avgReadingTime) {
                userPoints[user][date] += Math.floor((userReadingTime - avgReadingTime) / (0.1 * avgReadingTime));
            }

            // Calcul des points pour le temps de scroll reçu
            if (userScrollTime > avgScrollTime) {
                userPoints[user][date] += Math.floor((userScrollTime - avgScrollTime) / (0.1 * avgScrollTime));
            }
        });
    }
    );

    return userPoints; // Retourner les points par utilisateur pour chaque jour

};