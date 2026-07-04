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

test('official HKU offerings can be filtered by year, term and keyword', async () => {
  const response = await fetch(
    `${baseUrl}/api/course-offerings?academic_year=2025-26&term=2&keyword=machine`
  );
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.universityCode, 'HKU');
  assert.equal(result.academicYear, '2025-26');
  assert(result.courses.length > 0);
  assert(result.courses.every((course) => course.terms.includes('2')));
  assert(result.courses.some((course) => course.courseCode === 'COMP3314'));
});

test('official HKU offerings can combine core or elective category with study year', async () => {
  const coreResponse = await fetch(`${baseUrl}/api/course-offerings?category=core&year=1`);
  const core = await coreResponse.json();
  assert(core.courses.length > 0);
  assert(core.courses.every((course) => course.categories.includes('Year 1 - Core')));

  const electiveResponse = await fetch(`${baseUrl}/api/course-offerings?category=elective&year=3`);
  const electives = await electiveResponse.json();
  assert(electives.courses.length > 0);
  assert(electives.courses.every((course) => course.categories.includes('Year 2 to 4 - Elective')));
});

test('an unavailable offering year returns an empty catalogue', async () => {
  const response = await fetch(`${baseUrl}/api/course-offerings?academic_year=2099-00`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(result.courses, []);
});

test('official offering detail includes enriched course data when available', async () => {
  const response = await fetch(`${baseUrl}/api/course-offerings/COMP1117`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.offering.courseCode, 'COMP1117');
  assert.equal(result.course.credits, 6);
  assert.equal(result.academicYear, '2025-26');

  const importedResponse = await fetch(`${baseUrl}/api/course-offerings/FITE1010`);
  const imported = await importedResponse.json();
  assert.equal(importedResponse.status, 200);
  assert.equal(imported.course.credits, 6);
  assert(imported.course.description);

  const missingResponse = await fetch(`${baseUrl}/api/course-offerings/COMP9999`);
  assert.equal(missingResponse.status, 404);
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
      curriculumYear: '2025-26',
      completedCourseIds: [1, 2]
    })
  });
  const audit = await response.json();
  const foundation = audit.sections.find((section) => section.type === 'foundation');

  assert.equal(response.status, 200);
  assert.equal(audit.completedCredits, 12);
  assert.equal(audit.totalCreditsRequired, 240);
  assert.equal(foundation.completedCredits, 12);
  assert.equal(foundation.trackingScope, 'partial');
  assert.deepEqual(foundation.missingCourses, []);
  assert.equal(audit.curriculumStructure.reduce((sum, section) => sum + section.credits, 0), 240);
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
