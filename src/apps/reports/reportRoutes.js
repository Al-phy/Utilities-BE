import express from "express";
import { 
  generateReportCardPDF, 
  getReportCardDataJSON 
} from "./reportsController.js";

const router = express.Router();

// Report card PDF generation
router.get("/report-card/pdf", generateReportCardPDF);

// Report card data (JSON)
router.get("/report-card/data", getReportCardDataJSON);

export default router;