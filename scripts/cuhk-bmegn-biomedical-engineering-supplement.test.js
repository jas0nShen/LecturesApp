const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-bmegn-biomedical-engineering-courses-2025.json');
const {
  COURSE_LIST_ROWS,
  STREAMS_BY_CODE,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-bmegn-biomedical-engineering-supplement');

test('CUHK Biomedical Engineering supplement matches the official 2025-26 Study Scheme', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'BMEGN');
  assert.equal(entry.jupasCode, 'JS4460');
  assert.equal(entry.programmeId, 'CUHK-UG-BMEGN-39');
  assert.equal(entry.majorId, 'CUHK-UG-BMEGN-39-M1');
  assert.equal(COURSE_LIST_ROWS.length, 53);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 53);
  assert.equal(new Set(courses.map((course) => course.code)).size, 53);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 21);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 29);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);

  assert.equal(byCode.BMEG2001.credits, 1);
  assert.equal(byCode.BMEG2012.credits, 2);
  assert.equal(byCode.BMEG2603.courseType, 'internship');
  assert.equal(byCode.BMEG4998.courseType, 'capstone');
  assert.equal(byCode.ESTR4601.courseType, 'core');
  assert.equal(byCode.BMEG3920.title, 'Cross-Cultural Biomedical Collaboration for Global Health Challenges');
  assert.match(byCode.BMEG3103.group, /Medical Instrumentation and Biosensors/);
  assert.match(byCode.BMEG3103.group, /Biomedical Imaging, Informatics and Modeling/);
  assert.match(byCode.BMEG4520.group, /Molecular, Cell and Tissue Engineering/);
  assert.deepEqual(STREAMS_BY_CODE.get('BMEG3440'), [
    'Medical Instrumentation and Biosensors',
    'Biomedical Imaging, Informatics and Modeling',
    'Molecular, Cell and Tissue Engineering',
  ]);
  assert.match(supplement.note, /53-course Course List/);
  assert.match(supplement.note, /not imported from similar Programmes/);
  assert.match(supplement.note, /totalCreditRequired=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
