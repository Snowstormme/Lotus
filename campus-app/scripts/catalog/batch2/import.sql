begin;

-- Batch 2 only. Exact-name lookups; existing rows are never changed.
-- All five universities must already exist exactly once before this file is run.
do $batch2_check$
begin
  if (select count(*) from universities where name = 'Azərbaycan Tibb Universiteti') <> 1 then
    raise exception 'Batch 2 requires exactly one university named %.', 'Azərbaycan Tibb Universiteti';
  end if;
  if (select count(*) from universities where name = 'Bakı Slavyan Universiteti') <> 1 then
    raise exception 'Batch 2 requires exactly one university named %.', 'Bakı Slavyan Universiteti';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti') <> 1 then
    raise exception 'Batch 2 requires exactly one university named %.', 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti';
  end if;
  if (select count(*) from universities where name = 'Türkiyə-Azərbaycan Universiteti') <> 1 then
    raise exception 'Batch 2 requires exactly one university named %.', 'Türkiyə-Azərbaycan Universiteti';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Turizm və Menecment Universiteti') <> 1 then
    raise exception 'Batch 2 requires exactly one university named %.', 'Azərbaycan Turizm və Menecment Universiteti';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Bakı Slavyan Universiteti' and f.name = 'Filologiya fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Bakı Slavyan Universiteti' and f.name = 'Təhsil fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti' and f.name = 'Teatr Sənəti Fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti' and f.name = 'Audiovizual Sənətlər Fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Turizm və Menecment Universiteti' and f.name = 'Turizm və qonaqpərvərlik fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Turizm və Menecment Universiteti' and f.name = 'Biznes və Menecment fakültəsi') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified') > 1 then
    raise exception 'Batch 2 faculty lookup is ambiguous; review existing records.';
  end if;
end;
$batch2_check$;

insert into faculties (university_id, name)
select u.id, 'İctimai səhiyyə fakültəsi'
from universities u where u.name = 'Azərbaycan Tibb Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'İctimai səhiyyə fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Filologiya fakültəsi'
from universities u where u.name = 'Bakı Slavyan Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Filologiya fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Təhsil fakültəsi'
from universities u where u.name = 'Bakı Slavyan Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Təhsil fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Teatr Sənəti Fakültəsi'
from universities u where u.name = 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Teatr Sənəti Fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Audiovizual Sənətlər Fakültəsi'
from universities u where u.name = 'Azərbaycan Dövlət Mədəniyyət və İncəsənət Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Audiovizual Sənətlər Fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Turizm və qonaqpərvərlik fakültəsi'
from universities u where u.name = 'Azərbaycan Turizm və Menecment Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Turizm və qonaqpərvərlik fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Biznes və Menecment fakültəsi'
from universities u where u.name = 'Azərbaycan Turizm və Menecment Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Biznes və Menecment fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Faculty not specified'
from universities u where u.name = 'Türkiyə-Azərbaycan Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Faculty not specified');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Tibb bacılığının menecmenti (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Tibb bacılığının menecmenti (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Tibbi sığorta (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Tibbi sığorta (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ana və uşaq sağlamlığı (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ana və uşaq sağlamlığı (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Səhiyyənin siyasəti və planlaşdırma (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Səhiyyənin siyasəti və planlaşdırma (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Səhiyyə sistemlərinin idarə olunması (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Səhiyyə sistemlərinin idarə olunması (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Səhiyyə kommunikasiyası (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Public-health bachelor listing; parenthetical annotation retained.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Səhiyyə kommunikasiyası (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Sağlamlığın təbliğ (İctimai Səhiyyə)', true, 'bachelor', 'https://amu.edu.az/page/3728/bakalavr', 'Source spelling retained; apparent grammatical omission in təbliğ.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Tibb Universiteti' and f.name = 'İctimai səhiyyə fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Sağlamlığın təbliğ (İctimai Səhiyyə)' and c.source_url = 'https://amu.edu.az/page/3728/bakalavr');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'PHYS105', 'GENERAL PHYSICS I', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'GENERAL PHYSICS I' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'BIOL109', 'INTRODUCTION TO MOLECULAR BIOLOGY', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'INTRODUCTION TO MOLECULAR BIOLOGY' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MATH119', 'CALCULUS WITH ANALYTIC GEOMETRY', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'CALCULUS WITH ANALYTIC GEOMETRY' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CENG100', 'COMPUTER ENGINEERING ORIENTATION', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'COMPUTER ENGINEERING ORIENTATION' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CENG111', 'INTRODUCTION TO COMPUTER ENG. CONCEPTS', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'INTRODUCTION TO COMPUTER ENG. CONCEPTS' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENG101', 'ENGLISH FOR ACADEMIC PURPOSES I', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'ENGLISH FOR ACADEMIC PURPOSES I' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'OHS101', 'OCCUPATIONAL HEALTH AND SAFETY-I', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'OCCUPATIONAL HEALTH AND SAFETY-I' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'IS100', 'INTRODUCTION TO INFORMATION TECHNOLOGIES AND APPLICATIONS', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'INTRODUCTION TO INFORMATION TECHNOLOGIES AND APPLICATIONS' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'PHYS106', 'GENERAL PHYSICS II', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'GENERAL PHYSICS II' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MATH120', 'CALCULUS OF FUNCTIONS OF SEVERAL VARIABLES', true, 'bachelor', 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi', 'Title retained from the official source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Türkiyə-Azərbaycan Universiteti' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'CALCULUS OF FUNCTIONS OF SEVERAL VARIABLES' and c.source_url = 'https://www.tau.edu.az/az/programs/komputer-muhendisliyi');

commit;
