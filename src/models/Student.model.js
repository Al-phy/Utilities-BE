import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Student = sequelize.define(
  "Student",
  {
    student_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,   // ✅ REQUIRED
    },

    admission_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

      student_name: {          // ✅ MATCHES frontend + DB
      type: DataTypes.STRING,
      allowNull: false,
      field: "name",
    },

    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    class: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    division: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    academic_year: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "students",   // ✅ IMPORTANT if table already exists
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Student;
