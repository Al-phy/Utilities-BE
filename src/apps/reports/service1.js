import { Sequelize } from "sequelize";
import puppeteer from 'puppeteer';
import StudentMarks from "../../models/Student.js";
import StudentTermRemark from "../../models/StudentRemarks.js";

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate grade and remark based on percentage
 * @param {Number} percentage - Percentage score
 * @returns {Object} { grade, remark }
 */
export function getGradeAndRemark(percentage) {
  if (percentage >= 90) return { grade: "A+", remark: "Excellent" };
  if (percentage >= 80) return { grade: "A", remark: "Very Good" };
  if (percentage >= 70) return { grade: "B+", remark: "Good" };
  if (percentage >= 60) return { grade: "B", remark: "Above Average" };
  if (percentage >= 50) return { grade: "C", remark: "Average" };
  if (percentage >= 40) return { grade: "D", remark: "Pass" };
  return { grade: "F", remark: "Fail" };
}

// =====================================================
// CHART DATA SERVICES
// =====================================================

/**
 * Get chart data inputs for report card (student vs class average)
 * @param {Object} params - { admission_no, term }
 * @returns {Array} Chart data with subject, student_percentage, class_average
 */
export async function getChartDataInputs({ admission_no, term }) {
  try {
    if (!admission_no) return [];

    const student = await StudentMarks.findOne({
      where: { admission_no, term },
      attributes: ["class_number", "batch"],
    });

    if (!student) return [];

    const { class_number, batch } = student;

    // Student subject-wise %
    const studentMarks = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("(scored_mark / max_mark) * 100"), "student_pct"],
      ],
      where: { admission_no, term },
    });

    // Class average subject-wise %
    const classAvg = await StudentMarks.findAll({
      attributes: [
        "subject",
        [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "class_avg"],
      ],
      where: { class_number, batch, term },
      group: ["subject"],
    });

    return studentMarks.map((s) => {
      const avg = classAvg.find((c) => c.subject === s.subject);

      return {
        subject: s.subject,
        student_percentage: Number(
          Number(s.dataValues.student_pct || 0).toFixed(2)
        ),
        class_average: avg
          ? Number(Number(avg.dataValues.class_avg || 0).toFixed(2))
          : 0,
      };
    });
  } catch (error) {
    console.error("Chart service error:", error);
    return [];
  }
}

/**
 * Get subject-wise average marks for charts
 */
export const getSubjectAverageData = async (where) => {
  const data = await StudentMarks.findAll({
    attributes: [
      "subject",
      [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"]
    ],
    where,
    group: ["subject"],
    order: [["subject", "ASC"]]
  });
  
  return data.map(d => ({
    subject: d.subject,
    avg_score: Number(d.dataValues.avg_score).toFixed(2)
  }));
};

/**
 * Get term comparison data (Term 1 vs Term 2)
 */
export const getTermComparisonData = async (where) => {
  const data = await StudentMarks.findAll({
    attributes: [
      "subject",
      "term",
      [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_score"]
    ],
    where,
    group: ["subject", "term"],
    order: [
      ["subject", "ASC"],
      ["term", "ASC"]
    ]
  });
  
  return data.map(d => ({
    subject: d.subject,
    term: d.term,
    avg_score: Number(d.dataValues.avg_score).toFixed(2)
  }));
};

/**
 * Get top 5 students based on average marks
 */
export const getTopStudentsData = async (where) => {
  const students = await StudentMarks.findAll({
    attributes: [
      "admission_no",
      "student_name",
      "class_number",
      "batch",
      [Sequelize.fn("SUM", Sequelize.col("scored_mark")), "total_marks"],
      [Sequelize.literal("AVG(scored_mark / max_mark) * 100"), "avg_marks"]
    ],
    where,
    group: ["admission_no", "student_name", "class_number", "batch"],
    order: [[Sequelize.literal("avg_marks"), "DESC"]],
    limit: 5
  });
  
  return students.map((s, index) => ({
    rank: index + 1,
    admission_no: s.admission_no,
    student_name: s.student_name,
    class_number: s.class_number,
    batch: s.batch,
    total_marks: Number(s.dataValues.total_marks),
    avg_marks: Number(s.dataValues.avg_marks).toFixed(2)
  }));
};

/**
 * Get distinct batches for a specific class
 */
export const getBatchesByClass = async (class_number) => {
  const batches = await StudentMarks.findAll({
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("batch")), "batch"]
    ],
    where: { class_number },
    order: [["batch", "ASC"]]
  });
  
  return batches.map(b => b.batch);
};

// =====================================================
// REPORT CARD SERVICES
// =====================================================

/**
 * Get complete report card data for a student
 * @param {Object} params - { admission_no, term }
 * @returns {Object} Report card data with student info, marks, grades, and chart data
 */
export async function getReportCardData({ admission_no, term }) {
  const where = { admission_no };
  if (term) where.term = term;

  const rows = await StudentMarks.findAll({
    where,
    order: [["subject", "ASC"]],
  });

  if (!rows.length) return null;

  const report = rows.map((r) => {
    const percentage = (r.scored_mark / r.max_mark) * 100;
    const { grade } = getGradeAndRemark(percentage);
    return {
      subject: r.subject,
      max_mark: r.max_mark,
      scored_mark: r.scored_mark,
      percentage: percentage.toFixed(2),
      grade,
    };
  });

  const termRemark = await StudentTermRemark.findOne({
    where: {
      admission_no,
      term,
      year: rows[0].year,
    },
  });

  return {
    student: {
      admission_no: rows[0].admission_no,
      student_name: rows[0].student_name,
      class_number: rows[0].class_number,
      batch: rows[0].batch,
      term: rows[0].term,
      year: rows[0].year,
    },
    data: report,
    graphic_data: await getChartDataInputs({ admission_no, term }),
    term_remark: termRemark ? termRemark.remark : "—",
  };
}

/**
 * Save or update term remark for a student
 * @param {Object} params - { admission_no, term, year, remark, created_by }
 * @returns {Object} { isNew: boolean }
 */
export async function saveTermRemark({ admission_no, term, year, remark, created_by }) {
  const [remarkRecord, created] = await StudentTermRemark.findOrCreate({
    where: { admission_no, term, year },
    defaults: { remark, created_by }
  });

  if (!created) {
    remarkRecord.remark = remark;
    remarkRecord.created_by = created_by;
    await remarkRecord.save();
  }

  return { isNew: created };
}

// =====================================================
// CHART RENDERING SERVICE (PUPPETEER)
// =====================================================

/**
 * Generate a chart PNG image for report card using Puppeteer and Highcharts
 * @param {Array} graphic_data - Array of subject performance data
 * @returns {String} Base64 encoded PNG image as data URI
 */
export async function renderReportCardChartPNG(graphic_data) {
  let browser;
  
  try {
    console.log('Launching browser for chart generation...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });

    const subjectColors = {
      English: "#1e40af",
      Maths: "#6b21a8",
      Science: "#15803d",
    };

    const CLASS_AVG_COLOR = "#4b5563";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://code.highcharts.com/highcharts.js"></script>
  <style>
    body { margin: 0; padding: 20px; background: white; }
    #container { width: 800px; height: 400px; }
  </style>
</head>
<body>
  <div id="container"></div>
  <script>
    Highcharts.chart('container', {
      chart: {
        type: 'column',
        backgroundColor: '#ffffff',
        width: 800,
        height: 400,
        events: {
          load: function() {
            window.chartReady = true;
          }
        }
      },
      title: {
        text: 'Student vs Class Average (%)',
        style: {
          fontSize: '16px',
          fontWeight: 'bold'
        }
      },
      xAxis: {
        categories: ${JSON.stringify(graphic_data.map(d => d.subject))},
        title: { text: 'Subjects' }
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: 'Percentage (%)' }
      },
      credits: { enabled: false },
      legend: { enabled: true },
      tooltip: {
        shared: true,
        valueSuffix: '%'
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            format: '{y}%'
          }
        }
      },
      series: [
        {
          name: 'Student',
          data: ${JSON.stringify(graphic_data.map(d => ({
            y: d.student_percentage,
            color: subjectColors[d.subject] || "#000000"
          })))}
        },
        {
          name: 'Class Average',
          data: ${JSON.stringify(graphic_data.map(d => ({
            y: d.class_average,
            color: CLASS_AVG_COLOR
          })))}
        }
      ]
    });
  </script>
</body>
</html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    await page.waitForFunction('window.chartReady === true', {
      timeout: 20000
    });

    const element = await page.$('#container');
    
    if (!element) {
      throw new Error('Chart container not found');
    }
    
    const screenshot = await element.screenshot({ 
      type: 'png',
      encoding: 'base64'
    });

    await browser.close();

    console.log('Chart generated successfully');
    
    return `data:image/png;base64,${screenshot}`;

  } catch (error) {
    console.error('Error generating chart:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}