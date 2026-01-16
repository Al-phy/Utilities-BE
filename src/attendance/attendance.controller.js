import {
  findSessionByDate,
  createSessionWithRecords,
  updateAttendanceRecords,
  archiveAttendanceSession,
} from "./attendance.service.js";

export const getAttendanceByDate = async (req, res) => {
  try {
    const { class_number, batch, date } = req.query;

    const session = await findSessionByDate(class_number, batch, date);

    if (!session) {
      return res.json({
        success: false,
      });
    }

    return res.json({
      success: true,
      sessionId: session.id,
      records: session.records,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const saveAttendance = async (req, res) => {
  try {
    const { class_number, batch, date, createdBy, records } = req.body;

    const existing = await findSessionByDate(class_number, batch, date);

    if (existing) {
      return res.json({
        success: false,
        message: "Attendance already exists",
      });
    }

    const session = await createSessionWithRecords({
      classNum: class_number,
      batch,
      date,
      createdBy,
      records,
    });

    res.json({
      success: true,
      sessionId: session.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { records } = req.body;

    await updateAttendanceRecords(sessionId, records);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const deleteAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    await archiveAttendanceSession(sessionId);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
