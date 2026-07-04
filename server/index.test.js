const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { createServer } = require('./index');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports a running service', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: 'course-planner-api'
  });
});

test('course filters can be combined', async () => {
  const response = await fetch(
    `${baseUrl}/api/courses?programme_id=1&major_id=1&course_type=core&has_prerequisite=false&keyword=comp`
  );
  const courses = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(courses.map((course) => course.courseCode), ['COMP1117', 'COMP2121']);
});

test('course detail returns a course or 404', async () => {
  const foundResponse = await fetch(`${baseUrl}/api/courses/1`);
  assert.equal(foundResponse.status, 200);
  assert.equal((await foundResponse.json()).courseCode, 'COMP1117');

  const missingResponse = await fetch(`${baseUrl}/api/courses/999`);
  assert.equal(missingResponse.status, 404);
  assert.deepEqual(await missingResponse.json(), { error: 'Course not found' });
});

test('graduation audit calculates progress and missing courses', async () => {
  const response = await fetch(`${baseUrl}/api/graduation-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      programmeId: 1,
      majorId: 1,
      curriculumYear: '2026',
      completedCourseIds: [1, 2]
    })
  });
  const audit = await response.json();
  const core = audit.sections.find((section) => section.type === 'core');

  assert.equal(response.status, 200);
  assert.equal(audit.completedCredits, 12);
  assert.equal(audit.totalCreditsRequired, 240);
  assert.equal(core.completedCredits, 12);
  assert.deepEqual(core.missingCourses.map((course) => course.id), [3, 4]);
});

test('invalid JSON is rejected', async () => {
  const response = await fetch(`${baseUrl}/api/graduation-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Invalid JSON body' });
});
