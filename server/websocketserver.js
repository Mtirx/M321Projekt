const WebSocket = require("ws");

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
  ws.on("message", (message) => onMessage(ws, message));
};


/**
 * Handles a new websocket message.
 * @example
 * onMessage(ws, messageBuffer);
 * @param {Object} ws - The websocket object.
 * @param {Buffer} messageBuffer - The message buffer. IMPORTANT: Needs to be converted to a string or JSON object first.
 */
const onMessage = (ws, messageBuffer) => {
  const messageString = messageBuffer.toString();
  const message = JSON.parse(messageString);
  console.log("Received message: " + messageString);

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
  const index = clients.findIndex((client) => client.ws === ws);
  clients.splice(index, 1);
  const usersMessage = {
    type: "users",
    users: clients.map((client) => client.user),
  };
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(usersMessage));
  });
};

module.exports = { initializeWebsocketServer };
