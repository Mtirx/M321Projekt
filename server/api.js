const { executeSQL } = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

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

  const hashedPassword = await bcrypt.hash(password, 10);

  await executeSQL("INSERT INTO users (name, password) VALUES (?, ?);", [username, hashedPassword]);

  res.status(201).json({ message: "Benutzer erfolgreich registriert!" });
};

/**
 * Login eines Benutzers.
 * @param {Object} req - Die Anfrage.
 * @param {Object} res - Die Antwort.
 * @returns {void}
 */
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username und Passwort müssen vorhanden sein"})
  }
  try {
    const user = await executeSQL("SELECT * FROM users WHERE name = ?", [username]);

    if (user.length === 0) {
      return res.status(401).send("Benutzername oder Passwort falsch.");
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (!match) {
      return res.status(401).send("Benutzername oder Passwort falsch.");
    }

    const token = jwt.sign({ userId: user[0].id, username: user[0].name }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

module.exports = { initializeAPI };
