import { Sequelize } from "sequelize";
import Student from "../models/Student.model.js";
import ExamMarkEntry from "../models/ExamMarkEntry.model.js";
import ExamMark from "../models/ExamMarkScore.model.js";
import { Sequelize } from "sequelize";

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
