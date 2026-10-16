
    import { getSession } from './auth.js';

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    let activeSession = null;
    let coursePickerReady = false;
    let originalFacultyId = null;
    let universities = [];
    let faculties = [];

    function showMessage(container, message, isError) {
      container.textContent = message;
      container.className = isError ? 'alert error' : 'alert success';
    }

    function addSlot(dayIndex, values) {
      const slots = document.querySelector('[data-slots="' + dayIndex + '"]');
      const row = document.createElement('div');
      row.className = 'availability-slot';
      row.dataset.weekday = dayIndex;

      const start = document.createElement('input');
      start.type = 'time';
      start.value = values && values.start_time ? String(values.start_time).slice(0, 5) : '';
      const startLabel = document.createElement('label');
      startLabel.textContent = 'Start';
      startLabel.appendChild(start);
      const startField = document.createElement('span');
      startField.className = 'field';
      startField.appendChild(startLabel);

      const end = document.createElement('input');
      end.type = 'time';
      end.value = values && values.end_time ? String(values.end_time).slice(0, 5) : '';
      const endLabel = document.createElement('label');
      endLabel.textContent = 'End';
      endLabel.appendChild(end);
      const endField = document.createElement('span');
      endField.className = 'field';
      endField.appendChild(endLabel);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.addEventListener('click', function () {
        row.remove();
      });

      row.appendChild(startField);
      row.appendChild(endField);
      row.appendChild(remove);
      slots.appendChild(row);
    }

    function buildAvailabilityEditor(slots) {
      const editor = document.getElementById('availability-editor');
      editor.replaceChildren();
      weekdays.forEach(function (weekday, dayIndex) {
        const day = document.createElement('div');
        day.className = 'availability-day';
        const heading = document.createElement('h3');
        heading.textContent = weekday;
        day.appendChild(heading);

        const slotList = document.createElement('div');
        slotList.dataset.slots = dayIndex;
        day.appendChild(slotList);

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'add-slot';
        add.textContent = 'Add slot';
        add.addEventListener('click', function () {
          addSlot(dayIndex);
        });
        day.appendChild(add);
        editor.appendChild(day);

        const daySlots = (slots || []).filter(function (slot) {
          return slot.weekday === dayIndex;
        });
        if (daySlots.length === 0) addSlot(dayIndex);
        daySlots.forEach(function (slot) {
          addSlot(dayIndex, slot);
        });
      });
    }

    function collectSlots() {
      const slots = [];
      let invalid = false;
      document.querySelectorAll('.availability-slot').forEach(function (row) {
        const start = row.querySelector('input[type="time"]');
        const end = row.querySelectorAll('input[type="time"]')[1];
        if (!start.value && !end.value) return;
        if (!timePattern.test(start.value) || !timePattern.test(end.value) || end.value <= start.value) {
          invalid = true;
          return;
        }
        slots.push({
          weekday: Number(row.dataset.weekday),
          start_time: start.value,
          end_time: end.value
        });
      });
      if (slots.length > 14) invalid = true;
      return invalid ? null : slots;
    }

    function getProfileUpdate(includeVisibility) {
      const update = {
        year: Number(document.getElementById('year').value),
        languages: document.getElementById('languages').value,
        weekly_free_hours: Number(document.getElementById('weekly-free-hours').value)
      };
      if (includeVisibility) {
        update.name = document.getElementById('name').value;
        update.university_id = Number(document.getElementById('university').value);
        update.faculty_id = Number(document.getElementById('faculty').value);
        update.share_for_partners = document.getElementById('share-for-partners').checked;
        update.allow_messages = document.getElementById('allow-messages').checked;
      }
      return update;
    }

    function renderFacultyOptions(selectedFacultyId) {
      const facultySelect = document.getElementById('faculty');
      const universityId = Number(document.getElementById('university').value);
      facultySelect.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a faculty';
      facultySelect.appendChild(placeholder);
      faculties.filter(function (faculty) {
        return faculty.university_id === universityId;
      }).forEach(function (faculty) {
        const option = document.createElement('option');
        option.value = String(faculty.id);
        option.textContent = String(faculty.name);
        facultySelect.appendChild(option);
      });
      if (selectedFacultyId !== undefined && selectedFacultyId !== null) facultySelect.value = String(selectedFacultyId);
    }

    async function loadProfileOptions(profile) {
      const response = await fetch('/api/onboarding');
      const body = await response.json().catch(function () { return {}; });
      if (!response.ok || !Array.isArray(body.universities) || !Array.isArray(body.faculties)) throw new Error('Could not load university options.');
      universities = body.universities;
      faculties = body.faculties;
      const universitySelect = document.getElementById('university');
      universitySelect.replaceChildren();
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a university';
      universitySelect.appendChild(placeholder);
      universities.forEach(function (university) {
        const option = document.createElement('option');
        option.value = String(university.id);
        option.textContent = String(university.name) + (university.city ? ' — ' + String(university.city) : '');
        universitySelect.appendChild(option);
      });
      universitySelect.value = profile.university_id ? String(profile.university_id) : '';
      if (!universitySelect.value && profile.university) {
        const matchingUniversity = universities.find(function (university) { return university.name === profile.university; });
        if (matchingUniversity) universitySelect.value = String(matchingUniversity.id);
      }
      renderFacultyOptions(profile.faculty_id || undefined);
      if (!document.getElementById('faculty').value && profile.faculty) {
        const matchingFaculty = faculties.find(function (faculty) {
          return faculty.university_id === Number(universitySelect.value) && faculty.name === profile.faculty;
        });
        if (matchingFaculty) document.getElementById('faculty').value = String(matchingFaculty.id);
      }
      universitySelect.addEventListener('change', function () { renderFacultyOptions(); });
    }

    function showCourseStatus(message, kind) {
      const status = document.getElementById('course-status');
      status.textContent = message;
      status.className = kind ? 'alert ' + kind : 'alert';
    }

    function renderCourses(courses, selectedIds) {
      const list = document.getElementById('course-list');
      list.replaceChildren();
      const selected = new Set(selectedIds);
      courses.forEach(function (course) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'course-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'course_ids';
        checkbox.value = String(course.id);
        checkbox.checked = selected.has(course.id);
        const text = document.createElement('span');
        text.textContent = String(course.code) + ' — ' + String(course.name) + (course.teacher ? ' · ' + String(course.teacher) : '');
        label.append(checkbox, text);
        if (course.is_catalog === true) {
          const catalog = document.createElement('span');
          catalog.className = 'badge';
          catalog.textContent = 'Catalog';
          label.appendChild(catalog);
        }
        item.appendChild(label);
        list.appendChild(item);
      });
      coursePickerReady = true;
    }

    async function loadCoursesForProfile(session) {
      const picker = document.getElementById('course-picker');
      document.getElementById('course-list').replaceChildren();
      picker.hidden = false;
      try {
        const headers = { Authorization: 'Bearer ' + session.access_token };
        const responses = await Promise.all([fetch('/api/catalog', { headers }), fetch('/api/enrollments', { headers })]);
        const catalog = await responses[0].json().catch(function () { return {}; });
        const enrollments = await responses[1].json().catch(function () { return {}; });
        if (!responses[0].ok || !responses[1].ok) throw new Error('Could not load courses.');
        const courses = Array.isArray(catalog) ? catalog : [];
        const selectedIds = Array.isArray(enrollments.course_ids) ? enrollments.course_ids : [];
        if (courses.length === 0) {
          showCourseStatus('No courses listed for your university yet.', 'info');
          coursePickerReady = true;
          return;
        }
        renderCourses(courses, selectedIds);
        showCourseStatus('Choose the courses you are taking this semester.', 'info');
      } catch (error) {
        showCourseStatus(error.message || 'Could not load courses.', 'error');
      }
    }

    async function saveSettingsSetting(successMessage) {
      const status = document.getElementById('save-status');
      const update = getProfileUpdate(true);
      status.textContent = 'Saving visibility setting...';
      status.className = 'alert info';
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + activeSession.access_token, 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        if (!response.ok) throw new Error('Visibility update failed');
        showMessage(status, successMessage);
      } catch (err) {
        showMessage(status, 'Could not save partner visibility setting.', true);
      }
    }

    async function loadProfile() {
      const loadStatus = document.getElementById('load-status');
      const form = document.getElementById('profile-form');
      const id = new URLSearchParams(window.location.search).get('id') || '1';
      try {
        const session = await getSession().catch(function () { return null; });
        activeSession = session;
        const authHeaders = session ? { Authorization: 'Bearer ' + session.access_token } : {};
        const [profileResponse, availabilityResponse] = await Promise.all([
          fetch('/api/profile?id=' + encodeURIComponent(id), { headers: authHeaders }),
          fetch('/api/availability?user_id=' + encodeURIComponent(id), { headers: authHeaders })
        ]);
        const profile = await profileResponse.json().catch(() => ({}));
        const availability = await availabilityResponse.json().catch(() => []);
        if (profileResponse.status === 404 || availabilityResponse.status === 404) {
          showMessage(loadStatus, 'Demo user not found.', true);
          return;
        }
        if (!profileResponse.ok || !availabilityResponse.ok) throw new Error('Profile request failed');

        document.getElementById('demo-note').hidden = profile.is_demo !== true;
        document.getElementById('name').value = profile.name || '';
        await loadProfileOptions(profile);
        originalFacultyId = profile.faculty_id || Number(document.getElementById('faculty').value) || null;
        document.getElementById('name').readOnly = !session;
        document.getElementById('university').disabled = !session;
        document.getElementById('faculty').disabled = !session;
        document.getElementById('year').value = profile.year;
        document.getElementById('languages').value = profile.languages || '';
        document.getElementById('weekly-free-hours').value = profile.weekly_free_hours;
        if (session) {
          document.getElementById('course-university-title').textContent = profile.university ? 'Courses at ' + String(profile.university) : '';
          document.getElementById('share-for-partners').checked = profile.share_for_partners === true;
          document.getElementById('visibility-setting').hidden = false;
          document.getElementById('allow-messages').checked = profile.allow_messages !== false;
          document.getElementById('messaging-setting').hidden = false;
          await loadCoursesForProfile(session);
        }
        buildAvailabilityEditor(availability);
        loadStatus.textContent = 'Profile loaded.';
        form.hidden = false;
      } catch (err) {
        console.error('Could not load profile:', err);
        showMessage(loadStatus, 'Could not load your profile. Try again in a moment.', true);
      }
    }

    document.getElementById('profile-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      const saveStatus = document.getElementById('save-status');
      const profileUpdate = getProfileUpdate(Boolean(activeSession));
      const year = profileUpdate.year;
      const languages = profileUpdate.languages;
      const weeklyFreeHours = profileUpdate.weekly_free_hours;
      const slots = collectSlots();
      if (!Number.isInteger(year) || year < 1 || year > 6 || languages.length > 50 || /[\r\n]/.test(languages) ||
          (activeSession && (profileUpdate.name.trim().length < 2 || profileUpdate.name.trim().length > 80 || /[\r\n]/.test(profileUpdate.name))) ||
          (activeSession && (!Number.isInteger(profileUpdate.university_id) || profileUpdate.university_id < 1 || !Number.isInteger(profileUpdate.faculty_id) || profileUpdate.faculty_id < 1)) ||
          !Number.isInteger(weeklyFreeHours) || weeklyFreeHours < 0 || weeklyFreeHours > 60 || slots === null) {
        showMessage(saveStatus, 'Please enter valid profile and availability values.', true);
        return;
      }

      const facultyChangedRequested = Boolean(activeSession && Number(profileUpdate.faculty_id) !== Number(originalFacultyId));
      if (facultyChangedRequested && !window.confirm('Changing your faculty will clear your course selection for this semester. You will need to pick your courses again.')) return;

      const id = new URLSearchParams(window.location.search).get('id') || '1';
      try {
        const session = activeSession || await getSession().catch(function () { return null; });
        const authHeaders = session ? { Authorization: 'Bearer ' + session.access_token } : {};
        const requests = [
          fetch('/api/profile?id=' + encodeURIComponent(id), {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(profileUpdate)
          }),
          fetch('/api/availability?user_id=' + encodeURIComponent(id), {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify(slots)
          })
        ];
        if (activeSession && coursePickerReady && !facultyChangedRequested) {
          const selectedCourseIds = Array.from(document.querySelectorAll('#course-list input[type="checkbox"]:checked'))
            .map(function (input) { return Number(input.value); });
          requests.push(fetch('/api/enrollments', {
            method: 'PUT',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_ids: selectedCourseIds })
          }));
        }
        const responses = await Promise.all(requests);
        if (responses.some(function (response) { return !response.ok; })) throw new Error('Save failed');
        const profileResult = await responses[0].json().catch(function () { return {}; });
        if (profileResult.faculty_changed === true) {
          originalFacultyId = Number(profileResult.faculty_id);
          await loadCoursesForProfile(activeSession);
          showCourseStatus('Please choose your courses for your new faculty.', 'info');
          showMessage(saveStatus, 'Profile and availability saved.', false);
        } else {
          showMessage(saveStatus, activeSession && coursePickerReady ? 'Profile, courses, and availability saved.' : 'Profile and availability saved.');
        }
      } catch (err) {
        showMessage(saveStatus, 'Could not save profile.', true);
      }
    });

    document.getElementById('share-for-partners').addEventListener('change', function () {
      if (activeSession) saveSettingsSetting('Partner visibility setting saved.');
    });

    document.getElementById('allow-messages').addEventListener('change', function () {
      if (activeSession) saveSettingsSetting('Messaging setting saved.');
    });

    loadProfile();

