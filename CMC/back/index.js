const express = require('express');
const cmcRoute = require('./route/cmcRoute');
const helmet = require('helmet'); // Sécurité de base
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;



app.use(helmet()); // Sécurité de base
app.use(express.urlencoded());

app.use(express.json()); // pour traiter les JSON
app.use('/api/cmc', cmcRoute); // Utiliser le routeur défini dans cmcRoute
app.use(cors({
    origin: "http://localhost:5173" // or '*' for any origin
  }));


function start() {
    try {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Error on server startup: ', err);
    }
  }
  
  start();
