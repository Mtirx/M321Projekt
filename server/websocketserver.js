const WebSocket = require("ws");
const { executeSQL } = require("./database");
const { sendMessageToChatGPT } = require("./api"); // Import der ChatGPT-Funktion

const clients = [];

/**
 * Initialisiert den WebSocket-Server.
 * @param {Object} server - Das HTTP-Server-Objekt.
 * @returns {void}
 */
const initializeWebsocketServer = (server) => {
  const websocketServer = new WebSocket.Server({ server });
  websocketServer.on("connection", onConnection);
};

/**
 * Verarbeitet eine neue WebSocket-Verbindung.
 * @param {Object} ws - Das WebSocket-Objekt.
 * @returns {void}
 */
const onConnection = (ws) => {
  console.log("Neue WebSocket-Verbindung");

  // Nachrichten aus der Datenbank abrufen, wenn ein neuer Client verbunden wird
  sendAllMessages(ws);

  ws.on("message", (message) => onMessage(ws, message));
};

/**
 * Sendet alle gespeicherten Nachrichten an den neuen Client.
 * @param {Object} ws - Das WebSocket-Objekt.
 */
const sendAllMessages = async (ws) => {
  try {
    const result = await executeSQL("SELECT m.message, u.name FROM messages m JOIN users u ON m.user_id = u.id ORDER BY m.id ASC LIMIT 50");
    const messages = result.map(row => ({
      text: row.message,
      username: row.name
    }));

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
 * Verarbeitet eine WebSocket-Nachricht.
 * @param {Object} ws - Das WebSocket-Objekt.
 * @param {Buffer} messageBuffer - Der Nachrichtentext.
 */
const onMessage = async (ws, messageBuffer) => {
  const messageString = messageBuffer.toString();
  const message = JSON.parse(messageString);
  console.log("Empfangene Nachricht: " + messageString);

  switch (message.type) {
    case "user": {
      clients.push({ ws, user: message.user });

      const usersMessage = {
        type: "users",
        users: clients.map((client) => client.user),
      };

      clients.forEach((client) => {
        client.ws.send(JSON.stringify(usersMessage));
      });

      ws.on("close", () => onDisconnect(ws));
      break;
    }

    case "message": {
      const user = clients.find(client => client.ws === ws).user;
      const userId = user.id;
      const text = message.text;

      try {
        await executeSQL("INSERT INTO messages (user_id, message) VALUES (?, ?)", [userId, text]);
      } catch (err) {
        console.error("Fehler beim Speichern der Nachricht:", err);
      }

      clients.forEach((client) => {
        client.ws.send(messageString);
      });
      break;
    }

    case "ai_message": {
      const user = clients.find(client => client.ws === ws).user;
      const userId = user.id;
      const text = message.text;

      try {
        await executeSQL("INSERT INTO messages (user_id, message) VALUES (?, ?)", [userId, text]);
      } catch (err) {
        console.error("Fehler beim Speichern der Nachricht:", err);
      }

      clients.forEach((client) => {
        client.ws.send(messageString);
      });
      
      const aiResponse = await sendMessageToChatGPT(message.text);

      const aiMessage = {
        type: "message",
        text: aiResponse,
        username: "AI",
      };

      clients.forEach((client) => {
        client.ws.send(JSON.stringify(aiMessage));
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
      console.log("Unbekannter Nachrichtentyp: " + message.type);
    }
  }
};

/**
 * Verarbeitet eine WebSocket-Verbindungstrennung.
 * @param {Object} ws - Das WebSocket-Objekt.
 */
const onDisconnect = (ws) => {
  const index = clients.findIndex((client) => client.ws === ws);
  if (index !== -1) {
    clients.splice(index, 1);
  }

  const usersMessage = {
    type: "users",
    users: clients.map((client) => client.user),
  };
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(usersMessage));
  });
};

module.exports = { initializeWebsocketServer };
