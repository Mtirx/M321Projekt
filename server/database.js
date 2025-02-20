// database.js

let pool = null;

/**
 * Initialisiert die MariaDB-Verbindungspool.
 * @returns {void}
 */
const initializeMariaDB = () => {
  const mariadb = require("mariadb");
  pool = mariadb.createPool({
    database: process.env.DB_NAME || "mychat",
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "mychat",
    password: process.env.DB_PASSWORD || "mychatpassword",
    connectionLimit: 5,
  });
};

/**
 * Führt SQL-Abfragen aus.
 * @param {string} query - Die SQL-Abfrage.
 * @param {Array} params - Die Parameter für die Abfrage.
 * @returns {Array} - Das Ergebnis der Abfrage.
 */
const executeSQL = async (query, params) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const res = await conn.query(query, params);
    return res;
  } catch (err) {
    console.log(err);
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Initialisiert das DB-Schema und erstellt die Tabellen, falls sie nicht existieren.
 * @returns {void}
 */
const initializeDBSchema = async () => {
  const userTableQuery = `CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id)
  );`;
  await executeSQL(userTableQuery);
  
  const messageTableQuery = `CREATE TABLE IF NOT EXISTS messages (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`;
  await executeSQL(messageTableQuery);
};

// Exporte alle Funktionen
module.exports = { initializeMariaDB, executeSQL, initializeDBSchema };
