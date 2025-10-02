// server/db.js
const { Pool } = require("pg");
require("dotenv").config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For Neon/Render/Heroku-style Postgres with SSL
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
});

module.exports = { pool };
