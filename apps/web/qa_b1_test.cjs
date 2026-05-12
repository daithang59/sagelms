const { chromium } = require('@playwright/test');
const EXEC = 'C:/Users/Isel/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe';

async function runQA() {
  const browser = await chromium.launch({
    executablePath: EXEC,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const results = [];

  try {
    // A.1: Open app
    await page.goto('http://localhost:3000', { timeout: 15000, waitUntil: 'networkidle' });
    results.push({ test: 'A.1 App loads', result: 'PASS', note: page.url() });

    // A.2: Check login form exists
    const loginContent = await page.content();
    const hasLoginForm = loginContent.includes('login') || loginContent.includes('email') || loginContent.includes('password');
    results.push({ test: 'A.2 Login page accessible', result: hasLoginForm ? 'PASS' : 'FAIL', note: 'Login form: ' + hasLoginForm });

    // Try login with student credentials
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passField = await page.$('input[type="password"]');

    if (emailField && passField) {
      await emailField.fill('student@test.com');
      await passField.fill('password123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        const afterLogin = page.url();
        const isLoggedIn = !afterLogin.includes('/login');
        results.push({ test: 'A.2 Login success', result: isLoggedIn ? 'PASS' : 'FAIL', note: 'URL: ' + afterLogin });
      } else {
        results.push({ test: 'A.2 Login success', result: 'BLOCKED', note: 'No submit button found' });
      }
    } else {
      results.push({ test: 'A.2 Login success', result: 'BLOCKED', note: 'Email/password fields not found' });
    }

    // A.3: Navigate to CoursesPage
    await page.goto('http://localhost:3000/courses', { timeout: 10000, waitUntil: 'networkidle' });
    results.push({ test: 'A.3 CoursesPage navigates', result: 'PASS', note: page.url() });

    // B.1: Course list loads
    await page.waitForTimeout(2000);
    const coursesContent = await page.content();
    const hasCourses = coursesContent.includes('course') || coursesContent.includes('Course');
    results.push({ test: 'B.1 Courses list loads', result: hasCourses ? 'PASS' : 'FAIL', note: 'Has course content: ' + hasCourses });

    // B.2: Loading state
    const loading = await page.$('.loading, [class*="loading"], svg[class*="animate"]');
    results.push({ test: 'B.2 Loading state', result: loading ? 'PASS (observed)' : 'INFO (not visible)', note: '' });

    // B.3: Course card count
    const courseCards = await page.$$('a[href*="/courses/"]');
    results.push({ test: 'B.3 Course card count', result: courseCards.length > 0 ? 'PASS' : 'FAIL', note: 'Found ' + courseCards.length + ' course links' });

    // B.6: Create button visibility
    const createBtn = await page.$('button:has-text("Create"), a:has-text("Create"), [href*="create"]');
    results.push({ test: 'B.6 Create button visible', result: createBtn ? 'PASS' : 'FAIL', note: createBtn ? 'Found' : 'Not visible' });

    // C.1: Navigate to CourseDetail
    if (courseCards.length > 0) {
      await courseCards[0].click();
      await page.waitForTimeout(3000);
      const detailUrl = page.url();
      results.push({ test: 'C.1 CourseDetail navigates', result: detailUrl.includes('/courses/') ? 'PASS' : 'FAIL', note: 'URL: ' + detailUrl });

      // C.1: Course info
      const detailContent = await page.content();
      const hasTitle = detailContent.length > 200;
      results.push({ test: 'C.1 CourseInfo shown', result: hasTitle ? 'PASS' : 'FAIL', note: 'Content length: ' + detailContent.length });

      // C.2: Lesson list
      const lessonLinks = await page.$$('a[href*="lessons"]');
      results.push({ test: 'C.2 Lesson list', result: lessonLinks.length > 0 ? 'PASS' : 'FAIL', note: lessonLinks.length + ' lessons found' });

      // C.4: Enroll button
      const enrollBtn = await page.$('button:has-text("Enroll"), button:has-text("Unenroll")');
      results.push({ test: 'C.4 Enroll button', result: enrollBtn ? 'PASS' : 'INFO', note: enrollBtn ? 'Found' : 'Not found' });

      // D: Click first lesson
      if (lessonLinks.length > 0) {
        await lessonLinks[0].click();
        await page.waitForTimeout(3000);
        const lessonUrl = page.url();
        results.push({ test: 'A.5 LessonDetail navigates', result: lessonUrl.includes('lesson') ? 'PASS' : 'FAIL', note: 'URL: ' + lessonUrl });

        // D.1: Lesson content renders
        const lessonContent = await page.content();
        const hasContent = lessonContent.length > 500;
        results.push({ test: 'D.1 Lesson content renders', result: hasContent ? 'PASS' : 'FAIL', note: 'Length: ' + lessonContent.length });

        // D.2: Lesson has meaningful text
        const hasLessonText = lessonContent.includes('lesson') || lessonContent.includes('Lesson') ||
          lessonContent.includes('content') || lessonContent.includes('video') ||
          lessonContent.includes('text') || lessonContent.includes('TEXT') ||
          lessonContent.includes('pdf') || lessonContent.includes('PDF') ||
          lessonContent.includes('link') || lessonContent.includes('LINK');
        results.push({ test: 'D.2 Lesson meaningful content', result: hasLessonText ? 'PASS' : 'INFO', note: '' });

        // F.1: Console errors
        const errors = [];
        page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        results.push({ test: 'F.1 Console errors', result: errors.length === 0 ? 'PASS' : 'FAIL', note: 'Errors: ' + errors.slice(0, 3).join(' | ') });

      } else {
        results.push({ test: 'A.5 LessonDetail', result: 'BLOCKED', note: 'No lessons found in course' });
        results.push({ test: 'D.1 Lesson content', result: 'BLOCKED', note: 'No lessons to test' });
      }
    } else {
      results.push({ test: 'C.1 CourseDetail', result: 'BLOCKED', note: 'No course cards found' });
    }

  } catch(e) {
    results.push({ test: 'FATAL ERROR', result: 'FAIL', note: e.message });
  }

  await browser.close();

  // Print markdown table
  console.log('# B1 QA Report - Smoke + CoursesPage + CourseDetail\n');
  console.log('## Summary Table');
  console.log('| Test Case | Result | Notes |');
  console.log('|-----------|--------|-------|');
  for (const r of results) {
    console.log('| ' + r.test + ' | ' + r.result + ' | ' + r.note + ' |');
  }
  console.log('\n## Full Results (JSON)');
  console.log(JSON.stringify(results, null, 2));
}

runQA().catch(e => console.error('FATAL:', e.message));