
// Fonction pour calculer le nombre de posts par utilisateur
exports.countPostsByUser = (data) => {

    const postCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;

        // Vérifier si le titre correspond à "Poster un nouveau message"
        if (title === "Poster un nouveau message") {
            if (!postCount[user]) {
                postCount[user] = 0;  // Initialiser le compteur pour l'utilisateur
            }
            postCount[user]++;  // Incrémenter le compteur pour l'utilisateur
        }
    });

    return postCount;
};

// Fonction pour calculer le nombre de réponses et de citations par utilisateur
exports.countInteractionsByUser = (users, data) => {
    const data = loadData();  // Charger les données JSON via la fonction centralisée

    const responseCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Sender;

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if (users.includes(user) && 
            (title === "Repondre a un message" || 
                title === "Citer un message" || 
                title === "Afficher le fil de discussion" || 
                title === "Download un fichier dans le message")) {
            // S'assurer que l'utilisateur n'est pas l'expéditeur
            if (user !== sender) {
                if (!responseCount[user]) {
                    responseCount[user] = 0;  // Initialiser le compteur pour l'utilisateur
                }
                responseCount[user]++;  // Incrémenter le compteur pour l'utilisateur
            }
        }
    });

    return responseCount;
};

// Fonction pour calculer la pluralité des auteurs auxquels un utilisateur répond ou cite
exports.countUniqueAuthorsUserInteractedWith = (users, data) => {

    const authorsCount = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const title = operation.Action.Title;
        const sender = operation.Message.Sender;

        // Vérifier si l'utilisateur est dans la liste et si le titre correspond
        if (users.includes(user) && 
            (title === "Repondre a un message" || 
            title === "Citer un message" || 
            title === "Afficher le fil de discussion" || 
            title === "Download un fichier dans le message")) {
            
            // S'assurer que l'utilisateur n'est pas l'expéditeur
            if (user !== sender) {
                // Récupérer l'expéditeur du message original
                if (sender) {
                    if (!authorsCount[user]) {
                        authorsCount[user] = new Set();  // Utiliser un Set pour garder les auteurs uniques
                    }
                    authorsCount[user].add(sender);  // Ajouter l'auteur au Set
                }
            }
        }
    });

    // Convertir les Sets en compte d'auteurs uniques
    const uniqueAuthorsCount = {};
    for (const user in authorsCount) {
        uniqueAuthorsCount[user] = authorsCount[user].size;  // Compter le nombre d'auteurs uniques
    }

    return uniqueAuthorsCount;
};