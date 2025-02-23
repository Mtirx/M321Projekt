const WebSocket = require("ws");
const { executeSQL } = require("./database");

const clients = [];

/**
 * Initializes the websocket server.
 * @example
 * initializeWebsocketServer(server);
 * @param {Object} server - The http server object.
 * @returns {void}
 */
const initializeWebsocketServer = (server) => {
  const websocketServer = new WebSocket.Server({ server });
  websocketServer.on("connection", onConnection);
};

/**
 * Handles a new websocket connection.
 * @example
 * onConnection(ws);
 * @param {Object} ws - The websocket object.
 * @returns {void}
 */
const onConnection = (ws) => {
  console.log("New websocket connection");

  // Wenn ein neuer Client verbunden wird, Nachrichten aus der Datenbank abrufen
  sendAllMessages(ws);

  ws.on("message", (message) => onMessage(ws, message));
};

/**
 * Sends all stored messages to the new client.
 * @param {Object} ws - The websocket object.
 */
const sendAllMessages = async (ws) => {
  try {
    // Abrufen der letzten Nachrichten aus der Datenbank
    const result = await executeSQL("SELECT m.message, u.name FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.id DESC LIMIT 50");
    
    // Senden der abgerufenen Nachrichten an den neuen Client
    const messages = result.map(row => ({
      text: row.message,
      username: row.name
    }));

    // Nachrichtentyp "message" mit den abgerufenen Nachrichten
    messages.forEach((message) => {
      const messageObj = {
        type: "message",
        text: message.text,
        username: message.username
      };
      ws.send(JSON.stringify(messageObj));
    });
  } catch (err) {
    console.error("Fehler beim Abrufen der Nachrichten:", err);
  }
};

/**
 * Handles a new websocket message.
 * @example
 * onMessage(ws, messageBuffer);
 * @param {Object} ws - The websocket object.
 * @param {Buffer} messageBuffer - The message buffer.
 */
const onMessage = async (ws, messageBuffer) => {
  const messageString = messageBuffer.toString();
  const message = JSON.parse(messageString);
  console.log("Received message: " + messageString);

  switch (message.type) {
    case "user": {
      clients.push({ ws, user: message.user });
      
      // Alle Benutzer erhalten die aktualisierte Liste der aktiven Nutzer
      const usersMessage = {
        type: "users",
        users: clients.map((client) => client.user),
      };
      clients.forEach((client) => {
        client.ws.send(JSON.stringify(usersMessage));
      });
      
      // Wenn der Client die Verbindung trennt, entfernen wir ihn aus der Liste
      ws.on("close", () => onDisconnect(ws));
      break;
    }

    case "message": {
      // Nachricht in der Datenbank speichern
      const user = clients.find(client => client.ws === ws).user;
      const userId = user.id;
      const text = message.text;

      try {
        // Speichern der Nachricht in der Datenbank
        await executeSQL(
          "INSERT INTO messages (user_id, message) VALUES (?, ?)",
          [userId, text]
        );
      } catch (err) {
        console.error("Fehler beim Speichern der Nachricht:", err);
      }

      // Nachricht an alle Clients senden
      clients.forEach((client) => {
        client.ws.send(messageString);
      });
      break;
    }

    case "updateUsername": {
      const { userId, newUsername } = message;
      clients.forEach((client) => {
        if (client.user.id === userId) {
          client.user.name = newUsername;
        }
      });

      // Alle Clients erhalten die aktualisierte Liste der Benutzer
      const usersMessage = {
        type: "users",
        users: clients.map((client) => client.user),
      };
      clients.forEach((client) => {
        client.ws.send(JSON.stringify(usersMessage));
      });
      break;
    }

    default: {
      console.log("Unknown message type: " + message.type);
    }
  }
};

/**
 * Handles a websocket disconnect.
 * @example
 * onDisconnect(ws);
 * @param {Object} ws - The websocket object.
 * @returns {void}
 */
const onDisconnect = (ws) => {
  // Entfernen des benutzers wenn er raus geht.
  const index = clients.findIndex((client) => client.ws === ws);
  if (index !== -1) {
    clients.splice(index, 1);
  }

  // Alle Clients erhalten die aktualisierte Benutzerliste
  const usersMessage = {
    type: "users",
    users: clients.map((client) => client.user),
  };
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(usersMessage));
  });
};

module.exports = { initializeWebsocketServer };
