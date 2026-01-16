import { Sequelize } from "sequelize";
import Student from "../models/Student.model.js";
import ExamMarkEntry from "../models/ExamMarkEntry.model.js";
import ExamMark from "../models/ExamMarkScore.model.js";
import { Op } from "sequelize";
/* ================= CLASSES ================= */
export async function getClasses() {
  const rows = await Student.findAll({
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("class")), "class"]],
    raw: true,
  });
  return rows.map(r => r.class);
}
 
/* ================= DIVISIONS ================= */
export async function getDivisionsByClass(className) {
  const rows = await Student.findAll({
    where: { class: className },
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("division")), "division"]],
    raw: true,
  });
  return rows.map(r => r.division);
}
 
/* ================= STUDENTS ================= */
export async function getStudents(className, division) {
  return await Student.findAll({
    where: { class: className, division },
    attributes: [
      "student_id",
      "admission_no",
      ["name", "student_name"],
      "gender",
    ],
    order: [["name", "ASC"]],
    raw: true,
  });
}
 
/* ================= ACADEMIC YEARS ================= */
export async function getAcademicYears(className, division) {
  const rows = await ExamMarkEntry.findAll({
    where: { class: className, division },
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("academic_year")), "academic_year"],
    ],
    raw: true,
  });
 
  return rows.map(r => r.academic_year);
}
 
/* ================= FETCH EXAM ENTRIES ================= */
export async function fetchExamEntries() {
  return await ExamMarkEntry.findAll({
    order: [["created_at", "DESC"]],
  });
}
 
export async function fetchExamEntryById(entryId) {
  return ExamMarkEntry.findByPk(entryId);
}
 
export async function fetchMarksByEntry(entryId,term) {
  const entry = await ExamMarkEntry.findByPk(entryId);
  if (!entry) throw new Error("Exam entry not found");
 
  const marks = await ExamMark.findAll({
    where: { mark_entry_id: entryId },
    include: [
    {
      model: ExamMarkEntry,
      where: { term }, // ✅ TERM FILTER
      attributes: [],
      required: true,
    },
  ],
  });
 
  return { entry, marks };
}
 
/* ================= STUDENT REPORT ================= */
 
 
export async function getStudentReport(filters) {
  const { admission_no, academic_year, class: cls, division } = filters;
 
  if (!admission_no || !academic_year || !cls || !division) {
    return [];
  }
 
  const rows = await ExamMark.findAll({
    where: {
      admission_no,
      is_absent: { [Op.ne]: "ABSENT" },
    },
    include: [
      {
        model: ExamMarkEntry,
        where: {
          academic_year,
          class: cls,
          division,
        },
        attributes: ["subject", "term", "max_mark"],
        required: true,
      },
    ],
    order: [["updated_at", "DESC"]], // ✅ FIXED
  });
 
  const latestMap = {};
 
  for (const row of rows) {
    const r = row.toJSON();
     if (!r.exam_mark_entry) continue;
    const { subject, term, max_mark } = r.exam_mark_entry;
 
    const key = `${subject}_${term}`;
 
    // first row per subject+term is latest because DESC order
    if (!latestMap[key]) {
      latestMap[key] = {
        subject,
        term,
        scored_mark: r.scored_mark,
        max_mark,
        percentage: Number(r.percentage),
        updated_at: r.updated_at,
      };
    }
  }
 
  return Object.values(latestMap);
}
/* ================= LEADERBOARD ================= */
export async function getLeaderboard(academic_year) {
  try {
    const rows = await ExamMark.findAll({
      where: {
        is_absent: "PRESENT",
      },
      include: [
        {
          model: ExamMarkEntry,
          where: { academic_year },
          attributes: ["subject", "term", "max_mark"],
        },
        {
          model: Student,
          attributes: ["name", "class", "division"],
        },
      ],
      order: [["updated_at", "DESC"]], // ✅ IMPORTANT
    });
 
    const studentMap = {};
 
    for (const row of rows) {
      const r = row.toJSON();
      if (!r.exam_mark_entry || !r.Student) continue;
 
      const studentKey = r.admission_no;
      const subjectKey = `${r.exam_mark_entry.subject}_${r.exam_mark_entry.term}`;
 
      if (!studentMap[studentKey]) {
        studentMap[studentKey] = {
          admission_no: r.admission_no,
          name: r.Student.name,
          class: r.Student.class,
          division: r.Student.division,
          total: 0,
          max: 0,
          subjects: {},
        };
      }
 
      // ✅ take only latest mark per subject
      if (!studentMap[studentKey].subjects[subjectKey]) {
        studentMap[studentKey].subjects[subjectKey] = true;
        studentMap[studentKey].total += r.scored_mark || 0;
        studentMap[studentKey].max += r.exam_mark_entry.max_mark || 0;
      }
    }
 
    const leaderboard = Object.values(studentMap)
      .map((s) => ({
        admission_no: s.admission_no,
        name: s.name,
        class: s.class,
        division: s.division,
        total: s.total,
        max: s.max,
        percentage: s.max ? Number(((s.total / s.max) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .map((s, i) => ({ ...s, rank: i + 1 }));
 
    return leaderboard;
  } catch (err) {
    console.error("❌ LEADERBOARD ERROR", err);
    throw err;
  }
}
 
/* ================= SAVE EXAM MARKS ================= */
export async function saveStudentExamMarks(payload) {
  const {
    school_name,
    academic_year,
    class: className,
    division,
    subject,
    term,
    exam_name,
    max_mark,
    marks,
  } = payload;
 
  if (!Array.isArray(marks)) {
    throw new Error("Invalid payload");
  }
  // 🔍 check duplicate exam entry//////////////////////////////
const existingEntry = await ExamMarkEntry.findOne({
  where: {
    academic_year,
    class: className,
    division,
    subject,
    term,
    exam_name,
  },
});
 
if (existingEntry) {
  throw new Error(
    "The same exam name for this Academic Year, Class, Division, Subject and Term has already been created"
  );
}
 
 
  const entry = await ExamMarkEntry.create({
    school_name,
    academic_year,
    class: className,
    division,
    subject,
    term,
    exam_name,
    max_mark,
  });
 
  for (const m of marks) {
    const attendanceStatus = m.is_absent ? "ABSENT" : "PRESENT";
 
    const scoredMark =
      attendanceStatus === "ABSENT" ? 0 : Number(m.scored_mark);
 
    if (
      attendanceStatus === "PRESENT" &&
      (scoredMark < 0 || scoredMark > max_mark)
    ) {
      throw new Error(
        `Invalid marks for ${m.admission_no}. Must be between 0 and ${max_mark}`
      );
    }
 
    const percentage =
      attendanceStatus === "ABSENT"
        ? 0
        : Number(((scoredMark / max_mark) * 100).toFixed(2));
 
   // 🔎 find student_id using admission_no
const student = await Student.findOne({
  where: { admission_no: m.admission_no },
  attributes: ["student_id"],
});
 
if (!student) {
  throw new Error(`Student not found for admission_no ${m.admission_no}`);
}
 
await ExamMark.create({
  admission_no: m.admission_no,
  student_id: student.student_id, // ✅ ALWAYS VALID
  mark_entry_id: entry.id,
  scored_mark: scoredMark,
  percentage,
  is_absent: attendanceStatus,
});
 
  }
 
  return { success: true };
}
 
/* ================= UPDATE EXAM MARKS ================= */
export async function updateStudentExamMarks(payload) {
  const { entryId, max_mark, marks } = payload;
 
  if (!entryId || !Array.isArray(marks)) {
    throw new Error("Invalid update payload");
  }
 
  for (const m of marks) {
    const attendanceStatus = m.is_absent ? "ABSENT" : "PRESENT";
 
    const scoredMark =
      attendanceStatus === "ABSENT" ? 0 : Number(m.scored_mark);
 
    if (
      attendanceStatus === "PRESENT" &&
      (scoredMark < 0 || scoredMark > max_mark)
    ) {
      throw new Error(
        `Invalid marks for ${m.admission_no}. Must be between 0 and ${max_mark}`
      );
    }
 
    const percentage =
      attendanceStatus === "ABSENT"
        ? 0
        : Number(((scoredMark / max_mark) * 100).toFixed(2));
 
    // 🔎 find student_id using admission_no
const student = await Student.findOne({
  where: { admission_no: m.admission_no },
  attributes: ["student_id"],
});
 
if (!student) {
  throw new Error(`Student not found for admission_no ${m.admission_no}`);
}
 
// 🔎 check if mark already exists
const existingMark = await ExamMark.findOne({
  where: {
    mark_entry_id: entryId,
    student_id: student.student_id,
  },
});
 
if (existingMark) {
  // ✅ UPDATE
  await existingMark.update({
    scored_mark: scoredMark,
    percentage,
    is_absent: attendanceStatus,
  });
} else {
  // ✅ INSERT (for new students)
  await ExamMark.create({
    admission_no: m.admission_no,
    student_id: student.student_id,
    mark_entry_id: entryId,
    scored_mark: scoredMark,
    percentage,
    is_absent: attendanceStatus,
  });
}
 
  }
 
  return { success: true };
}
/* ================= CREATE STUDENT ================= */
export async function createStudent(data) {
  return await Student.create({
    admission_no: data.admission_no,
    student_name: data.name,
    gender: data.gender,
    class: data.class,
    division: data.division,
    academic_year: data.academic_year,
  });
}
 
 