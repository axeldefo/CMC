// Fonction pour calculer le temps de rédaction par utilisateur par jour
exports.calculateWritingTimeByUser = (users, data) => {

    const writingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const actionTitle = operation.Action.Title;
        const delay = operation.Action.Delai;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        if (users.includes(user) && ["Repondre a un message", "Poster un nouveau message", "Citer un message"].includes(actionTitle)) {
            if (delay) {
                const delayInSeconds = parseTimeToSeconds(delay);

                if (!writingTimes[user]) {
                    writingTimes[user] = {};
                }
                if (!writingTimes[user][actionDate]) {
                    writingTimes[user][actionDate] = 0;
                }
                writingTimes[user][actionDate] += delayInSeconds; // Add delay in seconds for the user per day
            }
        }
    });

    return writingTimes;
};

// Fonction pour calculer le temps de lecture par utilisateur par jour
exports.calculateReadingTimeByUser = (users, data) => {

    const readingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const delay = operation.Action.Delai;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        if (users.includes(user) && (title === "Afficher le fil de discussion" || title === "Afficher le contenu d'un message")) {
            if (delay) {
                const timeInSeconds = parseTimeToSeconds(delay);

                if (!readingTimes[user]) {
                    readingTimes[user] = {};
                }
                if (!readingTimes[user][actionDate]) {
                    readingTimes[user][actionDate] = 0;
                }
                readingTimes[user][actionDate] += timeInSeconds; // Add reading time for the user per day
            }
        }
    });

    return readingTimes;
};

// Fonction pour calculer le temps de scroll par utilisateur par jour
exports.calculateScrollTimeByUser = (users, data) => {

    const scrollTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier que l'utilisateur est dans la liste des utilisateurs spécifiés
        if (users.includes(user) && title.includes("Bouger la Scrollbar")) {
            // Récupérer toutes les opérations ayant le même RefTran pour le même utilisateur
            const relatedOperations = data.filter(op => 
                op.Operation.Action.RefTran === refTran && 
                op.Operation.User.Name === user
            );

            // Trouver la date de début et de fin pour ces opérations
            const dateDebut = Math.min(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));
            const dateFin = Math.max(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));
            const scrollTimeInSeconds = (dateFin - dateDebut) / 1000;

            // Initialiser l'objet utilisateur et la date si nécessaires
            if (!scrollTimes[user]) {
                scrollTimes[user] = {};
            }
            if (!scrollTimes[user][actionDate]) {
                scrollTimes[user][actionDate] = 0;
            }
            // Ajouter le temps de scroll pour l'utilisateur par jour
            scrollTimes[user][actionDate] += scrollTimeInSeconds;
        }
    });

    return scrollTimes;
};

// Fonction utilitaire pour convertir le temps (hh:mm:ss) en secondes
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}
