const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const ugService = require('./ugService');
const ugCourseShards = require('./ugCourseShards');

function getIndexOnlyMajorProfile() {
  for (const university of ugService.listUniversities()) {
    const programmes = ugService.listProgrammes({ universityId: university.id, degreeLevel: 'undergraduate' });
    for (const programme of programmes) {
      const major = ugService.listMajors(programme.id).find((item) => item.codedCourseCount === 0);
      if (major) return ugService.getMajorProfile(programme.id, major.id, programme.curriculumYear);
    }
  }
  throw new Error('Expected at least one index-only undergraduate Major fixture');
}

test('runtime UG shards are registered inside their own subpackage instead of statically required by the main package', () => {
  const shardIndex = fs.readFileSync(path.join(__dirname, 'ugCourseShards.js'), 'utf8');
  const hkuLoader = fs.readFileSync(path.join(__dirname, '..', 'subpackages', 'ug-data-hku-a', 'pages', 'loader', 'index.js'), 'utf8');

  assert.doesNotMatch(shardIndex, /require\(['"]\.\.\/subpackages\//);
  assert.doesNotMatch(shardIndex, /eval\s*\(/);
  assert.match(shardIndex, /module\.require\.bind\(module\)/);
  assert.match(hkuLoader, /registerUgCourseShard\(\{ universityCode, packageName, courses \}\)/);
  assert.match(hkuLoader, /completeUgCourseShardActivation\(packageName\)/);
  assert.match(hkuLoader, /buildPageUrl\(pages\[pages\.length - 2\]\)/);
  assert.match(hkuLoader, /wx\.reLaunch\(\{/);
  assert.doesNotMatch(hkuLoader, /wx\.navigateBack\(\{/);

  const runtimeModule = { exports: {} };
  vm.runInNewContext(shardIndex, {
    getApp: () => ({ globalData: {} }),
    module: runtimeModule
  });
  assert.equal(runtimeModule.exports.getCoursesByUniversityCode('HKU').length, 0);
});

test('UG catalogue summarizes current undergraduate seed data', () => {
  const summary = ugService.getCatalogueSummary();

  assert.equal(summary.universityCount, 8);
  assert.equal(summary.facultyCount, 70);
  assert.equal(summary.programmeCount, 445);
  assert.equal(summary.majorCount, 677);
  assert.equal(summary.requirementCount, 4);
  assert.equal(summary.courseCount, 13245);
  assert.equal(summary.sourceProgrammeCount, 444);
  assert.equal(summary.codedCourseCount, 13231);
  assert.equal(summary.programmeWithCoursesCount, 192);
  assert.equal(summary.pendingProgrammeCount, 252);
  assert.equal(summary.sourceReadiness.indexOnly + summary.sourceReadiness.noSource, summary.pendingProgrammeCount);
  assert(summary.sourceReadiness.indexOnly > 0);
  assert.match(summary.sourceReadinessLabel, /仅索引 \/ 来源/);
  assert.equal(summary.coveragePercent, 43);
  assert.match(summary.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(summary.generatedDate, /^\d{4}-\d{2}-\d{2}$/);
});

test('split CityU, HKBU, HKU and PolyU course shards aggregate through their stable university keys', () => {
  const cityuCourses = ugCourseShards.getCoursesByUniversityCode('CITYU');
  const hkbuCourses = ugCourseShards.getCoursesByUniversityCode('HKBU');
  const hkuCourses = ugCourseShards.getCoursesByUniversityCode('HKU');
  const polyuCourses = ugCourseShards.getCoursesByUniversityCode('POLYU');

  assert(cityuCourses.length > 1000);
  assert(hkbuCourses.length > 1000);
  assert(hkuCourses.length > 1000);
  assert(polyuCourses.length > 1000);
  assert.equal(ugCourseShards.getCourseCount('CITYU'), cityuCourses.length);
  assert.equal(ugCourseShards.getCourseCount('HKBU'), hkbuCourses.length);
  assert.equal(ugCourseShards.getCourseCount('HKU'), hkuCourses.length);
  assert.equal(ugCourseShards.getCourseCount('POLYU'), polyuCourses.length);
  ['CS2115', 'GE2401'].forEach((courseCode) => assert(cityuCourses.some((course) => course.courseCode === courseCode)));
  ['ACCT1005', 'DIFH4899'].forEach((courseCode) => assert(hkbuCourses.some((course) => course.courseCode === courseCode)));
  ['COMP1117', 'LLAW1001'].forEach((courseCode) => assert(hkuCourses.some((course) => course.courseCode === courseCode)));
  ['COMP1004', 'ME39003'].forEach((courseCode) => assert(polyuCourses.some((course) => course.courseCode === courseCode)));
});

test('CUHK Music exposes the verified 2025/26 required-course set', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const music = programmes.find((programme) => programme.jupasCode === 'JS4082');
  const major = ugService.listMajors(music.id).find((item) => item.nameEn === 'Music');
  const profile = ugService.getMajorProfile(music.id, major.id, '2026');
  const courses = ugService.listMajorCourses(music.id, major.id);

  assert.equal(music.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 25);
  assert.equal(courses.length, 25);
  ['MUSC1000', 'MUSC1001', 'MUSC1011', 'MUSC1212', 'MUSC2552', 'MUSC2872', 'MUSC2262'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'MUSC1000' && course.semester === 'Term 1'));
  assert(courses.some((course) => course.courseCode === 'MUSC1011' && course.requirementGroups.includes('major required alternative')));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'Chinese Music' }).some((course) => course.courseCode === 'MUSC2562'));
});

test('CUHK Fine Arts exposes the official BA course pool without treating it as one fixed study plan', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const fineArts = programmes.find((programme) => programme.jupasCode === 'JS4044');
  const major = ugService.listMajors(fineArts.id).find((item) => item.nameEn === 'Fine Arts');
  const profile = ugService.getMajorProfile(fineArts.id, major.id, '2026');
  const courses = ugService.listMajorCourses(fineArts.id, major.id);

  assert.equal(fineArts.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 53);
  assert.equal(courses.length, 53);
  ['FAAS1100', 'FAAS1900', 'FAAS2218', 'FAAS3114', 'FAAS4182', 'FAAS4282'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'FAAS4101' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'FAAS4182' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(fineArts.id, major.id, { keyword: 'photography' }).some((course) => course.courseCode === 'FAAS2208'));
});

test('CUHK Linguistics exposes the official 2025/26 course areas and research projects', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const linguistics = programmes.find((programme) => programme.jupasCode === 'JS4070');
  const major = ugService.listMajors(linguistics.id).find((item) => item.nameEn === 'Linguistics');
  const profile = ugService.getMajorProfile(linguistics.id, major.id, '2026');
  const courses = ugService.listMajorCourses(linguistics.id, major.id);

  assert.equal(linguistics.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 41);
  assert.equal(courses.length, 41);
  ['LING1000', 'LING2005', 'BMBL2001', 'LING3206', 'LING3403', 'LING4000'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LING4000' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(linguistics.id, major.id, { keyword: 'information technology' }).some((course) => course.courseCode === 'LING3401'));
});

test('CUHK Bimodal Bilingual Studies exposes its senior-entry 2025/26 study scheme', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const bimodal = programmes.find((programme) => programme.code === 'BMBLN');
  const major = ugService.listMajors(bimodal.id).find((item) => item.nameEn === 'Bimodal Bilingual Studies');
  const profile = ugService.getMajorProfile(bimodal.id, major.id, '2026');
  const courses = ugService.listMajorCourses(bimodal.id, major.id);

  assert.equal(bimodal.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 18);
  assert.equal(courses.length, 18);
  ['BMBL1001', 'BMBL2004', 'HKSL1003', 'BMBL3002', 'BMBL4102'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'BMBL4000' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'BMBL4102' && course.courseType === 'capstone'));
});

test('CUHK History exposes the verified 2025/26 required and capstone courses', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const history = programmes.find((programme) => programme.jupasCode === 'JS4056');
  const major = ugService.listMajors(history.id).find((item) => item.nameEn === 'History');
  const profile = ugService.getMajorProfile(history.id, major.id, '2026');
  const courses = ugService.listMajorCourses(history.id, major.id);

  assert.equal(history.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 5);
  assert.equal(courses.length, 5);
  assert(courses.some((course) => course.courseCode === 'HIST1001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'HIST4812' && course.courseType === 'capstone' && course.credits === 5));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Western History' }).some((course) => course.courseCode === 'HIST1002'));
});

test('CUHK Human Movement Science and Health Studies exposes its official course pool without hiding the source conflict', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS4320');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Human Movement Science and Health Studies');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const adapted = courses.find((course) => course.courseCode === 'SPED3910');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 24);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 15);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 7);
  assert(courses.some((course) => course.courseCode === 'SPED4201' && course.courseType === 'internship' && course.credits === 2));
  assert(courses.some((course) => course.courseCode === 'SPED4900' && course.courseType === 'capstone'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(adapted.requirementGroups.some((group) => group.includes('also listed in the official Health Studies elective pool')));
  assert.match(adapted.description, /Official source conflict/);
  assert.equal(programme.courseSourceUrl, 'https://spe.cuhk.edu.hk/programmes/bachelor-of-science-in-human-movement-science-and-health-studies-js4320/');
});

test('CUHK Exercise Science and Health Education exposes only the current Programme A requirement pool', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'ESHEN');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Exercise Science and Health Education');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 28);
  assert.equal(courses.length, 28);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 28);
  assert(courses.some((course) => course.courseCode === 'PHPC1001' && course.credits === 2 && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'SPED2141' && course.credits === 1));
  assert(courses.some((course) => course.courseCode === 'SPED4201' && course.courseType === 'internship' && course.credits === 2));
  assert(courses.some((course) => course.courseCode === 'SPED4900' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PHPC2007' && course.courseType === 'major_elective'));
  ['SPED2050', 'SPED2122', 'PHPC2009'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert.equal(programme.courseSourceUrl, 'https://spe.cuhk.edu.hk/programmes/bachelor-of-science-in-exercise-science-and-health-education/');
});

test('CUHK Physical Education, Exercise Science and Health exposes the 2026-27 Programme A study scheme', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS4329');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Physical Education, Exercise Science and Health');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 52);
  assert.equal(courses.length, 52);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 52);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 39);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 11);
  assert(courses.some((course) => course.courseCode === 'PHPC1001' && course.credits === 2 && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'SPED3400' && course.credits === 4 && /SPED3201/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'SPED4400' && course.credits === 4 && /SPED2201/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'SPED4201' && course.courseType === 'internship' && course.credits === 2));
  assert(courses.some((course) => course.courseCode === 'SPED4900' && course.courseType === 'capstone'));
  ['SPED3201', 'SPED2201'].forEach((historicalCode) => {
    assert.equal(courses.some((course) => course.courseCode === historicalCode), false);
  });
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert.equal(programme.courseSourceUrl, 'https://spe.cuhk.edu.hk/programmes/bachelor-of-education-in-physical-education-exercise-science-and-health-js4329/');
});

test('HKUST Aerospace Engineering exposes the verified 2025/26 major core', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const aerospace = programmes.find((programme) => programme.nameEn === 'BEng in Aerospace Engineering');
  const major = ugService.listMajors(aerospace.id).find((item) => item.nameEn === 'BEng in Aerospace Engineering');
  const profile = ugService.getMajorProfile(aerospace.id, major.id, '2026');
  const courses = ugService.listMajorCourses(aerospace.id, major.id);

  assert.equal(aerospace.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 20);
  assert.equal(courses.length, 20);
  ['MECH1910', 'MECH2007', 'MECH3640', 'MECH3690', 'MECH4980'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'MECH1990' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'MECH4980' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(aerospace.id, major.id, { keyword: 'Aerodynamics' }).some((course) => course.courseCode === 'MECH3640'));
});

test('HKUST Artificial Intelligence exposes the verified 2025/26 core and capstone paths', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const ai = programmes.find((programme) => programme.nameEn === 'BEng in Artificial Intelligence');
  const major = ugService.listMajors(ai.id).find((item) => item.nameEn === 'BEng in Artificial Intelligence');
  const profile = ugService.getMajorProfile(ai.id, major.id, '2026');
  const courses = ugService.listMajorCourses(ai.id, major.id);

  assert.equal(ai.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 6);
  assert.equal(courses.length, 6);
  assert(courses.some((course) => course.courseCode === 'COMP1944' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'COMP1991' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'COMP4981H' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(ai.id, major.id, { keyword: 'Ethics' }).some((course) => course.courseCode === 'COMP1944'));
});

test('HKUST Computer Engineering exposes verified professional and capstone paths', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BEng in Computer Engineering');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BEng in Computer Engineering');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  assert.equal(courses.length, 9);
  assert(courses.some((course) => course.courseCode === 'CPEG1971' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'CPEG4912' && course.courseType === 'capstone'));
});

test('HKUST Civil Engineering exposes the verified 2025/26 foundation, core, internship and capstone paths', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BEng in Civil Engineering');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BEng in Civil Engineering');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 39);
  assert.equal(courses.length, 39);
  ['CIVL1100', 'CIVL2510', 'CIVL3320', 'CIVL3740', 'CIVL4950'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'COMP1023' && course.requirementGroups.includes('major required alternative')));
  assert(courses.some((course) => course.courseCode === 'CIVL3020' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'CIVL4920' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Geotechnical' }).some((course) => course.courseCode === 'CIVL3740'));
});

test('HKUST Bioengineering exposes its verified 2025/26 core and elective course pool', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BEng in Bioengineering');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BEng in Bioengineering');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 64);
  assert.equal(courses.length, 64);
  ['BIEN1600', 'BIEN3410', 'BIEN3910', 'CENG2320', 'CENG4650'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'BIEN3320' && course.requirementGroups.includes('major required alternative')));
  assert(courses.some((course) => course.courseCode === 'BIEN4930' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CENG5240' && course.courseType === 'major_elective'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Pharmaceutical' }).some((course) => course.courseCode === 'CENG4670'));
});

test('HKUST Biochemistry and Cell Biology exposes verified 2025/26 prerequisites, curriculum and IRE track courses', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BSc in Biochemistry and Cell Biology');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BSc in Biochemistry and Cell Biology');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 37);
  assert.equal(courses.length, 37);
  ['LIFS2010', 'LIFS3140', 'CHEM1011', 'CHEM3320', 'LIFS3110'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LIFS1901' && course.requirementGroups.includes('major prerequisite exemption')));
  assert(courses.some((course) => course.courseCode === 'LIFS4961' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'LIFS3070' && course.courseType === 'core'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Genetics' }).some((course) => course.courseCode === 'LIFS3140'));
});

test('HKUST Biotechnology exposes its verified 2025/26 major and track curriculum', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BSc in Biotechnology');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BSc in Biotechnology');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 52);
  assert.equal(courses.length, 52);
  ['LIFS2070', 'LIFS3150', 'BTEC5210', 'LIFS3040', 'BIBU4820'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LIFS4963' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'LIFS2011' && course.courseType === 'major_elective'));
  assert(courses.some((course) => course.courseCode === 'LIFS4200' && course.courseType === 'core'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Entrepreneurship' }).some((course) => course.courseCode === 'BIBU4820'));
});

test('HKUST Biomedical and Health Sciences exposes its verified 2025/26 core and capstone paths', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'Biomedical and Health Sciences');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Biomedical and Health Sciences');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 65);
  assert.equal(courses.length, 65);
  ['LIFS1980', 'LIFS2901', 'LIFS4380', 'CHEM1011', 'COMP1021'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LIFS3904' && course.requirementGroups.includes('major required alternative')));
  assert(courses.some((course) => course.courseCode === 'LIFS4976' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'LIFS4320' && course.courseType === 'major_elective'));
  assert(courses.some((course) => course.courseCode === 'LIFS3180' && course.requirementGroups.includes('major elective subject to approval')));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Pharmacology' }).some((course) => course.courseCode === 'LIFS4380'));
});

test('HKUST Biotechnology and Business exposes verified 2025/26 science, business and capstone curriculum', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programme = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' }).find((item) => item.nameEn === 'BSc in Biotechnology and Business');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'BSc in Biotechnology and Business');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 44);
  assert.equal(courses.length, 44);
  ['BIBU1010', 'LIFS4200', 'ECON2123', 'ISOM2700', 'BTEC5380'].forEach((courseCode) => assert(courses.some((course) => course.courseCode === courseCode)));
  assert(courses.some((course) => course.courseCode === 'BIBU4850' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'BTEC5340' && course.courseType === 'major_elective'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Marketing' }).some((course) => course.courseCode === 'MARK2120'));
});

test('UG pending source readiness labels summarize index-only catalogue gaps', () => {
  assert.deepEqual(ugService.summarizePendingSourceReadiness([
    { codedCourseCount: 3, sourceStatus: 'course_codes_available' },
    { codedCourseCount: 0, sourceStatus: 'programme_summary_only', courseCount: 1 },
    { codedCourseCount: 0, officialUrl: 'https://example.test/programme' },
    { codedCourseCount: 0 }
  ]), {
    indexOnly: 2,
    noSource: 1
  });
  assert.equal(
    ugService.formatPendingSourceReadiness({ indexOnly: 2, noSource: 1 }),
    '2 个仅索引 / 来源 · 1 个缺来源'
  );
});

test('UG pending programme collection text is copy-ready for data sourcing', () => {
  const pending = ugService.listPendingProgrammes({ universityCode: 'POLYU', limit: 2 });
  const allPending = ugService.listPendingProgrammes({ universityCode: 'POLYU', limit: -1 });
  const text = ugService.buildPendingCollectionText({ universityCode: 'POLYU', limit: 2 });

  assert.equal(pending.length, 2);
  assert.equal(allPending.length, 19);
  assert.equal(pending[0].universityCode, 'POLYU');
  assert.equal(pending[0].sourceStatusLabel, '仅索引 / 来源');
  assert.match(pending[0].officialUrl, /^https:\/\//);
  assert.match(text, /【本科课程资料待补清单】/);
  assert.match(text, /范围：POLYU/);
  assert.match(text, /待补 Programme：19/);
  assert.match(text, /课程代码 \/ 课程名 \/ 学分 \/ Year \/ Semester \/ 课程类别 \/ 来源链接/);
  assert.match(text, /不要推测课程/);
});

test('UG pending programme collection can be filtered by source readiness', () => {
  const polyuIndexOnly = ugService.listPendingProgrammes({
    universityCode: 'POLYU',
    readiness: 'index-only',
    limit: 3
  });
  const polyuNoSource = ugService.listPendingProgrammes({
    universityCode: 'POLYU',
    readiness: 'no-source',
    limit: 2
  });
  const text = ugService.buildPendingCollectionText({
    universityCode: 'POLYU',
    readiness: 'no-source',
    limit: 2
  });

  assert.equal(ugService.normalizePendingReadinessFilter('index_only'), 'indexOnly');
  assert.equal(ugService.normalizePendingReadinessFilter('no-source'), 'noSource');
  assert.equal(ugService.normalizePendingReadinessFilter('all'), '');
  assert.throws(() => ugService.normalizePendingReadinessFilter('coded'), /Unknown pending readiness/);
  assert.equal(polyuIndexOnly.length, 3);
  assert(polyuIndexOnly.every((programme) => programme.sourceReadiness === 'indexOnly'));
  assert(polyuIndexOnly.every((programme) => programme.sourceStatusLabel === '仅索引 / 来源'));
  assert.equal(polyuNoSource.length, 0);
  assert.equal(ugService.getPendingSourceReadinessKey({}), 'noSource');
  assert.equal(ugService.getPendingSourceStatus({}), '缺来源');
  assert.match(text, /待补 Programme：19/);
  assert.match(text, /当前筛选：no-source · 0 个/);
  assert.match(text, /暂无待补 Programme/);
});

test('UG pending programme collection can prioritize launch batches', () => {
  const pending = ugService.listPendingProgrammes({ priority: 'launch', limit: 4 });
  const text = ugService.buildPendingCollectionText({ priority: 'launch', limit: 4 });

  assert.equal(ugService.normalizePendingPriorityMode('first_batch'), 'launch');
  assert.equal(ugService.normalizePendingPriorityMode('none'), '');
  assert.throws(() => ugService.normalizePendingPriorityMode('random'), /Unknown pending priority/);
  assert.equal(pending.length, 4);
  assert(pending.every((programme) => programme.universityCode === 'POLYU'));
  assert.equal(pending[0].code, 'JS3011');
  assert.equal(ugService.isUmbrellaSchemeProgramme({ name: 'Bachelor’s Degree Scheme in Interdisciplinary Studies' }), true);
  assert.equal(ugService.isUmbrellaSchemeProgramme({ name: 'Bachelor of Science (Honours) Scheme in Biotechnology and Chemical Technology' }), false);
  assert.match(text, /优先级：launch/);
  assert.match(text, /1\. POLYU · JS3011 · Bachelor of Science \(Honours\) Scheme in Biotechnology and Chemical Technology/);
});

test('UG catalogue exposes the multi-school hierarchy needed for onboarding', () => {
  const universities = ugService.listUniversities();
  const university = universities.find((item) => item.code === 'POLYU');
  const faculty = ugService.listFaculties(university.id)[0];
  const programme = ugService.listProgrammes({ universityId: university.id, facultyId: faculty.id })[0];
  const major = ugService.listMajors(programme.id)[0];

  assert.deepEqual(universities.map((item) => item.code), ['HKU', 'CUHK', 'HKUST', 'POLYU', 'CITYU', 'HKBU', 'EDUHK', 'LINGNAN']);
  assert.equal(university.nameZh, '香港理工大学');
  assert(programme.nameEn);
  assert(major.nameEn);
  assert.deepEqual(ugService.listCurriculumYears(programme.id, major.id), ['2026']);
});

test('UG per-school coverage stays visible for setup validation', () => {
  const coverage = Object.fromEntries(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({ universityId: university.id, degreeLevel: 'undergraduate' });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    return [university.code, {
      programmeCount: programmes.length,
      majorCount: majors.length,
      codedCourseCount
    }];
  }));

  assert.deepEqual(Object.keys(coverage), ['HKU', 'CUHK', 'HKUST', 'POLYU', 'CITYU', 'HKBU', 'EDUHK', 'LINGNAN']);
  assert.deepEqual(
    Object.fromEntries(Object.entries(coverage).map(([code, item]) => [code, [item.programmeCount, item.majorCount]])),
    {
      HKU: [137, 137], CUHK: [84, 84], HKUST: [50, 64], POLYU: [46, 110],
      CITYU: [58, 187], HKBU: [22, 47], EDUHK: [25, 25], LINGNAN: [23, 23]
    }
  );
  assert(coverage.HKU.codedCourseCount >= 1842);
  assert(coverage.CITYU.codedCourseCount >= 2109);
  assert(coverage.POLYU.codedCourseCount >= 2472);
  assert(coverage.LINGNAN.codedCourseCount >= 721);
});

test('UG school coverage summarizes imported source data for the status page', () => {
  const coverage = ugService.getSchoolCoverage();
  const hku = coverage.find((school) => school.code === 'HKU');
  const cityu = coverage.find((school) => school.code === 'CITYU');
  const hkbu = coverage.find((school) => school.code === 'HKBU');
  const lingnan = coverage.find((school) => school.code === 'LINGNAN');
  const polyu = coverage.find((school) => school.code === 'POLYU');

  assert.equal(coverage.length, 8);
  assert.equal(hku.programmeCount, 136);
  assert.equal(hku.majorCount, 136);
  assert.equal(hku.programmeWithCoursesCount, 53);
  assert.equal(hku.pendingProgrammeCount, 83);
  assert.equal(hku.coveragePercent, 39);
  assert.equal(hku.codedCourseCount, 3335);
  assert.match(hku.generatedDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(hku.updatedLabel, /^更新于 \d{4}-\d{2}-\d{2}$/);
  assert.equal(hku.badge, 'COURSES');
  assert.equal(hku.sourceReadiness.indexOnly + hku.sourceReadiness.noSource, hku.pendingProgrammeCount);
  assert.match(hku.sourceReadinessLabel, /仅索引 \/ 来源/);
  const cuhk = coverage.find((school) => school.code === 'CUHK');
  assert(cuhk.programmeWithCoursesCount >= 3);
  assert(cuhk.pendingProgrammeCount > 0);
  assert(cuhk.coveragePercent > 0);
  assert(cuhk.codedCourseCount >= 131);
  assert.equal(cuhk.badge, 'COURSES');
  assert.equal(polyu.programmeWithCoursesCount, 27);
  assert.equal(polyu.pendingProgrammeCount, 19);
  assert.equal(polyu.coveragePercent, 59);
  assert.equal(polyu.codedCourseCount, 2472);
  assert.equal(polyu.badge, 'COURSES');
  assert.equal(polyu.sourceReadiness.indexOnly, polyu.pendingProgrammeCount);
  assert.equal(cityu.programmeWithCoursesCount, 38);
  assert.equal(cityu.pendingProgrammeCount, 20);
  assert.equal(cityu.coveragePercent, 66);
  assert.equal(cityu.codedCourseCount, 2725);
  assert.equal(cityu.badge, 'COURSES');
  assert.equal(hkbu.programmeWithCoursesCount, 21);
  assert.equal(hkbu.pendingProgrammeCount, 1);
  assert.equal(hkbu.coveragePercent, 95);
  assert.equal(hkbu.codedCourseCount, 2650);
  assert.equal(hkbu.badge, 'COURSES');
  assert.equal(lingnan.programmeWithCoursesCount, 23);
  assert.equal(lingnan.pendingProgrammeCount, 0);
  assert.equal(lingnan.coveragePercent, 100);
  assert.equal(lingnan.codedCourseCount, 721);
  assert.equal(lingnan.badge, 'COURSES');
  assert.deepEqual(lingnan.sourceReadiness, { indexOnly: 0, noSource: 0 });
  assert(polyu.coverageLabel.includes('课程代码'));
});

test('PolyU Physics with AIDA or IE exposes official secondary major courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const physics = programmes.find((programme) => programme.code === 'JS3030');
  const majors = ugService.listMajors(physics.id);
  const aida = majors.find((major) => major.nameEn.includes('Artificial Intelligence and Data Analytics'));
  const ie = majors.find((major) => major.nameEn.includes('Innovation and Entrepreneurship'));
  const aidaCourses = ugService.listMajorCourses(physics.id, aida.id);
  const ieCourses = ugService.listMajorCourses(physics.id, ie.id);

  assert.equal(physics.sourceStatus, 'course_codes_available');
  assert.equal(physics.codedCourseCount, 17);
  assert.equal(aida.codedCourseCount, 9);
  assert.equal(ie.codedCourseCount, 8);
  assert(aidaCourses.some((course) => course.courseCode === 'COMP4431' && course.titleEn === 'Artificial Intelligence'));
  assert(aidaCourses.some((course) => course.courseCode === 'AP40020' && course.courseType === 'capstone'));
  assert(ieCourses.some((course) => course.courseCode === 'MM3161' && course.titleEn === 'Creativity, Innovation and Entrepreneurship'));
  assert(ieCourses.some((course) => course.courseCode === 'AP40022' && course.credits === 6));
});

test('PolyU Fashion exposes official SFT subject cluster courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const fashion = programmes.find((programme) => programme.code === 'JS3050');
  const majors = ugService.listMajors(fashion.id);
  const fashionDesign = majors.find((major) => major.nameEn === 'Fashion Design');
  const fashionBusiness = majors.find((major) => major.nameEn === 'Fashion Business');
  const designCourses = ugService.listMajorCourses(fashion.id, fashionDesign.id);
  const businessCourses = ugService.listMajorCourses(fashion.id, fashionBusiness.id);

  assert.equal(fashion.sourceStatus, 'course_codes_available');
  assert.equal(fashion.codedCourseCount, 315);
  assert.equal(fashionDesign.codedCourseCount, 63);
  assert.equal(fashionBusiness.codedCourseCount, 63);
  assert(designCourses.some((course) => course.courseCode === 'SFT207DD' && course.titleEn === 'Digital Product Creation'));
  assert(designCourses.some((course) => course.courseCode === 'SFT415CP' && course.courseType === 'capstone'));
  assert(businessCourses.some((course) => course.courseCode === 'SFT413FB' && course.titleEn === 'Fashion Brand Management'));
  assert(ugService.listMajorCourses(fashion.id, fashionBusiness.id, { keyword: 'AI in Fashion' }).some((course) => course.courseCode === 'SFT303AF'));
});

test('PolyU Accounting and Finance Scheme exposes official AF programme requirement subjects', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const accountingScheme = programmes.find((programme) => programme.code === 'JS3060');
  const majors = ugService.listMajors(accountingScheme.id);
  const accountancy = majors.find((major) => major.nameEn === 'Accountancy');
  const accountingAndFinance = majors.find((major) => major.nameEn === 'Accounting and Finance');
  const digitalFinance = majors.find((major) => major.nameEn === 'Digital Finance and Investment');
  const accountancyCourses = ugService.listMajorCourses(accountingScheme.id, accountancy.id);
  const accountingAndFinanceCourses = ugService.listMajorCourses(accountingScheme.id, accountingAndFinance.id);
  const digitalFinanceCourses = ugService.listMajorCourses(accountingScheme.id, digitalFinance.id);

  assert.equal(accountingScheme.sourceStatus, 'course_codes_available');
  assert.equal(accountingScheme.codedCourseCount, 252);
  assert.equal(accountancy.codedCourseCount, 39);
  assert.equal(accountingAndFinance.codedCourseCount, 47);
  assert.equal(digitalFinance.codedCourseCount, 40);
  assert(accountancyCourses.some((course) => course.courseCode === 'AF3110' && course.titleEn === 'Intermediate Accounting 1'));
  assert(accountancyCourses.some((course) => course.courseCode === 'AF4912' && course.courseType === 'capstone'));
  assert(accountingAndFinanceCourses.some((course) => course.courseCode === 'AF4317' && course.titleEn === 'Derivative Securities'));
  assert(digitalFinanceCourses.some((course) => course.courseCode === 'AF4231' && course.titleEn === 'Machine Learning and Finance Analytics'));
  assert(ugService.listMajorCourses(accountingScheme.id, digitalFinance.id, { keyword: 'ESG Investing' }).some((course) => course.courseCode === 'AF4338'));
});

test('PolyU LMS scheme exposes official undergraduate subject syllabi course pool', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const lmsScheme = programmes.find((programme) => programme.code === 'JS3070');
  const major = ugService.listMajors(lmsScheme.id)[0];
  const profile = ugService.getMajorProfile(lmsScheme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(lmsScheme.id, major.id);

  assert.equal(lmsScheme.sourceStatus, 'course_codes_available');
  assert.equal(lmsScheme.codedCourseCount, 71);
  assert.equal(profile.codedCourseCount, 71);
  assert.equal(courses.length, 71);
  assert(courses.some((course) => course.courseCode === 'LGT3007' && course.titleEn === 'Air Transport Logistics'));
  assert(courses.some((course) => course.courseCode === 'LGT4306' && course.titleEn === 'Supply Chain Analytics'));
  assert(courses.some((course) => course.courseCode === 'LGT4811' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(lmsScheme.id, major.id, { keyword: 'digital procurement' }).some((course) => course.courseCode === 'LGT4310'));
});

test('PolyU Management and Marketing scheme exposes official undergraduate subject syllabi course pool', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const mmScheme = programmes.find((programme) => programme.code === 'JS3080');
  const majors = ugService.listMajors(mmScheme.id);
  const management = majors.find((major) => major.nameEn === 'Management');
  const marketing = majors.find((major) => major.nameEn === 'Marketing');
  const managementProfile = ugService.getMajorProfile(mmScheme.id, management.id, '2026');
  const marketingCourses = ugService.listMajorCourses(mmScheme.id, marketing.id);

  assert.equal(mmScheme.sourceStatus, 'course_codes_available');
  assert.equal(mmScheme.codedCourseCount, 118);
  assert.equal(management.codedCourseCount, 59);
  assert.equal(marketing.codedCourseCount, 59);
  assert.equal(managementProfile.codedCourseCount, 59);
  assert.equal(marketingCourses.length, 59);
  assert(marketingCourses.some((course) => course.courseCode === 'MM3842' && course.titleEn === 'Digital Marketing'));
  assert(marketingCourses.some((course) => course.courseCode === 'MM4942' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(mmScheme.id, management.id, { keyword: 'Human Resource Management' }).some((course) => course.courseCode === 'MM3111'));
  assert(ugService.listMajorCourses(mmScheme.id, marketing.id, { keyword: 'Strategic Brand' }).some((course) => course.courseCode === 'MM4831'));
});

test('PolyU Spatial Data Science and Smart Cities scheme exposes official LSGS subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const lsgsScheme = programmes.find((programme) => programme.code === 'JS3130');
  const majors = ugService.listMajors(lsgsScheme.id);
  const landSurveying = majors.find((major) => major.nameEn === 'Land Surveying and Geo-Informatics');
  const smartCities = majors.find((major) => major.nameEn === 'Urban Informatics and Smart Cities');
  const landProfile = ugService.getMajorProfile(lsgsScheme.id, landSurveying.id, '2026');
  const smartCityCourses = ugService.listMajorCourses(lsgsScheme.id, smartCities.id);

  assert.equal(lsgsScheme.sourceStatus, 'course_codes_available');
  assert.equal(lsgsScheme.codedCourseCount, 114);
  assert.equal(landSurveying.codedCourseCount, 57);
  assert.equal(smartCities.codedCourseCount, 57);
  assert.equal(landProfile.codedCourseCount, 57);
  assert.equal(smartCityCourses.length, 57);
  assert(smartCityCourses.some((course) => course.courseCode === 'LSGI3802' && course.titleEn === 'Spatial Data Science'));
  assert(smartCityCourses.some((course) => course.courseCode === 'LSGI4503' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(lsgsScheme.id, landSurveying.id, { keyword: 'Survey Adjustment' }).some((course) => course.courseCode === 'LSGI2341A'));
  assert(ugService.listMajorCourses(lsgsScheme.id, smartCities.id, { keyword: 'Urban Big Data' }).some((course) => course.courseCode === 'LSGI3804'));
});

test('PolyU Aviation Engineering scheme exposes official AAE subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const aviationScheme = programmes.find((programme) => programme.code === 'JS3140');
  const majors = ugService.listMajors(aviationScheme.id);
  const aeronautical = majors.find((major) => major.nameEn === 'Aeronautical Engineering');
  const airTransport = majors.find((major) => major.nameEn === 'Air Transport Engineering');
  const aeronauticalProfile = ugService.getMajorProfile(aviationScheme.id, aeronautical.id, '2026');
  const airTransportCourses = ugService.listMajorCourses(aviationScheme.id, airTransport.id);

  assert.equal(aviationScheme.sourceStatus, 'course_codes_available');
  assert.equal(aviationScheme.codedCourseCount, 88);
  assert.equal(aeronautical.codedCourseCount, 44);
  assert.equal(airTransport.codedCourseCount, 44);
  assert.equal(aeronauticalProfile.codedCourseCount, 44);
  assert.equal(airTransportCourses.length, 44);
  assert(airTransportCourses.some((course) => course.courseCode === 'AAE3001' && course.titleEn === 'Fundamentals of Aerodynamics'));
  assert(airTransportCourses.some((course) => course.courseCode === 'AAE4012' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(aviationScheme.id, aeronautical.id, { keyword: 'Aircraft Propulsion' }).some((course) => course.courseCode === 'AAE3003'));
  assert(ugService.listMajorCourses(aviationScheme.id, airTransport.id, { keyword: 'Air Traffic Management' }).some((course) => course.courseCode === 'AAE3012'));
});

test('PolyU Biomedical Engineering exposes official BME subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const bmeProgramme = programmes.find((programme) => programme.code === 'JS3150');
  const major = ugService.listMajors(bmeProgramme.id)[0];
  const profile = ugService.getMajorProfile(bmeProgramme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(bmeProgramme.id, major.id);

  assert.equal(bmeProgramme.sourceStatus, 'course_codes_available');
  assert.equal(bmeProgramme.codedCourseCount, 58);
  assert.equal(major.codedCourseCount, 58);
  assert.equal(profile.codedCourseCount, 58);
  assert.equal(courses.length, 58);
  assert(courses.some((course) => course.courseCode === 'BME31125' && course.titleEn === 'Clinical Measurement and Instrumentation'));
  assert(courses.some((course) => course.courseCode === 'BME41118' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(bmeProgramme.id, major.id, { keyword: 'Medical Robotics' }).some((course) => course.courseCode === 'BME41137'));
  assert(ugService.listMajorCourses(bmeProgramme.id, major.id, { keyword: 'Chinese Communication' }).some((course) => course.courseCode === 'CLC3241'));
});

test('PolyU Electrical Engineering scheme exposes official EEE undergraduate subject syllabi', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const eeScheme = programmes.find((programme) => programme.code === 'JS3170');
  const majors = ugService.listMajors(eeScheme.id);
  const electrical = majors.find((major) => major.nameEn === 'Electrical Engineering');
  const transportation = majors.find((major) => major.nameEn === 'Transportation Systems Engineering');
  const electricalProfile = ugService.getMajorProfile(eeScheme.id, electrical.id, '2026');
  const transportationCourses = ugService.listMajorCourses(eeScheme.id, transportation.id);

  assert.equal(eeScheme.sourceStatus, 'course_codes_available');
  assert.equal(eeScheme.codedCourseCount, 74);
  assert.equal(electrical.codedCourseCount, 37);
  assert.equal(transportation.codedCourseCount, 37);
  assert.equal(electricalProfile.codedCourseCount, 37);
  assert.equal(transportationCourses.length, 37);
  assert(transportationCourses.some((course) => course.courseCode === 'EE4019' && course.titleEn === 'Intelligent Transportation Systems (EE4019B variant)'));
  assert(transportationCourses.some((course) => course.courseCode === 'EE4006' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(eeScheme.id, electrical.id, { keyword: 'Power Systems' }).some((course) => course.courseCode === 'EE4004'));
  assert(ugService.listMajorCourses(eeScheme.id, transportation.id, { keyword: 'Transportation Data Analytics' }).some((course) => course.courseCode === 'EE3013'));
});

test('PolyU Information and Artificial Intelligence Engineering scheme exposes official EIE undergraduate subject syllabi', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const eieScheme = programmes.find((programme) => programme.code === 'JS3180');
  const majors = ugService.listMajors(eieScheme.id);
  const iot = majors.find((major) => major.nameEn === 'Internet-of-Things');
  const ai = majors.find((major) => major.nameEn === 'Artificial Intelligence');
  const security = majors.find((major) => major.nameEn === 'Information Security');
  const iotProfile = ugService.getMajorProfile(eieScheme.id, iot.id, '2026');
  const securityCourses = ugService.listMajorCourses(eieScheme.id, security.id);

  assert.equal(eieScheme.sourceStatus, 'course_codes_available');
  assert.equal(eieScheme.codedCourseCount, 213);
  assert.equal(iot.codedCourseCount, 71);
  assert.equal(ai.codedCourseCount, 71);
  assert.equal(security.codedCourseCount, 71);
  assert.equal(iotProfile.codedCourseCount, 71);
  assert.equal(securityCourses.length, 71);
  assert(securityCourses.some((course) => course.courseCode === 'EIE4117' && course.courseType === 'capstone'));
  assert(securityCourses.some((course) => course.courseCode === 'EIE4122' && course.titleEn === 'Deep Learning and Deep Neural Networks'));
  assert(ugService.listMajorCourses(eieScheme.id, iot.id, { keyword: 'Internet of Things' }).some((course) => course.courseCode === 'EIE2113'));
  assert(ugService.listMajorCourses(eieScheme.id, ai.id, { keyword: 'Machine Learning' }).some((course) => course.courseCode === 'EIE4121'));
  assert(ugService.listMajorCourses(eieScheme.id, security.id, { keyword: 'Network Security' }).some((course) => course.courseCode === 'EIE3130'));
});

test('PolyU Applied Mathematics and Finance Analytics scheme exposes official AMA subject library courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const amaScheme = programmes.find((programme) => programme.code === 'JS3220');
  const majors = ugService.listMajors(amaScheme.id);
  const appliedMath = majors.find((major) => major.nameEn === 'Applied Mathematics');
  const investment = majors.find((major) => major.nameEn === 'Investment Science and Finance Analytics');
  const qfft = majors.find((major) => major.nameEn === 'Quantitative Finance and FinTech');
  const qfftCourses = ugService.listMajorCourses(amaScheme.id, qfft.id);
  const appliedProfile = ugService.getMajorProfile(amaScheme.id, appliedMath.id, '2026');

  assert.equal(amaScheme.sourceStatus, 'course_codes_available');
  assert.equal(amaScheme.codedCourseCount, 264);
  assert.equal(appliedMath.codedCourseCount, 88);
  assert.equal(investment.codedCourseCount, 88);
  assert.equal(qfft.codedCourseCount, 88);
  assert.equal(appliedProfile.codedCourseCount, 88);
  assert.equal(qfftCourses.length, 88);
  assert(qfftCourses.some((course) => course.courseCode === 'AMA3340' && course.titleEn === 'Introduction to Blockchain and Cyber Security'));
  assert(qfftCourses.some((course) => course.courseCode === 'AMA4951' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(amaScheme.id, investment.id, { keyword: 'Derivative Pricing' }).some((course) => course.courseCode === 'AMA4325'));
  assert(ugService.listMajorCourses(amaScheme.id, appliedMath.id, { keyword: 'Optimization Methods' }).some((course) => course.courseCode === 'AMA4850'));
});

test('PolyU Data Science and Artificial Intelligence scheme exposes official major curricula', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const dsaiScheme = programmes.find((programme) => programme.code === 'JS3223');
  const majors = ugService.listMajors(dsaiScheme.id);
  const ai = majors.find((major) => major.nameEn === 'Artificial Intelligence');
  const aift = majors.find((major) => major.nameEn === 'Artificial Intelligence with Financial Technology');
  const dsa = majors.find((major) => major.nameEn === 'Data Science and Analytics');
  const aiCourses = ugService.listMajorCourses(dsaiScheme.id, ai.id);
  const aiftCourses = ugService.listMajorCourses(dsaiScheme.id, aift.id);
  const dsaCourses = ugService.listMajorCourses(dsaiScheme.id, dsa.id);

  assert.equal(dsaiScheme.sourceStatus, 'course_codes_available');
  assert.equal(majors.length, 3);
  assert(aiCourses.some((course) => course.courseCode === 'DSAI4209' && course.titleEn === 'Introduction Generative AI and Foundation Models'));
  assert(aiCourses.some((course) => course.courseCode === 'DSAI4901' && course.courseType === 'capstone' && course.credits === 6));
  assert(aiftCourses.some((course) => course.courseCode === 'DSAI4206' && course.titleEn === 'Emerging Topics in FinTech'));
  assert(aiftCourses.some((course) => course.courseCode === 'AF2108'));
  assert(aiftCourses.some((course) => course.courseCode === 'AF2111'));
  assert(dsaCourses.some((course) => course.courseCode === 'DSAI3101' && course.titleEn === 'Bayesian Methods for Data Science'));
  assert(ugService.listMajorCourses(dsaiScheme.id, dsa.id, { keyword: 'Optimization' }).some((course) => course.courseCode === 'AMA4850'));
});

test('PolyU Product Innovation and Smart Manufacturing scheme exposes official curricula', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const scheme = programmes.find((programme) => programme.code === 'JS3236');
  const majors = ugService.listMajors(scheme.id);
  const productInnovation = majors.find((major) => major.nameEn === 'Product Innovation with Marketing');
  const smartManufacturing = majors.find((major) => major.nameEn === 'Smart Manufacturing');
  const productInnovationCourses = ugService.listMajorCourses(scheme.id, productInnovation.id);
  const smartManufacturingCourses = ugService.listMajorCourses(scheme.id, smartManufacturing.id);

  assert.equal(scheme.sourceStatus, 'course_codes_available');
  assert.equal(productInnovationCourses.length, 35);
  assert.equal(smartManufacturingCourses.length, 35);
  assert(productInnovationCourses.some((course) => course.courseCode === 'ISE430' && course.recommendedYear === 4));
  assert(productInnovationCourses.some((course) => course.courseCode === 'ISE4008' && course.courseType === 'capstone'));
  assert(smartManufacturingCourses.some((course) => course.courseCode === 'ISE4024' && course.titleEn === 'Robotics and Automation Systems'));
  assert(ugService.listMajorCourses(scheme.id, smartManufacturing.id, { keyword: 'Computer-Aided Product Design' }).some((course) => course.courseCode === 'ISE418'));
});

test('PolyU Intelligent Supply Chain exposes its official curriculum without opening unverified tracks', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const scheme = programmes.find((programme) => programme.code === 'JS3237');
  const majors = ugService.listMajors(scheme.id);
  const supplyChain = majors.find((major) => major.nameEn === 'Intelligent Supply Chain');
  const engineeringManagement = majors.find((major) => major.nameEn === 'Engineering Management with Data Analytics');
  const aviation = majors.find((major) => major.nameEn === 'Aviation Operations and Systems');
  const courses = ugService.listMajorCourses(scheme.id, supplyChain.id);

  assert.equal(scheme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 35);
  assert(courses.some((course) => course.courseCode === 'ISE2003' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'ISE4008' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(scheme.id, supplyChain.id, { keyword: 'Supply Chain Analytics' }).some((course) => course.courseCode === 'LGT4306'));
  const engineeringManagementCourses = ugService.listMajorCourses(scheme.id, engineeringManagement.id);
  assert.equal(engineeringManagementCourses.length, 35);
  assert(engineeringManagementCourses.some((course) => course.courseCode === 'ISE3022' && course.titleEn === 'Digital Transformation with Advanced Technology'));
  assert(engineeringManagementCourses.some((course) => course.courseCode === 'ISE4008' && course.courseType === 'capstone'));
  const aviationCourses = ugService.listMajorCourses(scheme.id, aviation.id);
  assert.equal(aviationCourses.length, 34);
  assert(aviationCourses.some((course) => course.courseCode === 'ISE3016' && course.titleEn === 'Aviation Safety and Security Management'));
  assert(aviationCourses.some((course) => course.courseCode === 'ISE4008' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(scheme.id, aviation.id, { keyword: 'Airline Strategy' }).some((course) => course.courseCode === 'LGT4800'));
});

test('PolyU English and Applied Linguistics exposes its official 2025/26 onwards curriculum', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3240');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 62);
  assert.equal(courses.length, 62);
  assert(courses.some((course) => course.courseCode === 'FH1001' && course.titleEn === 'Language and Humanities Professionals in Society'));
  assert(courses.some((course) => course.courseCode === 'ENGL4003' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'ENGL4028' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Social Data Analytics' }).some((course) => course.courseCode === 'ENGL4026'));
});

test('PolyU Speech Therapy exposes its official curriculum with clinical education subjects', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3242');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 37);
  assert.equal(courses.length, 37);
  assert(courses.some((course) => course.courseCode === 'CBS4209' && course.courseType === 'capstone' && course.credits === 3));
  assert(courses.some((course) => course.courseCode === 'CBS4295' && course.courseType === 'internship' && course.credits === 6));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Evidence-Based' }).some((course) => course.courseCode === 'CBS4207'));
});

test('PolyU Language Science and Technology exposes verified curriculum subjects without placeholder codes', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3243');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 33);
  assert.equal(courses.length, 33);
  assert(courses.some((course) => course.courseCode === 'CBS3402' && course.titleEn === 'Psycholinguistics'));
  assert(courses.some((course) => course.courseCode === 'CBS3410' && course.titleEn === 'Python for Language Analytics'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Computational Linguistics' }).some((course) => course.courseCode === 'CBS4958'));
  assert(!courses.some((course) => /LST\d?xxx/i.test(course.courseCode)));
});

test('PolyU Applied Social Sciences scheme exposes verified Social Work and social policy curricula', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3250');
  const majors = ugService.listMajors(programme.id);
  const socialWork = majors.find((major) => major.nameEn === 'Social Work');
  const socialPolicy = majors.find((major) => major.nameEn === 'Social Policy and Social Entrepreneurship');
  const socialWorkCourses = ugService.listMajorCourses(programme.id, socialWork.id);
  const socialPolicyCourses = ugService.listMajorCourses(programme.id, socialPolicy.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(socialWorkCourses.length, 44);
  assert.equal(socialPolicyCourses.length, 47);
  assert(socialWorkCourses.some((course) => course.courseCode === 'APSS4693' && course.courseType === 'internship' && course.credits === 9));
  assert(socialWorkCourses.some((course) => course.courseCode === 'APSS463' && course.courseType === 'capstone'));
  assert(socialPolicyCourses.some((course) => course.courseCode === 'APSS4513' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(programme.id, socialPolicy.id, { keyword: 'Social Data Analytics' }).some((course) => course.courseCode === 'APSS3244'));
});

test('PolyU Optometry exposes the official School of Optometry subject list', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3290');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 40);
  assert.equal(courses.length, 40);
  assert(courses.some((course) => course.courseCode === 'SO1000' && course.titleEn === 'Introduction to Optometry'));
  assert(courses.some((course) => course.courseCode === 'SO4039' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'SO4046' && course.courseType === 'internship'));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Ocular Disease' }).some((course) => course.courseCode === 'SO4026'));
});

test('PolyU Hotel and Tourism Management exposes only verified specialism subjects', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3310');
  const majors = ugService.listMajors(programme.id);
  const hotel = majors.find((major) => major.nameEn === 'Hotel Management');
  const smartTourism = majors.find((major) => major.nameEn === 'Smart Tourism and Hospitality');
  const events = majors.find((major) => major.nameEn === 'Event and Experience Management');
  const hotelCourses = ugService.listMajorCourses(programme.id, hotel.id);
  const smartTourismCourses = ugService.listMajorCourses(programme.id, smartTourism.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 12);
  assert.equal(hotelCourses.length, 6);
  assert.equal(smartTourismCourses.length, 6);
  assert.equal(ugService.listMajorCourses(programme.id, events.id).length, 0);
  assert(hotelCourses.some((course) => course.courseCode === 'HTM2303' && course.titleEn === 'Hotel Operations'));
  assert(smartTourismCourses.some((course) => course.courseCode === 'HTM4362' && course.titleEn === 'Artificial Intelligence in Tourism and Hospitality'));
  assert(smartTourismCourses.every((course) => course.credits === 3));
});

test('PolyU Chinese History and Culture exposes the official 2025-26 curriculum', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3320');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 60);
  assert.equal(courses.length, 60);
  assert(courses.some((course) => course.courseCode === 'CHC134' && course.titleEn === 'Science and Civilisation in Pre-modern China'));
  assert(courses.some((course) => course.courseCode === 'CHC313' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'CHC402' && course.courseType === 'capstone'));
  assert.equal(courses.find((course) => course.courseCode === 'CHC402').recommendedYear, 0);
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Digital Humanities' }).some((course) => course.courseCode === 'CHC407P'));
});

test('PolyU Environmental Engineering exposes verified current practical training modules', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'JS3375');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 3);
  assert.equal(courses.length, 3);
  assert(courses.some((course) => course.courseCode === 'CSE2706' && course.credits === 2 && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'CSE2708' && course.recommendedYear === 4 && course.courseType === 'internship'));
});

test('PolyU Physiotherapy exposes the official 2025/26 programme requirement curriculum', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programme = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === 'JS3636');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 44);
  assert.equal(courses.length, 44);
  assert(courses.some((course) => course.courseCode === 'RS2690' && course.recommendedYear === 1 && course.semester === 'Semester 2'));
  assert(courses.some((course) => course.courseCode === 'RS4050' && course.courseType === 'capstone' && course.credits === 3));
  assert(courses.some((course) => course.courseCode === 'RS47300' && course.courseType === 'internship' && course.credits === 4));
  assert(ugService.listMajorCourses(programme.id, major.id, { keyword: 'Robotics' }).some((course) => course.courseCode === 'RS4920'));
});

test('PolyU Civil Engineering exposes verified practical training modules', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programme = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === 'JS3739');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 3);
  assert.equal(courses.length, 3);
  assert(courses.some((course) => course.courseCode === 'CSE2706' && course.credits === 2 && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'CSE2708' && course.recommendedYear === 4 && course.courseType === 'internship'));
});

test('PolyU Mechanical Engineering scheme exposes official core courses and practical training', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programme = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === 'JS3741');
  const majors = ugService.listMajors(programme.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 67);
  const robotics = majors.find((major) => major.nameEn === 'Intelligent Robotics Engineering');
  const mechanical = majors.find((major) => major.nameEn === 'Mechanical Engineering');
  const roboticsCourses = ugService.listMajorCourses(programme.id, robotics.id);
  const mechanicalCourses = ugService.listMajorCourses(programme.id, mechanical.id);

  assert.equal(roboticsCourses.length, 34);
  assert.equal(mechanicalCourses.length, 33);
  assert(roboticsCourses.some((course) => course.courseCode === 'ME39003' && course.courseType === 'internship' && course.credits === 3));
  assert(roboticsCourses.some((course) => course.courseCode === 'ME42011' && course.recommendedYear === 4 && course.semester === 'Semester 2'));
  assert(mechanicalCourses.some((course) => course.courseCode === 'ME34004' && course.recommendedYear === 3 && course.semester === 'Semester 2'));
  assert(mechanicalCourses.some((course) => course.courseCode === 'ME49001' && course.courseType === 'capstone' && course.credits === 6));
});

test('PolyU Business Administration scheme exposes official Common Year One courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programme = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === 'JS3003');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 11);
  assert.equal(courses.length, 11);
  assert(courses.some((course) => course.courseCode === 'MM1041' && course.credits === 2 && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'AF2108' && course.recommendedYear === 1 && course.semester === 'Semester 2'));
});

test('HKU BA and LLB exposes official core law and interdisciplinary courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6078');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 23);
  assert.equal(courses.length, 23);
  assert(courses.some((course) => course.courseCode === 'LLAW1016' && course.recommendedYear === 1 && course.credits === 6));
  assert(courses.some((course) => course.courseCode === 'LALS2001' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'LALS5001' && course.courseType === 'capstone'));
});

test('HKU Chinese language education exposes the official Chinese major course pool', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6080');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 63);
  assert.equal(courses.length, 63);
  assert(courses.some((course) => course.courseCode === 'CHIN1116' && course.credits === 6));
  assert(courses.some((course) => course.courseCode === 'CHIN2162' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'CHIN4101' && course.courseType === 'capstone'));
  assert.equal(profile.programme.courseSourceUrl, 'https://web.chinese.hku.hk/en/undergraduate/programme_information/');
  assert(courses.every((course) => course.sourceUrl === 'https://web.chinese.hku.hk/en/undergraduate/programme_information/'));
});

test('HKU dental surgery exposes the official six-year professional core', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6107');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 26);
  assert.equal(courses.length, 26);
  assert(courses.some((course) => course.courseCode === 'DENT1003' && course.credits === 18 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'DENT5005' && course.credits === 39 && course.recommendedYear === 5));
  assert(courses.some((course) => course.courseCode === 'DENT6132' && course.credits === 6 && course.courseType === 'capstone'));
});

test('HKU education and science exposes official shared education core courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6119');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert(courses.some((course) => course.courseCode === 'BBED3261' && course.recommendedYear === 3));
  assert(courses.some((course) => course.courseCode === 'BBED4282' && course.courseType === 'major_elective'));
  assert(courses.some((course) => course.courseCode === 'BBED5464' && course.credits === 12 && course.courseType === 'capstone'));
});

test('HKU speech-language pathology exposes the official five-year clinical curriculum', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6157');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 43);
  assert.equal(courses.length, 43);
  assert(courses.some((course) => course.courseCode === 'SLPC1031' && course.credits === 6 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'SLPC3039' && course.credits === 12 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CEDU9001' && course.recommendedYear === 4));
  assert(courses.some((course) => course.courseCode === 'SLPC5044' && course.courseType === 'capstone'));
});

test('HKU applied artificial intelligence exposes official core, concentration and capstone courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6224');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 62);
  assert.equal(courses.length, 62);
  assert(courses.some((course) => course.courseCode === 'ASAI1001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'GEOG3430' && course.courseType === 'major_elective'));
  assert(courses.some((course) => course.courseCode === 'ASAI4798' && course.credits === 12 && course.courseType === 'capstone'));
});

test('HKU Financial Technology exposes verified core, elective alternatives and capstone courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6248');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 38);
  assert.equal(courses.length, 38);
  assert(courses.some((course) => course.courseCode === 'FITE1010' && course.courseType === 'core'));
  assert(courses.some((course) => (
    course.courseCode === 'COMP3314'
    && course.requirementGroups.some((group) => group.includes('choose 1'))
  )));
  assert(courses.some((course) => course.courseCode === 'FITE4801' && course.credits === 12 && course.courseType === 'capstone'));
  assert(courses.every((course) => course.recommendedYear === 0));
});

test('HKU Global Health and Development exposes its official 2025-26 major curriculum', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6250');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 22);
  assert.equal(courses.length, 22);
  assert(courses.some((course) => course.courseCode === 'GHAD1001' && course.recommendedYear === 1));
  assert(courses.some((course) => (
    course.courseCode === 'URBS1003'
    && course.requirementGroups.some((group) => group.includes('select 4 of 11'))
    && course.recommendedYear === 0
  )));
  assert(courses.some((course) => course.courseCode === 'GHAD4010' && course.credits === 12 && course.courseType === 'capstone'));
});

test('HKU Design+ exposes official studio sequence, BASc core and language alternatives', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programme = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' })
    .find((item) => item.code === '6236');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 30);
  assert.equal(courses.length, 30);
  assert(courses.some((course) => course.courseCode === 'DESN2004' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'DESN4003' && course.credits === 12 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CUND9003' && course.courseType === 'major_elective'));
});

test('HKU Computing and Data Science catalogue profiles expose official course offerings', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const cds = programmes.find((programme) => programme.nameEn === 'Computing and Data Science');
  const delta = programmes.find((programme) => programme.nameEn === 'Computing and Data Science (Delta+)');
  const major = ugService.listMajors(cds.id)[0];
  const profile = ugService.getMajorProfile(cds.id, major.id, '2026');
  const machineLearning = ugService.listMajorCourses(cds.id, major.id, { keyword: 'machine learning' });

  assert.equal(cds.sourceStatus, 'course_codes_available');
  assert.equal(cds.codedCourseCount, 56);
  assert.equal(delta.codedCourseCount, 56);
  assert.equal(profile.courseCount, 56);
  assert.equal(profile.codedCourseCount, 56);
  assert(machineLearning.some((course) => course.courseCode === 'COMP3314'));
});

test('HKU Data and Systems Engineering exposes the 2025-26 and thereafter coded curriculum', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6315');
  const major = ugService.listMajors(programme.id).find((item) => item.id === 'HKU-UG-6315-35-M1');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2025-26');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const byType = (courseType) => courses.filter((course) => course.courseType === courseType);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 60);
  assert.equal(profile.codedCourseCount, 60);
  assert.equal(courses.length, 60);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 60);
  assert.equal(byType('core').length, 25);
  assert.equal(byType('major_elective').length, 33);
  assert.equal(byType('internship').length, 1);
  assert.equal(byType('capstone').length, 1);
  ['AILTXXXX', 'CC##XXXX', 'DASE3134', 'DASE4135'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.some((course) => course.courseCode === 'DASE3229' && course.credits === 0 && course.recommendedYear === 3));
  assert(courses.some((course) => (
    course.courseCode === 'DASE4174'
    && course.credits === 12
    && course.recommendedYear === 4
    && course.semester === 'Semester 1 / Semester 2'
  )));
  assert.equal(programme.courseSourceUrl, 'https://www.dase.hku.hk/f/page/1011/4804/Syllabus_BEng(DASE)_2025-26_4Y.pdf');
});

test('HKU Mechanical Engineering preserves conditional and zero-credit training boundaries', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6339');
  const major = ugService.listMajors(programme.id).find((item) => item.id === 'HKU-UG-6339-36-M1');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2025-26');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const byType = (courseType) => courses.filter((course) => course.courseType === courseType);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 60);
  assert.equal(profile.codedCourseCount, 60);
  assert.equal(courses.length, 60);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 60);
  assert.equal(byType('core').length, 24);
  assert.equal(byType('elective').length, 1);
  assert.equal(byType('major_elective').length, 32);
  assert.equal(byType('internship').length, 2);
  assert.equal(byType('capstone').length, 1);
  ['CC##XXXX', 'AILTXXXX', 'ELEC4149', 'BMED3600', 'ELEC3347', 'ENGG1320', 'ENGG1340', 'ENGG1350'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.some((course) => (
    course.courseCode === 'ENGG1200'
    && course.courseType === 'elective'
    && course.requirementGroups.some((group) => group.includes('without HKDSE Physics'))
  )));
  assert(courses.some((course) => (
    course.courseCode === 'MECH2418'
    && course.credits === 6
    && course.semester === 'Summer Semester'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'MECH3432'
    && course.credits === 0
    && course.courseType === 'internship'
    && course.requirementGroups.some((group) => group.includes('not counted toward the 36-credit elective minimum'))
  )));
  assert(courses.some((course) => course.courseCode === 'MECH4429' && course.credits === 12 && course.courseType === 'capstone'));
  assert.equal(programme.courseSourceUrl, 'https://engg.hku.hk/Portals/0/UG/syllabuses/Syllabus_BEng(ME)_2025-26.pdf');
});

test('HKU Civil Engineering exposes the closed 2025-26 and thereafter curriculum', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6353');
  const major = ugService.listMajors(programme.id).find((item) => item.id === 'HKU-UG-6353-37-M1');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2025-26');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const byType = (courseType) => courses.filter((course) => course.courseType === courseType);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 57);
  assert.equal(profile.codedCourseCount, 57);
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 57);
  assert.equal(byType('core').length, 24);
  assert.equal(byType('major_elective').length, 31);
  assert.equal(byType('internship').length, 1);
  assert.equal(byType('capstone').length, 1);
  ['CC##XXXX', 'AILTXXXX', 'ENGG1200', 'IMSE2102', 'GEOG2090', 'URBS1005'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.some((course) => (
    course.courseCode === 'CIVL2114'
    && course.credits === 0
    && course.courseType === 'internship'
    && course.recommendedYear === 3
  )));
  assert(courses.some((course) => (
    course.courseCode === 'CIVL4101'
    && course.credits === 6
    && course.courseType === 'core'
    && course.recommendedYear === 4
  )));
  assert(courses.some((course) => (
    course.courseCode === 'CIVL4102'
    && course.credits === 12
    && course.courseType === 'capstone'
    && course.recommendedYear === 4
  )));
  assert(courses.some((course) => course.courseCode === 'CIVL3141' && course.courseType === 'major_elective'));
  assert.equal(programme.courseSourceUrl, 'https://engg.hku.hk/Portals/0/UG/syllabuses/Syllabus_BEng(CivE)_2025-26.pdf');
});

test('HKU Early Childhood Education and Special Education preserves the official coded curriculum boundaries', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6092');
  const major = ugService.listMajors(programme.id).find((item) => item.id === 'HKU-UG-6092-23-M1');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2025-26');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const byType = (courseType) => courses.filter((course) => course.courseType === courseType);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 47);
  assert.equal(profile.codedCourseCount, 47);
  assert.equal(courses.length, 47);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 47);
  assert.equal(byType('core').length, 29);
  assert.equal(byType('major_elective').length, 15);
  assert.equal(byType('internship').length, 3);
  assert.equal(byType('capstone').length, 0);
  ['CC##XXXX', 'AILTXXXX'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.some((course) => (
    course.courseCode === 'BECE2401'
    && course.credits === 12
    && course.recommendedYear === 2
    && course.courseType === 'internship'
    && course.requirementGroups.some((group) => group.includes('Official Capstone Experience'))
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BECE4401'
    && course.credits === 24
    && course.recommendedYear === 4
    && course.courseType === 'internship'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BECE5401'
    && course.credits === 30
    && course.recommendedYear === 5
    && course.courseType === 'internship'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BECE5999'
    && course.credits === 18
    && course.recommendedYear === 5
    && course.courseType === 'core'
    && course.requirementGroups.some((group) => group.includes('Project'))
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BECE6001'
    && course.titleEn === 'Supporting Children with Autism Spectrum Disorder'
    && course.recommendedYear === 4
    && course.courseType === 'major_elective'
  )));
  assert(courses.some((course) => course.courseCode === 'CAES1001' && course.credits === 0 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'CAES9430' && course.recommendedYear === 3));
  assert(courses.some((course) => course.courseCode === 'CEDU9003' && course.recommendedYear === 2 && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'CUND9004' && course.recommendedYear === 2 && course.courseType === 'major_elective'));
  assert(courses.every((course) => !course.semester));
  assert.equal(
    programme.courseSourceUrl,
    'https://www4.hku.hk/pubunit/drcd/files/ugdr2025-26/Education/BEd(ECE%26SE).pdf'
  );
});

test('HKU Language Education English exposes the currently published coded pool without treating open electives as closed', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6066');
  const major = ugService.listMajors(programme.id).find((item) => item.id === 'HKU-UG-6066-20-M1');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2025-26');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const byType = (courseType) => courses.filter((course) => course.courseType === courseType);
  const cppOptions = courses.filter((course) => (
    course.requirementGroups.some((group) => group.includes('Current Published CPP Option'))
  ));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 210);
  assert.equal(profile.codedCourseCount, 210);
  assert.equal(courses.length, 210);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 210);
  assert.equal(byType('core').length, 17);
  assert.equal(byType('major_elective').length, 174);
  assert.equal(byType('internship').length, 19);
  assert.equal(byType('capstone').length, 0);
  assert.equal(cppOptions.length, 16);
  assert(cppOptions.every((course) => (
    course.requirementGroups.some((group) => group.includes('pool may change; not guaranteed annually'))
  )));
  ['CC##XXXX', 'AILTXXXX', 'CEDU9004', 'BBED6721', 'BBED6730', 'BBED6732', 'BBED6782'].forEach((courseCode) => {
    assert.equal(courses.some((course) => course.courseCode === courseCode), false);
  });
  assert(courses.some((course) => (
    course.courseCode === 'LING1000'
    && course.credits === 6
    && course.recommendedYear === 1
    && course.courseType === 'core'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'ENGL1040'
    && course.titleEn === 'Literary rewriting'
    && course.courseType === 'major_elective'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'ENGL2163'
    && course.titleEn === 'Comics, graphic novel and theory'
    && course.requirementGroups.some((group) => group.includes('Advanced Elective Pool'))
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BBED2521'
    && course.recommendedYear === 2
    && course.semester === 'Summer Semester'
    && course.courseType === 'internship'
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BBED4422'
    && course.credits === 12
    && course.recommendedYear === 4
    && course.semester === 'Semester 1'
    && course.courseType === 'internship'
    && course.requirementGroups.some((group) => group.includes('Official Capstone Experience'))
  )));
  assert(courses.some((course) => (
    course.courseCode === 'BBED5422'
    && course.credits === 12
    && course.recommendedYear === 5
    && course.semester === 'Semester 2'
    && course.courseType === 'internship'
  )));
  assert(courses.some((course) => course.courseCode === 'CAES1001' && course.credits === 0 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'CAES9423' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'CEDU9002' && course.recommendedYear === 5 && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'CUND9004' && course.recommendedYear === 5 && course.courseType === 'major_elective'));
  assert.equal(courses.filter((course) => course.semester).length, 3);
  assert.equal(
    programme.courseSourceUrl,
    'https://www4.hku.hk/pubunit/drcd/files/ugdr2025-26/Education/BA%26BEd(LangEd).pdf'
  );
});

test('UG major profile groups requirements with traceable courses and sources', () => {
  const profile = ugService.getMajorProfile(1, 1, '2025-26');
  const capstone = profile.requirementGroups.find((group) => group.type === 'capstone');

  assert.equal(profile.university.code, 'HKU');
  assert.equal(profile.faculty.nameEn, 'Faculty of Engineering');
  assert.equal(profile.programme.code, 'BENG');
  assert.equal(profile.major.code, 'COMP');
  assert.equal(profile.totalCreditRequired, 240);
  assert.equal(profile.courseCount, 14);
  assert.equal(profile.trackedRequirementCount, 4);
  assert(profile.trackedCredits > 0);
  assert(profile.sourceUrl.startsWith('https://'));
  assert.equal(capstone.requiredCredits, 12);
  assert.deepEqual(capstone.courses.map((course) => course.courseCode), ['COMP4801']);
});

test('UG course and major search support the next import workflow', () => {
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { courseType: 'core', recommendedYear: 3 })
      .map((course) => course.courseCode),
    ['COMP3230', 'COMP3234', 'COMP3251', 'COMP3297']
  );
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { keyword: 'machine learning' })
      .map((course) => course.courseCode),
    ['COMP3314']
  );
  assert(ugService.searchMajors('engineering').some((major) => major.code === 'COMP'));
  assert.equal(ugService.getMajorProfile(1, 999), null);
});

test('UG catalogue courses can be resolved by their stable card id', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKU' })
    .find((item) => item.code === '6004');
  const major = ugService.listMajors(programme.id)[0];
  const course = ugService.listMajorCourses(programme.id, major.id)[0];

  assert.deepEqual(ugService.getCatalogueCourse(course.id), course);
  assert.equal(ugService.getCatalogueCourse('not-a-real-course'), null);
});

test('imported UG programme profiles preserve source status without faking course rules', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const profile = getIndexOnlyMajorProfile();

  assert.equal(programmes.filter((programme) => typeof programme.id === 'string').length, 136);
  assert.equal(profile.sourceStatus, 'programme_summary_only');
  assert.equal(profile.codedCourseCount, 0);
  assert.equal(profile.trackedRequirementCount, 0);
  assert.equal(profile.courseCount, 0);
  assert(profile.sourceUrl.startsWith('https://'));
});

test('imported UG coded courses are searchable when public course rows exist', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const profile = ugService.getMajorProfile(computing.id, computerScience.id, '2026');

  assert(profile.codedCourseCount > 0);
  assert(ugService.listMajorCourses(computing.id, computerScience.id, { keyword: 'Artificial Intelligence' }).length > 0);
});

test('cold-start UG profiles use index coverage before their course shard is loaded', () => {
  const originalGetApp = global.getApp;
  global.getApp = () => ({ globalData: { ugCoursesByUniversity: {} } });
  try {
    const programme = ugService.listProgrammes({ universityCode: 'HKU' })
      .find((item) => item.code === '6004');
    const major = ugService.listMajors(programme.id)[0];
    const profile = ugService.getMajorProfile(programme.id, major.id, '2026');

    assert.equal(profile.courses.length, 0);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.codedCourseCount, 24);

    const mixedProgramme = ugService.getProgramme('POLYU-UG-JS3310-25');
    const pendingMajor = ugService.listMajors(mixedProgramme.id)
      .find((item) => item.id === 'POLYU-UG-JS3310-25-M3');
    const pendingProfile = ugService.getMajorProfile(mixedProgramme.id, pendingMajor.id, '2026');
    assert.equal(pendingProfile.sourceStatus, 'programme_summary_only');
    assert.equal(pendingProfile.codedCourseCount, 0);
  } finally {
    if (originalGetApp === undefined) delete global.getApp;
    else global.getApp = originalGetApp;
  }
});

test('imported UG coded courses are deduplicated by course code within a major', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const courses = ugService.listMajorCourses(computing.id, computerScience.id);
  const comp1004 = courses.filter((course) => course.courseCode === 'COMP1004');

  assert.equal(computing.codedCourseCount, 166);
  assert.equal(computerScience.codedCourseCount, 83);
  assert.equal(courses.length, 83);
  assert.equal(comp1004.length, 1);
  assert.equal(comp1004[0].semester, 'Semester 1 / Semester 2');
});

test('HKUST Computer Science majors expose official programme requirement courses', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn === 'BEng/BSc in Computer Science');
  const majors = ugService.listMajors(computerScience.id);
  const beng = majors.find((major) => major.nameEn === 'BEng in Computer Science');
  const bsc = majors.find((major) => major.nameEn === 'BSc in Computer Science');
  const bengCourses = ugService.listMajorCourses(computerScience.id, beng.id);
  const bscCourses = ugService.listMajorCourses(computerScience.id, bsc.id);

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 121);
  assert.equal(bengCourses.length, 92);
  assert.equal(bscCourses.length, 29);
  assert(bengCourses.some((course) => course.courseCode === 'COMP4211' && course.titleEn === 'Machine Learning'));
  assert(bscCourses.some((course) => course.courseCode === 'COMP4900' && course.credits === 0));
});

test('CUHK Computer Science exposes official CSE undergraduate course list', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn === 'Computer Science');
  const computerEngineering = programmes.find((programme) => programme.nameEn === 'Computer Engineering');
  const artificialIntelligence = programmes.find((programme) => programme.nameEn === 'Artificial Intelligence: Systems and Technologies');
  const major = ugService.listMajors(computerScience.id)[0];
  const cengMajor = ugService.listMajors(computerEngineering.id)[0];
  const aistMajor = ugService.listMajors(artificialIntelligence.id)[0];
  const courses = ugService.listMajorCourses(computerScience.id, major.id);
  const cengCourses = ugService.listMajorCourses(computerEngineering.id, cengMajor.id);
  const aistCourses = ugService.listMajorCourses(artificialIntelligence.id, aistMajor.id);
  const machineLearning = ugService.listMajorCourses(computerScience.id, major.id, { keyword: 'machine learning' });

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 69);
  assert.equal(courses.length, 69);
  assert(courses.some((course) => course.courseCode.startsWith('CSCI2100') && course.titleEn === 'Data Structures'));
  assert(machineLearning.some((course) => course.courseCode === 'CSCI3320'));
  assert.equal(computerEngineering.sourceStatus, 'course_codes_available');
  assert.equal(computerEngineering.codedCourseCount, 26);
  assert.equal(cengCourses.length, 26);
  assert(cengCourses.some((course) => course.courseCode === 'CENG3420' && course.titleEn === 'Computer Organization and Design'));
  assert.equal(artificialIntelligence.sourceStatus, 'course_codes_available');
  assert.equal(artificialIntelligence.codedCourseCount, 36);
  assert.equal(aistCourses.length, 36);
  assert(aistCourses.some((course) => course.courseCode.startsWith('AIST4010') && course.titleEn === 'Foundation of Applied Deep Learning'));
});

test('CityU Computer Science programmes expose official undergraduate requirement courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn.startsWith('BSc Computer Science (Streams:'));
  const cybersecurity = programmes.find((programme) => programme.nameEn.startsWith('BSc Cybersecurity'));
  const aiMajor = ugService.listMajors(computerScience.id).find((major) => major.nameEn === 'Artificial Intelligence');
  const cryptographyMajor = ugService.listMajors(cybersecurity.id).find((major) => major.nameEn === 'Cryptography');
  const aiCourses = ugService.listMajorCourses(computerScience.id, aiMajor.id);
  const cryptographyCourses = ugService.listMajorCourses(cybersecurity.id, cryptographyMajor.id);

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 305);
  assert.equal(aiCourses.length, 61);
  assert(aiCourses.some((course) => course.courseCode === 'CS4486' && course.titleEn === 'Artificial Intelligence'));
  assert(aiCourses.some((course) => course.courseCode === 'CS4514' && course.courseType === 'capstone'));
  assert.equal(cybersecurity.sourceStatus, 'course_codes_available');
  assert.equal(cybersecurity.codedCourseCount, 235);
  assert.equal(cryptographyCourses.length, 47);
  assert(cryptographyCourses.some((course) => course.courseCode === 'CS2117' && course.titleEn === 'Foundation of Cybersecurity'));
  assert(cryptographyCourses.some((course) => course.courseCode === 'CS4192' && course.titleEn === 'Algorithms for Private Data Analytics'));
});

test('CityU Global Business exposes official BBA curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const globalBusiness = programmes.find((programme) => programme.jupasCode === 'JS1001');
  const major = ugService.listMajors(globalBusiness.id)[0];
  const courses = ugService.listMajorCourses(globalBusiness.id, major.id);

  assert.equal(globalBusiness.sourceStatus, 'course_codes_available');
  assert.equal(globalBusiness.codedCourseCount, 170);
  assert.equal(courses.length, 34);
  assert(courses.some((course) => course.courseCode === 'CB2100' && course.titleEn === 'Introduction to Financial Accounting'));
  assert(courses.some((course) => course.courseCode === 'CB4605' && course.courseType === 'capstone'));
});

test('CityU CFFT exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const cfft = programmes.find((programme) => programme.jupasCode === 'JS1000');
  const majors = ugService.listMajors(cfft.id);
  const computationalFinance = majors.find((major) => major.nameEn === 'Computational Finance');
  const financialTechnology = majors.find((major) => major.nameEn === 'Financial Technology');
  const computationalFinanceCourses = ugService.listMajorCourses(cfft.id, computationalFinance.id);
  const financialTechnologyCourses = ugService.listMajorCourses(cfft.id, financialTechnology.id);

  assert.equal(cfft.sourceStatus, 'course_codes_available');
  assert.equal(cfft.codedCourseCount, 101);
  assert.equal(computationalFinanceCourses.length, 51);
  assert.equal(financialTechnologyCourses.length, 50);
  assert(computationalFinanceCourses.some((course) => course.courseCode === 'EF4820' && course.titleEn === 'Derivatives Pricing I: Stock and FX'));
  assert(computationalFinanceCourses.some((course) => course.courseCode === 'CB4001' && course.courseType === 'capstone'));
  assert(financialTechnologyCourses.some((course) => course.courseCode === 'IS3101' && course.titleEn === 'Blockchain and Digital Currency'));
  assert(financialTechnologyCourses.some((course) => course.courseCode === 'IS4920' && course.courseType === 'capstone'));
});

test('CityU Accountancy exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const accountancy = programmes.find((programme) => programme.jupasCode === 'JS1002');
  const majors = ugService.listMajors(accountancy.id);
  const professionalAccounting = majors.find((major) => major.nameEn === 'Professional Accounting');
  const esgAndTech = majors.find((major) => major.nameEn === 'ESG and Tech');
  const professionalAccountingCourses = ugService.listMajorCourses(accountancy.id, professionalAccounting.id);
  const esgAndTechCourses = ugService.listMajorCourses(accountancy.id, esgAndTech.id);

  assert.equal(accountancy.sourceStatus, 'course_codes_available');
  assert.equal(accountancy.codedCourseCount, 83);
  assert.equal(professionalAccountingCourses.length, 42);
  assert.equal(esgAndTechCourses.length, 41);
  assert(professionalAccountingCourses.some((course) => course.courseCode === 'AC4342' && course.titleEn === 'Auditing'));
  assert(professionalAccountingCourses.some((course) => course.courseCode === 'AC4385' && course.courseType === 'capstone'));
  assert(esgAndTechCourses.some((course) => course.courseCode === 'AC3390' && course.titleEn === 'ESG Reporting and Disclosure'));
  assert(esgAndTechCourses.some((course) => course.courseCode === 'IS3101' && course.titleEn === 'Blockchain and Digital Currency'));
});

test('CityU Global Operations Management exposes official programme curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const gom = programmes.find((programme) => programme.jupasCode === 'JS1027');
  const majors = ugService.listMajors(gom.id);
  const supplyChain = majors.find((major) => major.nameEn === 'Supply Chain Management');
  const operationsAnalytics = majors.find((major) => major.nameEn === 'Operations Analytics');
  const supplyChainCourses = ugService.listMajorCourses(gom.id, supplyChain.id);
  const operationsAnalyticsCourses = ugService.listMajorCourses(gom.id, operationsAnalytics.id);

  assert.equal(gom.sourceStatus, 'course_codes_available');
  assert.equal(gom.codedCourseCount, 280);
  assert.equal(supplyChainCourses.length, 56);
  assert.equal(operationsAnalyticsCourses.length, 56);
  assert(supplyChainCourses.some((course) => course.courseCode === 'MS3124' && course.titleEn === 'Global Supply Chain Management'));
  assert(supplyChainCourses.some((course) => course.courseCode === 'MS4118' && course.courseType === 'capstone'));
  assert(operationsAnalyticsCourses.some((course) => course.courseCode === 'MS3253' && course.titleEn === 'Operations Analytics'));
  assert(operationsAnalyticsCourses.some((course) => course.courseCode === 'MS4227' && course.titleEn === 'Pricing and Revenue Management'));
});

test('CityU Business Decision Analytics exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const bdan = programmes.find((programme) => programme.jupasCode === 'JS1026');
  const majors = ugService.listMajors(bdan.id);
  const decisionAnalytics = majors.find((major) => major.nameEn === 'Decision Analytics');
  const dataInformatics = majors.find((major) => major.nameEn === 'Data Informatics');
  const decisionAnalyticsCourses = ugService.listMajorCourses(bdan.id, decisionAnalytics.id);
  const dataInformaticsCourses = ugService.listMajorCourses(bdan.id, dataInformatics.id);

  assert.equal(bdan.sourceStatus, 'course_codes_available');
  assert.equal(bdan.codedCourseCount, 81);
  assert.equal(decisionAnalyticsCourses.length, 39);
  assert.equal(dataInformaticsCourses.length, 42);
  assert(decisionAnalyticsCourses.some((course) => course.courseCode === 'MS3128' && course.titleEn === 'Managerial Decision Analytics'));
  assert(decisionAnalyticsCourses.some((course) => course.courseCode === 'MS4253' && course.courseType === 'capstone'));
  assert(dataInformaticsCourses.some((course) => course.courseCode === 'IS3100' && course.titleEn === 'Techniques for Big Data'));
  assert(dataInformaticsCourses.some((course) => course.courseCode === 'IS4937' && course.courseType === 'capstone'));
});

test('Lingnan Data Science exposes official undergraduate course list', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const dataScience = programmes.find((programme) => programme.jupasCode === 'JS7225');
  const major = ugService.listMajors(dataScience.id)[0];
  const courses = ugService.listMajorCourses(dataScience.id, major.id);
  const deepLearning = ugService.listMajorCourses(dataScience.id, major.id, { keyword: 'deep learning' });

  assert.equal(dataScience.sourceStatus, 'course_codes_available');
  assert.equal(dataScience.codedCourseCount, 22);
  assert.equal(courses.length, 22);
  assert(courses.some((course) => course.courseCode === 'CDS1001' && course.titleEn === 'Introduction to Programming for Data Science'));
  assert(courses.some((course) => course.courseCode === 'CDS4001' && course.courseType === 'capstone'));
  assert(deepLearning.some((course) => course.courseCode === 'CDS4006'));
});

test('Lingnan Translation exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const translation = programmes.find((programme) => programme.jupasCode === 'JS7204');
  const major = ugService.listMajors(translation.id)[0];
  const courses = ugService.listMajorCourses(translation.id, major.id);
  const interpreting = ugService.listMajorCourses(translation.id, major.id, { keyword: 'interpreting' });

  assert.equal(translation.sourceStatus, 'course_codes_available');
  assert.equal(translation.codedCourseCount, 68);
  assert.equal(courses.length, 68);
  assert(courses.some((course) => course.courseCode === 'TRA2001' && course.titleEn === 'Introduction to Computer-aided Translation'));
  assert(courses.some((course) => course.courseCode === 'TRA4318' && course.courseType === 'capstone'));
  assert(interpreting.some((course) => course.courseCode === 'TRA4326'));
});

test('Lingnan Government and International Affairs exposes official course offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const gia = programmes.find((programme) => programme.jupasCode === 'JS7302');
  const major = ugService.listMajors(gia.id)[0];
  const courses = ugService.listMajorCourses(gia.id, major.id);

  assert.equal(gia.sourceStatus, 'course_codes_available');
  assert.equal(gia.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert(courses.some((course) => course.courseCode === 'GOV2101' && course.titleEn === 'Introduction to Political Science'));
  assert(courses.some((course) => course.courseCode === 'SSC4319' && course.courseType === 'capstone'));
});

test('Lingnan Animation and Digital Arts exposes official programme structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const ada = programmes.find((programme) => programme.jupasCode === 'JS7133');
  const major = ugService.listMajors(ada.id)[0];
  const courses = ugService.listMajorCourses(ada.id, major.id);

  assert.equal(ada.sourceStatus, 'course_codes_available');
  assert.equal(ada.codedCourseCount, 15);
  assert.equal(courses.length, 15);
  assert(courses.some((course) => course.courseCode === 'ADA1003' && course.titleEn === 'Computer Graphics'));
  assert(courses.some((course) => course.courseCode === 'ADA4001' && course.courseType === 'capstone'));
});

test('Lingnan Film and Visual Arts exposes official course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const fva = programmes.find((programme) => programme.jupasCode === 'JS7905');
  const major = ugService.listMajors(fva.id)[0];
  const courses = ugService.listMajorCourses(fva.id, major.id);

  assert.equal(fva.sourceStatus, 'course_codes_available');
  assert.equal(fva.codedCourseCount, 39);
  assert.equal(courses.length, 39);
  assert(courses.some((course) => course.courseCode === 'FVA2105' && course.titleEn === 'Film Art and Storytelling'));
  assert(courses.some((course) => course.courseCode === 'FVA4306' && course.courseType === 'capstone'));
});

test('Lingnan Psychology exposes official undergraduate course offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const psychology = programmes.find((programme) => programme.jupasCode === 'JS7303');
  const major = ugService.listMajors(psychology.id)[0];
  const courses = ugService.listMajorCourses(psychology.id, major.id);

  assert.equal(psychology.sourceStatus, 'course_codes_available');
  assert.equal(psychology.codedCourseCount, 23);
  assert.equal(courses.length, 23);
  assert(courses.some((course) => course.courseCode === 'PSY2101' && course.titleEn === 'Introduction to Psychology'));
  assert(courses.some((course) => course.courseCode === 'PSY4325' && course.titleEn === 'Industrial and Organisational Psychology'));
});

test('Lingnan Philosophy exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const philosophy = programmes.find((programme) => programme.jupasCode === 'JS7802');
  const major = ugService.listMajors(philosophy.id)[0];
  const courses = ugService.listMajorCourses(philosophy.id, major.id);
  const aiCourses = ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Artificial Intelligence' });

  assert.equal(philosophy.sourceStatus, 'course_codes_available');
  assert.equal(philosophy.codedCourseCount, 68);
  assert.equal(courses.length, 68);
  assert(courses.some((course) => course.courseCode === 'PHI1002' && course.titleEn.includes('Introduction to Philosophy')));
  assert(aiCourses.some((course) => course.courseCode === 'PHI4375'));
});

test('Lingnan English Studies exposes official course syllabi', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const english = programmes.find((programme) => programme.jupasCode === 'JS7503');
  const major = ugService.listMajors(english.id)[0];
  const courses = ugService.listMajorCourses(english.id, major.id);

  assert.equal(english.sourceStatus, 'course_codes_available');
  assert.equal(english.codedCourseCount, 42);
  assert(courses.some((course) => course.courseCode === 'ENG2101' && course.titleEn === 'Introduction to the Study of Language'));
  assert(courses.some((course) => course.courseCode === 'ENG4301' && course.courseType === 'capstone'));
});

test('Lingnan sociology and social policy programmes expose official department offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const sociology = programmes.find((programme) => programme.jupasCode === 'JS7304');
  const hssm = programmes.find((programme) => programme.jupasCode === 'JS7305');
  const spps = programmes.find((programme) => programme.jupasCode === 'JS7306');

  assert.equal(sociology.codedCourseCount, 29);
  assert.equal(hssm.codedCourseCount, 11);
  assert.equal(spps.codedCourseCount, 20);
  assert(ugService.listMajorCourses(sociology.id, ugService.listMajors(sociology.id)[0].id).some((course) => course.courseCode === 'SOC2101'));
  assert(ugService.listMajorCourses(hssm.id, ugService.listMajors(hssm.id)[0].id).some((course) => course.courseCode === 'HSM4002' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(spps.id, ugService.listMajors(spps.id)[0].id).some((course) => course.courseCode === 'SSC3102'));
});

test('Lingnan Social Data Science exposes official major structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const socialDataScience = programmes.find((programme) => programme.jupasCode === 'JS7307');
  const major = ugService.listMajors(socialDataScience.id)[0];
  const courses = ugService.listMajorCourses(socialDataScience.id, major.id);

  assert.equal(socialDataScience.sourceStatus, 'course_codes_available');
  assert.equal(socialDataScience.codedCourseCount, 18);
  assert(courses.some((course) => course.courseCode === 'SDA1001' && course.titleEn === 'Introduction to Social Data Science'));
  assert(courses.some((course) => course.courseCode === 'GOV3219' && course.titleEn === 'Introduction to Computational Political Science'));
});

test('Lingnan Cultural Studies exposes official undergraduate curriculum courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const culturalStudies = programmes.find((programme) => programme.jupasCode === 'JS7606');
  const major = ugService.listMajors(culturalStudies.id)[0];
  const courses = ugService.listMajorCourses(culturalStudies.id, major.id);

  assert.equal(culturalStudies.sourceStatus, 'course_codes_available');
  assert.equal(culturalStudies.codedCourseCount, 24);
  assert(courses.some((course) => course.courseCode === 'CUS3007' && course.titleEn === 'Social Media Literacy'));
  assert(courses.some((course) => course.courseCode === 'CUS3410' && course.titleEn === 'Cultural Policy & Community Practice'));
});

test('Lingnan Marketing and Social Media exposes official undergraduate courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const marketing = programmes.find((programme) => programme.jupasCode === 'JS7215');
  const major = ugService.listMajors(marketing.id)[0];
  const courses = ugService.listMajorCourses(marketing.id, major.id);

  assert.equal(marketing.sourceStatus, 'course_codes_available');
  assert.equal(marketing.codedCourseCount, 26);
  assert(courses.some((course) => course.courseCode === 'MKT3001' && course.titleEn === 'Social Media Marketing'));
  assert(courses.some((course) => course.courseCode === 'MKT4312' && course.titleEn === 'Strategic Brand Management'));
});

test('Lingnan Chinese exposes official undergraduate required courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const chinese = programmes.find((programme) => programme.jupasCode === 'JS7101');
  const major = ugService.listMajors(chinese.id)[0];
  const courses = ugService.listMajorCourses(chinese.id, major.id);

  assert.equal(chinese.sourceStatus, 'course_codes_available');
  assert.equal(chinese.codedCourseCount, 12);
  assert(courses.some((course) => course.courseCode === 'CHI2105' && course.titleEn === 'Modern Chinese Literature'));
  assert(courses.some((course) => course.courseCode === 'CHI4302' && course.courseType === 'capstone'));
});

test('Lingnan Global Development and Sustainability exposes official required courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const gds = programmes.find((programme) => programme.jupasCode === 'JS7123');
  const major = ugService.listMajors(gds.id)[0];
  const courses = ugService.listMajorCourses(gds.id, major.id);

  assert.equal(gds.sourceStatus, 'course_codes_available');
  assert.equal(gds.codedCourseCount, 13);
  assert(courses.some((course) => course.courseCode === 'GDS1001' && course.titleEn === 'Interdisciplinary Inquiry for Global Challenges'));
  assert(courses.some((course) => course.courseCode === 'GDS4000' && course.courseType === 'capstone'));
});

test('Lingnan Economics exposes official undergraduate course outlines', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const economics = programmes.find((programme) => programme.jupasCode === 'JS7301');
  const major = ugService.listMajors(economics.id)[0];
  const courses = ugService.listMajorCourses(economics.id, major.id);

  assert.equal(economics.sourceStatus, 'course_codes_available');
  assert.equal(economics.codedCourseCount, 39);
  assert(courses.some((course) => course.courseCode === 'ECO2101' && course.titleEn === 'Introduction to Economics'));
  assert(courses.some((course) => course.courseCode === 'ECO4324' && course.titleEn === 'Environmental Economics and Policy'));
});

test('Lingnan BBA programmes expose official programme structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS7211', 34, 'ACT2200', 'RIM2200'],
    ['JS7212', 22, 'BAI3007', 'BAI4010'],
    ['JS7213', 23, 'FIN2200', 'FIN4399'],
    ['JS7214', 17, 'MGT3352', 'MGT4358'],
    ['JS7216', 31, 'RIM2200', 'RIM3355']
  ];

  expectations.forEach(([jupasCode, count, firstCourseCode, secondCourseCode]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const major = ugService.listMajors(programme.id)[0];
    const courses = ugService.listMajorCourses(programme.id, major.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, count);
    assert(courses.some((course) => course.courseCode === firstCourseCode));
    assert(courses.some((course) => course.courseCode === secondCourseCode));
  });
});

test('Lingnan History exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const history = programmes.find((programme) => programme.jupasCode === 'JS7709');
  const major = ugService.listMajors(history.id)[0];
  const courses = ugService.listMajorCourses(history.id, major.id);

  assert.equal(history.sourceStatus, 'course_codes_available');
  assert.equal(history.codedCourseCount, 101);
  assert.equal(courses.length, 101);
  assert(courses.some((course) => course.courseCode === 'HST1001' && course.titleEn === 'Historian’s Craft'));
  assert(courses.some((course) => course.courseCode === 'HST4499' && course.titleEn === 'History Capstone Seminar'));
});

test('CityU BBA Marketing exposes stream-specific undergraduate courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const marketing = programmes.find((programme) => programme.jupasCode === 'JS1007');
  const globalMarketing = ugService.listMajors(marketing.id).find((major) => major.nameEn === 'Global Marketing');
  const marketingAnalytics = ugService.listMajors(marketing.id).find((major) => major.nameEn === 'Marketing Analytics');
  const globalCourses = ugService.listMajorCourses(marketing.id, globalMarketing.id);
  const analyticsCourses = ugService.listMajorCourses(marketing.id, marketingAnalytics.id);

  assert.equal(marketing.sourceStatus, 'course_codes_available');
  assert.equal(marketing.codedCourseCount, 37);
  assert.equal(globalCourses.length, 18);
  assert.equal(analyticsCourses.length, 19);
  assert(globalCourses.some((course) => course.courseCode === 'CB4601' && course.titleEn === 'Global Marketing'));
  assert(globalCourses.some((course) => course.courseCode === 'CB3042' && course.titleEn === 'China Business Environment'));
  assert(analyticsCourses.some((course) => course.courseCode === 'MKT3608' && course.titleEn === 'Marketing Intelligence and Applications of Analytics'));
  assert(analyticsCourses.some((course) => course.courseCode === 'IS3100' && course.titleEn === 'Techniques for Big Data'));
});

test('CityU College of Business pending programmes expose shared undergraduate core courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1005', 28, 2],
    ['JS1012', 28, 2],
    ['JS1013', 56, 4],
    ['JS1014', 70, 5],
    ['JS1017', 28, 2],
    ['JS1018', 42, 3],
    ['JS1019', 56, 4]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorCount]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    assert.equal(majors.length, majorCount);
    majors.forEach((major) => {
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, 14);
      assert(courses.some((course) => course.courseCode === 'CB2100' && course.titleEn === 'Introduction to Financial Accounting'));
      assert(courses.some((course) => course.courseCode === 'CB4303' && course.titleEn === 'Strategic Management'));
    });
  });
});

test('CityU School of Creative Media programmes expose official undergraduate core courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1042', 84, 6, 14, ['SM2105', 'SM4712A']],
    ['JS1043', 95, 5, 19, ['CS2303', 'SM4712B']],
    ['JS1044', 76, 4, 19, ['SM3807', 'SM4712C']]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorCount, coursesPerMajor, courseCodes]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    assert.equal(majors.length, majorCount);
    majors.forEach((major) => {
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, coursesPerMajor);
      courseCodes.forEach((courseCode) => {
        assert(courses.some((course) => course.courseCode === courseCode));
      });
    });
  });
});

test('CityU School of Creative Media entry programmes reuse degree-track course templates', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1040', 59, [
      ['Creative Media (School-based)', 7, ['SM1701', 'SM1702A']],
      ['BA Creative Media', 14, ['SM2105', 'SM4712A']],
      ['BSc Creative Media', 19, ['CS2303', 'SM4712B']],
      ['BAS New Media', 19, ['SM3807', 'SM4712C']]
    ]],
    ['JS1041', 52, [
      ['BA Creative Media', 14, ['SM2105', 'SM4712A']],
      ['BSc Creative Media', 19, ['CS2303', 'SM4712B']],
      ['BAS New Media', 19, ['SM3807', 'SM4712C']]
    ]]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorExpectations]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    majorExpectations.forEach(([majorName, coursesPerMajor, courseCodes]) => {
      const major = majors.find((item) => item.nameEn === majorName);
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, coursesPerMajor);
      courseCodes.forEach((courseCode) => {
        assert(courses.some((course) => course.courseCode === courseCode));
      });
    });
  });
});

test('imported UG programmes can be searched by title, code and faculty', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const hkuProgrammes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const architecture = ugService.searchProgrammes(hkuProgrammes, '6004');
  const engineering = ugService.searchProgrammes(hkuProgrammes, 'Engineering');

  assert(architecture.some((programme) => programme.nameEn === 'Bachelor of Arts in Architectural Studies'));
  assert(engineering.length > 0);
  assert(ugService.searchProgrammes(hkuProgrammes, '').length >= hkuProgrammes.length);
});

test('HKU Architectural Studies exposes official BA(AS) timetable courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const architecture = programmes.find((programme) => programme.code === '6004');
  const major = ugService.listMajors(architecture.id)[0];
  const profile = ugService.getMajorProfile(architecture.id, major.id, '2026');
  const courses = ugService.listMajorCourses(architecture.id, major.id);

  assert.equal(architecture.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert(courses.some((course) => course.courseCode === 'ARCH1079' && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'ARCH1080' && course.semester === 'Semester 2'));
  assert(courses.some((course) => course.courseCode === 'ARCH4603' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(architecture.id, major.id, { keyword: 'Building Technology' }).some((course) => course.courseCode === 'ARCH2056'));
});

test('HKU Bachelor of Laws exposes verified professional, capstone and designated elective courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const llb = programmes.find((programme) => programme.code === '6406');
  const major = ugService.listMajors(llb.id).find((item) => item.nameEn === 'Bachelor of Laws');
  const profile = ugService.getMajorProfile(llb.id, major.id, '2026');
  const courses = ugService.listMajorCourses(llb.id, major.id);

  assert.equal(llb.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 39);
  assert.equal(courses.length, 39);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 18);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 9);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 12);
  assert(courses.some((course) => course.courseCode === 'LLAW1001' && course.recommendedYear === 1 && course.credits === 6));
  assert(courses.some((course) => course.courseCode === 'LLAW3093' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'LLAW3280' && course.recommendedYear === 0 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'LLAW3282' && course.requirementGroups.includes('Years 3–4 combined · designated disciplinary elective alternative')));
  assert.equal(llb.courseSourceUrl, 'https://dm.law.hku.hk/wp-content/uploads/LLB_regulations_syllabus_2025-26.pdf');
});

test('HKU Surveying and Urban Studies expose official syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['6016', 'Bachelor of Science in Surveying', 31, ['RECO1018', 'RECO4011', 'RECO4016'], 'Construction Project Management'],
    ['6042', 'Bachelor of Arts in Urban Studies', 22, ['URBS1003', 'URBS4005', 'URBS4006'], 'Urban Environmental Science']
  ];

  expectations.forEach(([programmeCode, programmeName, courseCount, courseCodes, keyword]) => {
    const programme = programmes.find((item) => item.code === programmeCode);
    const major = ugService.listMajors(programme.id).find((item) => item.nameEn === programmeName);
    const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
    const courses = ugService.listMajorCourses(programme.id, major.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(profile.codedCourseCount, courseCount);
    assert.equal(courses.length, courseCount);
    courseCodes.forEach((courseCode) => {
      assert(courses.some((course) => course.courseCode === courseCode));
    });
    assert(ugService.listMajorCourses(programme.id, major.id, { keyword }).length > 0);
  });
});

test('HKU Landscape Studies exposes official syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const landscape = programmes.find((programme) => programme.code === '6028');
  const major = ugService.listMajors(landscape.id).find((item) => item.nameEn === 'Bachelor of Arts in Landscape Studies');
  const profile = ugService.getMajorProfile(landscape.id, major.id, '2026');
  const courses = ugService.listMajorCourses(landscape.id, major.id);

  assert.equal(landscape.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 33);
  assert.equal(courses.length, 33);
  ['ARCH2113', 'ARCH4201', 'ARCH4717'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(ugService.listMajorCourses(landscape.id, major.id, { keyword: 'Landscape Ecology' }).some((course) => course.courseCode === 'ARCH4717'));
});

test('HKU Art History exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const artHistory = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Art History'));
  const major = ugService.listMajors(artHistory.id).find((item) => item.nameEn === 'Art History');
  const profile = ugService.getMajorProfile(artHistory.id, major.id, '2026');
  const courses = ugService.listMajorCourses(artHistory.id, major.id);

  assert.equal(artHistory.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 94);
  assert.equal(courses.length, 94);
  ['ARTH1001', 'ARTH2081', 'ARTH4005'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'ARTH4005' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(artHistory.id, major.id, { keyword: 'museum' }).some((course) => course.courseCode === 'ARTH2056'));
});

test('HKU Chinese History and Culture exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const chineseHistory = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Chinese History and Culture'));
  const major = ugService.listMajors(chineseHistory.id).find((item) => item.nameEn === 'Chinese History and Culture');
  const profile = ugService.getMajorProfile(chineseHistory.id, major.id, '2026');
  const courses = ugService.listMajorCourses(chineseHistory.id, major.id);

  assert.equal(chineseHistory.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 62);
  assert.equal(courses.length, 62);
  ['CHIN1201', 'CHIN3221', 'HIST2018'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN3221' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(chineseHistory.id, major.id, { keyword: 'Silk Road' }).some((course) => course.courseCode === 'CHIN2276'));
});

test('HKU Chinese Language and Literature exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const chineseLanguage = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Chinese Language and Literature'));
  const major = ugService.listMajors(chineseLanguage.id).find((item) => item.nameEn === 'Chinese Language and Literature');
  const profile = ugService.getMajorProfile(chineseLanguage.id, major.id, '2026');
  const courses = ugService.listMajorCourses(chineseLanguage.id, major.id);

  assert.equal(chineseLanguage.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 63);
  assert.equal(courses.length, 63);
  ['CHIN1116', 'CHIN2187', 'CHIN4101'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN4101' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(chineseLanguage.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'CHIN2183'));
});

test('HKU Comparative Literature exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const comparativeLiterature = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Comparative Literature'));
  const major = ugService.listMajors(comparativeLiterature.id).find((item) => item.nameEn === 'Comparative Literature');
  const profile = ugService.getMajorProfile(comparativeLiterature.id, major.id, '2026');
  const courses = ugService.listMajorCourses(comparativeLiterature.id, major.id);

  assert.equal(comparativeLiterature.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 71);
  assert.equal(courses.length, 71);
  ['CLIT1001', 'CLIT3020', 'GEND2001', 'SINO2008'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CLIT3020' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(comparativeLiterature.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'HKGS2008'));
  assert(ugService.listMajorCourses(comparativeLiterature.id, major.id, { keyword: 'World heritage' }).some((course) => course.courseCode === 'SINO2008'));
});

test('HKU English Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const englishStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('English Studies'));
  const major = ugService.listMajors(englishStudies.id).find((item) => item.nameEn === 'English Studies');
  const profile = ugService.getMajorProfile(englishStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(englishStudies.id, major.id);

  assert.equal(englishStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 125);
  assert.equal(courses.length, 125);
  ['ENGL1011', 'ENGL2079', 'ENGL3041', 'ENGL2187'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'ENGL3041' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(englishStudies.id, major.id, { keyword: 'Shakespeare' }).some((course) => course.courseCode === 'ENGL2079'));
  assert(ugService.listMajorCourses(englishStudies.id, major.id, { keyword: 'World Englishes' }).some((course) => course.courseCode === 'ENGL1042'));
});

test('HKU Gender Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const genderStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Gender Studies'));
  const major = ugService.listMajors(genderStudies.id).find((item) => item.nameEn === 'Gender Studies');
  const profile = ugService.getMajorProfile(genderStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(genderStudies.id, major.id);

  assert.equal(genderStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 82);
  assert.equal(courses.length, 82);
  ['GEND1001', 'GEND3901', 'LLAW3071', 'BSTC2049'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'GEND3901' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(genderStudies.id, major.id, { keyword: 'non-discrimination' }).some((course) => course.courseCode === 'LLAW3071'));
  assert(ugService.listMajorCourses(genderStudies.id, major.id, { keyword: 'Buddhism' }).some((course) => course.courseCode === 'BSTC2049'));
});

test('HKU General Linguistics exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const generalLinguistics = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('General Linguistics'));
  const major = ugService.listMajors(generalLinguistics.id).find((item) => item.nameEn === 'General Linguistics');
  const profile = ugService.getMajorProfile(generalLinguistics.id, major.id, '2026');
  const courses = ugService.listMajorCourses(generalLinguistics.id, major.id);

  assert.equal(generalLinguistics.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 47);
  assert.equal(courses.length, 47);
  ['LING1000', 'LING2067', 'LING3005', 'LING3007'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LING3005' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(generalLinguistics.id, major.id, { keyword: 'Natural language processing' }).some((course) => course.courseCode === 'LING2067'));
  assert(ugService.listMajorCourses(generalLinguistics.id, major.id, { keyword: 'Cantonese' }).some((course) => course.courseCode === 'LING2058'));
});

test('HKU Global and Area Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const globalAreaStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Global and Area Studies'));
  const major = ugService.listMajors(globalAreaStudies.id).find((item) => item.nameEn === 'Global and Area Studies');
  const profile = ugService.getMajorProfile(globalAreaStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(globalAreaStudies.id, major.id);

  assert.equal(globalAreaStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 189);
  assert.equal(courses.length, 189);
  ['GLAS1001', 'GLAS2001', 'GLAS3111', 'GLAS4901', 'GRMN3029', 'THAI3003'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'GLAS2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'GLAS4901' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'European Union' }).some((course) => course.courseCode === 'GLAS3102'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'internship' }).some((course) => course.courseCode === 'GLAS3111'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'Thailand today' }).some((course) => course.courseCode === 'THAI3003'));
});

test('HKU History exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const history = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in History)');
  const major = ugService.listMajors(history.id).find((item) => item.nameEn === 'History');
  const profile = ugService.getMajorProfile(history.id, major.id, '2026');
  const courses = ugService.listMajorCourses(history.id, major.id);

  assert.equal(history.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 179);
  assert.equal(courses.length, 179);
  ['HIST1010', 'HIST2208', 'HIST3022', 'HIST4017', 'HIST4037'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'HIST4017' && course.credits === 12 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'HIST4037' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Silk Roads' }).some((course) => course.courseCode === 'HIST2208'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Artificial Intelligence' }).some((course) => course.courseCode === 'HIST4037'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Hong Kong' }).some((course) => course.courseCode === 'HIST1017'));
});

test('HKU Hong Kong Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const hongKongStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Hong Kong Studies)');
  const major = ugService.listMajors(hongKongStudies.id).find((item) => item.nameEn === 'Hong Kong Studies');
  const profile = ugService.getMajorProfile(hongKongStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(hongKongStudies.id, major.id);

  assert.equal(hongKongStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 60);
  assert.equal(courses.length, 60);
  ['HKGS1001', 'HKGS2001', 'HKGS3001', 'GCIN2019', 'POLI3020', 'SOCI2075'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'HKGS2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'HKGS3001' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'HKGS2008'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'TV industry' }).some((course) => course.courseCode === 'GCIN2011'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'environment' }).some((course) => course.courseCode === 'GEOG2138'));
});

test('HKU Japanese Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const japaneseStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Japanese Studies)');
  const major = ugService.listMajors(japaneseStudies.id).find((item) => item.nameEn === 'Japanese Studies');
  const profile = ugService.getMajorProfile(japaneseStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(japaneseStudies.id, major.id);

  assert.equal(japaneseStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 75);
  assert.equal(courses.length, 75);
  ['JAPN1011', 'JAPN2088', 'JAPN3082', 'JAPN4101', 'JAPN2010', 'JAPN3067', 'JAPN4088', 'GCIN2013', 'POLI3126', 'SOCI2090'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'JAPN2088' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'JAPN4101' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'popular culture' }).some((course) => course.courseCode === 'JAPN2058'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'manga' }).some((course) => course.courseCode === 'JAPN3062'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'video game' }).some((course) => course.courseCode === 'GCIN2013'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'World city Tokyo' }).some((course) => course.courseCode === 'SOCI2090'));
});

test('HKU Korean Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const koreanStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Korean Studies)');
  const major = ugService.listMajors(koreanStudies.id).find((item) => item.nameEn === 'Korean Studies');
  const profile = ugService.getMajorProfile(koreanStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(koreanStudies.id, major.id);

  assert.equal(koreanStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 52);
  assert.equal(courses.length, 52);
  ['KORE1001', 'KORE2001', 'KORE3044', 'KORE4008', 'KORE2028', 'KORE2038', 'KORE3043', 'ARTH2097', 'GEOG2153', 'GEOG3403'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'KORE2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'KORE4008' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'K-pop' }).some((course) => course.courseCode === 'GEOG2153'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'North Korea' }).some((course) => course.courseCode === 'KORE2028'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'Korean War' }).some((course) => course.courseCode === 'KORE2044'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'urban planning' }).some((course) => course.courseCode === 'GEOG3403'));
});

test('HKU Music exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const music = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Music)');
  const major = ugService.listMajors(music.id).find((item) => item.nameEn === 'Music');
  const profile = ugService.getMajorProfile(music.id, major.id, '2026');
  const courses = ugService.listMajorCourses(music.id, major.id);

  assert.equal(music.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 55);
  assert.equal(courses.length, 55);
  ['MUSI1023', 'MUSI2010', 'MUSI2070', 'MUSI2081', 'MUSI3028', 'MUSI3039', 'MUSI3042', 'MUSI4002', 'MUSI4003', 'MUSI2088'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'MUSI1023' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'MUSI4003' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'AI' }).some((course) => course.courseCode === 'MUSI2088'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'film music' }).some((course) => course.courseCode === 'MUSI2044'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'gamelan' }).some((course) => course.courseCode === 'MUSI2068'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'environment' }).some((course) => course.courseCode === 'MUSI3041'));
});

test('HKU Philosophy exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const philosophy = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Philosophy)');
  const major = ugService.listMajors(philosophy.id).find((item) => item.nameEn === 'Philosophy');
  const profile = ugService.getMajorProfile(philosophy.id, major.id, '2026');
  const courses = ugService.listMajorCourses(philosophy.id, major.id);

  assert.equal(philosophy.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 94);
  assert.equal(courses.length, 94);
  ['PHIL1012', 'PHIL1034', 'PHIL2225', 'PHIL2369', 'PHIL2481', 'PHIL2800', 'PHIL3920', 'PHIL4810', 'PHIL4920'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'PHIL3920' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PHIL4920' && course.courseType === 'capstone' && course.credits === 12));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'artificial intelligence' }).some((course) => course.courseCode === 'PHIL2225'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Environmental philosophy' }).some((course) => course.courseCode === 'PHIL2369'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Buddhist philosophy' }).some((course) => course.courseCode === 'PHIL2800'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Senior thesis' }).some((course) => course.courseCode === 'PHIL4920'));
});

test('HKU Translation exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const translation = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Translation)');
  const major = ugService.listMajors(translation.id).find((item) => item.nameEn === 'Translation');
  const profile = ugService.getMajorProfile(translation.id, major.id, '2026');
  const courses = ugService.listMajorCourses(translation.id, major.id);

  assert.equal(translation.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 41);
  assert.equal(courses.length, 41);
  ['CHIN1311', 'CHIN2336', 'CHIN2369', 'CHIN2373', 'CHIN2320', 'CHIN2321'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN2320' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CHIN2321' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'translation technologies' }).some((course) => course.courseCode === 'CHIN2373'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'legal interpreting' }).some((course) => course.courseCode === 'CHIN2343'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'Journey to the West' }).some((course) => course.courseCode === 'CHIN2377'));
});

test('CUHK Pharmacy exposes the official attendance-year curriculum and alternative final-year paths', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const pharmacy = programmes.find((programme) => programme.jupasCode === 'JS4525');
  const major = ugService.listMajors(pharmacy.id).find((item) => item.nameEn === 'Pharmacy');
  const profile = ugService.getMajorProfile(pharmacy.id, major.id, '2026');
  const courses = ugService.listMajorCourses(pharmacy.id, major.id);

  assert.equal(pharmacy.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 57);
  assert.equal(courses.length, 57);
  ['MEDF1011', 'PHAR2710', 'PHAR2711', 'PHAR2018', 'PHAR4911', 'PHAR4912', 'PHAR4201', 'PHAR4301', 'PHAR4901'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'MEDF1011' && course.recommendedYear === 1 && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'PHAR2018' && course.recommendedYear === 3 && course.semester === 'Summer'));
  assert(courses.some((course) => course.courseCode === 'PHAR4911' && course.credits === 0 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PHAR4912' && course.credits === 6 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PHAR4201' && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'PHAR4901' && course.requirementGroups.some((group) => group.includes('choose one Clerkship option'))));
});

test('CUHK Electronic Engineering exposes the official 2025-26 standard four-year curriculum', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const electronicEngineering = programmes.find((programme) => programme.jupasCode === 'JS4434');
  const major = ugService.listMajors(electronicEngineering.id).find((item) => item.nameEn === 'Electronic Engineering');
  const profile = ugService.getMajorProfile(electronicEngineering.id, major.id, '2026');
  const courses = ugService.listMajorCourses(electronicEngineering.id, major.id);

  assert.equal(electronicEngineering.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 79);
  assert.equal(courses.length, 79);
  ['ENGG1110', 'ESTR1002', 'ENGG1111', 'ELEG2602', 'ELEG4998', 'ELEG4999', 'ELEG3910', 'SEEM2440', 'ESTR2500', 'DOTE1030'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(!courses.some((course) => course.courseCode === 'ENGG1040'));
  assert(courses.some((course) => course.courseCode === 'ENGG1111' && course.credits === 0 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'ELEG2602' && course.semester === 'Summer'));
  assert(courses.some((course) => course.courseCode === 'ELEG4999' && course.recommendedYear === 4 && course.semester === 'Term 2' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'DOTE1030' && course.recommendedYear === 0 && course.requirementGroups.some((group) => group.includes('choose one of SEEM2440'))));
});

test('CUHK Mechanical and Automation Engineering exposes the complete 2026-27 major course list', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const mechanical = programmes.find((programme) => programme.jupasCode === 'JS4408');
  const major = ugService.listMajors(mechanical.id).find((item) => item.nameEn === 'Mechanical and Automation Engineering');
  const profile = ugService.getMajorProfile(mechanical.id, major.id, '2026');
  const courses = ugService.listMajorCourses(mechanical.id, major.id);

  assert.equal(mechanical.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 104);
  assert.equal(courses.length, 104);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 104);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Faculty Package'))).length, 7);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Foundation Courses'))).length, 8);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Major Required Courses'))).length, 18);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Breadth pool'))).length, 37);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Depth pool'))).length, 30);
  ['ENGG1110', 'ESTR1002', 'ENGG1111', 'MAEG2602', 'MAEG4998', 'MAEG4999', 'ESTR4998', 'ESTR4999', 'SEEM2440', 'ESTR2500', 'DOTE1030'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  ['ENGG1040', 'PHYS1003', 'EEEN4030', 'ESTR4404'].forEach((courseCode) => {
    assert(!courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'ENGG1111' && course.credits === 0 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'PHYS1110' && course.recommendedYear === 1 && course.semester === ''));
  assert(courses.some((course) => course.courseCode === 'MAEG2602' && course.recommendedYear === 2 && course.semester === 'Summer'));
  assert(courses.some((course) => course.courseCode === 'MAEG4999' && course.recommendedYear === 4 && course.semester === 'Term 2'));
  assert(courses.some((course) => course.courseCode === 'ESTR4999' && course.recommendedYear === 0 && course.semester === ''));
});

test('HKUST Mathematics exposes all explicitly named 2025-26 Track courses without fabricating open pools', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const mathematics = programmes.find((programme) => programme.nameEn === 'BSc in Mathematics');
  const major = ugService.listMajors(mathematics.id).find((item) => item.nameEn === 'BSc in Mathematics');
  const profile = ugService.getMajorProfile(mathematics.id, major.id, '2026');
  const courses = ugService.listMajorCourses(mathematics.id, major.id);

  assert.equal(mathematics.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 85);
  assert.equal(courses.length, 85);
  ['MATH1013', 'MATH2043', 'MATH2431', 'MATH4991', 'MATH4999', 'COMP2012H', 'COMP3711H', 'SCIE3500', 'SCIE4500'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(!courses.some((course) => course.courseCode === 'MATH4333'));
  assert(courses.some((course) => course.courseCode === 'MATH4823' && course.credits === 0 && /1-4 variable credits/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'MATH4991' && course.recommendedYear === 4 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'SCIE4500' && course.recommendedYear === 0 && course.courseType === 'capstone'));
});

test('HKUST Chemistry preserves the 2025-26 Track and Option course roles and variable internship credit', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const chemistry = programmes.find((programme) => programme.nameEn === 'BSc in Chemistry');
  const major = ugService.listMajors(chemistry.id).find((item) => item.nameEn === 'BSc in Chemistry');
  const profile = ugService.getMajorProfile(chemistry.id, major.id, '2026');
  const courses = ugService.listMajorCourses(chemistry.id, major.id);

  assert.equal(chemistry.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 57);
  assert.equal(courses.length, 57);
  ['CHEM1011', 'CHEM2401', 'CHEM2410', 'CHEM3420', 'CHEM4350', 'CHEM4250', 'CHEM4550', 'CHEM4430', 'SCIE3500', 'SCIE4500'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHEM2410' && course.credits === 3));
  assert(courses.some((course) => course.courseCode === 'CHEM3610' && course.credits === 0 && /2-3 variable credits/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'CHEM4430' && course.requirementGroups.some((group) => group.includes('IRE Required'))));
  assert(courses.some((course) => course.courseCode === 'CHEM4692' && course.courseType === 'capstone'));
});

test('HKUST Physics uses the fixed 2025-26 curriculum without importing the later AI Option', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const physics = programmes.find((programme) => programme.nameEn === 'BSc in Physics');
  const major = ugService.listMajors(physics.id).find((item) => item.nameEn === 'BSc in Physics');
  const profile = ugService.getMajorProfile(physics.id, major.id, '2026');
  const courses = ugService.listMajorCourses(physics.id, major.id);

  assert.equal(physics.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 56);
  assert.equal(courses.length, 56);
  ['PHYS1111', 'PHYS3053', 'PHYS3031', 'PHYS3090', 'PHYS4291', 'PHYS4813', 'MATH4223', 'SCIE3500', 'SCIE4500'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  ['PHYS3243', 'PHYS3245', 'PHYS4245', 'COMP1021', 'COMP1028'].forEach((courseCode) => {
    assert(!courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'PHYS2021' && /Major PDF/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'PHYS4813' && course.credits === 1));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKU Global Creative Industries exposes the pending 2026-27 official syllabus without closing open pools', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6274');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Arts in Global Creative Industries');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 98);
  assert.equal(courses.length, 98);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 98);
  ['SOFM1001', 'SOFM2003', 'SOFM3001', 'SOFM4001', 'SOFM4002', 'GCIN2105', 'SOCI2055', 'GLAS2101', 'AILT1001', 'CAES1001'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  ['GCIN1001', 'GCIN4001', 'FOSS2018', 'MUSI2079'].forEach((courseCode) => {
    assert(!courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CAES1001' && course.credits === 0 && course.recommendedYear === 1));
  assert(courses.some((course) => course.courseCode === 'SOFM2003' && course.courseType === 'internship' && course.recommendedYear === 2));
  assert(courses.some((course) => course.courseCode === 'SOFM4002' && course.courseType === 'capstone' && course.recommendedYear === 4));
  assert(courses.some((course) => course.courseCode === 'GCIN2105' && /MUSI2079/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'SOCI2055' && course.requirementGroups.some((group) => group.includes('Film & Media Communications / Visual Arts'))));
  assert(courses.filter((course) => course.courseType === 'major_elective').every((course) => course.semester === ''));
});

test('HKU Humanities and Digital Technologies exposes the pending 2026-27 coded curriculum without inventing open focus pools', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6286');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Arts in Humanities and Digital Technologies');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 80);
  assert.equal(courses.length, 80);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 80);
  ['HUDT1001', 'HUDT1002', 'HUDT2001', 'HUDT2002', 'HUDT3002', 'HUDT3100', 'HUDT4001', 'HUDT2205', 'GCIN2118', 'HIST3080'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'HUDT1001' && course.recommendedYear === 1 && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'HUDT2002' && course.recommendedYear === 2 && course.semester === 'Semester 2'));
  assert(courses.some((course) => course.courseCode === 'HUDT3100' && course.courseType === 'internship' && course.recommendedYear === 0));
  assert(courses.some((course) => course.courseCode === 'HUDT2205' && course.requirementGroups.some((group) => group.includes('Gaming Studies Advanced'))));
  assert(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Advanced'))).every((course) => course.semester === ''));
});

test('HKU AI and Data Science double degree preserves the official coded curriculum and internship credit conflict boundary', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6298');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Arts and Bachelor of Engineering in Artificial Intelligence and Data Science');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 67);
  assert.equal(courses.length, 67);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 67);
  ['AIHU1001', 'AIHU4001', 'COMP1117', 'COMP3340', 'COMP3512', 'COMP4503', 'MATH2101', 'MATH2211', 'FITE3010', 'SDST3622', 'CAES9542'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'COMP3512' && course.courseType === 'internship' && course.credits === 6 && course.recommendedYear === 0));
  assert(courses.some((course) => course.courseCode === 'COMP4503' && course.courseType === 'capstone' && course.recommendedYear === 5));
  assert(courses.some((course) => course.courseCode === 'MATH2101' && course.requirementGroups.some((group) => group.includes('alternative to MATH2012'))));
  assert(courses.some((course) => course.courseCode === 'FITE3010' && course.requirementGroups.some((group) => group.includes('COMP3323/FITE3010 alternative'))));
  assert(courses.every((course) => course.semester === ''));
});

test('HKU Pharmacy exposes the applicable four-year professional curriculum and closed Year 4 elective pool', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6494');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Pharmacy');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const professionalRequired = courses.filter((course) => course.requirementGroups.some((group) => group.startsWith('Professional Core — Year')) && course.courseType !== 'major_elective');
  const professionalElectives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Year 4 Electives')));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 33);
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 33);
  assert.equal(professionalRequired.length, 24);
  assert.equal(professionalRequired.reduce((sum, course) => sum + course.credits, 0), 192);
  assert.equal(professionalElectives.length, 6);
  assert(professionalElectives.every((course) => course.credits === 6 && course.recommendedYear === 4));
  ['BPHM1111', 'BPHM2143', 'BPHM3147', 'BPHM4161', 'BPHM4144', 'CAES9720', 'CEMD9005'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'BPHM4161' && course.courseType === 'capstone' && course.credits === 12));
  assert(courses.every((course) => course.semester === ''));
});

test('HKU Chinese Medicine exposes the applicable six-year professional curriculum and clinical clerkship', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === '6482');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Chinese Medicine');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const academicCore = courses.filter((course) => course.requirementGroups.some((group) => (
    group.startsWith('Professional Core —')
      && !group.includes('Disciplinary Electives')
      && !group.includes('Clinical Attachment')
      && !group.includes('Final-year Clinical Clerkship')
  )));
  const clinical = courses.filter((course) => course.requirementGroups.some((group) => (
    group.includes('Clinical Attachment') || group.includes('Final-year Clinical Clerkship')
  )));
  const disciplinaryElectives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Disciplinary Electives')));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 55);
  assert.equal(courses.length, 55);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 55);
  assert.deepEqual([academicCore.length, academicCore.reduce((sum, course) => sum + course.credits, 0)], [34, 234]);
  assert.deepEqual([clinical.length, clinical.reduce((sum, course) => sum + course.credits, 0)], [6, 114]);
  assert.equal(disciplinaryElectives.length, 10);
  assert(disciplinaryElectives.every((course) => course.credits === 3));
  ['BCHM1601', 'BCHM3602', 'BCHM4608', 'BCHM5609', 'BCHM6601', 'CAES9730', 'CEMD9003'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'BCHM6601' && course.courseType === 'capstone' && course.credits === 90 && course.recommendedYear === 6));
  assert(courses.some((course) => course.courseCode === 'BCHM4608' && course.recommendedYear === 0 && /spans Year 4/.test(course.description)));
  assert.equal(courses.filter((course) => course.semester).length, 7);
});

test('HKU 6717 exposes all 12 published BSocSc first- and second-major course structures', () => {
  const expected = [
    {
      programmeId: 'HKU-UG-6717-55',
      programmeName: 'Bachelor of Social Sciences (Major in Cognitive Science)',
      majorId: 'HKU-UG-6717-55-M1',
      majorName: 'Cognitive Science',
      courseCount: 44,
      representatives: { foundation: 'COMP1117', core: 'PSYC2066', major_elective: 'COMP3270', capstone: 'PSYC4068' }
    },
    {
      programmeId: 'HKU-UG-6717-56',
      programmeName: 'Bachelor of Social Sciences (Major in Computational Social Science)',
      majorId: 'HKU-UG-6717-56-M1',
      majorName: 'Computational Social Science',
      courseCount: 33,
      representatives: { core: 'SOCI3001', major_elective: 'BSDS3002', capstone: 'FOSS4007', experiential: 'FOSS2018' }
    },
    {
      programmeId: 'HKU-UG-6717-57',
      programmeName: 'Bachelor of Social Sciences (Major in Counselling)',
      majorId: 'HKU-UG-6717-57-M1',
      majorName: 'Counselling',
      courseCount: 40,
      representatives: { foundation: 'SOWK1004', core: 'SOWK2137', major_elective: 'SOWK2020', capstone: 'SOWK4009' }
    },
    {
      programmeId: 'HKU-UG-6717-58',
      programmeName: 'Bachelor of Social Sciences (Major in Criminology)',
      majorId: 'HKU-UG-6717-58-M1',
      majorName: 'Criminology',
      courseCount: 49,
      representatives: { foundation: 'SOCI1001', core: 'SOCI2030', major_elective: 'JMSC2001', capstone: 'SOCI4096' }
    },
    {
      programmeId: 'HKU-UG-6717-59',
      programmeName: 'Bachelor of Social Sciences (Major in Geography)',
      majorId: 'HKU-UG-6717-59-M1',
      majorName: 'Geography',
      courseCount: 98,
      representatives: { core: 'GEOG2090', major_elective: 'GEOG3424', capstone: 'GEOG4003', experiential: 'FOSS2019' }
    },
    {
      programmeId: 'HKU-UG-6717-60',
      programmeName: 'Bachelor of Social Sciences (Major in Media and Cultural Studies)',
      majorId: 'HKU-UG-6717-60-M1',
      majorName: 'Media and Cultural Studies',
      courseCount: 51,
      representatives: { foundation: 'SOCI1001', core: 'SOCI2043', major_elective: 'AMER2014', capstone: 'SOCI4098' }
    },
    {
      programmeId: 'HKU-UG-6717-61',
      programmeName: 'Bachelor of Social Sciences (Major in Neuroscience)',
      majorId: 'HKU-UG-6717-61-M1',
      majorName: 'Neuroscience',
      courseCount: 22,
      representatives: { foundation: 'PSYC1001', core: 'PSYC2101', major_elective: 'BBMS3011', capstone: 'PSYC3061' }
    },
    {
      programmeId: 'HKU-UG-6717-62',
      programmeName: 'Bachelor of Social Sciences (Major in Politics and Public Administration)',
      majorId: 'HKU-UG-6717-62-M1',
      majorName: 'Politics and Public Administration',
      courseCount: 111,
      representatives: { foundation: 'POLI1003', core: 'POLI2104', major_elective: 'POLI3154', capstone: 'POLI4046', experiential: 'FOSS2018' }
    },
    {
      programmeId: 'HKU-UG-6717-63',
      programmeName: 'Bachelor of Social Sciences (Major in Psychology)',
      majorId: 'HKU-UG-6717-63-M1',
      majorName: 'Psychology',
      courseCount: 41,
      representatives: { foundation: 'PSYC1001', core: 'PSYC2007', major_elective: 'PSYC2002', capstone: 'PSYC3051' }
    },
    {
      programmeId: 'HKU-UG-6717-64',
      programmeName: 'Bachelor of Social Sciences (Major in Social Policy and Social Development)',
      majorId: 'HKU-UG-6717-64-M1',
      majorName: 'Social Policy and Social Development',
      courseCount: 33,
      representatives: { core: 'SOWK2141', major_elective: 'SOWK4055', capstone: 'SOWK4011', experiential: 'FOSS2024' }
    },
    {
      programmeId: 'HKU-UG-6717-65',
      programmeName: 'Bachelor of Social Sciences (Major in Sociology)',
      majorId: 'HKU-UG-6717-65-M1',
      majorName: 'Sociology',
      courseCount: 82,
      representatives: { core: 'SOCI3024', major_elective: 'SOCI3105', capstone: 'SOCI4095', experiential: 'FOSS2025' }
    },
    {
      programmeId: 'HKU-UG-6717-66',
      programmeName: 'Bachelor of Social Sciences (Major in Urban Governance)',
      majorId: 'HKU-UG-6717-66-M1',
      majorName: 'Urban Governance',
      courseCount: 83,
      representatives: { foundation: 'GEOG1002', core: 'GEOG2013', major_elective: 'GEOG2018', capstone: 'GEOG4001' }
    }
  ];

  assert.equal(expected.length, 12);
  expected.forEach(({ programmeId, programmeName, majorId, majorName, courseCount, representatives }) => {
    const programme = ugService.getProgramme(programmeId);
    const majors = ugService.listMajors(programmeId);
    const courses = ugService.listMajorCourses(programmeId, majorId);

    assert.equal(programme.id, programmeId);
    assert.equal(programme.code, '6717');
    assert.equal(programme.nameEn, programmeName);
    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.deepEqual(majors.map((major) => [major.id, major.nameEn]), [[majorId, majorName]]);
    assert.equal(programme.codedCourseCount, courseCount);
    assert.equal(majors[0].codedCourseCount, courseCount);
    assert.equal(courses.length, courseCount);
    assert.equal(new Set(courses.map((course) => course.courseCode)).size, courseCount);
    Object.entries(representatives).forEach(([courseType, courseCode]) => {
      assert(courses.some((course) => course.courseCode === courseCode && course.courseType === courseType));
    });
    courses.forEach((course) => {
      assert.doesNotMatch(`${course.courseCode} ${course.titleEn}`, /(?:\b(?:TODO|TBC|TBD|PLACEHOLDER)\b|待填|待补|xxx)/i);
    });
  });
});

test('HKBU Accounting exposes only the closed 67-unit BBA and concentration requirements', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.code === 'BBA(ACCT)');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Business Administration (Hons) - Accounting Concentration');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 24);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 67);
  ['ACCT1005', 'BUSI1007', 'BUSI4005', 'ACCT2005', 'ACCT4006'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(!courses.some((course) => course.courseCode === 'ACCT3007'));
  assert.equal(courses.filter((course) => course.requirementGroups.includes('BBA Required Courses')).length, 17);
  assert.equal(courses.filter((course) => course.requirementGroups.includes('Accounting Concentration Required Courses')).length, 7);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Religion, Philosophy and Ethics preserves four elective groups and duplicate group eligibility', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS2025');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Arts (Hons) in Religion, Philosophy and Ethics');
  const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const required = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Major Required Courses')));
  const electives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Major Elective Courses')));
  const projects = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Honours Project')));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 57);
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 57);
  assert.deepEqual([required.length, required.reduce((sum, course) => sum + course.credits, 0)], [7, 21]);
  assert.equal(electives.length, 48);
  assert(electives.every((course) => course.credits === 3));
  assert.deepEqual([projects.length, projects.reduce((sum, course) => sum + course.credits, 0)], [2, 6]);
  assert(courses.some((course) => course.courseCode === 'RELI2037' && course.requirementGroups.some((group) => group.includes('Groups A / D'))));
  assert(courses.some((course) => course.courseCode === 'RELI3235' && course.requirementGroups.some((group) => group.includes('Groups B / C'))));
  assert(courses.some((course) => course.courseCode === 'RELI2007' && /Group A/.test(course.prerequisites)));
  assert(courses.some((course) => course.courseCode === 'RELI2015' && /Groups B and C/.test(course.prerequisites)));
  assert(courses.some((course) => course.courseCode === 'RELI2035' && /Group D/.test(course.prerequisites)));
  assert(courses.some((course) => course.courseCode === 'RELI4898' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'RELI4899' && course.courseType === 'capstone'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2060 keeps Music and Creative Industries course identities isolated by Major', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2060');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.nameEn, major]));
  const music = ugService.listMajorCourses(programme.id, majors.Music.id);
  const creativeIndustries = ugService.listMajorCourses(programme.id, majors['Creative Industries'].id);
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2060-music-creative-industries-2025.json'), 'utf8'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 189);
  assert.equal(majors.Music.id, 'HKBU-UG-BA-BMUS-MUSIC-CI-3-M1');
  assert.equal(majors['Creative Industries'].id, 'HKBU-UG-BA-BMUS-MUSIC-CI-3-M2');
  assert.equal(music.length, 96);
  assert.equal(creativeIndustries.length, 93);
  assert.equal(new Set(music.map((course) => course.courseCode)).size, 96);
  assert.equal(new Set(creativeIndustries.map((course) => course.courseCode)).size, 93);
  assert.deepEqual(
    music.filter((course) => course.credits === 0).map((course) => course.courseCode),
    ['MUSI1028', 'MUSI1029', 'MUSI2028', 'MUSI2029', 'MUSI3028', 'MUSI3029', 'MUSI4028', 'MUSI4029', 'MUSI2037', 'MUSI3048', 'MUSI3049', 'MUSI4048', 'MUSI4049']
  );
  assert.equal(creativeIndustries.filter((course) => course.credits === 0).length, 0);
  assert(music.some((course) => course.courseCode === 'MUSI3055' && course.credits === 3 && /coordinator-directed open pool/.test(course.requirementGroups[0])));
  assert(!creativeIndustries.some((course) => course.courseCode === 'MUSI3055'));
  assert(creativeIndustries.some((course) => course.courseCode === 'MUSI3086' && course.courseType === 'internship'));
  assert(!music.some((course) => course.courseCode === 'MUSI3086'));
  [music, creativeIndustries].forEach((courses) => {
    const soundArt = courses.find((course) => course.courseCode === 'MUSI2057');
    assert.equal(soundArt.credits, 2);
    assert.match(soundArt.description, /individual course page assigns 3 units/);
    assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
    assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  });
  assert.match(source.note, /Major Courses as 69 units, but the explicit structure is 37 \+ 21 = 58 units/);
  assert.match(source.note, /displayed Chamber Music path contains six 1-unit courses.*producing 23/);
  assert.match(source.note, /Directed Studies is an open coordinator-directed 21-unit pool/);
});

test('HKBU JS2620 models PERM and Sports Science as separate selectable Majors', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2620');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.id, major]));
  const perm = ugService.listMajorCourses(programme.id, 'HKBU-UG-BA-PERM-14-M1');
  const sportsScience = ugService.listMajorCourses(programme.id, 'HKBU-UG-BA-PERM-14-M2');
  const sharedCodes = perm.filter((course) => sportsScience.some((candidate) => candidate.courseCode === course.courseCode));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 91);
  assert.equal(majors['HKBU-UG-BA-PERM-14-M1'].codedCourseCount, 51);
  assert.equal(majors['HKBU-UG-BA-PERM-14-M2'].nameEn, 'Sports Science Major');
  assert.equal(majors['HKBU-UG-BA-PERM-14-M2'].codedCourseCount, 40);
  assert.equal(perm.length, 51);
  assert.equal(sportsScience.length, 40);
  assert.equal(new Set(perm.map((course) => course.courseCode)).size, 51);
  assert.equal(new Set(sportsScience.map((course) => course.courseCode)).size, 40);
  assert.equal(sharedCodes.length, 26);
  assert(perm.some((course) => course.courseCode === 'PERM3056' && course.courseType === 'internship' && /20 elective units total/.test(course.requirementGroups[0])));
  assert(perm.some((course) => course.courseCode === 'PERM3057' && course.courseType === 'internship'));
  assert(!perm.some((course) => course.courseCode === 'PERM4027'));
  assert(!perm.some((course) => course.courseCode === 'CMED1046'));
  assert(sportsScience.some((course) => course.courseCode === 'PERM4027' && /Required Courses/.test(course.requirementGroups[0])));
  assert(sportsScience.some((course) => course.courseCode === 'CMED1046' && /Chinese-proficient path/.test(course.requirementGroups[0])));
  assert(sportsScience.some((course) => course.courseCode === 'PERM3066' && /not proficient in Chinese/.test(course.requirementGroups[0])));
  [perm, sportsScience].forEach((courses) => {
    assert(courses.some((course) => course.courseCode === 'PERM4898' && course.courseType === 'capstone'));
    assert(courses.some((course) => course.courseCode === 'PERM4899' && course.courseType === 'capstone'));
    assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  });
  assert(perm.every((course) => course.requirementGroups.every((group) => !group.includes('Sports Science'))));
  assert(sportsScience.every((course) => course.requirementGroups.every((group) => !group.includes('PERM Major'))));
});

test('HKBU Social Work preserves field practice, elective substitution and Honours Project credits', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2660');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const required = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Major Required Courses')));
  const electives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Major Elective Courses')));
  const fieldPractice = courses.filter((course) => course.courseType === 'internship');
  const projects = courses.filter((course) => course.courseType === 'capstone');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 40);
  assert.deepEqual([required.length, required.reduce((sum, course) => sum + course.credits, 0)], [21, 45]);
  assert.deepEqual([electives.length, electives.reduce((sum, course) => sum + course.credits, 0)], [14, 42]);
  assert.deepEqual(fieldPractice.map((course) => [course.courseCode, course.credits]), [['SOWK3005', 10], ['SOWK4008', 5], ['SOWK4009', 5]]);
  assert.deepEqual(projects.map((course) => [course.courseCode, course.credits]), [['SOWK4898', 1], ['SOWK4899', 2]]);
  assert(courses.some((course) => course.courseCode === 'SOWK3005' && /21 rather than 18 units/.test(course.description)));
  assert(courses.some((course) => course.courseCode === 'SOWK1027' && course.credits === 0.5 && /course directory returns no result/.test(course.description)));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Arts and Technology preserves three concentrations and its published unit conflicts', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2920');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2920-arts-technology-2025.json'), 'utf8'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 86);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 86);
  assert.equal(courses.filter((course) => course.requirementGroups.includes('Transdisciplinary Common Core · all required / 9 units')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups.includes('Programme-specific Knowledge / Skill Courses · all required / 21 units')).length, 7);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Experiential Learning'))).length, 3);
  assert(courses.some((course) => course.courseCode === 'ARTT3007' && course.courseType === 'internship' && course.credits === 3));
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'capstone').map((course) => [course.courseCode, course.credits]),
    [['ARTT4005', 3], ['ARTT4006', 7]]
  );
  ['Sound Concentration', 'Technology Concentration', 'Visual Concentration'].forEach((name) => {
    assert(courses.some((course) => course.requirementGroups.some((group) => group.includes(name))));
  });
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Concentration Free Elective Courses'))).length, 60);
  ['MUSI4025', 'MUSI4026', 'MUSI4027'].forEach((courseCode) => {
    const course = courses.find((candidate) => candidate.courseCode === courseCode);
    assert.equal(course.credits, 2);
    assert.match(course.description, /Concentration table displays 3 units/);
  });
  assert.match(source.note, /three listed 3-unit courses but includes four 2-unit Composition for Screen courses/);
  assert.match(source.note, /2026-2027 Handbook endpoint currently returns HTTP 401/);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2410 preserves the six-year biomedical, Chinese medicine and clinical structure', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2410');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2410-chinese-medicine-biomedical-science-2025.json'), 'utf8'));
  const inGroup = (group) => courses.filter((course) => course.requirementGroups.includes(group));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.studyPeriod, '6 years');
  assert.equal(courses.length, 71);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 71);
  assert.deepEqual(
    [inGroup('Biomedical Sciences · all required / 52 units').length, inGroup('Biomedical Sciences · all required / 52 units').reduce((sum, course) => sum + course.credits, 0)],
    [24, 52]
  );
  assert.deepEqual(
    [inGroup('Chinese Medicine · all required / 97 units').length, inGroup('Chinese Medicine · all required / 97 units').reduce((sum, course) => sum + course.credits, 0)],
    [31, 97]
  );
  assert.deepEqual(
    inGroup('Clinical Internship in Chinese Medicine · all required / 49 units').map((course) => [course.courseCode, course.credits]),
    [['CMED4015', 12], ['CMED4018', 19], ['CMED4019', 18]]
  );
  assert.deepEqual(
    inGroup('Honours Project · both required / 6 units').map((course) => [course.courseCode, course.credits]),
    [['BMSC4898', 3], ['BMSC4899', 3]]
  );
  assert.equal(inGroup('Recommended Free Electives · open recommendation list / complete 9 units').length, 11);
  ['BCME2302', 'BCME2312', 'BCHM3901', 'BCHM3905', 'BCHM3909'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert.match(source.note, /open recommendation list and is not presented as a closed elective pool/);
  assert.match(source.note, /excluded from the BSc \(Hons\) in Biomedical Science honours-classification GPA calculation/);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2020 keeps five Arts Majors and their course identities isolated', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2020');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.id, major]));
  const expectedCounts = {
    'HKBU-UG-BA-1-M1': 74,
    'HKBU-UG-BA-1-M2': 62,
    'HKBU-UG-BA-1-M3': 86,
    'HKBU-UG-BA-1-M4': 66,
    'HKBU-UG-BA-1-M5': 50
  };
  const coursesByMajor = Object.fromEntries(Object.keys(expectedCounts).map((majorId) => [
    majorId,
    ugService.listMajorCourses(programme.id, majorId)
  ]));
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2020-bachelor-arts-majors-2025.json'), 'utf8'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 338);
  assert.equal(Object.keys(majors).length, 5);
  Object.entries(expectedCounts).forEach(([majorId, count]) => {
    assert.equal(majors[majorId].codedCourseCount, count);
    assert.equal(coursesByMajor[majorId].length, count);
    assert.equal(new Set(coursesByMajor[majorId].map((course) => course.courseCode)).size, count);
    assert(coursesByMajor[majorId].every((course) => course.recommendedYear === 0 && course.semester === ''));
  });
  assert(coursesByMajor['HKBU-UG-BA-1-M1'].some((course) => course.courseCode === 'CHIL3026'));
  assert(coursesByMajor['HKBU-UG-BA-1-M2'].some((course) => course.courseCode === 'CHIL3026'));
  assert(!coursesByMajor['HKBU-UG-BA-1-M3'].some((course) => course.courseCode === 'CHIL3026'));
  assert(coursesByMajor['HKBU-UG-BA-1-M2'].some((course) => course.courseCode === 'WRIT4006' && course.courseType === 'internship'));
  assert(coursesByMajor['HKBU-UG-BA-1-M2'].some((course) => course.courseCode === 'HUMN2036' && /Either HUMN2036 or HUMN3037/.test(course.requirementGroups[0])));
  assert(coursesByMajor['HKBU-UG-BA-1-M3'].some((course) => course.courseCode === 'ENGL2006' && /choose 1 of ENGL2006 \/ ENGL2015/.test(course.requirementGroups[0])));
  assert(coursesByMajor['HKBU-UG-BA-1-M4'].some((course) => course.courseCode === 'HUMN3006' && /only for students without Chinese proficiency/.test(course.requirementGroups[0])));
  assert.deepEqual(
    coursesByMajor['HKBU-UG-BA-1-M5'].filter((course) => course.courseType === 'capstone').map((course) => course.courseCode),
    ['TRAN4888', 'TRAN4889']
  );
  assert.match(source.note, /uncoded 3-unit Third Language option.*is not fabricated as a coded course/);
  assert.match(source.note, /18 major-elective units plus 3 Free Elective units for 21 units in one group/);
});

test('HKBU JS2420 preserves the pharmacy practicum, elective pools and Honours Project', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2420');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const inGroup = (group) => courses.filter((course) => course.requirementGroups.includes(group));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 46);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 46);
  assert.deepEqual(
    [inGroup('Major Required Courses · all required / 90 units').length, inGroup('Major Required Courses · all required / 90 units').reduce((sum, course) => sum + course.credits, 0)],
    [37, 90]
  );
  assert.equal(inGroup('Major Elective Courses · first closed pool · take 1 course / 3 units').length, 3);
  assert.equal(inGroup('Major Elective Courses · second closed pool · take 2 courses / 6 units').length, 4);
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'internship').map((course) => [course.courseCode, course.credits]),
    [['PCMD1025', 1], ['PCMD4005', 3.5], ['PCMD4025', 0.5]]
  );
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'capstone').map((course) => [course.courseCode, course.credits]),
    [['PCMD4898', 3], ['PCMD4899', 3]]
  );
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2940 keeps both health and social well-being concentration paths explicit', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2940');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2940-health-social-wellbeing-2025.json'), 'utf8'));
  const hasGroupText = (text) => courses.filter((course) => course.requirementGroups.some((group) => group.includes(text)));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 67);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 67);
  assert.equal(hasGroupText('Major Courses — Transdisciplinary Common Core').length, 3);
  const sharedElectives = hasGroupText('both concentrations · choose 6 units within the selected concentration pool');
  assert.equal(hasGroupText('Health Technology and Informatics Concentration · choose 6 units').length + sharedElectives.length, 21);
  assert.equal(hasGroupText('Health and Social Wellness Concentration · choose 6 units').length + sharedElectives.length, 23);
  assert(courses.some((course) => course.courseCode === 'BIOL2047' && /Either BIOL2047 or PERM1006/.test(course.requirementGroups[0])));
  assert(courses.some((course) => course.courseCode === 'COMP1007' && /Either COMP1007 or COMP1025/.test(course.requirementGroups[0])));
  assert(courses.some((course) => course.courseCode === 'HSWB3005' && course.courseType === 'internship' && course.credits === 3));
  assert(courses.some((course) => course.courseCode === 'COMP3066' && course.courseType === 'internship'));
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'capstone').map((course) => [course.courseCode, course.credits]),
    [['HSWB4898', 6], ['HSWB4899', 6]]
  );
  assert.match(source.note, /Both paths require 73 units of Major Courses and 12 units of Honours Project/);
  assert.match(source.note, /Courses that have different roles across the two concentrations are stored once/);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2960 preserves three Digital Futures and Humanities concentration pools', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2960');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2960-digital-futures-humanities-2025.json'), 'utf8'));
  const concentrationCourses = (name) => courses.filter((course) => course.requirementGroups[0].includes(`· ${name} ·`));
  const concentrationRequired = (name) => concentrationCourses(name).filter((course) => course.requirementGroups[0].includes('concentration required course (*)'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 100);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 100);
  assert.equal(courses.filter((course) => course.requirementGroups.includes('Major Required Courses · all required / 46 units')).length, 15);
  assert.deepEqual(
    ['Creativity and Culture', 'Innovation, Policy and Value', 'Innovation Project Management'].map((name) => [name, concentrationCourses(name).length, concentrationRequired(name).length]),
    [['Creativity and Culture', 34, 3], ['Innovation, Policy and Value', 22, 3], ['Innovation Project Management', 27, 3]]
  );
  assert(courses.some((course) => course.courseCode === 'DIFH3006' && course.courseType === 'internship' && course.credits === 3));
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'capstone').map((course) => [course.courseCode, course.titleEn, course.credits]),
    [['DIFH4898', 'Digital Futures and Humanities Project I', 3], ['DIFH4899', 'Digital Futures and Humanities Project II', 3]]
  );
  assert.match(source.note, /all other courses in that concentration are retained as its published elective pool without inferring an unstated course count/);
  assert.match(source.note, /HIST3146 is included from the official Programme table although that row has no linked course page/);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU JS2510 isolates seven Science Majors and their concentration project roles', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2510');
  const expectedCounts = {
    'HKBU-UG-BSC-12-M1': 49,
    'HKBU-UG-BSC-12-M2': 38,
    'HKBU-UG-BSC-12-M3': 34,
    'HKBU-UG-BSC-12-M4': 42,
    'HKBU-UG-BSC-12-M5': 83,
    'HKBU-UG-BSC-12-M6': 78,
    'HKBU-UG-BSC-12-M7': 41
  };
  const coursesByMajor = Object.fromEntries(Object.keys(expectedCounts).map((majorId) => [
    majorId,
    ugService.listMajorCourses(programme.id, majorId)
  ]));
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2510-science-majors-2025.json'), 'utf8'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 365);
  assert.equal(ugService.listMajors(programme.id).length, 7);
  Object.entries(expectedCounts).forEach(([majorId, count]) => {
    assert.equal(coursesByMajor[majorId].length, count);
    assert.equal(new Set(coursesByMajor[majorId].map((course) => course.courseCode)).size, count);
    assert(coursesByMajor[majorId].every((course) => course.recommendedYear === 0 && course.semester === ''));
  });

  const appliedBiology = coursesByMajor['HKBU-UG-BSC-12-M1'];
  const doubleDegree = coursesByMajor['HKBU-UG-BSC-12-M2'];
  const bioresource = coursesByMajor['HKBU-UG-BSC-12-M3'];
  const biochemical = coursesByMajor['HKBU-UG-BSC-12-M4'];
  const computerScience = coursesByMajor['HKBU-UG-BSC-12-M5'];
  const mathematics = coursesByMajor['HKBU-UG-BSC-12-M6'];
  const greenEnergy = coursesByMajor['HKBU-UG-BSC-12-M7'];
  assert(appliedBiology.some((course) => course.courseCode === 'BIOL4898' && course.requirementGroups.every((group) => !group.includes('Artificial Intelligence'))));
  assert(doubleDegree.some((course) => course.courseCode === 'BIOL4898' && course.requirementGroups.every((group) => !group.includes('Artificial Intelligence'))));
  assert(bioresource.some((course) => course.courseCode === 'BIOL4998' && course.requirementGroups.every((group) => !group.includes('Computing and Software Technologies'))));
  assert(biochemical.some((course) => course.courseCode === 'CHEM4898' && course.requirementGroups.every((group) => !group.includes('Computing and Software Technologies'))));
  assert.deepEqual(
    computerScience.filter((course) => course.courseType === 'project').map((course) => course.courseCode).sort(),
    ['COMP4868', 'COMP4869', 'COMP4878', 'COMP4879', 'COMP4908', 'COMP4909', 'COMP4928', 'COMP4929']
  );
  assert(mathematics.some((course) => course.courseCode === 'MATH3495' && course.courseType === 'internship'));
  assert(greenEnergy.some((course) => course.courseCode === 'GEST4035' && course.credits === 3));
  assert.match(source.note, /does not publish Lincoln Year 4 course codes.*none are invented/);
  assert.match(source.note, /DMC single-concentration table states 6 elective units.*3-unit requirement/);
});

test('HKBU JS2610 keeps six Arts and Social Sciences Major pools isolated', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2610');
  const expectedCounts = {
    'HKBU-UG-BA-BSOCSC-13-M1': 31,
    'HKBU-UG-BA-BSOCSC-13-M2': 47,
    'HKBU-UG-BA-BSOCSC-13-M3': 137,
    'HKBU-UG-BA-BSOCSC-13-M4': 43,
    'HKBU-UG-BA-BSOCSC-13-M5': 78,
    'HKBU-UG-BA-BSOCSC-13-M6': 48
  };
  const coursesByMajor = Object.fromEntries(Object.keys(expectedCounts).map((majorId) => [
    majorId,
    ugService.listMajorCourses(programme.id, majorId)
  ]));
  const source = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'ug-course-supplements', 'hkbu-js2610-arts-social-sciences-majors-2025.json'), 'utf8'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 384);
  assert.equal(ugService.listMajors(programme.id).length, 6);
  Object.entries(expectedCounts).forEach(([majorId, count]) => {
    assert.equal(coursesByMajor[majorId].length, count);
    assert.equal(new Set(coursesByMajor[majorId].map((course) => course.courseCode)).size, count);
    assert(coursesByMajor[majorId].every((course) => course.recommendedYear === 0 && course.semester === ''));
  });

  const europeanStudies = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M1'];
  const geography = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M2'];
  const globalChina = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M3'];
  const government = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M4'];
  const history = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M5'];
  const sociology = coursesByMajor['HKBU-UG-BA-BSOCSC-13-M6'];
  assert(europeanStudies.some((course) => course.courseCode === 'FREN1205' && course.credits === 9));
  assert(!geography.some((course) => course.courseCode === 'FREN1205'));
  assert.deepEqual(globalChina.filter((course) => course.courseType === 'capstone').map((course) => course.courseCode), ['GCST4898', 'GCST4899']);
  assert(globalChina.some((course) => course.courseCode === 'GCST2025' && course.courseType === 'internship'));
  assert(globalChina.some((course) => course.courseCode === 'GCST3005' && course.courseType === 'major_elective'));
  assert(government.some((course) => course.courseCode === 'POLS4898' && course.courseType === 'capstone'));
  assert(history.some((course) => course.courseCode === 'HIST4898' && course.courseType === 'capstone'));
  assert.deepEqual(sociology.filter((course) => course.courseType === 'capstone').map((course) => [course.courseCode, course.credits]), [['SOCI4898', 3], ['SOCI4899', 3]]);
  assert.match(source.note, /states a 3-unit Honours Project but lists SOCI4898 and SOCI4899 at 3 units each/);
});

test('HKBU BBA isolates the closed concentration pools by Major', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS2120');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.nameEn, major]));
  const economics = ugService.listMajorCourses(programme.id, majors['Economics and Data Analytics'].id);
  const finance = ugService.listMajorCourses(programme.id, majors.Finance.id);
  const humanResources = ugService.listMajorCourses(programme.id, majors['Human Resources Management'].id);
  const informationSystems = ugService.listMajorCourses(programme.id, majors['Information Systems and Business Intelligence'].id);
  const marketing = ugService.listMajorCourses(programme.id, majors.Marketing.id);
  const retail = ugService.listMajorCourses(programme.id, majors['Strategic Retail Management and Innovation'].id);
  const fintech = ugService.listMajorCourses(programme.id, majors.FinTech.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(economics.length, 42);
  assert.equal(finance.length, 40);
  assert.equal(humanResources.length, 35);
  assert.equal(informationSystems.length, 43);
  assert.equal(marketing.length, 43);
  assert.equal(retail.length, 44);
  assert.equal(fintech.length, 0);
  assert.equal(new Set(economics.map((course) => course.courseCode)).size, 42);
  assert.equal(new Set(finance.map((course) => course.courseCode)).size, 40);
  assert.equal(new Set(humanResources.map((course) => course.courseCode)).size, 35);
  assert.equal(new Set(informationSystems.map((course) => course.courseCode)).size, 43);
  assert.equal(new Set(marketing.map((course) => course.courseCode)).size, 43);
  assert.equal(new Set(retail.map((course) => course.courseCode)).size, 44);
  assert.equal(economics.filter((course) => course.requirementGroups.includes('BBA Required Courses')).length, 17);
  assert.equal(finance.filter((course) => course.requirementGroups.includes('BBA Required Courses')).length, 17);
  assert.equal(economics.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 4);
  assert.equal(finance.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 4);
  assert.equal(economics.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 21);
  assert.equal(finance.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 19);
  assert.equal(humanResources.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 5);
  assert.equal(humanResources.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 13);
  assert.equal(informationSystems.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 3);
  assert.equal(informationSystems.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 23);
  assert.equal(marketing.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 5);
  assert.equal(marketing.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 21);
  assert.equal(retail.filter((course) => course.requirementGroups.includes('Concentration Required Courses')).length, 4);
  assert.equal(retail.filter((course) => course.requirementGroups.includes('Concentration Elective Courses')).length, 23);
  ['ECON3076', 'ECON3105', 'ECON4036'].forEach((courseCode) => {
    assert(economics.some((course) => course.courseCode === courseCode));
    assert(!finance.some((course) => course.courseCode === courseCode));
  });
  ['FINE3005', 'FINE3015', 'FINE4035'].forEach((courseCode) => {
    assert(finance.some((course) => course.courseCode === courseCode));
    assert(!economics.some((course) => course.courseCode === courseCode));
  });
  assert(humanResources.some((course) => course.courseCode === 'HRMN3027' && course.credits === 0 && /does not contribute/.test(course.description)));
  assert(!informationSystems.some((course) => course.courseCode === 'HRMN3027'));
  assert.equal(informationSystems.filter((course) => course.courseCode === 'BUSI4027').length, 1);
  assert(!humanResources.some((course) => course.courseCode === 'BUSI4027'));
  ['MKTG3017', 'REMT3006'].forEach((courseCode) => {
    assert(marketing.some((course) => course.courseCode === courseCode && course.requirementGroups.includes('Concentration Elective Courses')));
    assert(retail.some((course) => course.courseCode === courseCode && course.requirementGroups.includes('Concentration Required Courses')));
  });
  assert(economics.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(finance.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(humanResources.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(informationSystems.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(marketing.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(retail.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Business Computing and Data Analytics preserves the 66-unit Major and open COMP approval rule', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS2910');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Bachelor of Science (Hons) in Business Computing and Data Analytics');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 58);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 58);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Required Courses — Business'))).length, 8);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Required Courses — Computer Science'))).length, 9);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Business Applications'))).length, 18);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Analytical Methodologies'))).length, 21);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Projects'))).length, 2);
  assert(courses.some((course) => course.courseCode === 'COMP3056' && course.credits === 0 && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'COMP4918' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'COMP4919' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.requirementGroups.some((group) => /other COMP course subject to Department approval/.test(group))));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Global Entertainment preserves the 72-unit Major and variable-credit elective pool', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS2930');
  const major = ugService.listMajors(programme.id).find((item) => item.nameEn === 'Global Entertainment');
  const courses = ugService.listMajorCourses(programme.id, major.id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 57);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Transdisciplinary Common Core'))).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Experiential Learning'))).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Knowledge/Skills Core'))).length, 9);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Knowledge/Skills Electives'))).length, 40);
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Honours Project'))).length, 2);
  ['ITS1005', 'ITS2028', 'ITS2029'].forEach((courseCode) => assert(courses.some((course) => course.courseCode === courseCode)));
  assert(courses.some((course) => course.courseCode === 'BAGE3006' && course.courseType === 'internship' && course.credits === 3));
  assert(courses.some((course) => course.courseCode === 'BAGE4898' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'BAGE4899' && course.courseType === 'capstone'));
  ['VART3395', 'VART3405'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode && course.credits === 9));
  });
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Communication keeps Journalism and PRA course pools isolated with their official paths', () => {
  const hkbu = ugService.listUniversities().find((item) => item.code === 'HKBU');
  const programmes = ugService.listProgrammes({ universityId: hkbu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS2310');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.nameEn, major]));
  const journalism = ugService.listMajorCourses(programme.id, majors['Journalism and Digital Media'].id);
  const pra = ugService.listMajorCourses(programme.id, majors['Public Relations and Advertising'].id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(journalism.length, 104);
  assert.equal(pra.length, 51);
  assert.equal(new Set(journalism.map((course) => course.courseCode)).size, 104);
  assert.equal(new Set(pra.map((course) => course.courseCode)).size, 51);
  assert.equal(journalism.filter((course) => course.courseType === 'internship' && course.credits === 0).length, 2);
  assert.equal(pra.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(journalism.filter((course) => course.courseType === 'capstone').length, 5);
  assert.equal(pra.filter((course) => course.courseType === 'capstone').length, 1);
  assert(journalism.some((course) => course.requirementGroups.some((group) => /Broadcast Journalism Stream/.test(group))));
  assert(journalism.some((course) => course.requirementGroups.some((group) => /International Journalism Stream/.test(group))));
  assert(journalism.some((course) => course.requirementGroups.some((group) => /labels the pool as 14 courses but displays 20/.test(group))));
  assert(pra.some((course) => course.requirementGroups.some((group) => /Advertising and Branding Concentration/.test(group))));
  assert(pra.some((course) => course.requirementGroups.some((group) => /Public Relations Concentration/.test(group))));
  assert(journalism.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(pra.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Film and Television preserves both options and the published FILM4016 conflict', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2330');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const film4016 = courses.find((course) => course.courseCode === 'FILM4016');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 76);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 76);
  assert(courses.some((course) => course.requirementGroups.some((group) => /Professional Option Core/.test(group))));
  assert(courses.some((course) => course.requirementGroups.some((group) => /Liberal Studies Required Elective pool 1/.test(group))));
  assert(courses.some((course) => course.requirementGroups.some((group) => /Liberal Studies Required Elective pool 2/.test(group))));
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(film4016.courseType, 'internship');
  assert.equal(film4016.credits, 3);
  assert.match(film4016.description, /individual course page assigns 0 unit/);
  assert.match(film4016.description, /manual confirmation is required/);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Acting for Global Screen keeps the 49-unit required block and explicit elective pool', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2340');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const required = courses.filter((course) => course.requirementGroups.includes('Major Required Courses · all required / 49 units'));
  const electives = courses.filter((course) => course.requirementGroups.includes('Major Elective Courses · select 30 units'));
  const projects = courses.filter((course) => course.requirementGroups.includes('Honours Project · both required / 6 units'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 51);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 51);
  assert.deepEqual([required.length, required.reduce((sum, course) => sum + course.credits, 0)], [17, 49]);
  assert.deepEqual([electives.length, electives.reduce((sum, course) => sum + course.credits, 0)], [32, 96]);
  assert.deepEqual([projects.length, projects.reduce((sum, course) => sum + course.credits, 0)], [2, 6]);
  assert(courses.some((course) => course.courseCode === 'FAGS3015' && course.credits === 1));
  assert(courses.some((course) => course.courseCode === 'FAGS3007' && course.courseType === 'internship' && /Internship or Practicum/.test(course.description)));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Game Design and Animation preserves both Streams and zero-unit practical courses', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2370');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const required = courses.filter((course) => course.requirementGroups.includes('Major Required Courses · all required / 46 units'));
  const animation = courses.filter((course) => course.requirementGroups.includes('Advanced Animation Stream Required Courses · all 3 required / 9 units'));
  const gameDesign = courses.filter((course) => course.requirementGroups.includes('Advanced Game Design Stream Required Courses · all 3 required / 9 units'));
  const electives = courses.filter((course) => course.requirementGroups.includes('Major Elective Courses · select 12 units'));
  const projects = courses.filter((course) => course.requirementGroups.includes('Honours Project · both required / 6 units'));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 71);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 71);
  assert.deepEqual([required.length, required.reduce((sum, course) => sum + course.credits, 0)], [20, 46]);
  assert.deepEqual([animation.length, animation.reduce((sum, course) => sum + course.credits, 0)], [3, 9]);
  assert.deepEqual([gameDesign.length, gameDesign.reduce((sum, course) => sum + course.credits, 0)], [3, 9]);
  assert.deepEqual([electives.length, electives.reduce((sum, course) => sum + course.credits, 0)], [37, 111]);
  assert.deepEqual([projects.length, projects.reduce((sum, course) => sum + course.credits, 0)], [2, 6]);
  assert.deepEqual(
    courses.filter((course) => course.credits === 0).map((course) => course.courseCode),
    ['GAME2008', 'GAME2009', 'GAME3008', 'GAME3009', 'FILM4016']
  );
  assert(courses.some((course) => course.courseCode === 'GAME3045' && course.credits === 1));
  assert(courses.some((course) => course.courseCode === 'GAME1006' && course.titleEn === 'Transcultural Studies of Games'));
  assert(courses.some((course) => course.courseCode === 'FILM4016' && course.courseType === 'internship'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('HKBU Visual Arts preserves Professional Mode concentrations and the senior-year replacement', () => {
  const programme = ugService.listProgrammes({ universityCode: 'HKBU' }).find((item) => item.jupasCode === 'JS2810');
  const major = ugService.listMajors(programme.id)[0];
  const courses = ugService.listMajorCourses(programme.id, major.id);
  const required = courses.filter((course) => course.requirementGroups.includes('Major Required Courses · all required / 24 units'));
  const clusterElectives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('Cluster Electives')));
  const publishedElectives = courses.filter((course) => course.requirementGroups.some((group) => group.includes('published course list')));
  const project = courses.find((course) => course.courseCode === 'VART4137');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(courses.length, 77);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 77);
  assert.deepEqual([required.length, required.reduce((sum, course) => sum + course.credits, 0)], [8, 24]);
  assert.equal(clusterElectives.length, 28);
  assert.equal(publishedElectives.length, 38);
  assert(courses.some((course) => course.courseCode === 'VART2337' && course.credits === 0 && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'VART3446' && course.credits === 3 && /senior-year replacement/.test(course.description)));
  assert.equal(project.credits, 6);
  assert.equal(project.courseType, 'capstone');
  assert.match(project.description, /18 units of Level 3 studio courses/);
  assert(courses.some((course) => course.requirementGroups.some((group) => /Studio and Media Arts Concentration/.test(group))));
  assert(courses.some((course) => course.requirementGroups.some((group) => /Craft and Design Concentration/.test(group))));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU BA English filters the official 2025 Stream pools while preserving the normative study plan', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const programme = programmes.find((item) => item.jupasCode === 'JS1104');
  const majors = Object.fromEntries(ugService.listMajors(programme.id).map((major) => [major.nameEn, major]));
  const epc = ugService.listMajorCourses(programme.id, majors['English and Professional Communication'].id);
  const literature = ugService.listMajorCourses(programme.id, majors['Language and Literature'].id);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(epc.length, 59);
  assert.equal(literature.length, 58);
  assert.equal(new Set(epc.map((course) => course.courseCode)).size, 59);
  assert.equal(new Set(literature.map((course) => course.courseCode)).size, 58);
  assert(epc.some((course) => course.courseCode === 'EN2859' && course.requirementGroups.some((group) => group.includes('EPC primary stream elective only'))));
  assert(!literature.some((course) => course.courseCode === 'EN2859'));
  ['EN2714', 'EN2722', 'EN2711', 'EN3593', 'EN4575', 'EN4576', 'CAI4001'].forEach((courseCode) => {
    assert(epc.some((course) => course.courseCode === courseCode));
    assert(literature.some((course) => course.courseCode === courseCode));
  });
  assert(epc.some((course) => course.courseCode === 'EN2714' && course.recommendedYear === 1 && course.semester === 'Semester A'));
  assert(epc.some((course) => course.courseCode === 'EN3593' && course.recommendedYear === 3 && course.semester === 'Summer'));
  assert(epc.some((course) => course.courseCode === 'EN4575' && course.recommendedYear === 4 && course.semester === '' && /Semester A and Semester B/.test(course.description)));
  assert(epc.filter((course) => course.courseType === 'major_elective').every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU Linguistics and Language Applications exposes one official Major and the current 57-credit structure', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1109');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const core = courses.filter((course) => course.courseType === 'core');
  const electives = courses.filter((course) => course.courseType === 'major_elective');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['Linguistics and Language Applications']);
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 40);
  assert.deepEqual([core.length, core.reduce((sum, course) => sum + course.credits, 0)], [11, 33]);
  assert.equal(electives.length, 29);
  assert(electives.every((course) => course.credits === 3));
  assert(electives.every((course) => course.requirementGroups.some((group) => (
    group.includes('choose 24 credits total') && group.includes('at least 12 credits at B4 level')
  ))));
  assert(courses.some((course) => course.courseCode === 'LT4235' && course.courseType === 'core'));
  assert(!courses.some((course) => course.courseCode === 'LT4391'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU International Relations and Global Affairs keeps Streams inside one official Major', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1102');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const core = courses.filter((course) => course.courseType === 'core');
  const electives = courses.filter((course) => course.courseType === 'major_elective');
  const streamCount = (stream) => electives.filter((course) => (
    course.requirementGroups.some((group) => group.includes(stream))
  )).length;

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['International Relations and Global Affairs']);
  assert.equal(courses.length, 53);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 53);
  assert.deepEqual([core.length, core.reduce((sum, course) => sum + course.credits, 0)], [18, 51]);
  assert.equal(electives.length, 35);
  assert.deepEqual(
    ['Asian Studies', 'International Studies', 'Development Studies'].map(streamCount),
    [24, 21, 13]
  );
  assert(courses.some((course) => course.courseCode === 'PIA3812' && course.courseType === 'core' && course.credits === 0));
  assert(courses.some((course) => course.courseCode === 'PIA4060' && course.courseType === 'major_elective' && course.credits === 6));
  ['PIA3810', 'PIA3810J', 'PIA3810K'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode && /Major leader/.test(course.description)));
  });
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU Public Affairs and Management keeps two Streams inside one official Major', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1108');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const groupText = (code) => byCode[code].requirementGroups.join(' ');

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['Public Affairs and Management']);
  assert.equal(courses.length, 56);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 56);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(courses.filter((course) => course.requirementGroups.some((group) => group.includes('Foundation-year Courses'))).length, 5);
  assert.match(groupText('PIA2012'), /Public Affairs and Governance \/ Public Policy and Management/);
  assert.match(groupText('PIA2402'), /Public Affairs and Governance Stream Core/);
  assert.match(groupText('PIA2402'), /Public Policy and Management Stream Elective/);
  assert.match(groupText('PIA3241'), /Public Policy and Management Stream Core/);
  assert.match(groupText('PIA3241'), /Public Affairs and Governance Stream Elective/);
  ['PIA3810', 'PIA3810J', 'PIA3810K'].forEach((code) => assert(byCode[code]));
  ['PIA3800', 'CAI4001'].forEach((code) => {
    assert.match(byCode[code].description, /either PIA3800 or CAI4001/i);
    assert.match(byCode[code].description, /must not both count/);
  });
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU Crime Science keeps admission Features inside one official 57-credit Major', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1111');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const inGroup = (label) => courses.filter((course) => (
    course.requirementGroups.some((group) => group.includes(label))
  ));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['Crime Science']);
  assert.equal(courses.length, 27);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 27);
  assert.deepEqual(
    [inGroup('Foundation-year Courses').length, inGroup('Foundation-year Courses').reduce((sum, course) => sum + course.credits, 0)],
    [3, 9]
  );
  assert.deepEqual(
    [inGroup('Major Core').length, inGroup('Major Core').reduce((sum, course) => sum + course.credits, 0)],
    [12, 39]
  );
  assert.equal(inGroup('Major Electives').length, 12);
  assert(courses.some((course) => course.courseCode === 'SS4296' && course.credits === 6 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CAI4001' && course.courseType === 'major_elective'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU Social Work keeps admission Features inside one official 81-credit Major', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1113');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const inGroup = (label) => courses.filter((course) => (
    course.requirementGroups.some((group) => group.includes(label))
  ));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['Social Work']);
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 33);
  assert.deepEqual(
    [inGroup('Foundation-year Courses').length, inGroup('Foundation-year Courses').reduce((sum, course) => sum + course.credits, 0)],
    [3, 9]
  );
  assert.deepEqual(
    [inGroup('Major Core').length, inGroup('Major Core').reduce((sum, course) => sum + course.credits, 0)],
    [20, 66]
  );
  assert.deepEqual(
    [inGroup('Area 1 Service Users').length, inGroup('Area 2 Advanced and Critical Practice').length],
    [5, 5]
  );
  assert(courses.some((course) => course.courseCode === 'SS3292' && course.credits === 8 && course.courseType === 'internship'));
  assert(courses.some((course) => course.courseCode === 'SS4291' && course.credits === 8 && course.courseType === 'internship'));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('CityU Psychology keeps optional Streams inside one 63-credit Major structure', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programme = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' })
    .find((item) => item.jupasCode === 'JS1112');
  const majors = ugService.listMajors(programme.id);
  const courses = ugService.listMajorCourses(programme.id, majors[0].id);
  const inGroup = (label) => courses.filter((course) => (
    course.requirementGroups.some((group) => group.includes(label))
  ));
  const inStream = (label) => courses.filter((course) => (
    `${course.requirementGroups.join(' ')} ${course.description}`.includes(label)
  ));

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.deepEqual(majors.map((major) => major.nameEn), ['Psychology']);
  assert.equal(courses.length, 37);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 37);
  assert.deepEqual(
    [inGroup('Foundation-year Courses').length, inGroup('Foundation-year Courses').reduce((sum, course) => sum + course.credits, 0)],
    [3, 9]
  );
  assert.deepEqual(
    [inGroup('Core Courses').length, inGroup('Core Courses').reduce((sum, course) => sum + course.credits, 0)],
    [11, 36]
  );
  assert.equal(inGroup('Major Electives').length, 20);
  assert.deepEqual([inStream('Health and Development').length, inStream('Mind and Brain').length], [9, 6]);
  assert(courses.some((course) => course.courseCode === 'SS2715' && course.credits === 1));
  assert(courses.some((course) => course.courseCode === 'SS3733' && course.credits === 2));
  assert(courses.some((course) => course.courseCode === 'SS4708' && course.credits === 6 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PIA3207' && !course.requirementGroups.some((group) => group.includes('Major Electives'))));
  assert(courses.some((course) => course.courseCode === 'LT3234' && /cannot fulfil both/.test(course.description)));
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
});

test('catalogue course detail resolves only the requested university shard', () => {
  const cityu = ugService.listMajorCourses('CITYU-UG-BSCCS-42', 'CITYU-UG-BSCCS-42-M1')[0];
  assert(cityu);
  assert.equal(ugService.getCatalogueCourse(cityu.id, 'CITYU').courseCode, cityu.courseCode);
  assert.equal(ugService.getCatalogueCourse(cityu.id).courseCode, cityu.courseCode);
  assert.equal(ugService.getCatalogueCourse(cityu.id, 'HKU'), null);
});
