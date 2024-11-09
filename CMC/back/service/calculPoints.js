const { countUniqueInteractorsForUsersAsSender, countInteractionsAndDownloadsForUser } = require('./generatedInteractions');
const { countPostsByUser, countUniqueAuthorsUserInteractedWith, countInteractionsByUser, countResponseAfterReading } = require('./interactionWithOthers');
const { calculateWritingTimeByUser, calculateReadingTimeByUser, calculateScrollTimeByUser, timeBetweenReadingAndResponding } = require('./timeSpent');
const { calculateWritingTimeByOthersForUser, calculateReadingTimeReceivedByUser, calculateScrollTimeReceivedByUser } = require('./timeReceived');

// Fonction utilitaire pour convertir une date en format standard (AAAA-MM-JJ HH:MM:SS) en objet Date
const parseDate = (dateStr) => new Date(dateStr);

// Fonction pour récupérer les données entre deux dates et pour un forum (Operations.Message.Forum) donné (si spécifié)
const getFilteredData = (data, startDateStr, endDateStr, forum) => {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    const filteredData = data.filter(item => {
        const actionDate = parseDate(item.Operation.Action.Date);
        
        // Convert forum to a number for comparison
        const forumMatch = (forum && forum !== "") ? parseInt(item.Operation.Message.Attributes.Forum) === parseInt(forum) : true;

        // Check if actionDate is within the date range and forum matches
        return actionDate >= startDate && actionDate <= endDate && forumMatch;
    });
    return filteredData;
};


// Fonction pour calculer les points correspondant aux interactions générées par user par jour sur une période donnée
exports.calculatePointsForGeneratedInteractions = (users, data, startDate, endDate, forum) => {

    // Filtrer les données en fonction de la période
    const filteredData = getFilteredData(data, startDate, endDate, forum);

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

            // Calculer les points pour cette date d'interactions (1 point par interaction, 3 points par téléchargement, 1 point par interlocuteur unique)
            const totalPoints = interactionsCount + downloadsCount + uniqueInteractorsCount;

            // Stocker les points par date
            result[user][date] = totalPoints;
        });
    });

    return result;  // Retourner chaque utilisateur avec son nombre de points par jour
};


// Fonction pour calculer les points correspondant aux interactions d'un user avec les autres sur une période donnée 
exports.calculatePointsForInteractionsWithOthers = (users, data, startDate, endDate, forum) => {
    // Filtrer les données en fonction de la période
    const filteredData = getFilteredData(data, startDate, endDate, forum);

    // Appeler les fonctions en passant la liste complète des utilisateurs
    const postsData = countPostsByUser(users, filteredData);
    const uniqueAuthorsData = countUniqueAuthorsUserInteractedWith(users, filteredData);
    const responseData = countInteractionsByUser(users, filteredData);
    const responseAfterReadingData = countResponseAfterReading(users, filteredData);
    
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
            const responseAfterReading = responseAfterReadingData[user]?.[date] || 0; // Nombre de réponses après lecture pour la date

            // Calculer les points pour cette date d'interactions (3 points par post, 1 point par auteur unique, 1 point par réponse, 3 points par réponse après lecture)
            const totalPoints = (3 * postsCount) + uniqueAuthorsCount + responseCount + (3 * responseAfterReading);

            // Ajouter les points au résultat
            result[user][date] = totalPoints;
        });
    });

    return result;  // Retourner chaque utilisateur avec son nombre de points par jour
};


// Fonction pour calculer les points correspondant au temps que l'utilisateur consacre aux autres 
// 1 point pour chaque 10% de plus que la moyenne pour le temps de rédaction, lecture et scroll et 1 point pour chaque 10% de moins que la médiane pour le temps entre lecture et réponse
exports.calculatePointsForTimeSpent = (users, data, startDate, endDate, forum) => {

    // Créer une liste de toutes les dates entre startDate et endDate
    const dateList = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dateList.push(currentDate.toISOString().split('T')[0]); // Format "YYYY-MM-DD"
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Filtrer les données en fonction de la période
    const filteredData = getFilteredData(data, startDate, endDate, forum);

    // Calculer les temps d'écriture, de lecture et de scroll pour tous les utilisateurs
    const writingTimes = calculateWritingTimeByUser(users, filteredData);
    const readingTimes = calculateReadingTimeByUser(users, filteredData);
    const scrollTimes = calculateScrollTimeByUser(users, filteredData);
    const timeBetweenReadingAndRespondingData = timeBetweenReadingAndResponding(users, filteredData);

    // Calculer la limite pour la comparaison du temps entre la lecture et la réponse
    const limitTimeBetweenReadingAndResponding = 1000;

    const totalUsers = users.length;
    const avgWritingTime = totalUsers ? Object.values(writingTimes).flat().reduce((sum, times) => sum + times, 0) / totalUsers : 0;
    const avgReadingTime = totalUsers ? Object.values(readingTimes).flat().reduce((sum, times) => sum + times, 0) / totalUsers : 0;
    const avgScrollTime = totalUsers ? Object.values(scrollTimes).flat().reduce((sum, times) => sum + times, 0) / totalUsers : 0;

    // Calculer les points pour chaque utilisateur par jour
    const userPoints = {};

    users.forEach(user => {
        userPoints[user] = {};
        dateList.forEach(date => {
            userPoints[user][date] = 0; // Initialiser les points à 0 pour chaque date

            const userWritingTime = writingTimes[user]?.[date] || 0;
            const userReadingTime = readingTimes[user]?.[date] || 0;
            const userScrollTime = scrollTimes[user]?.[date] || 0;
            const userTimeBetweenReadingAndResponding = timeBetweenReadingAndRespondingData[user]?.[date] || 0;

            // Calcul des points pour le temps de rédaction (1 point pour chaque 10% de plus que la moyenne)
            if (userWritingTime > avgWritingTime) {
                userPoints[user][date] += Math.floor((userWritingTime - avgWritingTime) / (0.1 * avgWritingTime));
            }

            // Calcul des points pour le temps de lecture (1 point pour chaque 10% de plus que la moyenne)
            if (userReadingTime > avgReadingTime) {
                userPoints[user][date] += Math.floor((userReadingTime - avgReadingTime) / (0.1 * avgReadingTime));
            }

            // Calcul des points pour le temps de scroll (1 point pour chaque 10% de plus que la moyenne)
            if (userScrollTime > avgScrollTime) {
                userPoints[user][date] += Math.floor((userScrollTime - avgScrollTime) / (0.1 * avgScrollTime));
            }

            // Calcul des points pour le temps entre la lecture et la réponse (1 point pour chaque 10% de moins que la limite 
            if (userTimeBetweenReadingAndResponding < limitTimeBetweenReadingAndResponding && userTimeBetweenReadingAndResponding > 0) {
                userPoints[user][date] += Math.floor((limitTimeBetweenReadingAndResponding - userTimeBetweenReadingAndResponding) / (0.1 * limitTimeBetweenReadingAndResponding));
            }

        });
    });

    return userPoints; // Retourner les points par utilisateur pour chaque jour
};


// Fonction pour calculer les points correspondant au temps que l'utilisateur reçoit des autres 
// 1 point pour chaque 10% de la moyenne en plus de la moyenne pour le temps de rédaction, lecture et scroll
exports.calculatePointsForTimeReceived = (users, data, startDate, endDate, forum) => {

    // Filtrer les données en fonction de la période
    const filteredData = getFilteredData(data, startDate, endDate, forum);

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

            // Calcul des points pour le temps de rédaction reçu (1 point pour chaque 10% de plus que la moyenne)
            if (userWritingTime > avgWritingTime) {
                userPoints[user][date] += Math.floor((userWritingTime - avgWritingTime) / (0.1 * avgWritingTime));
            }

            // Calcul des points pour le temps de lecture reçu (1 point pour chaque 10% de plus que la moyenne)
            if (userReadingTime > avgReadingTime) {
                userPoints[user][date] += Math.floor((userReadingTime - avgReadingTime) / (0.1 * avgReadingTime));
            }

            // Calcul des points pour le temps de scroll reçu (1 point pour chaque 10% de plus que la moyenne)
            if (userScrollTime > avgScrollTime) {
                userPoints[user][date] += Math.floor((userScrollTime - avgScrollTime) / (0.1 * avgScrollTime));
            }
        });
    }
    );

    return userPoints; // Retourner les points par utilisateur pour chaque jour

};