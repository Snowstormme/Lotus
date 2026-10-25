begin;

-- Batch 3 only. Exact-name lookups; existing rows are never changed.
-- All five universities must already exist exactly once before this file is run.
do $batch3_check$
begin
  if (select count(*) from universities where name = 'Azərbaycan Texnologiya Universiteti') <> 1 then
    raise exception 'Batch 3 requires exactly one university named %.', 'Azərbaycan Texnologiya Universiteti';
  end if;
  if (select count(*) from universities where name = 'Bakı Avrasiya Universiteti') <> 1 then
    raise exception 'Batch 3 requires exactly one university named %.', 'Bakı Avrasiya Universiteti';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Kooperasiya Universiteti') <> 1 then
    raise exception 'Batch 3 requires exactly one university named %.', 'Azərbaycan Kooperasiya Universiteti';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası') <> 1 then
    raise exception 'Batch 3 requires exactly one university named %.', 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Milli Konservatoriyası') <> 1 then
    raise exception 'Batch 3 requires exactly one university named %.', 'Azərbaycan Milli Konservatoriyası';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Qida mühəndisliyi fakültəsi') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Bakı Avrasiya Universiteti' and f.name = 'Regionşünaslıq və iqtisadiyyat fakültəsi') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Bakı Avrasiya Universiteti' and f.name = 'Filologiya fakültəsi') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Kooperasiya Universiteti' and f.name = 'İqtisadiyyat') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Kooperasiya Universiteti' and f.name = 'İdarəetmə') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Maliyyə-İqtisad') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Sosial iş') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'İfaçılıq') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Musiqi tarixi və nəzəriyyəsi') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties f join universities u on u.id = f.university_id
      where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified') > 1 then
    raise exception 'Batch 3 faculty lookup is ambiguous; review existing records.';
  end if;
end;
$batch3_check$;

insert into faculties (university_id, name)
select u.id, 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
from universities u where u.name = 'Azərbaycan Texnologiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Qida mühəndisliyi fakültəsi'
from universities u where u.name = 'Azərbaycan Texnologiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Qida mühəndisliyi fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Regionşünaslıq və iqtisadiyyat fakültəsi'
from universities u where u.name = 'Bakı Avrasiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Regionşünaslıq və iqtisadiyyat fakültəsi');

insert into faculties (university_id, name)
select u.id, 'Filologiya fakültəsi'
from universities u where u.name = 'Bakı Avrasiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Filologiya fakültəsi');

insert into faculties (university_id, name)
select u.id, 'İqtisadiyyat'
from universities u where u.name = 'Azərbaycan Kooperasiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'İqtisadiyyat');

insert into faculties (university_id, name)
select u.id, 'İdarəetmə'
from universities u where u.name = 'Azərbaycan Kooperasiya Universiteti'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'İdarəetmə');

insert into faculties (university_id, name)
select u.id, 'Maliyyə-İqtisad'
from universities u where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Maliyyə-İqtisad');

insert into faculties (university_id, name)
select u.id, 'Sosial iş'
from universities u where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Sosial iş');

insert into faculties (university_id, name)
select u.id, 'İfaçılıq'
from universities u where u.name = 'Azərbaycan Milli Konservatoriyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'İfaçılıq');

insert into faculties (university_id, name)
select u.id, 'Musiqi tarixi və nəzəriyyəsi'
from universities u where u.name = 'Azərbaycan Milli Konservatoriyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Musiqi tarixi və nəzəriyyəsi');

insert into faculties (university_id, name)
select u.id, 'Faculty not specified'
from universities u where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Faculty not specified');

insert into faculties (university_id, name)
select u.id, 'Faculty not specified'
from universities u where u.name = 'Azərbaycan Milli Konservatoriyası'
and not exists (select 1 from faculties f where f.university_id = u.id and f.name = 'Faculty not specified');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Maşın və mexanizmlər nəzəriyyəsi', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Maşın və mexanizmlər nəzəriyyəsi' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Maşın hissələri və konstruksiya etmənin əsasları', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Maşın hissələri və konstruksiya etmənin əsasları' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəzəri mexanika', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəzəri mexanika' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Yol hərəkəti qaydaları', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Yol hərəkəti qaydaları' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəqliyyat vasitələrinin konstruksiyasının əsasları', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəqliyyat vasitələrinin konstruksiyasının əsasları' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəqliyyatın yükləmə - boşaltma vasitələri', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Source spacing and punctuation retained; explicit bachelor subject list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəqliyyatın yükləmə - boşaltma vasitələri' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəqliyyat logistikası', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəqliyyat logistikası' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Vahid nəqliyyat sistemi', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Vahid nəqliyyat sistemi' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəqliyyat ekspedisiya işlərinin təşkili', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəqliyyat ekspedisiya işlərinin təşkili' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəqliyyatda servis işlərinin təşkili', true, 'bachelor', 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika', 'Explicit bachelor subject list; master''s section excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Texnologiya Universiteti' and f.name = 'Nəqliyyat və sənaye texnologiyaları fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəqliyyatda servis işlərinin təşkili' and c.source_url = 'https://www.atu.edu.az/kafedra/masin-muhendisliyi-ve-logistika');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Xətti cəbr və riyazi analiz', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Xətti cəbr və riyazi analiz' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ehtimal nəzəriyyəsi və riyazi statistika', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ehtimal nəzəriyyəsi və riyazi statistika' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Sosial işdə riyazi metodlar', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Sosial işdə riyazi metodlar' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İnformatika', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İnformatika' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'IKT-baza kompüter bilikləri', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty placeholder; initial Latin I retained exactly from the source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'IKT-baza kompüter bilikləri' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İKT.', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty placeholder; trailing period retained exactly from the source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İKT.' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Neyrobiologiya', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Neyrobiologiya' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ekonometrika', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ekonometrika' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Ekologiya', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; explicit bachelor department list.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Ekologiya' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'SƏTƏMM', true, 'bachelor', 'https://aesma.edu.az/az/Post/Details/5866', 'Faculty not specified is a placeholder; abbreviation retained from the source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Əmək və Sosial Münasibətlər Akademiyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'SƏTƏMM' and c.source_url = 'https://aesma.edu.az/az/Post/Details/5866');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Xarici musiqi tarixi', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Xarici musiqi tarixi' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Musiqişünaslığa giriş', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Musiqişünaslığa giriş' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Polifoniya', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Polifoniya' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Musiqi əsərlərin təhlili', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; source wording retained without grammatical correction.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Musiqi əsərlərin təhlili' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Xüsusi pedaqoji hazırlıq', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Xüsusi pedaqoji hazırlıq' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Tarixi musiqişünaslıq', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Tarixi musiqişünaslıq' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Nəzəri musiqişünaslıq', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Nəzəri musiqişünaslıq' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Orkestr üslub tarixi', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Orkestr üslub tarixi' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Musiqi menecmenti', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; bachelor Musiqişünaslıq subject list; master''s subjects excluded.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Musiqi menecmenti' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Muasir musiqi', true, 'bachelor', 'https://conservatory.edu.az/kafedralar/', 'Faculty placeholder; apparent typo Muasir retained exactly from the source.'
from faculties f join universities u on u.id = f.university_id
where u.name = 'Azərbaycan Milli Konservatoriyası' and f.name = 'Faculty not specified'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Muasir musiqi' and c.source_url = 'https://conservatory.edu.az/kafedralar/');

commit;
