// Fonction pour calculer le temps de rédaction par utilisateur
exports.calculateWritingTimeByUser = (data) => {

    const writingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const actionTitle = operation.Action.Title;
        const delay = operation.Action.Delai;

        // Vérifier si l'action correspond à une écriture (répondre, poster, citer)
        if (["Repondre a un message", "Poster un nouveau message", "Citer un message"].includes(actionTitle)) {
            if (delay) {
                // Convertir la durée en secondes
                const delayParts = delay.split(':');
                const delayInSeconds = (+delayParts[0] * 3600) + (+delayParts[1] * 60) + (+delayParts[2]);

                if (!writingTimes[user]) {
                    writingTimes[user] = [];
                }
                writingTimes[user].push(delayInSeconds);  // Ajouter le délai en secondes pour l'utilisateur
            }
        }
    });

    return writingTimes;
};


// Fonction pour calculer la moyenne des temps de rédaction pour tous les utilisateurs
exports.calculateOverallAverageWritingTime = () => {
    const averageWritingTimes = exports.calculateAverageWritingTimeByUser();  // Récupérer la moyenne par utilisateur

    const allTimes = Object.values(averageWritingTimes);

    const totalAverageTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;  // Calculer la moyenne globale

    return totalAverageTime;
};

// Fonction pour calculer le temps d'affichage par utilisateur
exports.calculateReadingTimeByUser = (data) => {

    const readingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const delay = operation.Action.Delai;

        // Vérifier si le titre correspond à "Afficher le fil de discussion" ou "Afficher le contenu d'un message"
        if (title === "Afficher le fil de discussion" || title === "Afficher le contenu d'un message") {
            if (delay) {
                const timeInSeconds = parseTimeToSeconds(delay); // Convertir le délai en secondes

                if (!readingTimes[user]) {
                    readingTimes[user] = 0; // Initialiser le compteur pour l'utilisateur
                }

                readingTimes[user] += timeInSeconds; // Ajouter le temps de lecture
            }
        }
    });

    return readingTimes; // Retourner le temps de lecture par utilisateur
};

// Fonction pour calculer le temps de scroll par utilisateur
exports.calculateScrollTimeByUser = (data) => {

    const scrollTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;

        // Vérifier si le titre correspond à "Bouger la Scrollbar"
        if (title === "Bouger la Scrollbar") {
            const relatedOperations = data.filter(op => op.Operation.Action.RefTran === refTran);

            // Trouver les dates des opérations avec le même RefTran
            const minDate = Math.min(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));
            const maxDate = Math.max(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));

            const scrollTimeInSeconds = (maxDate - minDate) / 1000; // Calculer le temps de scroll en secondes

            if (!scrollTimes[user]) {
                scrollTimes[user] = 0; // Initialiser le compteur pour l'utilisateur
            }

            scrollTimes[user] += scrollTimeInSeconds; // Ajouter le temps de scroll
        }
    });

    return scrollTimes; // Retourner le temps de scroll par utilisateur
};

// Fonction pour calculer le temps moyen de lecture
exports.calculateAverageReadingTime = () => {
    const readingTimes = this.calculateReadingTimeByUser();
    const scrollTimes = this.calculateScrollTimeByUser();

    const totalTimes = {};

    // Combiner les temps de lecture et de scroll pour chaque utilisateur
    for (const user in readingTimes) {
        if (!totalTimes[user]) {
            totalTimes[user] = 0;
        }
        totalTimes[user] += readingTimes[user];
    }

    for (const user in scrollTimes) {
        if (!totalTimes[user]) {
            totalTimes[user] = 0;
        }
        totalTimes[user] += scrollTimes[user];
    }

    // Calculer la moyenne du temps de lecture
    const totalReadingTime = Object.values(totalTimes).reduce((acc, curr) => acc + curr, 0);
    const userCount = Object.keys(totalTimes).length;

    const averageReadingTime = totalReadingTime / userCount;

    return averageReadingTime; // Retourner la moyenne du temps de lecture
};

// Fonction utilitaire pour convertir le temps (hh:mm:ss) en secondes
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}