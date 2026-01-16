import express from "express";
import {
  getAttendanceByDate,
  saveAttendance,
  updateAttendance,
  deleteAttendance,
} from "./attendance.controller.js";

const router = express.Router();

router.get("/by-date", getAttendanceByDate);
router.post("/save", saveAttendance);
router.put("/update/:sessionId", updateAttendance);
router.delete("/delete/:sessionId", deleteAttendance);

export default router;
