const { executeSQL } = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const OpenAI = require("openai"); // Für API-Aufrufe an OpenAI
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Dein OpenAI API-Key

/**
 * Initialisiert die API-Endpunkte.
 * @param {Object} app
 */
const initializeAPI = (app) => {
  app.get("/api/users", users);
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.put("/api/users/:userId/updateUsername", updateUsername);
};

/**
 * Beispiel für Benutzerabfrage.
 */
const users = async (req, res) => {
  await executeSQL("INSERT INTO users (name) VALUES ('John Doe');");
  const result = await executeSQL("SELECT * FROM users;");
  res.json(result);
};

/**
 * Registrierung eines neuen Benutzers.
 */
const register = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).json({ error: "Alle Felder müssen ausgefüllt sein." });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Die Passwörter stimmen nicht überein." });
  }

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
 */
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username und Passwort müssen vorhanden sein" });
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
};

const logout = (req, res) => {
  res.json({ message: "Erfolgreich ausgeloggt" });
};

/**
 * Benutzername aktualisieren
 */
const updateUsername = async (req, res) => {
  const { userId, newUsername } = req.body;

  if (!userId || !newUsername) {
    return res.status(400).json({ error: "Fehlende Parameter." });
  }

  const existingUser = await executeSQL("SELECT * FROM users WHERE name = ?;", [newUsername]);
  if (existingUser.length > 0) {
    return res.status(400).json({ error: "Benutzername bereits vergeben." });
  }

  const result = await executeSQL("UPDATE users SET name = ? WHERE id = ?;", [newUsername, userId]);
  
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: "Benutzer nicht gefunden." });
  }

  // Neues Token erstellen
  const newToken = jwt.sign({ userId, username: newUsername }, SECRET_KEY, { expiresIn: "1h" });

  res.json({ message: "Benutzername erfolgreich aktualisiert.", token: newToken });
};

/**
 * Sendet eine Nachricht an ChatGPT und gibt die Antwort zurück
 */
const sendMessageToChatGPT = async (message) => {
  const openai = new OpenAI({ apiKey:OPENAI_API_KEY});
  
  const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
              role: "user",
              content: message,
          },
      ],
      store: true,
  });
  console.log(completion.choices[0].message);
  return completion.choices[0].message;
};

module.exports = { initializeAPI, sendMessageToChatGPT };
