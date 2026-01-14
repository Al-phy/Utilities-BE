export function reportCardHTML({ student, data, termRemark, chartImage }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    padding: 40px;
    font-size: 14px;
    color: #0f172a;
    background: #ffffff;
  }

  .header {
    text-align: center;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }

  .school-name {
    font-size: 22px;
    font-weight: 700;
    color: #2563eb;
    margin: 0;
  }

  .title {
    font-size: 15px;
    color: #475569;
    margin-top: 4px;
  }

  .info {
    background: #f1f5f9;
    padding: 16px;
    border-radius: 8px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 8px;
    column-gap: 20px;
    margin-bottom: 24px;
  }

  .info p {
    margin: 0;
    font-size: 13px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }

  thead {
    background: #2563eb;
    color: #ffffff;
  }

  th, td {
    padding: 10px;
    text-align: center;
    font-size: 13px;
  }

  tbody tr:nth-child(even) {
    background: #f8fafc;
  }

  tbody tr:hover {
    background: #e0f2fe;
  }

  .grade-A { color: #16a34a; font-weight: 600; }
  .grade-B { color: #2563eb; font-weight: 600; }
  .grade-C { color: #ca8a04; font-weight: 600; }
  .grade-D { color: #dc2626; font-weight: 600; }

  .chart {
    margin-top: 32px;
    page-break-inside: avoid;
  }

  .chart h3 {
    margin-bottom: 12px;
    color: #2563eb;
    font-size: 16px;
  }

  .chart img {
    width: 100%;
    max-width: 800px;
    height: auto;
    display: block;
    margin: 10px auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  .remark {
    margin-top: 32px;
  }

  .remark h3 {
    margin-bottom: 8px;
    color: #2563eb;
  }

  .remark-box {
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    padding: 14px;
    border-radius: 6px;
    min-height: 80px;
    font-size: 13px;
    color: #334155;
  }

  .footer {
    margin-top: 40px;
    text-align: center;
    font-size: 11px;
    color: #64748b;
  }
</style>
</head>

<body>

  <div class="header">
    <h1 class="school-name">Green Valley Public School</h1>
    <div class="title">Student Report Card</div>
  </div>

  <div class="info">
    <p><b>Student Name:</b> ${student.student_name}</p>
    <p><b>Admission No:</b> ${student.admission_no}</p>
    <p><b>Class:</b> ${student.class_number} ${student.batch}</p>
    <p><b>Term:</b> ${student.term}</p>
    <p><b>Academic Year:</b> ${student.year}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Max Marks</th>
        <th>Scored</th>
        <th>Percentage</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${data
        .map(
          (row) => `
        <tr>
          <td>${row.subject}</td>
          <td>${row.max_mark}</td>
          <td>${row.scored_mark}</td>
          <td>${row.percentage}%</td>
          <td class="grade-${row.grade}">${row.grade}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  ${chartImage ? `
  <div class="chart">
    <h3>Performance Comparison</h3>
    <img src="${chartImage}" alt="Performance Chart" />
  </div>
  ` : ''}

  <div class="remark">
    <h3>Teacher's Remark</h3>
    <div class="remark-box">
      ${termRemark || "—"}
    </div>
  </div>

  <div class="footer">
    This is a system-generated report card.
  </div>

</body>
</html>
`;
}