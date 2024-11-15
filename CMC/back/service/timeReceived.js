// Fonction pour calculer le temps de rédaction des autres par utilisateur (lorsque l'utilisateur reçoit des réponses à ses messages)
exports.calculateWritingTimeByOthersForUser = (data) => {
    const writingTimeByUser = {};

    //Calculer le temps de rédaction des autres pour les messages envoyés par un utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const replyingUser = operation.User.Name;
        const title = operation.Action.Title;
        const senderUser = operation.Message.Attributes.Parent.Sender; // Récupérer l'expéditeur du message parent
        const actionDate = new Date(operation.Action.Date);
        const actionDateString = actionDate.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est une réponse ou une citation
        if (
            title === "Repondre a un message" &&
            senderUser !== replyingUser
        ) {
                if (!writingTimeByUser[senderUser]) {
                    writingTimeByUser[senderUser] = {};
                }
                if (!writingTimeByUser[senderUser][actionDateString]) {
                    writingTimeByUser[senderUser][actionDateString] = 0;
                }
                writingTimeByUser[senderUser][actionDateString] += delay;
        }
    });

    return writingTimeByUser;
};

// Fonction pour calculer le temps de lecture reçu par utilisateur (temps que les autres passent à lire ses messages)
exports.calculateReadingTimeReceivedByUser = (data) => {
    const readingTimeReceivedByUser = {};

    // Étape 2 : Calculer le temps de lecture des messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const readerUser = operation.User.Name;
        const title = operation.Action.Title;
        const senderUser = operation.Message.Attributes.Parent.Sender;
        const actionDate = new Date(operation.Action.Date);
        const actionDateString = actionDate.toISOString().split('T')[0]; // Format "YYYY-MM-DD"
        const delay = operation.Action.Delai ? parseTimeToSeconds(operation.Action.Delai) : 0;

        // Si l'action est "Afficher le contenu d'un message" et qu'elle correspond à un id existant
        if (title === "Afficher le contenu d'un message" || title === "Afficher le fil de discussion" && senderUser !== readerUser) {

                if (!readingTimeReceivedByUser[senderUser]) {
                    readingTimeReceivedByUser[senderUser] = {};
                }
                if (!readingTimeReceivedByUser[senderUser][actionDateString]) {
                    readingTimeReceivedByUser[senderUser][actionDateString] = 0;
                }
                readingTimeReceivedByUser[senderUser][actionDateString] += delay;
        }
    });

    return readingTimeReceivedByUser;
};

// Fonction pour calculer le temps de scroll reçu par utilisateur (temps que les autres passent à lire ses messages) par jour 
exports.calculateScrollTimeReceivedByUser = (data) => {
    const scrollTimeReceivedByUser = {};
    const processedRefTran = new Set(); // Stocker les RefTran traités pour chaque date

    // Étape 2 : Calculer le temps de scroll des messages envoyés par chaque utilisateur
    data.forEach(item => {
        const operation = item.Operation;
        const scrollerUser = operation.User.Name; // User who is scrolling
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const senderUser = operation.Message.Attributes.Parent.Sender;
        const actionDate = new Date(operation.Action.Date).toLocaleDateString('en-CA'); // Format "YYYY-MM-DD"

        // Vérifier si l'action est "Bouger la Scrollbar"
        if (title.includes("Bouger la ScrollBar")) {

            // Vérifier si le RefTran a déjà été traité pour la date actuelle
            if (!processedRefTran.has(refTran)) {

                if (senderUser !== scrollerUser) {
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
                // Ajouter le RefTran à la liste des RefTran traités pour la date actuelle
                processedRefTran.add(refTran);
            }
        }
    });

    return scrollTimeReceivedByUser;
};

// Fonction utilitaire pour convertir le temps (hh:mm:ss) en secondes
function parseTimeToSeconds(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}
