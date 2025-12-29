import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { fileURLToPath } from "url";
import sequelize from "./config/db.js";
import StudentMarks from "./models/Student.js";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
// CSV location

 
export async function importStudentMarks() {
    const filePath = path.join(__dirname, "../data/data.csv");
console.log(filePath, " filePathfilePathfilePathfilePathfilePath")
  const rows = [];
 
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // ✅ Basic validation (skip bad rows)
        if (
          !row["Admission number"] ||
          !row["Student name"] ||
          !row["Class"] ||
          !row["Subject"]
        ) {
          return;
        }
 
        rows.push({
          admission_no: row["Admission number"],
          student_name: row["Student name"],
          class_number: Number(row["Class"]),
          batch: row["Batch"],
          subject: row["Subject"],
          max_mark: Number(row["Max mark"]),
          scored_mark: Number(row["Scored Mark"]),
          term: row["Term"],
          year: Number(row["Year"]),
        });
      })
      .on("end", async () => {
        const transaction = await sequelize.transaction();
 
        try {
          // ✅ Ensure table exists
          await sequelize.sync();
 
          // ✅ Full refresh strategy (recommended)
          await StudentMarks.destroy({
            truncate: true,
            transaction,
          });
 
          // ✅ Fast bulk insert
          await StudentMarks.bulkCreate(rows, {
            validate: true,
            transaction,
          });
 
          await transaction.commit();
 
          console.log(`CSV import completed: ${rows.length} rows`);
 
          resolve({
            success: true,
            insertedRows: rows.length,
          });
        } catch (error) {
          await transaction.rollback();
          console.error("CSV Import Failed:", error);
          reject(error);
        }
      })
      .on("error", (error) => {
        console.error("CSV Read Error:", error);
        reject(error);
      });
  });
}