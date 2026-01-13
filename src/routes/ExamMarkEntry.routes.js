import express from "express";
import {
  loadFilters,
  divisions,
  students,
  years,
  report,
  leaderboard,
  saveExamMarks,
  getExamMarkEntries,
  getMarksByEntry,
  getExamEntry,
  updateExamMarks,
  addStudent,
} from "../controllers/student.controller.js";

const router = express.Router();

/* FILTERS */
router.get("/filters", loadFilters);

/* DIVISIONS */
router.get("/divisions", divisions);

/* STUDENTS */
router.get("/students", students);

/* YEARS */
router.get("/years", years);





/* ✅ EXAM MARK ENTRY */
router.post("/exams/marks", saveExamMarks);
router.put("/exams/marks", updateExamMarks);


router.get("/exams/entries", getExamMarkEntries);
router.get("/exams/marks/:entryId", getMarksByEntry);
router.get("/exams/entries/:entryId", getExamEntry);

router.post("/", addStudent);



export default router;
