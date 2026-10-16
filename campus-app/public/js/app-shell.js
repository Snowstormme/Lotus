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
  sidebarBrand.textContent = 'Lotus Campus';
  sidebar.appendChild(sidebarBrand);

  const navItems = [
    { key: 'home', label: 'Home', href: 'index.html' },
    { key: 'courses', label: 'Courses', href: 'courses.html' },
    { key: 'schedule', label: 'Schedule', href: 'schedule.html' },
    { key: 'ai', label: 'AI Assistant', href: 'assistant.html' },
    { key: 'feed', label: 'Feed', href: 'feed.html' },
    { key: 'messages', label: 'Messages', href: 'messages.html' },
    { key: 'community', label: 'Community', href: 'partners.html?id=1' },
    { key: 'profile', label: 'Profile', href: 'profile.html?id=1' }
  ];
  const moreItems = [
    { key: 'partners', label: 'Partners', href: 'partners.html?id=1' },
    { key: 'plan', label: 'Plan', href: 'plan.html?id=1' },
    { key: 'cost', label: 'Cost', href: 'cost.html' }
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
    if (page === 'partners.html') return 'community';
    if (page === 'profile.html') return 'profile';
    if (page === 'schedule.html') return 'schedule';
    if (page === 'courses.html') return 'courses';
    if (page === 'course.html') return 'courses';
    if (page === 'feed.html') return 'feed';
    if (page === 'messages.html') return 'messages';
    return '';
  }

  function makeNavLink(item, className) {
    const link = document.createElement('a');
    link.className = className || 'shell-nav-link';
    link.href = item.href;
    link.dataset.pageName = item.label;
    link.textContent = item.label;
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
      (page === 'cost.html' && item.key === 'cost');
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
  const moreTitle = document.createElement('h2');
  moreTitle.className = 'shell-nav-heading';
  moreTitle.textContent = 'More';
  const moreNav = document.createElement('nav');
  moreNav.className = 'shell-sidebar-nav shell-more-nav';
  moreNav.setAttribute('aria-label', 'More navigation');
  moreItems.forEach(function (item) { moreNav.appendChild(makeNavLink(item)); });
  sidebar.append(moreTitle, moreNav);

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
  searchWrap.append(searchLabel, search);

  const topActions = document.createElement('div');
  topActions.className = 'shell-top-actions';
  const notifications = document.createElement('button');
  notifications.className = 'icon-button';
  notifications.type = 'button';
  notifications.setAttribute('aria-label', 'Notifications placeholder');
  notifications.textContent = 'Notifications';
  const avatar = document.createElement('button');
  avatar.className = 'icon-button';
  avatar.type = 'button';
  avatar.setAttribute('aria-label', 'Avatar placeholder');
  avatar.textContent = 'Avatar';
  topActions.append(notifications, avatar);
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
  navItems.filter(function (item) { return ['home', 'courses', 'schedule', 'ai', 'feed', 'messages', 'profile'].includes(item.key); }).forEach(function (item) {
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
