import express from "express";
import cors from "cors";
import sequelize from "./src/config/db.js";
import { Sequelize } from "sequelize";
import StudentMarks from "./src/models/Student.js";
import User from "./src/models/User.js";
import { importStudentMarks } from "./src/readCsv.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); 

// REGISTER
app.post("/users/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User with this email already exists",
        from_a : "123"
      });
    }

    const newUser = await User.create({ username, email, password });

    res.json({
      success: true,
      message: "Registration successful",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// LOGIN
app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Server is running");
});

/* =========================
   CSV IMPORT
========================= */
app.post("/import-csv", async (req, res) => {
  try {
    const result = await importStudentMarks();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =========================
   COMMON FILTER BUILDER
========================= */
const buildWhere = (req) => {
  const where = {};
  if (req.query.class_number && req.query.class_number !== "ALL") {
    where.class_number = req.query.class_number;
  }
  if (req.query.batch && req.query.batch !== "ALL") {
    where.batch = req.query.batch;
  }
  return where;
};

/* =========================
   DYNAMIC BATCH FILTER (FIX)
========================= */
app.get("/filters/batches", async (req, res) => {
  try {
    const where = {};
    if (req.query.class_number) {
      where.class_number = req.query.class_number;
    }

    const rows = await StudentMarks.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("batch")), "batch"],
      ],
      where,
      raw: true,
    });

    res.json({
      success: true,
      data: rows.map((r) => r.batch),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 1️⃣ PERFORMANCE DISTRIBUTION
===================================================== */
app.get("/charts/performance-distribution", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "admission_no",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "percentage"],
      ],
      where,
      group: ["admission_no"],
    });

    const ranges = { "90-100": 0, "75-89": 0, "50-74": 0, "<50": 0 };

    rows.forEach((r) => {
      const p = Number(r.dataValues.percentage);
      if (p >= 90) ranges["90-100"]++;
      else if (p >= 75) ranges["75-89"]++;
      else if (p >= 50) ranges["50-74"]++;
      else ranges["<50"]++;
    });

    res.json({
      success: true,
      data: Object.entries(ranges).map(([subject, avg_score]) => ({
        subject,
        avg_score,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 2️⃣ SUBJECT PASS vs FAIL
===================================================== */
app.get("/charts/subject-pass-fail", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "subject",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN (scored_mark / max_mark) * 100 >= 40 THEN 1 ELSE 0 END"
            )
          ),
          "pass",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN (scored_mark / max_mark) * 100 < 40 THEN 1 ELSE 0 END"
            )
          ),
          "fail",
        ],
      ],
      where,
      group: ["subject"],
    });

    res.json({
      success: true,
      data: rows.flatMap((r) => [
        { subject: r.subject, term: "Pass", avg_score: r.dataValues.pass },
        { subject: r.subject, term: "Fail", avg_score: r.dataValues.fail },
      ]),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 3️⃣ SUBJECT AVERAGE
===================================================== */
app.get("/charts/subject-average", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["subject"],
    });

    res.json({
      success: true,
      data: rows.map((r) => ({
        subject: r.subject,
        avg_score: Number(r.dataValues.avg_score).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 4️⃣ TERM COMPARISON (GROUPED)
===================================================== */
app.get("/charts/term-comparison", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "subject",
        "term",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["subject", "term"],
    });

    res.json({
      success: true,
      data: rows.map((r) => ({
        subject: r.subject,
        term: r.term,
        avg_score: Number(r.dataValues.avg_score).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 5️⃣ REPORT SUBJECT AVG
===================================================== */
app.get("/charts/report-subject-avg", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["subject"],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   BAR CHART 6️⃣ REPORT TERM AVG
===================================================== */
app.get("/charts/report-term-avg", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "term",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["term"],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   TABLE 1️⃣ TOP 5 STUDENTS – OVERALL
===================================================== */
app.get("/table/top-students-overall", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      attributes: [
        "admission_no",
        "student_name",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_marks"],
      ],
      where,
      group: ["admission_no", "student_name"],
      order: [[Sequelize.literal("avg_marks"), "DESC"]],
      limit: 5,
    });

    res.json({
      success: true,
      data: rows.map((r, i) => ({
        rank: i + 1,
        admission_no: r.admission_no,
        student_name: r.student_name,
        avg_marks: Number(r.dataValues.avg_marks).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   TABLE 2️⃣ TOP STUDENTS – SUBJECT
===================================================== */
app.get("/table/top-students-subject", async (req, res) => {
  try {
    const where = {};
    if (req.query.class_number && req.query.class_number !== "ALL") {
      where.class_number = req.query.class_number;
    }
    if (req.query.batch && req.query.batch !== "ALL") {
      where.batch = req.query.batch;
    }

    const rows = await StudentMarks.findAll({
      attributes: [
        "subject",
        "student_name",
        "class_number",
        "batch",

        [Sequelize.fn("SUM", Sequelize.col("scored_mark")), "total_marks"],
        [
          Sequelize.literal(
            "ROUND(AVG(scored_mark / max_mark) * 100, 2)"
          ),
          "avg_score",
        ],
      ],
      where,
      group: ["subject", "student_name", "class_number", "batch"],
      order: [
        ["subject", "ASC"],
        [Sequelize.literal("avg_score"), "DESC"],
      ],
      raw: true,
    });

    /* 🔢 ADD RANK PER SUBJECT (IMPORTANT PART) */
    const ranked = {};
    const finalData = [];

    rows.forEach((r) => {
      if (!ranked[r.subject]) ranked[r.subject] = 1;

      finalData.push({
        rank: ranked[r.subject]++,
        subject: r.subject,
        student_name: r.student_name,
        total_marks: r.total_marks,
        avg_score: r.avg_score,
        class_number: r.class_number,
        batch: r.batch,
      });
    });

    res.json({
      success: true,
      data: finalData.slice(0,5), // top students
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});


/* =====================================================
   TABLE 3️⃣ LEADERBOARD (GLOBAL TOP 5 – ALL CLASSES & DIVISIONS)
===================================================== */
app.get("/table/leaderboard", async (req, res) => {
  try {
    const rows = await StudentMarks.findAll({
      attributes: [
        "student_name",
        "class_number",
        "batch",
        [
          Sequelize.literal(
            "ROUND(AVG(scored_mark / max_mark) * 100, 2)"
          ),
          "percentage",
        ],
      ],
      group: ["student_name", "class_number", "batch"],
      order: [[Sequelize.literal("percentage"), "DESC"]],
      raw: true,
    });

    const leaderboard = rows.slice(0, 5).map((r, index) => ({
      rank: index + 1,
      student_name: r.student_name,
      class_number: r.class_number,
      batch: r.batch,
      percentage: r.percentage,
    }));

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});



/* =========================
   START SERVER
========================= */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    // 🔥 THIS LINE CREATES THE TABLE
    await sequelize.sync();

    app.listen(4000, () => {
      console.log("Server running on http://localhost:4000");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

startServer();
