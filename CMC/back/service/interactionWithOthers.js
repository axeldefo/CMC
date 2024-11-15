// Fonction pour calculer le nombre de posts par utilisateur par jour
exports.countPostsByUser = (data) => {

    const postCount = {};
    

    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.User.Name;
        const title = operation.Action.Title;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste spécifiée et que l'action correspond à "Poster un nouveau message"
        if (title === "Poster un nouveau message") {
            if (!postCount[sender]) {
                postCount[sender] = {};  // Initialiser l'objet pour l'utilisateur
            }
            if (!postCount[sender][actionDate]) {
                postCount[sender][actionDate] = 0;  // Initialiser le compteur pour le jour
            }
            postCount[sender][actionDate]++;  // Incrémenter le compteur pour l'utilisateur pour ce jour
        }
    });

    return postCount;  // Retourner le nombre de posts par utilisateur par jour
};

// Fonction pour calculer le nombre de réponses et de citations par utilisateur par jour
exports.countInteractionsByUser = (data) => {

    const responseCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Attributes.Parent.Sender;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if ((title === "Repondre a un message" || 
             title === "Citer un message" || 
             title === "Afficher le fil de discussion" || 
             title === "Afficher le contenu d'un message" ||
             title === "Download un fichier dans le message") && sender !== user) {
            // S'assurer que l'utilisateur n'est pas l'expéditeur
            if (user !== sender) {
                if (!responseCount[user]) {
                    responseCount[user] = {};  // Initialiser l'objet pour l'utilisateur
                }
                if (!responseCount[user][actionDate]) {
                    responseCount[user][actionDate] = 0;  // Initialiser le compteur pour le jour
                }
                responseCount[user][actionDate]++;  // Incrémenter le compteur pour l'utilisateur pour ce jour
            }
        }
    });

    return responseCount;  // Retourner le nombre de réponses et de citations par utilisateur par jour
};

// Fonction pour calculer la pluralité des auteurs uniques avec lesquels un utilisateur répond ou cite par jour
exports.countUniqueAuthorsUserInteractedWith = (data) => {

    const authorsCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Attributes.Parent.Sender;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if ((title === "Repondre a un message" || 
             title === "Citer un message" || 
             title === "Afficher le fil de discussion" || 
             title === "Afficher le contenu d'un message" ||
             title === "Download un fichier dans le message") && sender !== user) {
            // S'assurer que l'utilisateur n'est pas l'expéditeur
            if (user !== sender && sender) {
                if (!authorsCount[user]) {
                    authorsCount[user] = {};  // Initialiser l'objet pour l'utilisateur
                }
                if (!authorsCount[user][actionDate]) {
                    authorsCount[user][actionDate] = new Set();  // Utiliser un Set pour garder les auteurs uniques
                }
                authorsCount[user][actionDate].add(sender);  // Ajouter l'auteur au Set
            }
        }
    });

    // Convertir les Sets en compte d'auteurs uniques
    const uniqueAuthorsCount = {};
    for (const user in authorsCount) {
        uniqueAuthorsCount[user] = {};  // Initialiser l'objet pour le nombre d'auteurs uniques
        for (const date in authorsCount[user]) {
            uniqueAuthorsCount[user][date] = authorsCount[user][date].size;  // Compter le nombre d'auteurs uniques pour chaque jour
        }
    }

    return uniqueAuthorsCount;  // Retourner le nombre d'auteurs uniques par utilisateur par jour
};

// Fonction pour compter les réponses ou citations immédiatement après la lecture d'un message par utilisateur par jour
exports.countResponseAfterReading = (data) => {

    let responseCountsByDay = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const sender = operation.Message.Attributes.Parent.Sender;
        const title = operation.Action.Title;
        const refTran = operation.Action.RefTran;
        const messageId = operation.Message.id;

        // Vérifier si l'utilisateur est dans la liste et que l'action est une lecture
        if ((title === "Afficher le contenu d'un message" || title === "Bouger la ScrollBar") && sender !== user) {
            if (title === "Afficher le contenu d'un message") {
                const readingDate = new Date(operation.Action.Date);
                const readingTimeInSeconds = readingDate.getTime() / 1000; // Convertir l'heure en secondes

                // Trouver la prochaine action après la lecture
                const nextAction = data.find(op => 
                    op.Operation.User.Name === user &&
                    new Date(op.Operation.Action.Date).getTime() / 1000 > readingTimeInSeconds // Action suivante
                );

                if (nextAction) {
                    const nextTitle = nextAction.Operation.Action.Title;
                    const nextParentMessageId = nextAction.Operation.Message.Attributes.Parent.id;
                    const nextActionDate = new Date(nextAction.Operation.Action.Date).toISOString().split('T')[0]; // Date au format YYYY-MM-DD

                    // Vérifier si la prochaine action est une réponse ou citation du même message
                    if ((nextTitle === "Repondre a un message" || nextTitle === "Citer un message") &&
                        nextParentMessageId === messageId) {

                        if (!responseCountsByDay[user]) responseCountsByDay[user] = {};
                        if (!responseCountsByDay[user][nextActionDate]) responseCountsByDay[user][nextActionDate] = 0;
                        responseCountsByDay[user][nextActionDate] += 1;
                    }
                }
            }

            // Cas où l'action est un défilement (scroll)
            if (refTran !== 0 && title === "Bouger la ScrollBar") {
                // Filtrer les opérations ayant le même refTran, ID de message, et nom de l'utilisateur
                const relatedOperations = data.filter(op => 
                    op.Operation.Action.RefTran === refTran && 
                    op.Operation.User.Name === user &&
                    op.Operation.Message.id === messageId
                );

                // Trouver la dernière action de lecture pour cet utilisateur et message
                const latestReadingAction = Math.max(...relatedOperations.map(op => new Date(op.Operation.Action.Date).getTime()));

                // Trouver la prochaine action de l'utilisateur après cette lecture
                const nextAction = data.find(op => 
                    op.Operation.User.Name === user &&
                    new Date(op.Operation.Action.Date).getTime() > latestReadingAction
                );

                if (nextAction) {
                    const nextTitle = nextAction.Operation.Action.Title;
                    const nextParentMessageId = nextAction.Operation.Message.Attributes.Parent.id;
                    const nextActionDate = new Date(nextAction.Operation.Action.Date).toISOString().split('T')[0]; // Date au format YYYY-MM-DD
                

                    // Vérifier si la prochaine action est une réponse ou citation du même message
                    if ((nextTitle === "Repondre a un message" || nextTitle === "Citer un message") &&
                        nextParentMessageId === messageId) {

                        if (!responseCountsByDay[user]) responseCountsByDay[user] = {};
                        if (!responseCountsByDay[user][nextActionDate]) responseCountsByDay[user][nextActionDate] = 0;
                        responseCountsByDay[user][nextActionDate] += 1;
                    }
                }
            }
        }
    });

    return responseCountsByDay;
};

