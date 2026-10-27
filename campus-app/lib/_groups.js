export function canSeeGroup(group, courseIds) {
  return group.kind === 'club' || group.kind === 'university' || (group.kind === 'course' && courseIds.has(group.course_id));
}

export function canJoinGroup(group, profile, courseIds) {
  if (group.kind === 'university') {
    return group.university_id != null && profile.university_id != null && String(group.university_id) === String(profile.university_id);
  }
  return canSeeGroup(group, courseIds);
}
