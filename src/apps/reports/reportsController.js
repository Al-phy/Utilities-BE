import { 
  getReportCardData,
  renderReportCardChartPNG 
} from "./service1.js";
import { reportCardHTML } from "../templates/reportCardTemplate.js";
import { generatePDF } from "../../utils/geneatePdf.js";

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