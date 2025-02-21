const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const { initializeAPI } = require("./server/api");
const { initializeWebsocketServer } = require("./server/websocketserver");
const {
  initializeMariaDB,
  initializeDBSchema,
  executeSQL,
} = require("./server/database");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(bodyParser.json());

app.use(express.static("client"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client/index.html");
});

initializeWebsocketServer(server);

initializeAPI(app);

(async function () {
  try {
    initializeMariaDB();
    await initializeDBSchema();

    // Starte den Server
    const serverPort = process.env.PORT || 3000;
    server.listen(serverPort, () => {
      console.log(`Server läuft auf Port ${serverPort}`);
    });
  } catch (error) {
    console.error("Fehler beim Initialisieren der Datenbank oder beim Starten des Servers:", error);
  }
})();
