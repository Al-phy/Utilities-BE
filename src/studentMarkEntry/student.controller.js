import {
  getClasses,
  getDivisionsByClass,
  getStudents,
  getAcademicYears,
  getStudentReport,
  getLeaderboard,
  saveStudentExamMarks,
  fetchExamEntries,
  fetchMarksByEntry,
  fetchExamEntryById,
  updateStudentExamMarks,
  createStudent,
} from "./student.service.js";
 
/* ================= FILTERS ================= */
export async function loadFilters(req, res) {
  try {
    const classes = await getClasses();
    res.json({ classes });
  } catch (err) {
    res.status(500).json({ error: "Failed to load classes" });
  }
}
 
/* ================= DIVISIONS ================= */
export async function divisions(req, res) {
  try {
    const className = req.query.class;
    if (!className)
      return res.status(400).json({ error: "Class required" });
 
    const data = await getDivisionsByClass(className);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load divisions" });
  }
}
 
/* ================= STUDENTS ================= */
export async function students(req, res) {
  try {
    const { class: className, division } = req.query;
    if (!className || !division)
      return res.status(400).json({ error: "Class and division required" });
 
    const data = await getStudents(className, division);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load students" });
  }
}
 
/* ================= YEARS ================= */
export async function years(req, res) {
  try {
    const { class: className, division } = req.query;
    if (!className || !division)
      return res.status(400).json({ error: "Class and division required" });
 
    const data = await getAcademicYears(className, division);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load years" });
  }
}
 
/* ================= REPORT ================= */
export async function report(req, res) {
  try {
    const data = await getStudentReport(req.query);
    res.json({ data });
  } catch (err) {
    console.error("❌ STUDENT REPORT ERROR");
    console.error(err);
    console.error("❌ END ERROR");
 
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
}
 
/* ================= LEADERBOARD ================= */
export async function leaderboard(req, res) {
  try {
    const { academic_year } = req.query;
    if (!academic_year)
      return res.status(400).json({ error: "academic_year required" });
 
    const data = await getLeaderboard(academic_year);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
}
 
export async function getExamMarkEntries(req, res) {
  try {
    const entries = await fetchExamEntries();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
 
export async function getMarksByEntry(req, res) {
  try {
    const { entryId } = req.params;
     const { term } = req.query;
    const data = await fetchMarksByEntry(entryId,term);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
 
export async function getExamEntry(req, res) {
  try {
    const entry = await fetchExamEntryById(req.params.entryId);
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
 
/* ================= SAVE EXAM MARKS ================= */
export async function saveExamMarks(req, res) {
  try {
    const result = await saveStudentExamMarks(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to save exam marks",
    });
  }
}
 
 
/* ================= UPDATE EXAM MARKS ================= */
export async function updateExamMarks(req, res) {
  try {
    const result = await updateStudentExamMarks(req.body);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to update exam marks",
    });
  }
}
 
/* ================= CREATE STUDENT ================= */
/* ================= CREATE STUDENT ================= */
export async function addStudent(req, res) {
  try {
    const {
      admission_no,
      name,
      gender,
      class: studentClass,
      division,
      academic_year,
    } = req.body;
 
    // ✅ FIXED validation
    if (
      !admission_no ||
      !name ||
      !gender ||
      !studentClass ||
      !division ||
      !academic_year
    ) {
      return res.status(400).json({ error: "All fields required" });
    }
 
    await createStudent({
      admission_no,
      name,
      gender,
      class: studentClass,   // ✅ FIXED
      division,
      academic_year,
    });
 
    res.status(201).json({ message: "Student created successfully" });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Admission number exists" });
    }
 
    console.error("CREATE STUDENT ERROR FULL:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
 
  }
}
 
 