(function () {
  const main = document.querySelector('main');
  const legacyHeader = document.querySelector('.site-header');
  if (!main || document.querySelector('.app-shell')) return;

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const sidebar = document.createElement('aside');
  sidebar.className = 'shell-sidebar';
  sidebar.setAttribute('aria-label', 'App navigation');
  const sidebarBrand = document.createElement('a');
  sidebarBrand.className = 'shell-brand';
  sidebarBrand.href = 'index.html';
  sidebarBrand.setAttribute('aria-label', 'Lotus Campus, home');
  const logo = document.createElement('img');
  logo.src = '/img/lotus-mark.svg';
  logo.alt = 'Lotus Campus';
  logo.width = 36;
  logo.height = 36;
  logo.className = 'shell-logo';
  sidebarBrand.appendChild(logo);
  const brandText = document.createElement('span');
  brandText.textContent = 'Lotus Campus';
  brandText.className = 'shell-wordmark';
  sidebarBrand.appendChild(brandText);
  sidebar.appendChild(sidebarBrand);

  const navItems = [
    { key: 'feed', label: 'Feed', href: 'feed.html', icon: 'feed' },
    { key: 'messages', label: 'Messages', href: 'messages.html', icon: 'messages' },
    { key: 'community', label: 'Groups', href: 'groups.html', icon: 'community' },
    { key: 'courses', label: 'Courses', href: 'courses.html', icon: 'courses' },
    { key: 'schedule', label: 'Schedule', href: 'schedule.html', icon: 'schedule' },
    { key: 'ai', label: 'AI Assistant', href: 'assistant.html', icon: 'ai' },
    { key: 'events', label: 'Events', href: 'events.html', icon: 'events' },
    { key: 'profile', label: 'Profile', href: 'profile.html?id=1', icon: 'profile' },
    { key: 'settings', label: 'Settings', href: 'settings.html', icon: 'settings' }
  ];
  function getCurrentKey() {
    const page = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') + '.html';
    if (page === 'index.html' || page === '') {
      if (window.location.hash === '#courses') return 'courses';
      if (window.location.hash === '#calendar') return 'schedule';
      return 'home';
    }
    if (page === 'settings.html') return 'settings';
    if (page === 'assistant.html') return 'ai';
    if (page === 'groups.html') return 'community';
    if (page === 'profile.html') return 'profile';
    if (page === 'schedule.html') return 'schedule';
    if (page === 'courses.html') return 'courses';
    if (page === 'course.html') return 'courses';
    if (page === 'feed.html') return 'feed';
    if (page === 'messages.html') return 'messages';
    if (page === 'events.html') return 'events';
    return '';
  }

  function makeNavLink(item, className) {
    const link = document.createElement('a');
    link.className = className || 'shell-nav-link';
    link.href = item.href;
    link.dataset.pageName = item.label;
    if (item.icon || item.key) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('class', 'nav-icon');
      icon.setAttribute('aria-hidden', 'true');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', 'img/icons.svg#' + (item.icon || item.key));
      icon.appendChild(use);
      link.appendChild(icon);
    }
    const label = document.createElement('span');
    label.textContent = item.label;
    link.appendChild(label);
    if (item.key === 'messages') {
      const badge = document.createElement('span');
      badge.className = 'unread-badge';
      badge.hidden = true;
      badge.dataset.unreadBadge = 'true';
      link.appendChild(badge);
    }
    const page = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') + '.html';
    const currentKey = getCurrentKey();
    const samePage = (page === 'groups.html' && item.key === 'community') ||
      (page === 'groups.html' && item.key === 'groups') ||
      (page === 'events.html' && item.key === 'events');
    if (item.key === currentKey || samePage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    return link;
  }

  const sidebarNav = document.createElement('nav');
  sidebarNav.className = 'shell-sidebar-nav';
  sidebarNav.setAttribute('aria-label', 'Primary navigation');
  navItems.forEach(function (item) { sidebarNav.appendChild(makeNavLink(item)); });
  sidebar.appendChild(sidebarNav);
  const sidebarNote = document.createElement('p');
  sidebarNote.className = 'shell-sidebar-note';
  sidebarNote.textContent = 'A little closer to your campus.';
  sidebar.appendChild(sidebarNote);

  const userCard = document.createElement('a');
  userCard.className = 'shell-user-card';
  userCard.href = 'login.html';
  const userAvatar = document.createElement('span');
  userAvatar.className = 'avatar-circle';
  userAvatar.textContent = '·';
  const userInfo = document.createElement('span');
  userInfo.className = 'shell-user-info';
  const userName = document.createElement('strong');
  userName.textContent = 'Log in';
  const userUniversity = document.createElement('span');
  userUniversity.className = 'muted';
  userUniversity.textContent = 'Sign in to view your profile';
  userInfo.append(userName, userUniversity);
  userCard.append(userAvatar, userInfo);
  sidebar.appendChild(userCard);

  const workspace = document.createElement('div');
  workspace.className = 'shell-workspace';
  main.classList.add('app-main');
  document.body.dataset.page = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  workspace.appendChild(main);
  shell.append(sidebar, workspace);
  if (legacyHeader) legacyHeader.remove();
  document.body.prepend(shell);

  const mobileBar = document.createElement('nav');
  mobileBar.className = 'mobile-bottom-bar';
  mobileBar.setAttribute('aria-label', 'Mobile navigation');
  navItems.filter(function (item) { return ['courses', 'schedule', 'ai', 'profile'].includes(item.key); }).forEach(function (item) {
  mobileBar.appendChild(makeNavLink(item, 'mobile-nav-link'));
  });
  const addLink = document.createElement('a');
  addLink.className = 'mobile-add-button';
  addLink.href = 'feed.html';
  addLink.setAttribute('aria-label', 'New post');
  addLink.textContent = '+';
  mobileBar.appendChild(addLink);
  document.body.appendChild(mobileBar);

  import('./auth.js').then(function (auth) {
    return auth.getSession();
  }).then(function (session) {
    if (!session) return null;
    fetch('/api/profile?id=1', { headers: { Authorization: 'Bearer ' + session.access_token } }).then(function (response) {
      if (!response.ok) return null;
      return response.json();
    }).then(function (profile) {
      if (!profile) return;
      const name = String(profile.name || 'Student').trim() || 'Student';
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0); }).join('').toUpperCase();
      userAvatar.textContent = initials || 'S';
      userName.textContent = name;
      const universityName = String(profile.university || '').trim();
      userUniversity.textContent = universityName || 'University not set';
      userCard.href = 'profile.html?id=1';
    }).catch(function () {});
    return fetch('/api/conversations', { headers: { Authorization: 'Bearer ' + session.access_token } });
  }).then(function (response) {
    if (!response || !response.ok) return null;
    return response.json();
  }).then(function (conversations) {
    if (!Array.isArray(conversations)) return;
    const unreadCount = conversations.filter(function (conversation) { return conversation.unread === true; }).length;
    if (unreadCount === 0) return;
    document.querySelectorAll('[data-unread-badge]').forEach(function (badge) {
      badge.hidden = false;
      badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    });
  }).catch(function () {
    // Unread counts are optional and must not block navigation.
  });

}());
