import AttendanceSession from "../models/AttendanceSession.js";
import AttendanceRecord from "../models/AttendanceRecord.js";

export const findSessionByDate = async (classNum, batch, date) => {
  return AttendanceSession.findOne({
    where: {
      class: String(classNum),
      division: batch,
      date,
      isArchived: false,
    },
    include: [
      {
        model: AttendanceRecord,
        as: "records",
      },
    ],
  });
};

export const createSessionWithRecords = async ({
  classNum,
  batch,
  date,
  createdBy,
  records,
}) => {
  const session = await AttendanceSession.create({
    class: String(classNum),
    division: batch,
    date,
    createdBy,
  });

  const recordData = records.map(r => ({
    ...r,
    sessionId: session.id,
  }));

  await AttendanceRecord.bulkCreate(recordData);

  return session;
};

export const updateAttendanceRecords = async (sessionId, records) => {
  await AttendanceRecord.destroy({
    where: { sessionId },
  });

  const updatedRecords = records.map(r => ({
    ...r,
    sessionId,
  }));

  await AttendanceRecord.bulkCreate(updatedRecords);
};

export const archiveAttendanceSession = async (sessionId) => {
  await AttendanceSession.update(
    { isArchived: true },
    { where: { id: sessionId } }
  );
};
