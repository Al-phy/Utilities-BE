import { 
  getReportCardData,
  renderReportCardChartPNG,
  getDistinctClasses,
  getDistinctBatchesByClass,
  getStudentsByClassAndBatch,
  saveTermRemark,
} from "./service1.js";
import { reportCardHTML } from "../templates/reportCardTemplate.js";
import { generatePDF } from "../../utils/geneatePdf.js";

// =====================================================
// NEW ENDPOINTS FOR REPORT CARD GENERATION
// =====================================================

/**
 * Get all distinct classes for report card generation
 * @route GET /reports/classes
 */
export const getClassesForReport = async (req, res) => {
  try {
    const classes = await getDistinctClasses();
    
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error in getClassesForReport:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching classes",
      error: error.message
    });
  }
};

/**
 * Get batches for a specific class
 * @route GET /reports/classes/:classNumber/batches
 */
export const getBatchesForClass = async (req, res) => {
  try {
    const { classNumber } = req.params;
    
    if (!classNumber) {
      return res.status(400).json({
        success: false,
        message: "Class parameter is required"
      });
    }
    
    const batches = await getDistinctBatchesByClass(parseInt(classNumber));
    
    res.json({
      success: true,
      data: batches
    });
  } catch (error) {
    console.error('Error in getBatchesForClass:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching batches",
      error: error.message
    });
  }
};

/**
 * Get students by class and batch
 * @route GET /reports/students-by-class-batch
 */
export const getStudentsByClassBatch = async (req, res) => {
  try {
    const { class: classNumber, batch } = req.query;
    
    if (!classNumber || !batch) {
      return res.status(400).json({
        success: false,
        message: "Class and batch parameters are required"
      });
    }
    
    const students = await getStudentsByClassAndBatch(parseInt(classNumber), batch);
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error in getStudentsByClassBatch:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message
    });
  }
};

/**
 * Generate Report Card PDF
 * @route GET /reports/report-card/pdf
 */
export const generateReportCardPDF = async (req, res, next) => {
  try {
    const { admission_no, term } = req.query;
    
    if (!admission_no || !term) {
      return res.status(400).json({
        error: "Missing required parameters: admission_no and term"
      });
    }
    
    console.log(`Generating PDF for ${admission_no}, term: ${term}`);
    
    // Get report card data from service
    const payload = await getReportCardData({ admission_no, term });
    
    if (!payload) {
      return res.status(404).json({
        error: "Report card data not found"
      });
    }
    
    console.log("Report card data retrieved, generating chart...");
    
    // Generate chart image
    let chartImage = null;
    try {
      chartImage = await renderReportCardChartPNG(payload.graphic_data);
      console.log("Chart generated successfully");
    } catch (chartError) {
      console.error("Failed to generate chart, continuing without it:", chartError);
    }
    
    console.log("Generating HTML...");
    
    // Generate HTML
    const html = reportCardHTML({
      student: payload.student,
      data: payload.data,
      termRemark: payload.term_remark,
      chartImage
    });
    
    console.log("Generating PDF...");
    
    // Generate PDF
    const pdf = await generatePDF(html);
    
    console.log("PDF generated successfully");
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=ReportCard_${admission_no}_${term}.pdf`
    );
    
    res.send(pdf);
  } catch (err) {
    next(err);
  }
};

/**
 * Get Report Card Data (JSON)
 * @route GET /reports/report-card/data
 */
export const getReportCardDataJSON = async (req, res, next) => {
  try {
    const { admission_no, term } = req.query;
    
    if (!admission_no) {
      return res.status(400).json({
        success: false,
        message: "admission_no is required"
      });
    }
    
    const reportData = await getReportCardData({ admission_no, term });
    
    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: "Report card not found"
      });
    }
    
    res.json({
      success: true,
      ...reportData
    });
  } catch (err) {
    next(err);
  }
};

export const saveTermRemarkController = async (req, res) => {
  try {
    const { admission_no, term, year, remark, created_by } = req.body;
    
    console.log("Saving remark for:", { admission_no, term, year });
    
    if (!admission_no || !term || !year) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    const result = await saveTermRemark({
      admission_no,
      term,
      year,
      remark,
      created_by: created_by || "teacher_demo"
    });
    
    res.json({
      success: true,
      message: "Remark saved successfully",
      data: result
    });
    
  } catch (error) {
    console.error("Error in saveTermRemarkController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save remark",
      error: error.message
    });
  }
};