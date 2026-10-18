
    import { getSession } from './auth.js';
    import { formatBakuDateTime } from './dates.js';

    const form = document.getElementById('post-form');
    const bodyInput = document.getElementById('post-body');
    const counter = document.getElementById('post-counter');
    const postSubmit = document.getElementById('post-submit');
    const postStatus = document.getElementById('post-status');
    const feedStatus = document.getElementById('feed-status');
    const feedList = document.getElementById('feed-list');
    const refreshButton = document.getElementById('refresh-feed');
    const feedEventsStatus = document.getElementById('feed-events-status');
    const feedEventsList = document.getElementById('feed-events-list');
    let session;

    function showStatus(container, message, kind) {
      container.textContent = message;
      container.className = kind ? 'alert ' + kind : 'empty-state';
    }

    function updateCounter() {
      counter.textContent = String(bodyInput.value.length) + '/500';
    }

    function addText(parent, tag, text, className) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      element.textContent = text;
      parent.appendChild(element);
      return element;
    }

    function addIcon(parent, symbol) {
      const icon = document.createElement('svg');
      icon.className = 'nav-icon';
      icon.setAttribute('aria-hidden', 'true');
      const use = document.createElement('use');
      use.setAttribute('href', 'img/icons.svg#' + symbol);
      icon.appendChild(use);
      parent.appendChild(icon);
      return icon;
    }

    function renderEvents(events) {
      feedEventsList.replaceChildren();
      events.slice(0, 3).forEach(function (event) {
        const item = document.createElement('li');
        item.className = 'feed-event-row';
        const link = document.createElement('a');
        link.href = 'events.html?id=' + encodeURIComponent(event.id);
        const date = new Date(event.starts_at);
        addText(link, 'strong', new Intl.DateTimeFormat('en', { timeZone: 'Asia/Baku', month: 'short', day: 'numeric' }).format(date), 'feed-event-date');
        const details = document.createElement('span');
        details.className = 'feed-event-details';
        addText(details, 'strong', String(event.title || 'Event'));
        addText(details, 'span', String(event.organizer_name || 'Campus'), 'muted');
        addText(details, 'span', formatBakuDateTime(event.starts_at) || 'Time unavailable', 'muted');
        addText(details, 'span', String(event.rsvp_count || 0) + ' going', 'muted');
        if (event.is_sample === true) addText(details, 'span', 'Sample', 'badge');
        link.appendChild(details);
        item.appendChild(link);
        feedEventsList.appendChild(item);
      });
    }

    async function loadEvents() {
      feedEventsStatus.textContent = 'Loading upcoming events...';
      feedEventsStatus.className = 'alert info';
      try {
        const response = await fetch('/api/events', { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await response.json().catch(function () { return []; });
        if (!response.ok) throw new Error(body.error || 'Could not load events.');
        const events = Array.isArray(body) ? body : [];
        if (!events.length) {
          showStatus(feedEventsStatus, 'No upcoming events yet. Check back soon.', '');
          return;
        }
        feedEventsStatus.replaceChildren();
        feedEventsStatus.className = 'empty-state';
        renderEvents(events);
      } catch (error) {
        feedEventsList.replaceChildren();
        showStatus(feedEventsStatus, error.message || 'Could not load events.', 'error');
      }
    }

    function renderReportOptions(post, container) {
      container.replaceChildren();
      const field = document.createElement('div');
      field.className = 'field';
      const label = document.createElement('label');
      label.htmlFor = 'report-reason-' + post.id;
      label.textContent = 'Reason';
      const select = document.createElement('select');
      select.id = label.htmlFor;
      select.setAttribute('aria-label', 'Report reason');
      ['spam', 'harassment', 'misinformation', 'other'].forEach(function (reason) {
        const option = document.createElement('option');
        option.value = reason;
        option.textContent = reason;
        select.appendChild(option);
      });
      field.append(label, select);
      const send = document.createElement('button');
      send.className = 'btn danger';
      send.type = 'button';
      send.textContent = 'Send report';
      const cancel = document.createElement('button');
      cancel.className = 'btn secondary';
      cancel.type = 'button';
      cancel.textContent = 'Cancel';
      send.addEventListener('click', async function () {
        if (!window.confirm('Report this post?')) return;
        send.disabled = true;
        try {
          const response = await fetch('/api/post-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
            body: JSON.stringify({ post_id: post.id, reason: select.value })
          });
          const body = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(body.error || 'Could not report the post.');
          container.textContent = body.message || 'Thanks, this post was reported.';
          container.className = 'alert success';
        } catch (error) {
          container.textContent = error.message || 'Could not report the post.';
          container.className = 'alert error';
          send.disabled = false;
        }
      });
      cancel.addEventListener('click', function () { container.replaceChildren(); });
      container.className = 'report-options';
      container.append(field, send, cancel);
    }

    function renderPosts(posts) {
      feedList.replaceChildren();
      posts.forEach(function (post) {
        const item = document.createElement('li');
        item.className = 'card feed-post';
        const header = document.createElement('div');
        header.className = 'feed-post-header';
        const avatar = document.createElement('span');
        avatar.className = 'avatar-circle feed-avatar';
        const authorName = String(post.author_name || 'Student');
        avatar.textContent = authorName.split(/\s+/).map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase() || 'S';
        avatar.setAttribute('aria-hidden', 'true');
        const author = document.createElement('div');
        author.className = 'feed-post-author';
        const meta = document.createElement('div');
        meta.className = 'feed-post-meta';
        addText(meta, 'strong', String(post.author_name || 'Student'));
        const secondary = document.createElement('span');
        secondary.className = 'feed-post-secondary muted';
        if (post.author_university) {
          addText(secondary, 'span', String(post.author_university));
        } else if (post.author_year) {
          addText(secondary, 'span', 'Year ' + String(post.author_year));
        }
        addText(secondary, 'span', formatBakuDateTime(post.created_at) || 'Time unavailable');
        meta.appendChild(secondary);
        if (post.is_sample === true) addText(meta, 'span', 'Sample', 'badge');
        const messageButton = document.createElement('button');
        messageButton.className = 'btn secondary feed-message-button';
        messageButton.type = 'button';
        addIcon(messageButton, 'messages');
        messageButton.appendChild(document.createTextNode('Message'));
        messageButton.addEventListener('click', async function () {
          messageButton.disabled = true;
          try {
            const response = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ contact_token: post.contact_token }) });
            const body = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(body.error || 'Could not start the conversation.');
            window.location.href = 'messages.html?conversation_id=' + encodeURIComponent(body.conversation_id);
          } catch (error) {
            showStatus(postStatus, error.message || "You can't message this student.", 'error');
            messageButton.disabled = false;
          }
        });
        author.append(avatar, meta, messageButton);
        header.appendChild(author);
        const menu = document.createElement('div');
        menu.className = 'feed-post-menu';
        const reportButton = document.createElement('button');
        reportButton.className = 'icon-button';
        reportButton.type = 'button';
        reportButton.setAttribute('aria-label', 'Report post');
        reportButton.title = 'Report post';
        addIcon(reportButton, 'more-options');
        const reportOptions = document.createElement('div');
        reportButton.addEventListener('click', function () { renderReportOptions(post, reportOptions); });
        menu.append(reportButton, reportOptions);
        header.appendChild(menu);
        const message = addText(item, 'p', String(post.body || ''), 'feed-post-body');
        message.setAttribute('aria-label', 'Post text');
        if (typeof post.image_url === 'string' && /^https?:\/\//i.test(post.image_url)) {
          const image = document.createElement('img');
          image.className = 'feed-post-image';
          image.src = post.image_url;
          image.alt = 'Post image';
          image.loading = 'lazy';
          item.appendChild(image);
        }
        const actions = document.createElement('div');
        actions.className = 'post-actions';
        const likeButton = document.createElement('button');
        likeButton.className = 'btn secondary feed-action-button';
        likeButton.type = 'button';
        const likeIcon = addText(likeButton, 'span', '♥', 'feed-action-glyph');
        likeIcon.setAttribute('aria-hidden', 'true');
        const likeCount = addText(likeButton, 'span', String(post.like_count || 0));
        likeButton.setAttribute('aria-label', (post.liked_by_me ? 'Unlike' : 'Like') + ' post, ' + String(post.like_count || 0) + ' likes');
        likeButton.addEventListener('click', async function () {
          likeButton.disabled = true;
          try {
            const response = await fetch('/api/post-like', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
              body: JSON.stringify({ post_id: post.id })
            });
            const body = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(body.error || 'Could not update the like.');
            post.liked_by_me = body.liked_by_me === true;
            post.like_count = Number(body.like_count) || 0;
            likeCount.textContent = String(post.like_count);
            likeButton.setAttribute('aria-label', (post.liked_by_me ? 'Unlike' : 'Like') + ' post, ' + String(post.like_count) + ' likes');
          } catch (error) {
            showStatus(postStatus, error.message || 'Could not update the like.', 'error');
          } finally {
            likeButton.disabled = false;
          }
        });
        const commentButton = document.createElement('button');
        commentButton.className = 'btn secondary feed-action-button feed-action-disabled';
        commentButton.type = 'button';
        commentButton.disabled = true;
        commentButton.setAttribute('aria-disabled', 'true');
        const commentCount = Number.isFinite(Number(post.comment_count)) ? Math.max(0, Number(post.comment_count)) : 0;
        addIcon(commentButton, 'messages');
        addText(commentButton, 'span', String(commentCount));
        commentButton.setAttribute('aria-label', 'Comments, ' + String(commentCount) + ', unavailable');
        const shareButton = document.createElement('button');
        shareButton.className = 'btn secondary feed-action-button feed-action-disabled';
        shareButton.type = 'button';
        shareButton.disabled = true;
        shareButton.setAttribute('aria-disabled', 'true');
        const shareIcon = addText(shareButton, 'span', '↗', 'feed-action-glyph');
        shareIcon.setAttribute('aria-hidden', 'true');
        addText(shareButton, 'span', 'Share');
        shareButton.setAttribute('aria-label', 'Share post, unavailable');
        actions.append(likeButton, commentButton, shareButton);
        item.append(header, message, actions);
        feedList.appendChild(item);
      });
    }

    async function loadPosts() {
      showStatus(feedStatus, 'Loading posts...', 'info');
      try {
        const response = await fetch('/api/posts', { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not load the feed.');
        const posts = Array.isArray(body) ? body : [];
        if (posts.length === 0) {
          feedList.replaceChildren();
          showStatus(feedStatus, 'No posts yet. Start the conversation.', '');
          return;
        }
        feedStatus.replaceChildren();
        feedStatus.className = 'empty-state';
        renderPosts(posts);
      } catch (error) {
        feedList.replaceChildren();
        showStatus(feedStatus, error.message || 'Could not load the feed.', 'error');
      }
    }

    async function init() {
      try {
        session = await getSession();
        if (!session) {
          window.location.replace('login.html');
          return;
        }
        bodyInput.addEventListener('input', updateCounter);
        form.addEventListener('submit', async function (event) {
          event.preventDefault();
          const text = bodyInput.value.trim();
          if (!text || text.length > 500) {
            showStatus(postStatus, 'Post text must be between 1 and 500 characters.', 'error');
            return;
          }
          postSubmit.disabled = true;
          showStatus(postStatus, 'Posting...', 'info');
          try {
            const response = await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token },
              body: JSON.stringify({ body: text })
            });
            const body = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(body.error || 'Could not create the post.');
            bodyInput.value = '';
            updateCounter();
            showStatus(postStatus, 'Post created.', 'success');
            await loadPosts();
          } catch (error) {
            showStatus(postStatus, error.message || 'Could not create the post.', 'error');
          } finally {
            postSubmit.disabled = false;
          }
        });
        refreshButton.addEventListener('click', loadPosts);
        await Promise.all([loadPosts(), loadEvents()]);
      } catch (error) {
        window.location.replace('login.html');
      }
    }

    init();

