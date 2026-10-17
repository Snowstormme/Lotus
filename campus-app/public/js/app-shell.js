(function () {
  const main = document.querySelector('main');
  const legacyHeader = document.querySelector('.site-header');
  if (!main || document.querySelector('.app-shell')) return;

  const authActions = document.getElementById('auth-actions');
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
  logo.src = 'img/lotus-logo.svg';
  logo.alt = '';
  logo.className = 'shell-logo';
  sidebarBrand.appendChild(logo);
  const brandText = document.createElement('span');
  brandText.textContent = 'Lotus Campus';
  sidebarBrand.appendChild(brandText);
  sidebar.appendChild(sidebarBrand);

  const navItems = [
    { key: 'feed', label: 'Feed', href: 'feed.html', icon: 'feed' },
    { key: 'messages', label: 'Messages', href: 'messages.html', icon: 'messages' },
    { key: 'community', label: 'Community', href: 'groups.html', icon: 'community' },
    { key: 'courses', label: 'Courses', href: 'courses.html', icon: 'courses' },
    { key: 'schedule', label: 'Schedule', href: 'schedule.html', icon: 'schedule' },
    { key: 'ai', label: 'AI Assistant', href: 'assistant.html', icon: 'ai' },
    { key: 'events', label: 'Events', href: 'events.html', icon: 'events' },
    { key: 'todos', label: 'To-do', href: 'todos.html', icon: 'todo' },
    { key: 'profile', label: 'Profile', href: 'profile.html?id=1', icon: 'profile' }
  ];
  const moreItems = [
    { key: 'feed', label: 'Feed', href: 'feed.html' },
    { key: 'messages', label: 'Messages', href: 'messages.html' },
    { key: 'community', label: 'Community', href: 'groups.html' },
    { key: 'partners', label: 'Partners', href: 'partners.html?id=1' },
    { key: 'plan', label: 'Plan', href: 'plan.html?id=1' },
    { key: 'todos', label: 'To-do', href: 'todos.html' },
    { key: 'events', label: 'Events', href: 'events.html' }
  ];
  const sidebarMoreItems = [
    { key: 'partners', label: 'Partners', href: 'partners.html?id=1' },
    { key: 'plan', label: 'Plan', href: 'plan.html?id=1' }
  ];

  function getCurrentKey() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'index.html' || page === '') {
      if (window.location.hash === '#courses') return 'courses';
      if (window.location.hash === '#calendar') return 'schedule';
      return 'home';
    }
    if (page === 'plan.html') return 'ai';
    if (page === 'assistant.html') return 'ai';
    if (page === 'partners.html' || page === 'groups.html') return 'community';
    if (page === 'profile.html') return 'profile';
    if (page === 'schedule.html') return 'schedule';
    if (page === 'courses.html') return 'courses';
    if (page === 'course.html') return 'courses';
    if (page === 'feed.html') return 'feed';
    if (page === 'messages.html') return 'messages';
    if (page === 'todos.html') return 'todos';
    if (page === 'events.html') return 'events';
    return '';
  }

  function makeNavLink(item, className) {
    const link = document.createElement('a');
    link.className = className || 'shell-nav-link';
    link.href = item.href;
    link.dataset.pageName = item.label;
    if (item.icon || item.key) {
      const icon = document.createElement('svg');
      icon.className = 'nav-icon';
      icon.setAttribute('aria-hidden', 'true');
      const use = document.createElement('use');
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
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const currentKey = getCurrentKey();
    const samePage = (page === 'plan.html' && ['ai', 'plan'].includes(item.key)) ||
      (page === 'partners.html' && ['community', 'partners'].includes(item.key)) ||
      (page === 'groups.html' && item.key === 'community') ||
      (page === 'todos.html' && item.key === 'todos') ||
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
  navItems.filter(function (item) { return item.key !== 'profile'; }).forEach(function (item) { sidebarNav.appendChild(makeNavLink(item)); });
  sidebar.appendChild(sidebarNav);
  const moreTitle = document.createElement('h2');
  moreTitle.className = 'shell-nav-heading';
  moreTitle.textContent = 'More';
  const moreNav = document.createElement('nav');
  moreNav.className = 'shell-sidebar-nav shell-more-nav';
  moreNav.setAttribute('aria-label', 'More navigation');
  sidebarMoreItems.forEach(function (item) { moreNav.appendChild(makeNavLink(item)); });
  sidebar.append(moreTitle, moreNav);

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
  const topbar = document.createElement('div');
  topbar.className = 'shell-topbar';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'shell-search-wrap';
  const searchLabel = document.createElement('label');
  searchLabel.className = 'sr-only';
  searchLabel.htmlFor = 'shell-search';
  searchLabel.textContent = 'Search courses and pages';
  const search = document.createElement('input');
  search.id = 'shell-search';
  search.className = 'shell-search';
  search.type = 'search';
  search.placeholder = 'Search courses or pages';
  search.setAttribute('aria-label', 'Search courses and pages');
  const searchShortcut = document.createElement('span');
  searchShortcut.className = 'search-shortcut';
  searchShortcut.setAttribute('aria-hidden', 'true');
  searchShortcut.textContent = '⌘K';
  searchWrap.append(searchLabel, search, searchShortcut);

  const topActions = document.createElement('div');
  topActions.className = 'shell-top-actions';
  const universityButton = document.createElement('a');
  universityButton.className = 'icon-button topbar-university';
  universityButton.href = 'profile.html?id=1';
  universityButton.hidden = true;
  const universityBadge = document.createElement('span');
  universityBadge.className = 'university-topbar-badge';
  universityButton.appendChild(universityBadge);
  const avatar = document.createElement('a');
  avatar.className = 'icon-button topbar-avatar';
  avatar.href = 'profile.html?id=1';
  avatar.setAttribute('aria-label', 'Open profile');
  const avatarIcon = document.createElement('svg');
  avatarIcon.className = 'nav-icon';
  avatarIcon.setAttribute('aria-hidden', 'true');
  const avatarUse = document.createElement('use');
  avatarUse.setAttribute('href', 'img/icons.svg#profile');
  avatarIcon.appendChild(avatarUse);
  avatar.appendChild(avatarIcon);
  topActions.append(universityButton, avatar);
  if (authActions) {
    authActions.classList.add('shell-auth-actions');
    topActions.appendChild(authActions);
  }
  topbar.append(searchWrap, topActions);

  main.classList.add('app-main');
  workspace.append(topbar, main);
  shell.append(sidebar, workspace);
  if (legacyHeader) legacyHeader.remove();
  document.body.prepend(shell);

  const mobileBar = document.createElement('nav');
  mobileBar.className = 'mobile-bottom-bar';
  mobileBar.setAttribute('aria-label', 'Mobile navigation');
  navItems.filter(function (item) { return ['courses', 'schedule', 'ai', 'profile'].includes(item.key); }).forEach(function (item) {
  mobileBar.appendChild(makeNavLink(item, 'mobile-nav-link'));
  });
  const addButton = document.createElement('button');
  addButton.className = 'mobile-add-button';
  addButton.type = 'button';
  addButton.setAttribute('aria-label', 'Add placeholder');
  addButton.textContent = '+';
  mobileBar.appendChild(addButton);
  document.body.appendChild(mobileBar);

  const sheet = document.createElement('div');
  sheet.className = 'coming-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  const sheetCard = document.createElement('div');
  sheetCard.className = 'coming-sheet-card';
  const sheetTitle = document.createElement('h2');
  sheetTitle.className = 'card-title';
  sheetTitle.textContent = 'Coming soon';
  const sheetText = document.createElement('p');
  sheetText.className = 'muted';
  sheetText.textContent = 'This action will be available in a future phase.';
  const sheetNav = document.createElement('nav');
  sheetNav.className = 'shell-sidebar-nav coming-sheet-nav';
  sheetNav.setAttribute('aria-label', 'More navigation');
  moreItems.forEach(function (item) { sheetNav.appendChild(makeNavLink(item, 'shell-nav-link')); });
  const closeButton = document.createElement('button');
  closeButton.className = 'btn secondary';
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  sheetCard.append(sheetTitle, sheetText, sheetNav, closeButton);
  sheet.appendChild(sheetCard);
  document.body.appendChild(sheet);
  addButton.addEventListener('click', function () { sheet.hidden = false; closeButton.focus(); });
  closeButton.addEventListener('click', function () { sheet.hidden = true; addButton.focus(); });
  sheet.addEventListener('click', function (event) { if (event.target === sheet) sheet.hidden = true; });

  search.addEventListener('input', function () {
    const term = search.value.trim().toLowerCase();
    document.querySelectorAll('.shell-nav-link, .mobile-nav-link').forEach(function (link) {
      link.hidden = Boolean(term) && !link.textContent.toLowerCase().includes(term);
    });
    document.querySelectorAll('.table tbody tr').forEach(function (row) {
      row.hidden = Boolean(term) && !row.textContent.toLowerCase().includes(term);
    });
  });

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
      avatar.replaceChildren();
      avatar.classList.add('avatar-circle');
      avatar.textContent = initials || 'S';
      userName.textContent = name;
      const universityName = String(profile.university || '').trim();
      userUniversity.textContent = universityName || 'University not set';
      userCard.href = 'profile.html?id=1';
      if (universityName) {
        const universityWord = universityName.split(/\s+/).filter(Boolean)[0] || '';
        universityBadge.textContent = universityWord.slice(0, 3).toUpperCase();
        universityButton.title = universityName;
        universityButton.setAttribute('aria-label', universityName);
        universityButton.hidden = false;
        import('./university-logo.js').then(function (logos) {
          logos.renderUniversityLogo(universityBadge, universityName, profile.logo_url);
        }).catch(function () {});
      }
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
