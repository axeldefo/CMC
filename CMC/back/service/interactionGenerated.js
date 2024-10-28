// interactions générées 

// Fonction pour compter les interactions et les téléchargements pour un utilisateur
exports.countInteractionsAndDownloadsForUser = (users, data) => {

    const result = {};

    data.forEach(item => {
        const operation = item.Operation;
        const user = operation.User.Name;
        const sender = operation.Message.Sender;
        const title = operation.Action.Title;

        // Vérifier si l'utilisateur est dans la liste
        if (users.includes(sender)) {
            // Initialiser l'objet pour l'utilisateur si ce n'est pas déjà fait
            if (!result[sender]) {
                result[sender] = {
                    interactionsCount: 0,
                    downloadsCount: 0,
                    downloadedFiles: new Set() // Pour éviter de compter les fichiers en double
                };
            }

            // Vérifier les interactions (réponses et citations)
            if (title === "Repondre a un message" || title === "Citer un message") {
                result[sender].interactionsCount++;
            }

            // Vérifier les téléchargements de fichiers
            if (title === "Download un fichier dans le message" && operation.Message.Attributes.AttachedFile.id) {
                const fileId = operation.Message.Attributes.AttachedFile.id;

                // Vérifier si le fichier a déjà été compté
                if (!result[sender].downloadedFiles.has(fileId)) {
                    result[sender].downloadsCount += operation.Message.Attributes.AttachedFile.Downloads;
                    result[sender].downloadedFiles.add(fileId); // Ajouter l'ID du fichier au Set
                }
            }
        }
    });

    return result; // Retourner le résultat structuré
};


// Fonction pour calculer la pluralité des personnes qui interagissent avec un utilisateur lorsqu'il est le sender
exports.countUniqueInteractorsWithUserAsSender = (user, data) => {

    const interactorSet = new Set();  // Utiliser un Set pour garder les utilisateurs uniques

    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Sender;  // L'utilisateur qui a envoyé le message
        const title = operation.Action.Title;

        // Vérifier si l'utilisateur est le sender
        if (sender === user) {
            // Vérifier si l'action est une réponse ou une citation
            if ((title === "Repondre a un message" || 
                title === "Citer un message" || 
                title === "Afficher le fil de discussion" || 
                title === "Download un fichier dans le message")) {
                const responderOrQuotingUser = operation.User.Name;  // Récupérer le nom de l'utilisateur qui répond ou cite
                interactorSet.add(responderOrQuotingUser);  // Ajouter l'interacteur au Set
            }
        }
    });

    return interactorSet.size;  // Retourner le nombre d'interacteurs uniques
};
