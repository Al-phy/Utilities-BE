import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import AttendanceSession from "./AttendanceSession.js";

const AttendanceRecord = sequelize.define(
  "AttendanceRecord",
  {
    admission_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    student_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Present", "Absent"),
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.INTEGER, // ✅ REQUIRED
      allowNull: false,
    },
  },
  {
    tableName: "attendance_records", // ✅ IMPORTANT
    timestamps: false,
  }
);
AttendanceSession.hasMany(AttendanceRecord, {
  foreignKey: "sessionId",
  as: "records",   // ✅ ADD THIS
});

AttendanceRecord.belongsTo(AttendanceSession, {
  foreignKey: "sessionId",
});

export default AttendanceRecord;
