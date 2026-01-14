import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const StudentTermRemark = sequelize.define(
  "StudentTermRemark",
  {
    admission_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "student_term_remarks",
    timestamps: true, // createdAt & updatedAt
  }
);

export default StudentTermRemark;
