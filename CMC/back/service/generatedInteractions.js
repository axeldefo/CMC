// Fonction pour compter les interactions et les téléchargements générées par utilisateur par jour
exports.countInteractionsAndDownloadsForUser = (users, data) => {

    const result = {};

    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Sender;
        const title = operation.Action.Title;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'utilisateur est dans la liste
        if (users.includes(sender)) {
            // Initialiser l'objet pour l'utilisateur si ce n'est pas déjà fait
            if (!result[sender]) {
                result[sender] = {};
            }
            if (!result[sender][actionDate]) {
                result[sender][actionDate] = {
                    interactionsCount: 0,
                    downloadsCount: 0,
                    downloadedFiles: new Set() // Pour éviter de compter les fichiers en double
                };
            }

            // Vérifier les interactions (réponses et citations)
            if (title === "Repondre a un message" || title === "Citer un message") {
                result[sender][actionDate].interactionsCount++;
            }

            // Vérifier les téléchargements de fichiers
            if (title === "Download un fichier dans le message" && operation.Message.Attributes.AttachedFile.id) {
                const fileId = operation.Message.Attributes.AttachedFile.id;

                // Vérifier si le fichier a déjà été compté
                if (!result[sender][actionDate].downloadedFiles.has(fileId)) {
                    result[sender][actionDate].downloadsCount += operation.Message.Attributes.AttachedFile.Downloads;
                    result[sender][actionDate].downloadedFiles.add(fileId); // Ajouter l'ID du fichier au Set
                }
            }
        }
    });

    // Convert downloadedFiles sets to counts and clean up result format
    Object.keys(result).forEach(user => {
        Object.keys(result[user]).forEach(date => {
            result[user][date].downloadedFiles = result[user][date].downloadedFiles.size;
        });
    });

    return result; // Retourner le résultat structuré
};

// Fonction pour calculer la pluralité des personnes qui interagissent avec chaque utilisateur de la liste lorsqu'ils sont le sender par jour
exports.countUniqueInteractorsForUsersAsSender = (users, data) => {
    const result = {};  // Objet pour stocker le nombre d'interacteurs uniques par jour pour chaque utilisateur

    // Initialiser le résultat pour chaque utilisateur et chaque date à 0
    users.forEach(user => {  // Assurez-vous que le nom de l'utilisateur est stocké dans la propriété `name` de chaque objet `user`
        result[user] = {}; // Initialiser l'objet pour l'utilisateur

        // Créer une liste de toutes les dates présentes dans les données
        data.forEach(item => {
            const operation = item.Operation;
            const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

            if (!result[user][actionDate]) {
                result[user][actionDate] = 0; // Initialiser le compteur d'interacteurs uniques pour cette date
            }
        });
    });

    // Compter les interacteurs uniques
    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Sender;
        const title = operation.Action.Title; // Titre de l'action
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'action a un titre pertinent et si le sender n'est pas null
        if (["Repondre a un message", "Citer un message", "Afficher le fil de discussion", "Download un fichier dans le message"].includes(title) && sender) {
            const responderOrQuotingUser = operation.User.Name;  // Utilisateur qui interagit

            // Vérifier pour chaque utilisateur s'il est le sender
            users.forEach(user => {
                if (sender === user) {
                    if (!result[user][actionDate]) {
                        result[user][actionDate] = new Set(); // Créer un Set pour les interacteurs uniques
                    }
                    result[user][actionDate].add(responderOrQuotingUser);  // Ajouter cet utilisateur au Set
                }
            });
        }
    });

    // Convertir les Sets d'interacteurs en comptes
    Object.keys(result).forEach(user => {
        Object.keys(result[user]).forEach(date => {
            result[user][date] = result[user][date]?.size || 0; // Nombre d'interacteurs uniques par jour
        });
    });

    return result;  // Retourner l'objet avec le calcul par utilisateur et par jour
};
