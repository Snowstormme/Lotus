begin;

-- Batch 4 only. Review before running; no existing rows are changed.
do $batch4_check$
begin
  if (select count(*) from universities where name = 'Azərbaycan Dövlət Gömrük Universiteti') <> 0 then
    raise exception 'Batch 4 requires no existing university named %.', 'Azərbaycan Dövlət Gömrük Universiteti';
  end if;
  if (select count(*) from universities where name = 'Xəzər Universiteti') <> 1 then
    raise exception 'Batch 4 requires exactly one existing university named %.', 'Xəzər Universiteti';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Dövlət Musiqi Akademiyası') <> 0 then
    raise exception 'Batch 4 requires no existing university named %.', 'Azərbaycan Dövlət Musiqi Akademiyası';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified') > 1 then
    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering') > 1 then
    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management') > 1 then
    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Fortepiano fakültəsi') > 1 then
    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi') > 1 then
    raise exception 'Batch 4 faculty lookup is ambiguous; review existing records.';
  end if;
end;
$batch4_check$;

insert into universities (name, city)
select 'Azərbaycan Dövlət Gömrük Universiteti', 'Bakı'
where not exists (select 1 from universities where name = 'Azərbaycan Dövlət Gömrük Universiteti');

insert into universities (name, city)
select 'Azərbaycan Dövlət Musiqi Akademiyası', 'Bakı'
where not exists (select 1 from universities where name = 'Azərbaycan Dövlət Musiqi Akademiyası');

insert into faculties (university_id, name)
select u.id, 'Faculty not specified'
from universities u where u.name = 'Azərbaycan Dövlət Gömrük Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Faculty not specified');

insert into faculties (university_id, name)
select u.id, 'School of Science and Engineering'
from universities u where u.name = 'Xəzər Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'School of Science and Engineering');

insert into faculties (university_id, name)
select u.id, 'School of Economics and Management'
from universities u where u.name = 'Xəzər Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'School of Economics and Management');

insert into faculties (university_id, name)
select u.id, 'Fortepiano fakültəsi'
from universities u where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Fortepiano fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Tarix-nəzəriyyə fakültəsi'
from universities u where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Tarix-nəzəriyyə fakültəsi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Mikroiqtisadiyyat', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Mikroiqtisadiyyat' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Makroiqtisadiyyat', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Makroiqtisadiyyat' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İqtisadi düşüncələr tarixi', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İqtisadi düşüncələr tarixi' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Beynəlxalq iqtisadiyyat', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Beynəlxalq iqtisadiyyat' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ekonometrika', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ekonometrika' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İqtisadiyyatın tənzimlənməsi', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İqtisadiyyatın tənzimlənməsi' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İqtisadi siyasət', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İqtisadi siyasət' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Makroiqtisadi təhlil', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Makroiqtisadi təhlil' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ətraf mühitin iqtisadiyyatı', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ətraf mühitin iqtisadiyyatı' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Aqrar iqtisadiyyat', true, 'bachelor', 'https://www.ascca.gov.az/az/pages/Bakalavriat', 'İqtisadiyyat bachelor subject list; faculty unspecified.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Gömrük Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Aqrar iqtisadiyyat' and c.source_url = 'https://www.ascca.gov.az/az/pages/Bakalavriat');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZLL 101', 'Azerbaijan language', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan language' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZC 202', 'Azerbaijan Culture', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan Culture' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CMS 115', 'Computer Application in Engineering', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Computer Application in Engineering' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENGL 101', 'English Foundations 1', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'English Foundations 1' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MATH 101', 'Calculus 1', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Calculus 1' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MATH 105', 'Calculus 2', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Calculus 2' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'PHSC 150', 'Physics for computer science', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Physics for computer science' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENGL 102', 'English Foundations 2', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'English Foundations 2' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CMS 140', 'Fundamentals of Computer programming', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Fundamentals of Computer programming' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZH 150', 'Azerbaijan History', true, 'bachelor', 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf', 'Title retained from the official source. Computer Science undergraduate curriculum. Computer Science curriculum; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Science and Engineering'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan History' and c.source_url = 'https://khazar.org/uploads/schools/Engineering/Computer_Sciences/curriculum/Computer_scienece.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ECON 101', 'Introduction to Economics', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Introduction to Economics' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENGL 101', 'English Foundations-1', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'English Foundations-1' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CMS 101', 'Introduction to Computer Sciences', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Introduction to Computer Sciences' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZLL 101', 'Azerbaijan Language', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan Language' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZC 201', 'Azerbaijan Culture', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan Culture' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENGL 102', 'English Foundations-2', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'English Foundations-2' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZH 150', 'Azerbaijan History', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan History' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'AZLL 105', 'Azerbaijan Literature', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azerbaijan Literature' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MED 315', 'Life Science', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Life Science' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MGT 101', 'Career Planning', true, 'bachelor', 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf', 'Title retained from the official source. BS in Economics degree plan 2020. 2020 degree plan; confirm current offering'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Xəzər Universiteti' and f.name = 'School of Economics and Management'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Career Planning' and c.source_url = 'https://khazar.org/uploads/schools/Economics/Economics_and_Management/degree_plans/Economics_2020.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ихтисас', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Title retained from the official source. Legacy Cyrillic spelling.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ихтисас' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İxtisasa giriş', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Bachelor list section 1.8.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İxtisasa giriş' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəzəri musiqişünaslıq', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Bachelor list section 1.8.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəzəri musiqişünaslıq' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Полифонийа', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Title retained from the official source. Legacy Cyrillic spelling.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Полифонийа' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Pedaqoji təcrübə', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Bachelor list section 1.8.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Pedaqoji təcrübə' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Щармонийа', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Title retained from the official source. Legacy Cyrillic spelling.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Щармонийа' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Солфежио', true, 'bachelor', 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html', 'Title retained from the official source. Legacy Cyrillic spelling.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Dövlət Musiqi Akademiyası' and f.name = 'Tarix-nəzəriyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Солфежио' and c.source_url = 'https://musicacademy.edu.az/az/struktur/fakulte-mn/tarikh-nazariyyet-fk/187-musigi-nezeriyyesi-kf/musiqi-nezeriyyesi-esasnamesi.html');

commit;
