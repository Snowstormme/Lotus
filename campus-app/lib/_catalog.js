async function getCatalogFacultyIds(supabase, profile) {
  const { data, error } = await supabase
    .from('faculties')
    .select('id')
    .eq('university_id', profile.university_id)
    .eq('name', 'Faculty not specified');
  if (error) throw error;
  return Array.from(new Set([profile.faculty_id, ...(data || []).map((faculty) => faculty.id)]));
}

export { getCatalogFacultyIds };
