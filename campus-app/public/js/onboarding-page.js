
    import { getSession } from './auth.js';

    const form = document.getElementById('onboarding-form');
    const status = document.getElementById('status');
    const saveStatus = document.getElementById('save-status');
    const universitySelect = document.getElementById('university');
    const facultySelect = document.getElementById('faculty');
    const coursePicker = document.getElementById('course-picker');
    const courseStatus = document.getElementById('course-status');
    const courseList = document.getElementById('course-list');
    let session;
    let faculties = [];
    let universities = [];
    let catalogLoaded = false;

    function showStatus(container, message, kind) {
      container.textContent = message;
      container.className = kind ? 'alert ' + kind : 'alert';
    }

    function addOption(select, value, label) {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = label;
      select.appendChild(option);
    }

    function renderFaculties() {
      const universityId = Number(universitySelect.value);
      facultySelect.replaceChildren();
      addOption(facultySelect, '', 'Choose a faculty');
      faculties
        .filter(function (faculty) { return Number(faculty.university_id) === universityId; })
        .forEach(function (faculty) {
          addOption(facultySelect, faculty.id, faculty.name);
        });
      facultySelect.disabled = facultySelect.options.length === 1;
    }

    function setCourseStatus(message, kind) {
      courseStatus.textContent = message;
      courseStatus.className = kind ? 'alert ' + kind : 'alert';
    }

    function renderCourses(courses) {
      courseList.replaceChildren();
      courses.forEach(function (course) {
        const item = document.createElement('li');
        const label = document.createElement('label');
        label.className = 'course-option';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'course_ids';
        checkbox.value = String(course.id);
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
        courseList.appendChild(item);
      });
    }

    async function loadCatalog() {
      setCourseStatus('Loading courses...', 'info');
      const university = universities.find(function (item) { return Number(item.id) === Number(universitySelect.value); });
      document.getElementById('course-university-title').textContent = university ? String(university.name) : '';
      try {
        const response = await fetch('/api/catalog', { headers: { Authorization: 'Bearer ' + session.access_token } });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not load courses.');
        const courses = Array.isArray(body) ? body : [];
        catalogLoaded = true;
        if (courses.length === 0) {
          setCourseStatus('No courses listed for your university yet.', 'info');
          return;
        }
        renderCourses(courses);
        setCourseStatus('Choose your courses, then save again.', 'info');
      } catch (error) {
        setCourseStatus(error.message || 'Could not load courses.', 'error');
      }
    }

    async function loadForm() {
      try {
        session = await getSession();
        if (!session) {
          window.location.href = 'login.html';
          return;
        }

        const response = await fetch('/api/onboarding', {
          headers: { Authorization: 'Bearer ' + session.access_token }
        });
        const body = await response.json().catch(function () { return {}; });
        if (response.ok && body.hasProfile === true) {
          window.location.replace('index.html');
          return;
        }
        if (response.status === 401) {
          window.location.href = 'login.html';
          return;
        }
        if (!response.ok) throw new Error(body.error || 'Could not load onboarding data.');

        const optionsResponse = await fetch('/api/onboarding');
        const optionsBody = await optionsResponse.json().catch(function () { return {}; });
        if (!optionsResponse.ok) throw new Error(optionsBody.error || 'Could not load onboarding data.');

        addOption(universitySelect, '', 'Choose a university');
        universities = Array.isArray(optionsBody.universities) ? optionsBody.universities : [];
        universities.forEach(function (university) {
          const city = university.city ? ' (' + university.city + ')' : '';
          addOption(universitySelect, university.id, String(university.name) + city);
        });
        faculties = Array.isArray(optionsBody.faculties) ? optionsBody.faculties : [];
        universitySelect.addEventListener('change', renderFaculties);
        facultySelect.addEventListener('change', function () {
          if (catalogLoaded) {
            catalogLoaded = false;
            courseList.replaceChildren();
            setCourseStatus('Save your profile first to load courses.', 'info');
          }
        });
        renderFaculties();
        coursePicker.hidden = false;
        form.hidden = false;
        showStatus(status, 'Complete your profile to continue.', 'info');
      } catch (error) {
        showStatus(status, error.message || 'Could not load the onboarding form.', 'error');
      }
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const year = Number(document.getElementById('year').value);
      const name = document.getElementById('name').value.trim();
      const languages = document.getElementById('languages').value.trim();
      if (name.length < 2 || name.length > 80 || year < 1 || year > 6 || languages.length > 50) {
        showStatus(saveStatus, 'Please check your profile details.', 'error');
        return;
      }

      showStatus(saveStatus, 'Saving your profile...', 'info');
      try {
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token
          },
          body: JSON.stringify({
            name,
            university_id: Number(universitySelect.value),
            faculty_id: Number(facultySelect.value),
            year,
            languages
          })
        });
        const body = await response.json().catch(function () { return {}; });
        if (!response.ok) throw new Error(body.error || 'Could not save your profile.');

        if (!catalogLoaded) {
          await loadCatalog();
          showStatus(saveStatus, 'Your profile is saved. Choose your courses, then save again.', 'success');
          return;
        }

        const selectedCourseIds = Array.from(courseList.querySelectorAll('input[type="checkbox"]:checked'))
          .map(function (input) { return Number(input.value); });
        const enrollmentsResponse = await fetch('/api/enrollments', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session.access_token
          },
          body: JSON.stringify({ course_ids: selectedCourseIds })
        });
        const enrollmentsBody = await enrollmentsResponse.json().catch(function () { return {}; });
        if (!enrollmentsResponse.ok) throw new Error(enrollmentsBody.error || 'Could not save your courses.');

        saveStatus.replaceChildren();
        const message = document.createElement('span');
        message.textContent = 'Your profile and courses are saved';
        saveStatus.className = 'alert success';
        saveStatus.appendChild(message);
        const homeLink = document.createElement('a');
        homeLink.href = 'index.html';
        homeLink.textContent = ' Go to the home page';
        saveStatus.appendChild(homeLink);
        window.setTimeout(function () { window.location.replace('index.html'); }, 700);
      } catch (error) {
        showStatus(saveStatus, error.message || 'Could not save your profile.', 'error');
      }
    });

    loadForm();

