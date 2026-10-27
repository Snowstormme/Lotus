import { icon } from './ui.js';

    import { getSession } from './auth.js';
    let session = null;
    let groups = [];
    const kindNames = { university: 'University', course: 'Course', club: 'Club' };
    function message(container, text, error) { container.replaceChildren(); const node = document.createElement('p'); node.className = error ? 'alert error' : 'empty-state'; node.textContent = text; container.appendChild(node); }
    function errorText(response, fallback) { return response.json().then((body) => body && typeof body.error === 'string' ? body.error : fallback).catch(() => fallback); }
    function headers() { return { Authorization: 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }; }
    function groupKind(group) { return kindNames[group.kind] || String(group.kind || 'Group'); }
    function updateMembership(group, button) { const restricted = !group.is_member && group.can_join === false; button.textContent = restricted ? 'Members of this university only' : group.is_member ? 'Leave' : 'Join'; button.disabled = restricted; button.title = restricted ? 'University affiliation is based on your profile.' : ''; button.setAttribute('aria-label', restricted ? 'Joining is limited to students who selected this university in their profile' : (group.is_member ? 'Leave ' : 'Join ') + String(group.name || 'group')); }
    async function changeMembership(group, button) { button.disabled = true; const response = await fetch('/api/groups', { method: 'POST', headers: headers(), body: JSON.stringify({ action: group.is_member ? 'leave' : 'join', group_id: group.id }) }); if (!response.ok) { document.getElementById('groups-status').className = 'alert error'; document.getElementById('groups-status').textContent = await errorText(response, 'Could not update group membership.'); button.disabled = false; return; } const body = await response.json(); group.is_member = body.is_member === true; group.member_count = body.member_count; updateMembership(group, button); renderGroups(); }
    function groupCard(group) {
      const card = document.createElement('article');
      card.className = 'card group-card'; card.tabIndex = 0; card.setAttribute('role', 'link');
      const open = () => { window.location.href = 'groups.html?id=' + encodeURIComponent(group.id); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.target !== card) return;
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
      const top = document.createElement('div'); top.className = 'group-card-top';
      const mark = document.createElement('span'); mark.className = 'group-mark group-mark-' + (['university', 'course', 'club'].includes(group.kind) ? group.kind : 'club');
      mark.appendChild(icon(group.kind === 'course' ? 'courses' : 'community'));
      top.append(mark, text('span', groupKind(group), 'badge'));
      if (group.is_sample) top.appendChild(text('span', 'Sample', 'badge'));
      const footer = document.createElement('div'); footer.className = 'group-card-footer';
      const members = document.createElement('span'); members.className = 'group-member-count muted';
      members.append(icon('community'), text('span', String(group.member_count) + ' member' + (group.member_count === 1 ? '' : 's')));
      const button = document.createElement('button'); button.type = 'button';
      button.className = 'btn ' + (group.is_member ? 'secondary' : 'primary'); updateMembership(group, button);
      button.addEventListener('click', event => { event.stopPropagation(); changeMembership(group, button); });
      footer.append(members, button);
      card.append(top, text('h2', group.name || 'Group', 'card-title'), text('p', group.description || 'No description.', 'group-description'), footer);
      return card;
    }
    function text(tag, value, className) { const node = document.createElement(tag); if (className) node.className = className; node.textContent = value == null ? '' : String(value); return node; }
    function renderGroups() { const target = document.getElementById('groups-list'); const search = document.getElementById('group-search').value.trim().toLowerCase(); const kind = document.getElementById('group-kind').value; const filtered = groups.filter((group) => (!search || String(group.name || '').toLowerCase().includes(search) || String(group.description || '').toLowerCase().includes(search)) && (kind === 'all' || group.kind === kind)); if (!filtered.length) { message(target, 'No groups match your search.'); return; } target.replaceChildren(); const grid = document.createElement('div'); grid.className = 'groups-grid'; filtered.forEach((group) => grid.appendChild(groupCard(group))); target.appendChild(grid); }
    function renderDetail(group) { const target = document.getElementById('group-detail-content'); target.replaceChildren(); const heading = document.createElement('div'); heading.className = 'section-heading'; heading.appendChild(text('h1', group.name || 'Group', 'card-title')); if (group.is_sample) heading.appendChild(text('span', 'Sample', 'badge')); target.appendChild(heading); target.appendChild(text('p', groupKind(group), 'badge')); target.appendChild(text('p', group.description || 'No description.', 'group-description')); target.appendChild(text('p', String(group.member_count) + ' member' + (group.member_count === 1 ? '' : 's'), 'muted')); const button = document.createElement('button'); button.type = 'button'; button.className = 'btn secondary'; updateMembership(group, button); button.addEventListener('click', () => changeMembership(group, button)); target.appendChild(button); }
    async function loadDetail(id) { document.getElementById('groups-list-view').hidden = true; document.getElementById('group-detail-view').hidden = false; const target = document.getElementById('group-detail-content'); try { const response = await fetch('/api/groups?id=' + encodeURIComponent(id), { headers: headers() }); if (response.status === 404) { message(target, 'Group not found.', true); return; } if (!response.ok) throw new Error('Group request failed'); renderDetail(await response.json()); } catch (error) { console.error('Could not load group:', error); message(target, 'Could not load this group.', true); } }
    async function loadGroups() { const status = document.getElementById('groups-status'); try { const response = await fetch('/api/groups', { headers: headers() }); if (!response.ok) throw new Error('Groups request failed'); groups = await response.json(); status.textContent = 'Groups loaded.'; status.className = 'alert success'; renderGroups(); } catch (error) { console.error('Could not load groups:', error); status.textContent = 'Could not load groups.'; status.className = 'alert error'; message(document.getElementById('groups-list'), 'Could not load groups.', true); } }
    document.getElementById('group-search').addEventListener('input', renderGroups); document.getElementById('group-kind').addEventListener('change', renderGroups);
    document.getElementById('create-group-form').addEventListener('submit', async (event) => { event.preventDefault(); const button = document.getElementById('create-group-button'); const status = document.getElementById('create-group-status'); button.disabled = true; status.className = 'alert info'; status.textContent = 'Creating group...'; const response = await fetch('/api/groups', { method: 'POST', headers: headers(), body: JSON.stringify({ action: 'create', name: document.getElementById('create-group-name').value.trim(), description: document.getElementById('create-group-description').value, kind: 'club' }) }); if (!response.ok) { status.className = 'alert error'; status.textContent = await errorText(response, 'Could not create the group.'); button.disabled = false; return; } document.getElementById('create-group-form').reset(); status.className = 'alert success'; status.textContent = 'Group created.'; button.disabled = false; await loadGroups(); });
    try { session = await getSession(); if (!session) { window.location.replace('login.html'); } else { const id = new URLSearchParams(window.location.search).get('id'); if (id) await loadDetail(id); else await loadGroups(); } } catch (error) { console.error('Could not initialize groups:', error); document.getElementById('groups-status').textContent = 'Could not load groups.'; document.getElementById('groups-status').className = 'alert error'; }

