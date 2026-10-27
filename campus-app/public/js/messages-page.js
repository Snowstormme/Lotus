import { initials } from './ui.js';

    import { getSession } from './auth.js';
    import { formatBakuDateTime } from './dates.js';

    const layout = document.getElementById('messages-layout');
    const conversationStatus = document.getElementById('conversation-status');
    const conversationList = document.getElementById('conversation-list');
    const threadTitle = document.getElementById('thread-title');
    const threadPerson = document.getElementById('thread-person');
    const threadStatus = document.getElementById('thread-status');
    const threadMessages = document.getElementById('thread-messages');
    const messageBody = document.getElementById('message-body');
    const messageCounter = document.getElementById('message-counter');
    const sendButton = document.getElementById('send-button');
    const messageStatus = document.getElementById('message-status');
    const blockButton = document.getElementById('block-button');
    const reportButton = document.getElementById('report-button');
    const reportOptions = document.getElementById('report-options');
    const threadActionStatus = document.getElementById('thread-action-status');
    let session;
    let currentConversation = null;
    let pollTimer = null;

    function showStatus(container, message, kind) {
      container.textContent = message;
      container.className = kind ? 'alert ' + kind : 'empty-state';
    }

    function updateCounter() {
      messageCounter.textContent = String(messageBody.value.length) + '/1000';
    }

    function setThreadEnabled(enabled) {
      messageBody.disabled = !enabled;
      sendButton.disabled = !enabled;
      blockButton.disabled = !enabled;
      reportButton.disabled = !enabled;
    }

    function renderConversations(conversations) {
      conversationList.replaceChildren();
      conversations.forEach(function (conversation) {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'conversation-item';
        if (currentConversation && currentConversation.id === conversation.id) button.classList.add('active');
        const header = document.createElement('div');
        header.className = 'conversation-item-header';
        const name = document.createElement('strong');
        name.textContent = String(conversation.other_person_name || 'Student');
        header.appendChild(name);
        if (conversation.unread === true) {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = 'New';
          header.appendChild(badge);
        }
        const preview = document.createElement('span');
        preview.className = 'muted conversation-preview';
        preview.textContent = String(conversation.last_message_preview || 'No messages yet.');
        const time = document.createElement('time');
        time.className = 'muted';
        time.textContent = conversation.last_message_at ? formatBakuDateTime(conversation.last_message_at) : '';
        const avatar = document.createElement('span'); avatar.className = 'avatar-circle conversation-avatar'; avatar.textContent = initials(conversation.other_person_name); avatar.setAttribute('aria-hidden', 'true');
        const content = document.createElement('span'); content.className = 'conversation-content'; content.append(header, preview, time);
        button.append(avatar, content);
        button.addEventListener('click', function () { openConversation(conversation); });
        item.appendChild(button);
        conversationList.appendChild(item);
      });
    }

    async function loadConversations(selectId) {
      showStatus(conversationStatus, 'Loading conversations...', 'info');
      try {
        const response = await fetch('/api/conversations', { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not load conversations.');
        const conversations = Array.isArray(body) ? body : [];
        if (conversations.length === 0) {
          conversationList.replaceChildren();
          showStatus(conversationStatus, 'No conversations yet.', '');
          return;
        }
        showStatus(conversationStatus, '', '');
        renderConversations(conversations);
        const selected = conversations.find(function (conversation) { return conversation.id === selectId; }) || conversations[0];
        if (selected && (!currentConversation || currentConversation.id !== selected.id || selectId)) await openConversation(selected);
      } catch (error) {
        conversationList.replaceChildren();
        showStatus(conversationStatus, error.message || 'Could not load conversations.', 'error');
      }
    }

    async function openConversation(conversation) {
      currentConversation = conversation;
      layout.classList.add('thread-visible');
      threadTitle.textContent = String(conversation.other_person_name || 'Student');
      const threadAvatar = document.getElementById('thread-avatar');
      if (threadAvatar) threadAvatar.textContent = initials(conversation.other_person_name);
      threadPerson.textContent = conversation.other_person_year ? 'Year ' + String(conversation.other_person_year) : '';
      threadMessages.replaceChildren();
      showStatus(threadStatus, 'Loading messages...', 'info');
      setThreadEnabled(true);
      window.history.replaceState(null, '', 'messages.html?conversation_id=' + encodeURIComponent(conversation.id));
      try {
        const response = await fetch('/api/messages?conversation_id=' + encodeURIComponent(conversation.id), { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not load the conversation.');
        const messages = Array.isArray(body) ? body : [];
        threadMessages.replaceChildren();
        if (messages.length === 0) {
          showStatus(threadStatus, 'No messages yet. Say hello.', '');
          return;
        }
        showStatus(threadStatus, '', '');
        messages.forEach(renderMessage);
      } catch (error) {
        showStatus(threadStatus, error.message || 'Could not load the conversation.', 'error');
      }
    }

    function renderMessage(message) {
      const item = document.createElement('li');
      item.className = 'message-row' + (message.sender_is_me ? ' mine' : '');
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble' + (message.body === null ? ' muted' : '');
      bubble.textContent = message.body === null ? 'Message deleted' : String(message.body);
      const meta = document.createElement('div');
      meta.className = 'message-meta muted';
      const time = document.createElement('time');
      time.textContent = formatBakuDateTime(message.created_at) || 'Time unavailable';
      meta.appendChild(time);
      if (message.sender_is_me && message.body !== null) {
        const actions = document.createElement('span');
        actions.className = 'message-actions';
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn secondary';
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async function () {
          if (!window.confirm('Delete this message?')) return;
          deleteButton.disabled = true;
          try {
            const response = await fetch('/api/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ message_id: message.id }) });
            const body = await response.json().catch(function () { return {}; });
            if (!response.ok) throw new Error(body.error || 'Could not delete the message.');
            await openConversation(currentConversation);
          } catch (error) {
            showStatus(messageStatus, error.message || 'Could not delete the message.', 'error');
            deleteButton.disabled = false;
          }
        });
        actions.appendChild(deleteButton);
        meta.appendChild(actions);
      }
      item.append(bubble, meta);
      threadMessages.appendChild(item);
    }

    function showReportOptions() {
      reportOptions.replaceChildren();
      reportOptions.hidden = false;
      reportOptions.className = 'report-options';
      const field = document.createElement('div');
      field.className = 'field';
      const label = document.createElement('label');
      label.htmlFor = 'conversation-report-reason';
      label.textContent = 'Reason';
      const select = document.createElement('select');
      select.id = label.htmlFor;
      ['spam', 'harassment', 'scam', 'other'].forEach(function (reason) {
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
        if (!window.confirm('Report this conversation?')) return;
        send.disabled = true;
        try {
          const response = await fetch('/api/conversation-report', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ conversation_id: currentConversation.id, reason: select.value }) });
          const body = await response.json().catch(function () { return {}; });
          if (!response.ok) throw new Error(body.error || 'Could not report the conversation.');
          showStatus(threadActionStatus, body.message || 'Thanks, this conversation was reported.', 'success');
          reportOptions.hidden = true;
        } catch (error) {
          showStatus(threadActionStatus, error.message || 'Could not report the conversation.', 'error');
          send.disabled = false;
        }
      });
      cancel.addEventListener('click', function () { reportOptions.hidden = true; });
      reportOptions.append(field, send, cancel);
    }

    async function blockCurrentConversation() {
      if (!currentConversation || !window.confirm('Block this student?')) return;
      blockButton.disabled = true;
      try {
        const response = await fetch('/api/user-block', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ conversation_id: currentConversation.id, action: 'block' }) });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not block this student.');
        currentConversation = null;
        layout.classList.remove('thread-visible');
        setThreadEnabled(false);
        await loadConversations();
      } catch (error) {
        showStatus(threadActionStatus, error.message || 'Could not block this student.', 'error');
        blockButton.disabled = false;
      }
    }

    async function refreshOpenThread() {
      if (document.visibilityState !== 'visible' || !currentConversation) return;
      const id = currentConversation.id;
      await loadConversations(id);
    }

    function startPolling() {
      if (pollTimer) window.clearInterval(pollTimer);
      if (document.visibilityState === 'visible') pollTimer = window.setInterval(refreshOpenThread, 60000);
    }

    document.getElementById('back-to-conversations').addEventListener('click', function () { layout.classList.remove('thread-visible'); });
    reportButton.addEventListener('click', showReportOptions);
    blockButton.addEventListener('click', blockCurrentConversation);
    messageBody.addEventListener('input', updateCounter);
    messageBody.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('message-form').requestSubmit();
      }
    });
    document.getElementById('message-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!currentConversation) return;
      const text = messageBody.value.trim();
      if (!text || text.length > 1000) {
        showStatus(messageStatus, 'Message text must be between 1 and 1000 characters.', 'error');
        return;
      }
      sendButton.disabled = true;
      showStatus(messageStatus, 'Sending...', 'info');
      try {
        const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ conversation_id: currentConversation.id, body: text }) });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not send the message.');
        messageBody.value = '';
        updateCounter();
        showStatus(messageStatus, '', '');
        await openConversation(currentConversation);
      } catch (error) {
        showStatus(messageStatus, error.message || 'Could not send the message.', 'error');
      } finally {
        sendButton.disabled = false;
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        refreshOpenThread();
        startPolling();
      } else if (pollTimer) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    });

    try {
      session = await getSession();
      if (!session) {
        window.location.replace('login.html');
      } else {
        const queryId = Number(new URLSearchParams(window.location.search).get('conversation_id')) || null;
        await loadConversations(queryId);
        startPolling();
      }
    } catch (error) {
      window.location.replace('login.html');
    }

