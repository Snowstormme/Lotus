const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toMinutes(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
}

function matchStudyPartners({ requestingUserId, users, enrollments, slots, limit = 5 }) {
  const userById = new Map(users.map((user) => [user.id, user]));
  const requestUser = userById.get(requestingUserId);
  if (!requestUser) return [];

  const coursesByUser = new Map();
  enrollments.forEach((enrollment) => {
    if (!userById.has(enrollment.user_id)) return;
    if (!coursesByUser.has(enrollment.user_id)) coursesByUser.set(enrollment.user_id, new Map());
    coursesByUser.get(enrollment.user_id).set(enrollment.course_id, enrollment.course_code);
  });

  const requestCourses = coursesByUser.get(requestingUserId) || new Map();
  const slotsByUser = new Map();
  slots.forEach((slot) => {
    if (!userById.has(slot.user_id)) return;
    if (!slotsByUser.has(slot.user_id)) slotsByUser.set(slot.user_id, []);
    slotsByUser.get(slot.user_id).push(slot);
  });

  const requestSlots = slotsByUser.get(requestingUserId) || [];
  return users
    .filter((candidate) => candidate.id !== requestingUserId && (candidate.is_demo === true || candidate.share_for_partners === true))
    .map((candidate) => {
      const candidateCourses = coursesByUser.get(candidate.id) || new Map();
      const sharedCourses = Array.from(requestCourses.keys())
        .filter((courseId) => candidateCourses.has(courseId))
        .map((courseId) => requestCourses.get(courseId))
        .sort((a, b) => String(a).localeCompare(String(b)));

      const overlapTexts = new Set();
      let overlapScore = 0;
      (slotsByUser.get(candidate.id) || []).forEach((candidateSlot) => {
        requestSlots.forEach((requestSlot) => {
          if (candidateSlot.weekday !== requestSlot.weekday) return;
          const start = Math.max(toMinutes(candidateSlot.start_time), toMinutes(requestSlot.start_time));
          const end = Math.min(toMinutes(candidateSlot.end_time), toMinutes(requestSlot.end_time));
          if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return;
          overlapScore += 1;
          overlapTexts.add(WEEKDAYS[candidateSlot.weekday] + ' ' + formatTime(start) + '-' + formatTime(end));
        });
      });

      return {
        name: candidate.name,
        year: candidate.year,
        shared_courses: sharedCourses,
        overlapping_free_times: Array.from(overlapTexts),
        score: sharedCourses.length + overlapScore
      };
    })
    .filter((candidate) => candidate.shared_courses.length > 0)
    .sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)))
    .slice(0, limit)
    .map(({ name, year, shared_courses, overlapping_free_times }) => ({
      name,
      year,
      shared_courses,
      overlapping_free_times
    }));
}

module.exports = { matchStudyPartners };
