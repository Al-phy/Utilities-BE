import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Student from "./Student.model.js";
import ExamMarkEntry from "./ExamMarkEntry.model.js";

const ExamMark = sequelize.define(
  "exam_marks",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    admission_no: DataTypes.STRING,
    student_id: DataTypes.INTEGER,
    mark_entry_id: DataTypes.INTEGER,
    scored_mark: DataTypes.INTEGER,
    percentage: DataTypes.FLOAT,
    is_absent: {
      type: DataTypes.ENUM("PRESENT", "ABSENT"),
      allowNull: false,
    },
  },
  {
    tableName: "exam_marks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

/* RELATIONS */
Student.hasMany(ExamMark, { foreignKey: "student_id" });
ExamMark.belongsTo(Student, { foreignKey: "student_id" });

ExamMarkEntry.hasMany(ExamMark, { foreignKey: "mark_entry_id" });
ExamMark.belongsTo(ExamMarkEntry, { foreignKey: "mark_entry_id" });

export default ExamMark;
