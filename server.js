import express from "express";
import cors from "cors";
import { Sequelize } from "sequelize";
import StudentMarks from "./src/models/Student.js";
import { importStudentMarks } from "./src/readCsv.js";

const app = express();
app.use(cors());
app.use(express.json());

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

/* =====================================================
   BAR CHART 1️⃣ PERFORMANCE DISTRIBUTION
===================================================== */
app.get("/charts/performance-distribution", async (req, res) => {
  try {
    const where = buildWhere(req);

    const data = await StudentMarks.findAll({
      attributes: [
        "admission_no",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "percentage"],
      ],
      where,
      group: ["admission_no"],
    });

    const ranges = { "90–100": 0, "75–89": 0, "50–74": 0, "<50": 0 };

    data.forEach((d) => {
      const pct = Number(d.dataValues.percentage);
      if (pct >= 90) ranges["90–100"]++;
      else if (pct >= 75) ranges["75–89"]++;
      else if (pct >= 50) ranges["50–74"]++;
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

    const data = await StudentMarks.findAll({
      attributes: [
        "subject",
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN (scored_mark / max_mark) * 100 >= 40 THEN 1 ELSE 0 END"
            )
          ),
          "pass_count",
        ],
        [
          Sequelize.fn(
            "SUM",
            Sequelize.literal(
              "CASE WHEN (scored_mark / max_mark) * 100 < 40 THEN 1 ELSE 0 END"
            )
          ),
          "fail_count",
        ],
      ],
      where,
      group: ["subject"],
    });

    res.json({
      success: true,
      data: data.flatMap((d) => [
        { subject: d.subject, term: "Pass", avg_score: d.dataValues.pass_count },
        { subject: d.subject, term: "Fail", avg_score: d.dataValues.fail_count },
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

    const data = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["subject"],
    });

    res.json({
      success: true,
      data: data.map((d) => ({
        subject: d.subject,
        avg_score: Number(d.dataValues.avg_score).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   BAR CHART 4️⃣ TERM COMPARISON
===================================================== */
app.get("/charts/term-comparison", async (req, res) => {
  try {
    const where = buildWhere(req);

    const data = await StudentMarks.findAll({
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
      data: data.map((d) => ({
        subject: d.subject,
        term: d.term,
        avg_score: Number(d.dataValues.avg_score).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
/* =====================================================
   BAR CHART 5️⃣ REPORT SUBJECT AVG (Backend A)
===================================================== */
app.get("/charts/report-subject-avg", async (req, res) => {
  try {
    const where = buildWhere(req);

    const data = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["subject"],
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   BAR CHART 6️⃣ REPORT TERM AVG (Backend A)
===================================================== */
app.get("/charts/report-term-avg", async (req, res) => {
  try {
    const where = buildWhere(req);

    const data = await StudentMarks.findAll({
      attributes: [
        "term",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"],
      ],
      where,
      group: ["term"],
    });

    res.json({ success: true, data });
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

    const students = await StudentMarks.findAll({
      attributes: [
        "admission_no",
        "student_name",
        "class_number",
        "batch",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_marks"],
      ],
      where,
      group: ["admission_no", "student_name", "class_number", "batch"],
      order: [[Sequelize.literal("avg_marks"), "DESC"]],
      limit: 5,
    });

    res.json({
      success: true,
      data: students.map((s, i) => ({
        rank: i + 1,
        admission_no: s.admission_no,
        student_name: s.student_name,
        class_number: s.class_number,
        batch: s.batch,
        avg_marks: Number(s.dataValues.avg_marks).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* =====================================================
   TABLE 2️⃣ TOP STUDENTS – SUBJECT WISE
===================================================== */
app.get("/table/top-students-subject", async (req, res) => {
  try {
    const where = buildWhere(req);

    const students = await StudentMarks.findAll({
      attributes: [
        "subject",
        "student_name",
        "admission_no",
        [Sequelize.literal("(scored_mark / max_mark) * 100"), "percentage"],
      ],
      where,
      order: [[Sequelize.literal("percentage"), "DESC"]],
      limit: 5,
    });

    res.json({
      success: true,
      data: students.map((s, i) => ({
        rank: i + 1,
        subject: s.subject,
        student_name: s.student_name,
        admission_no: s.admission_no,
        percentage: Number(s.dataValues.percentage).toFixed(2),
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
/* =====================================================
   TABLE 3️⃣ LEADERBOARD (Backend A)
===================================================== */
app.get("/table/leaderboard", async (req, res) => {
  try {
    const where = buildWhere(req);

    const rows = await StudentMarks.findAll({
      where,
      order: [["created_at", "DESC"]],
      raw: true,
    });

    const map = {};
    rows.forEach((r) => {
      if (!map[r.admission_no]) {
        map[r.admission_no] = {
          admission_no: r.admission_no,
          student_name: r.student_name,
          total: 0,
          max: 0,
        };
      }
      map[r.admission_no].total += r.scored_mark;
      map[r.admission_no].max += r.max_mark;
    });

    const leaderboard = Object.values(map)
      .map((s) => ({
        ...s,
        percentage: ((s.total / s.max) * 100).toFixed(2),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((s, i) => ({ rank: i + 1, ...s }));

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/* =========================
   START SERVER
========================= */
app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
