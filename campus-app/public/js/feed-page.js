
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
        const meta = document.createElement('div');
        meta.className = 'feed-post-meta';
        addText(meta, 'strong', String(post.author_name || 'Student'));
        addText(meta, 'span', 'Year ' + String(post.author_year || '—'), 'muted');
        if (post.is_sample === true) addText(meta, 'span', 'Sample', 'badge');
        const messageButton = document.createElement('button');
        messageButton.className = 'btn secondary';
        messageButton.type = 'button';
        messageButton.textContent = 'Message';
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
        header.appendChild(avatar);
        header.appendChild(meta);
        addText(header, 'time', formatBakuDateTime(post.created_at) || 'Time unavailable', 'muted');
        const message = addText(item, 'p', String(post.body || ''), 'feed-post-body');
        message.setAttribute('aria-label', 'Post text');
        const actions = document.createElement('div');
        actions.className = 'post-actions';
        const likeButton = document.createElement('button');
        likeButton.className = 'btn secondary';
        likeButton.type = 'button';
        likeButton.textContent = (post.liked_by_me ? 'Unlike' : 'Like') + ' (' + String(post.like_count || 0) + ')';
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
            likeButton.textContent = (post.liked_by_me ? 'Unlike' : 'Like') + ' (' + String(post.like_count) + ')';
            likeButton.setAttribute('aria-label', (post.liked_by_me ? 'Unlike' : 'Like') + ' post, ' + String(post.like_count) + ' likes');
          } catch (error) {
            showStatus(postStatus, error.message || 'Could not update the like.', 'error');
          } finally {
            likeButton.disabled = false;
          }
        });
        const reportButton = document.createElement('button');
        reportButton.className = 'btn secondary';
        reportButton.type = 'button';
        reportButton.textContent = 'Report';
        const reportOptions = document.createElement('div');
        reportButton.addEventListener('click', function () { renderReportOptions(post, reportOptions); });
        actions.append(messageButton, likeButton, reportButton);
        item.append(header, message, actions, reportOptions);
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
        await loadPosts();
      } catch (error) {
        window.location.replace('login.html');
      }
    }

    init();

