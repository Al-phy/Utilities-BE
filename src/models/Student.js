
// models/StudentMark.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
 
const StudentMarks = sequelize.define("StudentMarks", {
  admission_no: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  class_number: {
    // renamed, INT type
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  batch: {
    type: DataTypes.STRING, // A / B
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  max_mark: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  scored_mark: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  term: {
    type: DataTypes.STRING, // Term 1 / Term 2 / Final
    allowNull: false,
  },
 
  year: {
    type: DataTypes.INTEGER, // 2023, 2024
    allowNull: false,
  },
});
 
export default StudentMarks;
 
 