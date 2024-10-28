import mysql.connector
import json
from datetime import datetime

# Configuration de la connexion à la base de données
config = {
    'user': 'e2205762',
    'password': 'Reb974kb',
    'host': 'e-srv-lamp.univ-lemans.fr',
    'database': 'e2205762'
}

# Connexion à la base de données
cnx = mysql.connector.connect(**config)
print("Connexion réussie.")
cursor = cnx.cursor(dictionary=True)

# Fonction pour extraire la valeur d'un attribut spécifique dans 'Attribut'
def extract_attribute_value(attribut, key):
    attributes = attribut.split(',')
    for attr in attributes:
        if key in attr:
            return attr.split('=')[1]
    return None

# Fonction pour récupérer les données et les transformer en JSON
def get_data_and_generate_json():
    # Récupérer les lignes de la table 'transition'
    query_transition = "SELECT * FROM transition ORDER BY IDTran"
    cursor.execute(query_transition)
    transitions = cursor.fetchall()
    print("Transitions récupérées.")

    # Dictionnaire pour stocker le premier expéditeur de chaque message
    first_senders = {}
    
    # Remplir le dictionnaire avec le premier expéditeur pour chaque IDMsg
    for transition in transitions:
        id_msg = extract_attribute_value(transition['Attribut'], 'IDMsg')
        if id_msg and id_msg not in first_senders:
            first_senders[id_msg] = {
                'sender': transition['Utilisateur'],
                'date': f"{transition['Date']} {transition['Heure']}"  # Ajouter la date de la transition
            }
    result = []

    # Pour chaque ligne dans la table 'transition', récupérer les informations nécessaires
    for transition in transitions:
        id_msg = extract_attribute_value(transition['Attribut'], 'IDMsg') or ""  # Extraire idmsg depuis Attribut
        forum_id = extract_attribute_value(transition['Attribut'], 'IDForum') or ""  # Extraire IDForum
        id_parent = extract_attribute_value(transition['Attribut'], 'IDParent') or ""  # Extraire IDParent
        print("idmsg: " + id_msg + " idforum: " + forum_id + " id_parent: " + id_parent)

        # Récupérer les données de la table 'userfiles' correspondantes à IDMsg
        # Ne pas exécuter la requête SQL si 'id_msg' est vide
        if id_msg:
            # Récupérer les données de la table 'userfiles' correspondantes à IDMsg
            query_userfiles = f"SELECT id, Filenameo, User, Dateupload, Timeupload, Nbdownload FROM userfiles WHERE IDMsg = {id_msg}"
            cursor.execute(query_userfiles)
            userfiles = cursor.fetchone()
        else:
            userfiles = None

        # Créer une version modifiée du titre pour la recherche dans 'activite'
        modified_title = transition['Titre'].replace('Bouger la scrollbar en bas - afficher la fin du message', "Bouger la Scrollbar en bas (afficher la fin d'un message)").replace('Bouger la scrollbar en bas', 'Bouger la ScrollBar').replace('Afficher une structure (cours/forum)', 'Afficher une structure (cours,forum)').replace('Répondre à un message', 'Repondre a un message')

        print(modified_title)
        # Échapper les apostrophes dans le titre modifié
        modified_title = modified_title.replace("'", "''")
        # Affichage du titre modifié
        print("Titre modifié:", modified_title)
        # Récupérer l'ID de la catégorie depuis la table 'activite' via 'Titre'
        if modified_title:
            query_activite = f"SELECT IDCat FROM activite WHERE Titre LIKE '%{modified_title}%'"
            print("Requête activite:", query_activite)
            cursor.execute(query_activite)
            activite = cursor.fetchone()
            cursor.fetchall()

            # Récupérer le type de catégorie depuis la table 'categorie'
            if activite:
                query_categorie = f"SELECT Titre FROM categorie WHERE IDCat = {activite['IDCat']}"
                cursor.execute(query_categorie)
                categorie = cursor.fetchone()
                cursor.fetchall()
            else:
                print("Aucune activité trouvée pour le titre:", modified_title)
                categorie = "Aucune activite trouvee pour ce titre"
        else:
            print("Titre modifié vide, aucune requête exécutée.")
            categorie = None


        # Construire la structure JSON selon le modèle donné
        operation = {
            "Operation": {
                "id": transition['IDTran'],
                "Message": {
                    "id": id_msg,
                    "Date": first_senders.get(id_msg, {}).get('date'),
                    "Sender": first_senders.get(id_msg, {}).get('sender'),
                    "Attributes": {
                        "idParent": id_parent,
                        "Forum": forum_id,
                        "AttachedFile": {
                            "id": userfiles['id'] if userfiles else None,
                            "sender": userfiles['User'] if userfiles else None,
                            "FileName": userfiles['Filenameo'] if userfiles else None,
                            "Downloads": userfiles['Nbdownload'] if userfiles else None,
                            "UploadDate": f"{userfiles['Dateupload']} {userfiles['Timeupload']}" if userfiles else None
                        }
                    }
                },
                "User": {
                    "Name": transition['Utilisateur']
                },
                "Action": {
                    "RefTran": transition['RefTran'],
                    "Title": modified_title.replace("''","'"),
                    "Type": categorie if categorie else None,
                    "Date": f"{transition['Date']} {transition['Heure']}",
                    "Delai": transition['Delai'],
                    "Comment": transition['Commentaire']
                }
            }
        }

        result.append(operation)

    # Convertir les données en format JSON et les sauvegarder dans un fichier
    json_data = json.dumps(result, indent=4, default=str)
    with open('mdd.json', 'w') as json_file:
        json_file.write(json_data)

    print("Fichier JSON généré avec succès.")

# Appeler la fonction pour générer le fichier JSON
get_data_and_generate_json()

# Fermer la connexion
cursor.close()
cnx.close()
