// Fonction pour calculer le temps de rédaction des autres par utilisateur (lorsque l'utilisateur reçoit des réponses à ses messages)
exports.calculateWritingTimeByOthersForUser = (users, data) => {
    const writingTimeByUser = {};
    const messageSentByUser = {};

    // Étape 1 : Identifier les messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const id = operation.Message.id;
        const actionDate = new Date(operation.Action.Date);

        // Si l'action est "Envoyer un message", l'enregistrer sous l'utilisateur
        if (users.includes(user) && (title === "Repondre a un message" || title === "Citer un message")) {
            if (!messageSentByUser[user]) {
                messageSentByUser[user] = [];
            }
            messageSentByUser[user].push({ id, date: actionDate });
        }
    });

    // Étape 2 : Calculer le temps de rédaction des autres pour les messages envoyés par un utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const replyingUser = operation.User.Name;
        const title = operation.Action.Title;
        const id = operation.Message.id;
        const actionDate = new Date(operation.Action.Date);
        const actionDateString = actionDate.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est une réponse ou une citation
        if (
            title === "Repondre a un message" ||
            title === "Citer un message"
        ) {
            const senderUser = getUserWhoSentMessage(id, messageSentByUser);

            if (senderUser && senderUser !== replyingUser) {
                if (!writingTimeByUser[senderUser]) {
                    writingTimeByUser[senderUser] = {};
                }
                if (!writingTimeByUser[senderUser][actionDateString]) {
                    writingTimeByUser[senderUser][actionDateString] = 0;
                }
                writingTimeByUser[senderUser][actionDateString] += delay;
            }
        }
    });

    return writingTimeByUser;
};

// Fonction pour calculer le temps de lecture reçu par utilisateur (temps que les autres passent à lire ses messages)
exports.calculateReadingTimeReceivedByUser = (users, data) => {
    const readingTimeReceivedByUser = {};
    const messageSentByUser = {};

    // Étape 1 : Identifier les messages envoyés par chaque utilisateur et initialiser les objets de lecture
    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const id = operation.Message.id;
        const actionDate = new Date(operation.Action.Date);

        // Si l'action est l'envoi d'un message, l'enregistrer sous l'utilisateur
        if (users.includes(user) && (title === "Repondre a un message" || title === "Citer un message" || title === "Poster un nouveau message")) {
            if (!messageSentByUser[user]) {
                messageSentByUser[user] = [];
            }
            messageSentByUser[user].push({ id, date: actionDate });
        }
    });

    // Étape 2 : Calculer le temps de lecture des messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const readerUser = operation.User.Name;
        const title = operation.Action.Title;
        const id = operation.Message.id;
        const actionDate = new Date(operation.Action.Date);
        const actionDateString = actionDate.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est "Afficher le contenu d'un message" et qu'elle correspond à un id existant
        if (title === "Afficher le contenu d'un message" || title === "Afficher le fil de discussion") {
            const senderUser = getUserWhoSentMessage(id, messageSentByUser);

            if (senderUser && senderUser !== readerUser) {
                if (!readingTimeReceivedByUser[senderUser]) {
                    readingTimeReceivedByUser[senderUser] = {};
                }
                if (!readingTimeReceivedByUser[senderUser][actionDateString]) {
                    readingTimeReceivedByUser[senderUser][actionDateString] = 0;
                }
                readingTimeReceivedByUser[senderUser][actionDateString] += delay;
            }
        }
    });

    return readingTimeReceivedByUser;
};

// Fonction pour calculer le temps de scroll reçu par utilisateur (temps que les autres passent à lire ses messages) par jour 
exports.calculateScrollTimeReceivedByUser = (users, data) => {
    const scrollTimeReceivedByUser = {};
    const messageSentByUser = {};

    // Étape 1 : Identifier les messages envoyés par chaque utilisateur et initialiser les objets de lecture
    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const messageId = operation.Message.id;
        const sender = operation.Message.Sender; // Récupérer le sender directement
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Si l'action est l'envoi d'un message, l'enregistrer sous l'utilisateur
        if (users.includes(user) && (title === "Repondre a un message" || title === "Citer un message" || title === "Poster un nouveau message")) {
            if (!messageSentByUser[sender]) {
                messageSentByUser[sender] = [];
            }
            messageSentByUser[sender].push({ id: messageId, date: actionDate });
        }
    });

    // Étape 2 : Calculer le temps de scroll des messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const scrollerUser = operation.User.Name; // User who is scrolling
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'action est "Bouger la Scrollbar"
        if (title.includes("Bouger la Scrollbar")) {
            // Trouver le message correspondant en utilisant le RefTran
            const relatedMessage = data.find(op => op.Operation.Action.RefTran === refTran);
            if (relatedMessage) {
                const senderUser = relatedMessage.Operation.Message.Sender; // Récupérer l'expéditeur

                // Assurer que le scroller n'est pas le même que l'expéditeur du message
                if (senderUser && senderUser !== scrollerUser) {
                    // Trouver les dates min et max des opérations liées
                    const relatedOperations = data.filter(op => op.Operation.Action.RefTran === refTran);
                    const dateDebut = Math.min(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));
                    const dateFin = Math.max(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));
                    const scrollTimeInSeconds = (dateFin - dateDebut) / 1000;

                    if (!scrollTimeReceivedByUser[senderUser]) {
                        scrollTimeReceivedByUser[senderUser] = {};
                    }
                    if (!scrollTimeReceivedByUser[senderUser][actionDate]) {
                        scrollTimeReceivedByUser[senderUser][actionDate] = 0;
                    }
                    scrollTimeReceivedByUser[senderUser][actionDate] += scrollTimeInSeconds; // Add scroll time for the user per day
                }
            }
        }
    });

    return scrollTimeReceivedByUser;
};

// Fonction pour trouver l'utilisateur qui a envoyé un message basé sur id
const getUserWhoSentMessage = (id, messageSentByUser) => {
    for (const user in messageSentByUser) {
        const messages = messageSentByUser[user];
        for (const message of messages) {
            if (message.id === id) {
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
