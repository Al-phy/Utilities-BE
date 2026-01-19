import express from "express";
import { 
  generateReportCardPDF, 
  getReportCardDataJSON, getBatchesForClass, getClassesForReport, getStudentsByClassBatch, saveTermRemarkController
} from "./reportsController.js";

const router = express.Router();

router.get("/classes", getClassesForReport);
router.get("/classes/:classNumber/batches", getBatchesForClass);
router.get("/students-by-class-batch", getStudentsByClassBatch);

// Report card PDF generation
router.get("/report-card/pdf", generateReportCardPDF);

// Report card data (JSON)
router.get("/report-card/data", getReportCardDataJSON);
router.post("/term-remark", saveTermRemarkController);


export default router;