begin;

-- Serialize this seed so concurrent runs cannot create duplicate groups.
lock table groups in share row exclusive mode;

insert into groups (name, description, kind, university_id)
select u.name,
       'Student community for ' || u.name || '. University affiliation is self-reported; this group does not imply university endorsement.',
       'university', u.id
from universities u
where not exists (
  select 1 from groups g where g.kind = 'university' and g.university_id = u.id
);

commit;
