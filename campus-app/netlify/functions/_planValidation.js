function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validatePlan(plan, weeklyFreeHours) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) return false;
  if (!Array.isArray(plan.weeks) || typeof plan.summary !== 'string') return false;
  if (plan.summary.trim().split(/\s+/).filter(Boolean).length > 40) return false;

  return plan.weeks.every((week) => {
    if (!week || typeof week !== 'object' || !isDateString(week.week_start) || !Array.isArray(week.days)) {
      return false;
    }

    let totalMinutes = 0;
    const daysAreValid = week.days.every((day) => {
      if (!day || typeof day !== 'object' || typeof day.day !== 'string' || !Array.isArray(day.tasks)) {
        return false;
      }
      return day.tasks.every((task) => {
        if (!task || typeof task !== 'object' || typeof task.course !== 'string' ||
            typeof task.task !== 'string' || typeof task.minutes !== 'number' ||
            !Number.isFinite(task.minutes) || task.minutes < 0 || task.minutes > 480) {
          return false;
        }
        totalMinutes += task.minutes;
        return true;
      });
    });

    return daysAreValid && totalMinutes <= weeklyFreeHours * 60;
  });
}

module.exports = { validatePlan };
