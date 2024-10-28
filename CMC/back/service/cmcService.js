
const fs = require('fs');
const path = require('path');

// Fonction pour charger et analyser les données JSON
const loadData = () => {
    const jsonFilePath = path.join(__dirname, '../data/mdd.json');  // Chemin vers ton fichier JSON
    const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');  // Lecture du fichier
    return JSON.parse(jsonData);  // Parse le contenu JSON
};

