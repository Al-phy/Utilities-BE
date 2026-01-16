import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
const AttendanceSession = sequelize.define(
  "AttendanceSession",
  {
    class: {                 // ✅ MATCHES DB
      type: DataTypes.STRING,
      allowNull: false,
    },
    division: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "attendance_sessions",
    timestamps: true,
  }

);

export default AttendanceSession;
