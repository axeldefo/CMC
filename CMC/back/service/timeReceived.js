// Fonction pour calculer le temps de rédaction des autres par utilisateur (lorsque l'utilisateur reçoit des réponses à ses messages)
exports.calculateWritingTimeByOthersForUser = (data) => {

    const writingTimeByUser = {};
    const messageSentByUser = {};

    // Étape 1 : Identifier les messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date);

        // Si l'action est "Envoyer un message", l'enregistrer sous l'utilisateur
        if (title === "Repondre a un message" ||
            title === "Citer un message" ||
            title === "Poster un nouveau message") {
            if (!messageSentByUser[user]) {
                messageSentByUser[user] = [];
            }
            messageSentByUser[user].push({
                refTran,
                date: actionDate
            });
        }
    });

    // Étape 2 : Calculer le temps de rédaction des autres pour les messages envoyés par un utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const replyingUser = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date);
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est une réponse ou une citation
        if (
            title === "Repondre a un message" ||
            title === "Citer un message" ||
            title === "Poster un nouveau message"
        ) {
            const senderUser = getUserWhoSentMessage(refTran, messageSentByUser);

            if (senderUser && senderUser !== replyingUser) {
                if (!writingTimeByUser[senderUser]) {
                    writingTimeByUser[senderUser] = 0;
                }
                writingTimeByUser[senderUser] += delay;
            }
        }
    });

    return writingTimeByUser;
};



// Fonction pour calculer le temps de lecture reçu par utilisateur (temps que les autres passent à lire ses messages)
exports.calculateReadingTimeReceivedByUser = (data) => {
    
    const readingTimeReceivedByUser = {};
    const messageSentByUser = {};
    const messageReadingTime = {};

    // Étape 1 : Identifier les messages envoyés par chaque utilisateur et initialiser les objets de lecture
    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date);

        // Si l'action est l'envoi d'un message, l'enregistrer sous l'utilisateur
        if (title === "Repondre a un message" || title === "Repondre a un message" || title === "Citer un message" || title === "Poster un nouveau message") {
            if (!messageSentByUser[user]) {
                messageSentByUser[user] = [];
            }
            messageSentByUser[user].push({
                refTran,
                date: actionDate
            });
        }
    });

    // Étape 2 : Calculer le temps de lecture des messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const readerUser = operation.User.Name;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date);
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est "Afficher le contenu d'un message" et qu'elle correspond à un refTran existant
        if (title === "Afficher le contenu d'un message" || title === "Afficher le fil de discussion") {
            const senderUser = getUserWhoSentMessage(refTran, messageSentByUser);

            if (senderUser && senderUser !== readerUser) {
                if (!readingTimeReceivedByUser[senderUser]) {
                    readingTimeReceivedByUser[senderUser] = 0;
                }
                readingTimeReceivedByUser[senderUser] += delay;
            }
        }

        // Étape 3 : Calculer le temps de scroll pour le message en cours
        if (title === "Bouger la Scrollbar") {
            const senderUser = getUserWhoSentMessage(refTran, messageSentByUser);

            if (senderUser && senderUser !== readerUser) {
                if (!messageReadingTime[refTran]) {
                    messageReadingTime[refTran] = [];
                }
                messageReadingTime[refTran].push({
                    readerUser,
                    id: operation.id,
                    date: actionDate
                });
            }
        }
    });

    // Étape 4 : Calculer la durée des sessions de scroll pour chaque message
    for (const refTran in messageReadingTime) {
        const session = messageReadingTime[refTran];
        session.sort((a, b) => a.id - b.id);

        const firstAction = session[0];
        const lastAction = session[session.length - 1];
        const scrollTimeInSeconds = (lastAction.date - firstAction.date) / 1000;

        const senderUser = getUserWhoSentMessage(refTran, messageSentByUser);
        const readerUser = firstAction.readerUser;

        if (senderUser && senderUser !== readerUser) {
            if (!readingTimeReceivedByUser[senderUser]) {
                readingTimeReceivedByUser[senderUser] = 0;
            }
            readingTimeReceivedByUser[senderUser] += scrollTimeInSeconds;
        }
    }

    return readingTimeReceivedByUser;
};

// Fonction pour trouver l'utilisateur qui a envoyé un message basé sur refTran
const getUserWhoSentMessage = (refTran, messageSentByUser) => {
    for (const user in messageSentByUser) {
        const messages = messageSentByUser[user];
        for (const message of messages) {
            if (message.refTran === refTran) {
                return user;
            }
        }
    }
    return null;
};

// Fonction utilitaire pour convertir le temps (hh:mm:ss) en secondes
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}
