begin;

-- Batch 1 only. Existing universities are required; no university rows are created.
-- Review before running. Guards are rechecked against the database inside this transaction.
do $batch1_check$
begin
  if (select count(*) from universities where name = 'Bakı Dövlət Universiteti') <> 1
     or not exists (select 1 from universities where id = 2 and name = 'Bakı Dövlət Universiteti') then
    raise exception 'Batch 1 university lookup changed; regenerate the import.';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Dövlət İqtisad Universiteti') <> 1
     or not exists (select 1 from universities where id = 3 and name = 'Azərbaycan Dövlət İqtisad Universiteti') then
    raise exception 'Batch 1 university lookup changed; regenerate the import.';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Dövlət Neft və Sənaye Universiteti') <> 1
     or not exists (select 1 from universities where id = 4 and name = 'Azərbaycan Dövlət Neft və Sənaye Universiteti') then
    raise exception 'Batch 1 university lookup changed; regenerate the import.';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Dövlət Pedaqoji Universiteti') <> 1
     or not exists (select 1 from universities where id = 14 and name = 'Azərbaycan Dövlət Pedaqoji Universiteti') then
    raise exception 'Batch 1 university lookup changed; regenerate the import.';
  end if;
  if (select count(*) from universities where name = 'Azərbaycan Texniki Universiteti') <> 1
     or not exists (select 1 from universities where id = 25 and name = 'Azərbaycan Texniki Universiteti') then
    raise exception 'Batch 1 university lookup changed; regenerate the import.';
  end if;
  if (select count(*) from faculties where university_id = 2 and name = 'Jurnalistika fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'Maliyyə və mühasibat fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'İqtisadiyyat və idarəetmə fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'Rəqəmsal iqtisadiyyat fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'Biznes və menecment fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'Mühəndislik fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 3 and name = 'Türk dünyası iqtisad fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'Geoloji-kəşfiyyat fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'Qaz-neft-mədən fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'Kimya Texnologiya fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'Neft Mexanika fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'Energetika fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'İT və İdarəetmə fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 4 and name = 'İqtisadiyyat və Menecment fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'Filologiya') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'Riyaziyyat') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'Kimya və biologiya') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'Məktəbəqədər təhsil') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'İncəsənət və fiziki tərbiyə') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'Fizika') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 14 and name = 'İbtidai təhsil') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'İnformasiya texnologiyaları və telekommunikasiya fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'Sənaye iqtisadiyyatı və menecment fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'Xüsusi texnika və texnologiya fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'Maşınqayırma və metallurgiya fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'Nəqliyyat və logistika fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
  if (select count(*) from faculties where university_id = 25 and name = 'Energetika fakültəsi') > 1 then
    raise exception 'Batch 1 faculty lookup is ambiguous; review existing records.';
  end if;
end;
$batch1_check$;

insert into faculties (university_id, name)
select 2, 'Jurnalistika fakültəsi'
where not exists (select 1 from faculties where university_id = 2 and name = 'Jurnalistika fakültəsi');

insert into faculties (university_id, name)
select 3, 'Maliyyə və mühasibat fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'Maliyyə və mühasibat fakültəsi');

insert into faculties (university_id, name)
select 3, 'İqtisadiyyat və idarəetmə fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'İqtisadiyyat və idarəetmə fakültəsi');

insert into faculties (university_id, name)
select 3, 'Rəqəmsal iqtisadiyyat fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'Rəqəmsal iqtisadiyyat fakültəsi');

insert into faculties (university_id, name)
select 3, 'Biznes və menecment fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'Biznes və menecment fakültəsi');

insert into faculties (university_id, name)
select 3, 'Mühəndislik fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'Mühəndislik fakültəsi');

insert into faculties (university_id, name)
select 3, 'Türk dünyası iqtisad fakültəsi'
where not exists (select 1 from faculties where university_id = 3 and name = 'Türk dünyası iqtisad fakültəsi');

insert into faculties (university_id, name)
select 4, 'Geoloji-kəşfiyyat fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'Geoloji-kəşfiyyat fakültəsi');

insert into faculties (university_id, name)
select 4, 'Qaz-neft-mədən fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'Qaz-neft-mədən fakültəsi');

insert into faculties (university_id, name)
select 4, 'Kimya Texnologiya fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'Kimya Texnologiya fakültəsi');

insert into faculties (university_id, name)
select 4, 'Neft Mexanika fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'Neft Mexanika fakültəsi');

insert into faculties (university_id, name)
select 4, 'Energetika fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'Energetika fakültəsi');

insert into faculties (university_id, name)
select 4, 'İT və İdarəetmə fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'İT və İdarəetmə fakültəsi');

insert into faculties (university_id, name)
select 4, 'İqtisadiyyat və Menecment fakültəsi'
where not exists (select 1 from faculties where university_id = 4 and name = 'İqtisadiyyat və Menecment fakültəsi');

insert into faculties (university_id, name)
select 14, 'Filologiya'
where not exists (select 1 from faculties where university_id = 14 and name = 'Filologiya');

insert into faculties (university_id, name)
select 14, 'Riyaziyyat'
where not exists (select 1 from faculties where university_id = 14 and name = 'Riyaziyyat');

insert into faculties (university_id, name)
select 14, 'Kimya və biologiya'
where not exists (select 1 from faculties where university_id = 14 and name = 'Kimya və biologiya');

insert into faculties (university_id, name)
select 14, 'Məktəbəqədər təhsil'
where not exists (select 1 from faculties where university_id = 14 and name = 'Məktəbəqədər təhsil');

insert into faculties (university_id, name)
select 14, 'İncəsənət və fiziki tərbiyə'
where not exists (select 1 from faculties where university_id = 14 and name = 'İncəsənət və fiziki tərbiyə');

insert into faculties (university_id, name)
select 14, 'Fizika'
where not exists (select 1 from faculties where university_id = 14 and name = 'Fizika');

insert into faculties (university_id, name)
select 14, 'İbtidai təhsil'
where not exists (select 1 from faculties where university_id = 14 and name = 'İbtidai təhsil');

insert into faculties (university_id, name)
select 25, 'İnformasiya texnologiyaları və telekommunikasiya fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'İnformasiya texnologiyaları və telekommunikasiya fakültəsi');

insert into faculties (university_id, name)
select 25, 'Sənaye iqtisadiyyatı və menecment fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'Sənaye iqtisadiyyatı və menecment fakültəsi');

insert into faculties (university_id, name)
select 25, 'Xüsusi texnika və texnologiya fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'Xüsusi texnika və texnologiya fakültəsi');

insert into faculties (university_id, name)
select 25, 'Maşınqayırma və metallurgiya fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'Maşınqayırma və metallurgiya fakültəsi');

insert into faculties (university_id, name)
select 25, 'Nəqliyyat və logistika fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'Nəqliyyat və logistika fakültəsi');

insert into faculties (university_id, name)
select 25, 'Energetika fakültəsi'
where not exists (select 1 from faculties where university_id = 25 and name = 'Energetika fakültəsi');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İnformasiya janrları və xəbər jurnalistikası', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İnformasiya janrları və xəbər jurnalistikası' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Fotojurnalistika', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Fotojurnalistika' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'İnformasiya texnologiyaları', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'İnformasiya texnologiyaları' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Yeni media və kommunikasiya nəzəriyyələri', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Yeni media və kommunikasiya nəzəriyyələri' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Медиаграмотность', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Russian-language title retained from the official source.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Медиаграмотность' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Analityc journalism', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Source spelling; likely intended as Analytic journalism.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Analityc journalism' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Araşdırma jurnalistikası', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Araşdırma jurnalistikası' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Media savadlılığı', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Media savadlılığı' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Jurnalist etikası və kommunikasiya mədəniyyəti', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Jurnalist etikası və kommunikasiya mədəniyyəti' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Економика медиа', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Russian-language title retained from the official source.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Економика медиа' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Практическая работа в газете', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Russian-language title retained from the official source.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Практическая работа в газете' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'New media and communication theories', true, 'bachelor', 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv', 'Bachelor syllabus listing.'
from faculties f where f.university_id = 2 and f.name = 'Jurnalistika fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'New media and communication theories' and c.source_url = 'https://journalism.bdu.info.az/tehsil/tedris-proqramlari-yeni-m-bklv');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Dövlət maliyyəsi', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; Maliyyə bachelor program.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Dövlət maliyyəsi' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Korporativ maliyyə', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; Maliyyə bachelor program.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Korporativ maliyyə' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Maliyyə bazarları', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; Maliyyə bachelor program.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Maliyyə bazarları' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Maliyyə risklərinin idarəedilməsi', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; spelling retained.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Maliyyə risklərinin idarəedilməsi' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Vergitutma', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; Maliyyə bachelor program.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Vergitutma' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, '', 'Maliyyə menecmenti', true, 'bachelor', 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf', 'Printed page 63; Maliyyə bachelor program.'
from faculties f where f.university_id = 3 and f.name = 'Maliyyə və mühasibat fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Maliyyə menecmenti' and c.source_url = 'https://unec.edu.az/application/uploads/2024/11/UNEC_Kataloq_11_2024_tedris_planli.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ENG1101', 'English I', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'English I' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'MATH101', 'Calculus I', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Calculus I' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'OGEN1101', 'Intro to Petroleum Engineering', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Intro to Petroleum Engineering' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'CHEM1101', 'General Chemistry I', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'General Chemistry I' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'LAB1101', 'Introduction to Laboratory Safety & Hazardous Materials', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Introduction to Laboratory Safety & Hazardous Materials' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ECON1101', 'Industrial Economics & Finance', true, 'bachelor', 'https://asoiu.edu.az/upload/Short_information.pdf', 'Oil and Gas Engineering; first-year curriculum.'
from faculties f where f.university_id = 4 and f.name = 'Qaz-neft-mədən fakültəsi'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Industrial Economics & Finance' and c.source_url = 'https://asoiu.edu.az/upload/Short_information.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'ÜF-B02', 'Azərbaycan dilində işgüzar və akademik kommunikasiya', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Azərbaycan dilində işgüzar və akademik kommunikasiya' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'İF-B05', 'Dilçiliyə giriş', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Dilçiliyə giriş' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'İF-B06.1', 'Müasir Azərbaycan dili - 1', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Müasir Azərbaycan dili - 1' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'İF-B06.2', 'Müasir Azərbaycan dili - 2', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Müasir Azərbaycan dili - 2' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'İF-B06.3', 'Müasir Azərbaycan dili - 3', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Müasir Azərbaycan dili - 3' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

insert into courses (faculty_id, code, name, is_catalog, level, source_url, source_note)
select f.id, 'İF-B06.4', 'Müasir Azərbaycan dili - 4', true, 'bachelor', 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf', 'Azərbaycan dili və ədəbiyyatı müəllimliyi program.'
from faculties f where f.university_id = 14 and f.name = 'Filologiya'
and not exists (select 1 from courses c where c.faculty_id = f.id and c.name = 'Müasir Azərbaycan dili - 4' and c.source_url = 'https://adpu.edu.az/images/adpu_files/tedris/telim-neticeleri/filologiya/azerbaycan-dili-ve-edebiyyat-ixtisasi-uzre-fenlerin-telim-neticeleri.pdf');

commit;
