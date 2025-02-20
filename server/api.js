// api.js

const { executeSQL } = require("./database");

/**
 * Initialisiert die API-Endpunkte.
 * @param {Object} app - Das Express-App-Objekt.
 * @returns {void}
 */
const initializeAPI = (app) => {
  // Definiert API-Endpunkte
  app.get("/api/hello", hello);
  app.get("/api/users", users);
  app.post("/api/register", register);
  app.post("/api/login", login);
};

/**
 * Einfache "Hello World"-Antwort.
 * @param {Object} req - Die Anfrage.
 * @param {Object} res - Die Antwort.
 * @returns {void}
 */
const hello = (req, res) => {
  res.send("Hello World!");
};

/**
 * Beispiel für Benutzer, die eine Datenbankabfrage durchführen.
 * @param {Object} req - Die Anfrage.
 * @param {Object} res - Die Antwort.
 * @returns {void}
 */
const users = async (req, res) => {
  await executeSQL("INSERT INTO users (name) VALUES ('John Doe');");
  const result = await executeSQL("SELECT * FROM users;");
  res.json(result);
};

/**
 * Registrierung eines neuen Benutzers.
 * @param {Object} req - Die Anfrage.
 * @param {Object} res - Die Antwort.
 * @returns {void}
 */
const register = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Die Passwörter stimmen nicht überein." });
  }

  // Überprüfen, ob der Benutzername bereits existiert
  const existingUser = await executeSQL("SELECT * FROM users WHERE name = ?;", [username]);
  if (existingUser.length > 0) {
    return res.status(400).json({ error: "Benutzername bereits vergeben." });
  }

  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);

  // Benutzer in der Datenbank speichern
  await executeSQL("INSERT INTO users (name, password) VALUES (?, ?);", [username, hashedPassword]);

  // Erfolgsantwort
  res.status(201).json({ message: "Benutzer erfolgreich registriert!" });
};

/**
 * @param {Object} req - Die Anfrage.
 * @param {Object} res - Die Antwort.
 * @returns {void}
 */
const login = (req, res) => {
  res.send("Login funktioniert!");
};

module.exports = { initializeAPI };
