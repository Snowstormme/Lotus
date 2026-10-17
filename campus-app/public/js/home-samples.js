const samplePosts = [
  { author_name: 'Ayla Demir', author_year: 2, body: 'Study group for this week is meeting in the library lounge.', created_at: '2026-10-17T10:00:00+04:00', like_count: 4, is_sample: true },
  { author_name: 'Kamran Valeh', author_year: 1, body: 'Sharing a short review checklist for the next assessment.', created_at: '2026-10-16T16:30:00+04:00', like_count: 7, is_sample: true },
  { author_name: 'Nigar Aras', author_year: 3, body: 'Which topics should we cover in our next study session?', created_at: '2026-10-16T11:15:00+04:00', like_count: 3, is_sample: true }
];

const sampleGroups = [
  { name: 'Study Circle', description: 'A friendly place for shared study sessions.', kind: 'club', member_count: 18, is_member: false, is_sample: true },
  { name: 'Campus Creators', description: 'Share ideas and learn from fellow students.', kind: 'club', member_count: 12, is_member: false, is_sample: true },
  { name: 'Language Exchange', description: 'Practice languages together each week.', kind: 'club', member_count: 9, is_member: false, is_sample: true }
];

const sampleEvents = [
  { title: 'Study Skills Workshop', description: 'A sample campus learning session.', starts_at: '2026-10-20T16:00:00+04:00', location: 'Student Center', rsvp_count: 12, is_sample: true },
  { title: 'Campus Welcome Meetup', description: 'A sample event for meeting classmates.', starts_at: '2026-10-22T18:00:00+04:00', location: 'Main Hall', rsvp_count: 8, is_sample: true },
  { title: 'Career Q&A', description: 'A sample conversation about future pathways.', starts_at: '2026-10-24T14:00:00+04:00', location: 'Room 204', rsvp_count: 6, is_sample: true }
];

export { samplePosts, sampleGroups, sampleEvents };
