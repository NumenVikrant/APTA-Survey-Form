// server/app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const stringify = require("csv-stringify").stringify;
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://localhost:3000",
      "https://apta-survey-form.vercel.app",
    ],
  })
);

// ✅ Health Check
app.get("/health", (req, res) => res.send({ ok: true }));

// ✅ POST /api/submit-survey
app.post("/api/submit-survey", async (req, res) => {
  try {
    const {
      name,
      role,
      support,
      response,
      clarity,
      reports,
      overall,
      comments,
    } = req.body;

    if (!name || !role || !support ||response ||clarity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Insert into Supabase table
    const { data, error } = await supabase
      .from("apta_feedback")
      .insert([
        {
          name,
          role,
          support: parseInt(support) || null,
          response: parseInt(response) || null,
          clarity: parseInt(clarity) || null,
          reports: reports || null,
          overall: parseInt(overall) || null,
          comments,
        },
      ])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ message: "Database error", error: error.message });
    }

    return res.json({ ok: true, inserted: data });
  } catch (err) {
    console.error("Insert error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/download-survey (CSV Export)
app.get("/api/download-survey", async (req, res) => {
  try {
    const userToken = req.query.token;
    if (userToken !== process.env.SECRET_KEY) {
      return res.status(403).send("Forbidden: Invalid SECRET_KEY");
    }

    const { data, error } = await supabase
      .from("apta_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      return res.status(500).send("Could not fetch data");
    }

    const headers = [
      "timestamp",
      "name",
      "role",
      "support",
      "response",
      "clarity",
      "reports",
      "overall",
      "comments",
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=apta_feedback_responses.csv");

    const stringifier = stringify({ header: true, columns: headers });
    stringifier.pipe(res);

    data.forEach((row) => {
      stringifier.write([
        row.created_at,
        row.name,
        row.role,
        row.support,
        row.response,
        row.clarity,
        row.reports,
        row.overall,
        row.comments,
      ]);
    });

    stringifier.end();
  } catch (err) {
    console.error("CSV export error:", err);
    return res.status(500).send("Could not generate CSV");
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
