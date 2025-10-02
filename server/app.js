// server/app.js
require("dotenv").config();
console.log("DATABASE_URL (masked):", process.env.DATABASE_URL || "");
console.log("PGSSL:", process.env.PGSSL);

const express = require("express");
const path = require("path");
const cors = require("cors");
const { pool } = require("./db");
const stringify = require("csv-stringify").stringify;

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - adjust to your deployed frontend origin(s)
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
      // Add your production frontend domains here:
      // "https://your-frontend.vercel.app",
      // "https://your-frontend.netlify.app",
    ],
  })
);

// Optional: serve static frontend if colocated
app.use(express.static(path.join(__dirname, "..", "public")));

//Health Check :
app.get("/health", (req, res) => {
  res.send({ ok: true });
});

// POST /api/submit-survey - insert a submission
app.post("/api/submit-survey", async (req, res) => {
  try {
    const {
      name,
      country,
      function: func,
      role,
      support,
      response,
      clarity,
      reports,
      overall,
      comments,
    } = req.body;

    if (!name || !country || !func || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const insertSQL = `
      INSERT INTO apta_feedback
      (name, country, function, role, support, response, clarity, reports, overall, comments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `;

    const params = [
      name.trim(),
      country.trim(),
      func.trim(),
      role.trim(),
      parseInt(support) || null,
      parseInt(response) || null,
      parseInt(clarity) || null,
      reports || null,
      parseInt(overall) || null,
      (comments || "").trim(),
    ];

    const { rows } = await pool.query(insertSQL, params);
    return res.json({
      ok: true,
      id: rows[0].id,
      timestamp: rows[0].created_at,
    });
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET /api/download-survey - stream CSV for all submissions
// GET /api/download-survey - stream CSV for all submissions
app.get("/api/download-survey", async (req, res) => {
  try {
    // ✅ Simple admin security check
    const userToken = req.query.token;
    if (userToken !== process.env.SECRET_KEY) {
      return res.status(403).send("Forbidden: Invalid SECRET_KEY");
    }

    // ✅ Fetch all feedback records
    const sql = `
      SELECT
        created_at,
        name,
        country,
        function,
        role,
        support,
        response,
        clarity,
        reports,
        overall,
        comments
      FROM apta_feedback
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(sql);

    // ✅ CSV headers
    const headers = [
      "timestamp",
      "name",
      "country",
      "function",
      "role",
      "support",
      "response",
      "clarity",
      "reports",
      "overall",
      "comments",
    ];

    // ✅ Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=apta_feedback_responses.csv"
    );

    // ✅ Create CSV stream
    const stringifier = stringify({ header: true, columns: headers });
    stringifier.pipe(res);

    // ✅ Write each row
    for (const row of rows) {
      stringifier.write([
        row.created_at ? row.created_at.toISOString() : "",
        row.name || "",
        row.country || "",
        row.function || "",
        row.role || "",
        row.support || "",
        row.response || "",
        row.clarity || "",
        row.reports || "",
        row.overall || "",
        row.comments || "",
      ]);
    }

    stringifier.end();
  } catch (err) {
    console.error("CSV export error:", err);
    return res.status(500).send("Could not generate CSV");
  }
});

// Start server
app.listen(port, () => {
  console.log(`Survey server listening at http://localhost:${port}`);
});
