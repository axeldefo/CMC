// Fonction pour compter les interactions et les téléchargements générées par utilisateur par jour
exports.countInteractionsAndDownloadsForUser = (data) => {


    const result = {};

    data.forEach(item => {
        const operation = item.Operation;
        const title = operation.Action.Title;
        const sender = operation.Message.Attributes.Parent.Sender;
        const user = operation.User.Name;
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

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
            if ((title === "Repondre a un message" || title === "Afficher le contenu d'un message" || title === "Citer un message") && sender !== user) {
                result[sender][actionDate].interactionsCount++;
            }

            // Vérifier les téléchargements de fichiers
            if (title === "Download un fichier dans le message" && sender !== user) {
                const fileId = operation.Message.Attributes.AttachedFile.id;

                // Vérifier si le fichier a déjà été compté
                if (!result[sender][actionDate].downloadedFiles.has(fileId)) {
                    result[sender][actionDate].downloadsCount += operation.Message.Attributes.AttachedFile.Downloads;
                    result[sender][actionDate].downloadedFiles.add(fileId); // Ajouter l'ID du fichier au Set
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

exports.countUniqueInteractorsForUsersAsSender = (data) => {

    const result = {};  // Objet pour stocker le nombre d'interacteurs uniques par jour pour chaque utilisateur

    // Initialiser le résultat pour chaque utilisateur et chaque date à 0
    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Attributes.Parent?.Sender; 
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Si le sender est défini, initialiser le résultat pour ce sender et cette date
        if (sender) {
            if (!result[sender]) {
                result[sender] = {}; // Initialiser l'objet pour le sender
            }
            if (!result[sender][actionDate]) {
                result[sender][actionDate] = new Set(); // Initialiser un Set pour les interacteurs uniques
            }
        }
    });

    // Compter les interacteurs uniques
    data.forEach(item => {
        const operation = item.Operation;
        const sender = operation.Message.Attributes.Parent?.Sender;
        const title = operation.Action.Title; // Titre de l'action
        const responderOrQuotingUser = operation.User.Name;  // Utilisateur qui interagit
        const actionDate = new Date(operation.Action.Date).toISOString().split('T')[0]; // Format "YYYY-MM-DD"

        // Vérifier si l'action a un titre pertinent et si le sender n'est pas null
        if (["Repondre a un message", "Afficher le contenu d'un message", "Citer un message", "Afficher le fil de discussion", "Download un fichier dans le message"].includes(title) && sender !== responderOrQuotingUser && sender) {

            // Ajouter l'utilisateur qui interagit au Set des interacteurs uniques du sender pour cette date
            result[sender][actionDate].add(responderOrQuotingUser);
        }
    });

    // Convertir les Sets d'interacteurs en comptes
    Object.keys(result).forEach(sender => {
        Object.keys(result[sender]).forEach(date => {
            result[sender][date] = result[sender][date]?.size || 0; // Nombre d'interacteurs uniques par jour
        });
    });

    return result;  // Retourner l'objet avec le calcul par utilisateur et par jour
};
