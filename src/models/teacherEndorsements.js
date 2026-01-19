import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const TeacherEndorsement = sequelize.define(
  "teacher_endorsements",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // 🔗 Link to users_list (teacher)
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "FK -> users_list.id (teacher)",
    },

    class: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Class assigned to teacher (e.g., 5, 6, 7)",
    },

    batch: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Division / Batch (e.g., A, B)",
    },

    subjects: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "Array of subject objects teacher handles in this class",
    },
  },
  {
    tableName: "teacher_endorsements",
    timestamps: true, // createdAt & updatedAt
  }
);

export default TeacherEndorsement;
