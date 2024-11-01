// Fonction pour calculer le nombre de posts par utilisateur par jour
exports.countPostsByUser = (users, data) => {
    const postCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Sender;
        const title = operation.Action.Title;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste spécifiée et que l'action correspond à "Poster un nouveau message"
        if (users.includes(sender) && title === "Poster un nouveau message") {
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
exports.countInteractionsByUser = (users, data) => {
    const responseCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Sender;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if (users.includes(user) && 
            (title === "Repondre a un message" || 
             title === "Citer un message" || 
             title === "Afficher le fil de discussion" || 
             title === "Download un fichier dans le message")) {
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
exports.countUniqueAuthorsUserInteractedWith = (users, data) => {
    const authorsCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Sender;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if (users.includes(user) && 
            (title === "Repondre a un message" || 
             title === "Citer un message" || 
             title === "Afficher le fil de discussion" || 
             title === "Download un fichier dans le message")) {
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

