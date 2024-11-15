
// Fonction pour calculer le temps de rédaction par utilisateur par jour
exports.calculateWritingTimeByUser = (data) => {

    const writingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const parentSender = operation.Message.Attributes.Parent.Sender;
        const actionTitle = operation.Action.Title;
        const delayInSeconds = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        if (["Repondre a un message", "Poster un nouveau message"].includes(actionTitle) && user !== parentSender) {

            if (!writingTimes[user]) {
                writingTimes[user] = {};
            }
            if (!writingTimes[user][actionDate]) {
                writingTimes[user][actionDate] = 0;
            }
            writingTimes[user][actionDate] += delayInSeconds; // Add delay in seconds for the user per day

        }
    });

    return writingTimes;
};

// Fonction pour calculer le temps de lecture par utilisateur par jour
exports.calculateReadingTimeByUser = (data) => {

    const readingTimes = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const parentSender = operation.Message.Attributes.Parent.Sender;
        const title = operation.Action.Title;
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        if ((title === "Afficher le fil de discussion" || title === "Afficher le contenu d'un message") && user !== parentSender) {

            if (!readingTimes[user]) {
                readingTimes[user] = {};
            }
            if (!readingTimes[user][actionDate]) {
                readingTimes[user][actionDate] = 0;
            }
            readingTimes[user][actionDate] += delay; // Add reading time for the user per day
        }
    });

    return readingTimes;
};

// Fonction pour calculer le temps de scroll par utilisateur par jour
exports.calculateScrollTimeByUser = (data) => {
    const scrollTimes = {};
    const processedRefTran = new Set(); // Set pour stocker les RefTran déjà traités

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const parentSender = operation.Message.Attributes.Parent.Sender;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date).toLocaleDateString('en-CA'); // Format "YYYY-MM-DD"

        // Vérifier que l'utilisateur est dans la liste des utilisateurs spécifiés
        if (title.includes("Bouger la ScrollBar") && user !== parentSender && !processedRefTran.has(refTran)) {

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

            // Ajouter le RefTran au Set pour indiquer qu'il a été traité
            processedRefTran.add(refTran);

        }
    });

    return scrollTimes;
};


// Fonction pour calculer le temps entre la lecture et la réponse par utilisateur par jour
exports.timeBetweenReadingAndResponding = (data) => {
    let responseTimesByDay = {};
    const processedRefTran = new Set(); // Set pour éviter de traiter plusieurs fois le même RefTran

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const messageId = operation.Message.Attributes.Parent.id;
        const delai = operation.Action.Delai;
        const delayInSeconds = operation.Action.Delai? parseTimeToSeconds(delai) : 0;
        const parentSender = operation.Message.Attributes.Parent.Sender;

        // Vérifier si l'utilisateur est dans la liste et que l'action est une lecture
        if ((title === "Afficher le contenu d'un message" || title === "Bouger la ScrollBar")) {
            // Cas où l'action est un affichage de contenu
            if (refTran === 0 && title === "Afficher le contenu d'un message") {
                const readingDate = new Date(operation.Action.Date);
                const readingTimeInSeconds = readingDate.getTime() / 1000; // Convertir l'heure en secondes
                const endReadingTime = readingTimeInSeconds + delayInSeconds;

                // Trouver la prochaine action après la lecture
                const nextAction = data.find(op =>
                    op.Operation.User.Name === user &&
                    new Date(op.Operation.Action.Date).getTime() / 1000 > endReadingTime
                );

                if (nextAction) {
                    const nextTitle = nextAction.Operation.Action.Title;
                    const nextParentMessageId = nextAction.Operation.Message.Attributes.Parent.id;
                    const nextActionDate = new Date(nextAction.Operation.Action.Date).toLocaleDateString('en-CA');

                    // Vérifier si c'est une réponse ou citation pour le même message
                    if ((nextTitle === "Repondre a un message" || nextTitle === "Citer un message") &&
                        nextParentMessageId === messageId && parentSender !== user) {

                        const responseTimeInSeconds = (new Date(nextAction.Operation.Action.Date).getTime() / 1000) - endReadingTime;

                        if (!responseTimesByDay[user]) responseTimesByDay[user] = {};
                        if (!responseTimesByDay[user][nextActionDate]) responseTimesByDay[user][nextActionDate] = [];

                        responseTimesByDay[user][nextActionDate] += responseTimeInSeconds;
                    }
                }
            }

            // Cas où l'action est un défilement (scroll)
            if (refTran !== 0 && title === "Bouger la ScrollBar" && !processedRefTran.has(refTran)) {
                // Récupérer toutes les opérations ayant le même RefTran pour le même utilisateur
                const relatedOperations = data.filter(op =>
                    op.Operation.Action.RefTran === refTran &&
                    op.Operation.User.Name === user 
                );

                // Trouver la date et l'heure de la dernière action de lecture (scroll)
                const latestReadingActionTime = Math.max(...relatedOperations.map(op => {
                    const timeStr = op.Operation.Action.Date.split(' ')[1];
                    return parseTimeToSeconds(timeStr);
                }));

                // Calculer la date de fin avec le délai, si présent
                let endReadingTime = latestReadingActionTime;
                if (delayInSeconds) {
                    endReadingTime += delayInSeconds; // Ajouter le délai à l'heure de la lecture
                }

                // Trouver la prochaine action après le défilement
                const nextAction = data.find(op =>
                    op.Operation.User.Name === user &&
                    parseTimeToSeconds(op.Operation.Action.Date.split(' ')[1]) > endReadingTime
                );

                if (nextAction) {
                    const nextTitle = nextAction.Operation.Action.Title;
                    const nextParentMessageId = nextAction.Operation.Message.Attributes.Parent.id;
                    const nextActionDate = new Date(nextAction.Operation.Action.Date).toLocaleDateString('en-CA');

                    // Vérifier si c'est une réponse ou citation pour le même message
                    if ((nextTitle === "Repondre a un message" || nextTitle === "Citer un message") &&
                        nextParentMessageId === messageId && parentSender !== user) {

                        const responseTimeInSeconds = parseTimeToSeconds(nextAction.Operation.Action.Date.split(' ')[1]) - endReadingTime;

                        if (!responseTimesByDay[user]) responseTimesByDay[user] = {};
                        if (!responseTimesByDay[user][nextActionDate]) responseTimesByDay[user][nextActionDate] = [];

                        responseTimesByDay[user][nextActionDate] += responseTimeInSeconds;
                    }
                }
            }
            // Ajouter le RefTran au Set pour éviter les duplications
            processedRefTran.add(refTran);
        }
    });

    return responseTimesByDay;
};


// Fonction utilitaire pour convertir le temps (hh:mm:ss) en secondes
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}
