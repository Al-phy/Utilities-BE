import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ExamMarkEntry = sequelize.define(
  "exam_mark_entries",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    school_name: {
      type: DataTypes.STRING(50),
    },

    academic_year: {
      type: DataTypes.STRING(9), // 2024-2025
      allowNull: false,
    },

    class: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    division: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },

    subject: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    term: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },

    exam_name: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },

    max_mark: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "exam_mark_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    indexes: [
      {
        unique: true,
        name: "unique_exam_entry",
        fields: [
          "academic_year",
          "class",
          "division",
          "subject",
          "term",
          "exam_name",
        ],
      },
    ],
  }
);

export default ExamMarkEntry;
