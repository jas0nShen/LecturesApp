const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-food-science-nutrition-2027.json');
const VERIFIED_AT = '2026-07-16';
const SUBJECT_LIST_URL = 'https://www.polyu.edu.hk/fsn/study/list-of-all-subjects/';

const programmeSources = {
  'POLYU-TPG-048': 'https://www.polyu.edu.hk/study/pg/tpg/2027/15057-mft',
  'POLYU-TPG-049': 'https://www.polyu.edu.hk/study/pg/tpg/2027/15058-mft',
  'POLYU-TPG-050': 'https://www.polyu.edu.hk/study/pg/tpg/2027/15058-npf',
  'POLYU-TPG-051': 'https://www.polyu.edu.hk/study/pg/tpg/2027/15060'
};

const curriculumSources = {
  'POLYU-TPG-048': 'https://www.polyu.edu.hk/fsn/study/taught-postgraduate-programmes-list/master-of-science-in-global-food-safety-management-and-risk-analysis/',
  'POLYU-TPG-049': 'https://www.polyu.edu.hk/fsn/study/taught-postgraduate-programmes-list/master-of-science-in-nutrition-and-healthy-ageing/',
  'POLYU-TPG-050': 'https://www.polyu.edu.hk/fsn/study/taught-postgraduate-programmes-list/master-of-science-in-nutrition-and-healthy-ageing-nutrition-in-practice/',
  'POLYU-TPG-051': 'https://www.polyu.edu.hk/fsn/study/taught-postgraduate-programmes-list/master-of-science-in-dietetics/'
};

const catalogue = {
  APSS533: ['Mental Health and the Aged', 3],
  FSN5011: ['Food Safety Risk Analysis', 6],
  FSN5012: ['Global Food Safety Management', 6],
  FSN5013: ['Food Safety in Action', 3],
  FSN5014: ['International Food Standards, Laws and Regulations', 3],
  FSN5015: ['Foodborne Chemical and Microbial Hazards: Case Studies', 3],
  FSN5016: ['Global Food Security', 3],
  FSN5017: ['Capstone Project', 6],
  FSN5021: ['Food Preparation and Menu Planning', 3],
  FSN5022: ['Nutritional Assessment', 3],
  FSN5023: ['Public Health Nutrition', 3],
  FSN5024: ['Nutrition and Health for Older Adults', 3],
  FSN5025: ['Nutrition Education and Counselling', 3],
  FSN5026: ['Practicum I', 3],
  FSN5027: ['Practicum II', 3],
  FSN5028: ['Capstone Project', 3],
  FSN5029: ['Advanced Human Physiology and Anatomy', 3],
  FSN5030: ['Applied Nutrition', 4],
  FSN5031: ['Advanced Pharmacology and Nutrition', 3],
  FSN5032: ['Chinese Medicine Based Diet Therapy', 2],
  FSN5033: ['Clinical Biochemistry and Molecular Nutrition', 3],
  FSN5034: ['Clinical Dietetics and Medicine', 6],
  FSN5036: ['Dietetics in Practice', 3],
  FSN5037: ['Professional Practice for Dietitians', 3],
  FSN5038: ['Dietetics Placement I', 3],
  FSN5039: ['Dietetics Placement II', 8],
  FSN5040: ['Dietetics Placement III', 7],
  FSN5T01: ['Academic Integrity and Ethics in Science', 1],
  RS517: ['Research Methods & Data Analysis', 3]
};

function subjectUrl(code, programmeId) {
  if (code.startsWith('FSN')) return `https://www.polyu.edu.hk/fsn/docdrive/syllabus/${code}.pdf`;
  return curriculumSources[programmeId];
}

function course(programmeId, code, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing FSN catalogue entry ${code}`);
  return {
    code,
    name: entry[0],
    credits: entry[1],
    appliesToTrackIds: [],
    sourceUrl: subjectUrl(code, programmeId),
    ...options
  };
}

function group(programmeId, id, name, type, codes, options = {}) {
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: [],
    sourceUrl: curriculumSources[programmeId],
    courses: codes.map((code) => course(programmeId, code, (options.courseOptions || {})[code]))
  };
}

function academicIntegrity(programmeId) {
  return group(programmeId, 'academic-integrity', 'Academic Integrity and Ethics in Science', 'academic_integrity', ['FSN5T01'], {
    creditsRequired: 1,
    coursesRequired: 1,
    ruleText: 'Complete FSN5T01 Academic Integrity and Ethics in Science for 1 credit.',
    courseOptions: { FSN5T01: { courseKind: 'academic_integrity' } }
  });
}

function foodSafety() {
  const programmeId = 'POLYU-TPG-048';
  return {
    programmeId,
    faculty: 'Department of Food Science and Nutrition (FSN)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'verified',
    statusNote: 'The official 2027 Programme page and current Department of Food Science and Nutrition curriculum publish the same eight required subjects and the 31-credit total. The current official FSN subject list and Subject Description Forms publish the exact codes and credits: two 6-credit subjects, four 3-credit taught subjects, the 6-credit FSN5017 Capstone Project and the 1-credit FSN5T01 Academic Integrity and Ethics in Science subject.',
    courseGroups: [
      group(programmeId, 'required-taught-subjects', 'Required Taught Subjects', 'core', ['FSN5011', 'FSN5012', 'FSN5013', 'FSN5014', 'FSN5015', 'FSN5016'], {
        creditsRequired: 24,
        coursesRequired: 6,
        ruleText: 'Complete all six required taught subjects for 24 credits.'
      }),
      group(programmeId, 'capstone-project', 'Capstone Project', 'project', ['FSN5017'], {
        creditsRequired: 6,
        coursesRequired: 1,
        ruleText: 'Complete FSN5017 Capstone Project for 6 credits.',
        courseOptions: { FSN5017: { courseKind: 'project' } }
      }),
      academicIntegrity(programmeId)
    ]
  };
}

function nutritionHealthyAgeing() {
  const programmeId = 'POLYU-TPG-049';
  return {
    programmeId,
    faculty: 'Department of Food Science and Nutrition (FSN)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'verified',
    statusNote: 'The official 2027 Programme page and current Department of Food Science and Nutrition curriculum publish the same eleven required subjects and the 31-credit total. The current departmental curriculum publishes exact codes and credits, including APSS533 and RS517. FSN5026 and FSN5028 are each scheduled as two 1.5-credit portions but remain one official 3-credit subject; they are not duplicated in the course list.',
    courseGroups: [
      group(programmeId, 'required-taught-and-practicum-subjects', 'Required Taught and Practicum Subjects', 'core', ['FSN5021', 'FSN5022', 'FSN5023', 'FSN5024', 'FSN5025', 'FSN5026', 'FSN5029', 'APSS533', 'RS517'], {
        creditsRequired: 27,
        coursesRequired: 9,
        ruleText: 'Complete all nine required taught and Practicum subjects for 27 credits. FSN5026 Practicum I spans two 1.5-credit teaching periods and is represented once as a 3-credit subject.',
        courseOptions: { FSN5026: { courseKind: 'internship' } }
      }),
      group(programmeId, 'capstone-project', 'Capstone Project', 'project', ['FSN5028'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete FSN5028 Capstone Project for 3 credits across its two 1.5-credit teaching periods.',
        courseOptions: { FSN5028: { courseKind: 'project' } }
      }),
      academicIntegrity(programmeId)
    ]
  };
}

function nutritionInPractice() {
  const programmeId = 'POLYU-TPG-050';
  return {
    programmeId,
    faculty: 'Department of Food Science and Nutrition (FSN)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'verified',
    statusNote: 'The official 2027 Programme page and current Department of Food Science and Nutrition curriculum publish the same eleven required subjects and the 31-credit total. The current departmental curriculum publishes exact codes and credits, including RS517. FSN5026, FSN5027 and FSN5028 are each scheduled as two 1.5-credit portions but remain one official 3-credit subject; they are not duplicated in the course list.',
    courseGroups: [
      group(programmeId, 'required-taught-and-practicum-subjects', 'Required Taught and Practicum Subjects', 'core', ['FSN5021', 'FSN5022', 'FSN5023', 'FSN5024', 'FSN5025', 'FSN5026', 'FSN5027', 'FSN5029', 'RS517'], {
        creditsRequired: 27,
        coursesRequired: 9,
        ruleText: 'Complete all nine required taught and Practicum subjects for 27 credits. FSN5026 and FSN5027 each span two 1.5-credit teaching periods and are represented once as 3-credit subjects.',
        courseOptions: {
          FSN5026: { courseKind: 'internship' },
          FSN5027: { courseKind: 'internship' }
        }
      }),
      group(programmeId, 'capstone-project', 'Capstone Project', 'project', ['FSN5028'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete FSN5028 Capstone Project for 3 credits across its two 1.5-credit teaching periods.',
        courseOptions: { FSN5028: { courseKind: 'project' } }
      }),
      academicIntegrity(programmeId)
    ]
  };
}

function dietetics() {
  const programmeId = 'POLYU-TPG-051';
  return {
    programmeId,
    faculty: 'Department of Food Science and Nutrition (FSN)',
    status: 'verified',
    creditsRequired: 64,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page publishes all eighteen required subjects and the 64-credit total. The current Department of Food Science and Nutrition curriculum, subject list and Subject Description Forms publish the exact code and credit mapping, including RS517, three Dietetic Placements, the 3-credit FSN5028 Capstone Project and FSN5T01. The current curriculum table lists 16 credits of Year 1 Semester 2 subjects but prints a 15-credit subtotal; its listed course credits plus the other term totals equal the official 64-credit Programme total. This one-credit displayed subtotal conflict requires manual review and is not used to reduce any course credit.',
    courseGroups: [
      group(programmeId, 'required-taught-subjects', 'Required Taught Subjects', 'core', ['FSN5021', 'FSN5022', 'FSN5023', 'FSN5025', 'FSN5029', 'RS517', 'FSN5030', 'FSN5031', 'FSN5032', 'FSN5033', 'FSN5034', 'FSN5036', 'FSN5037'], {
        creditsRequired: 42,
        coursesRequired: 13,
        ruleText: 'Complete all thirteen required taught subjects for 42 credits. FSN5034 Clinical Dietetics and Medicine carries 6 credits across two teaching periods.'
      }),
      group(programmeId, 'dietetic-placements', 'Dietetic Placements', 'internship', ['FSN5038', 'FSN5039', 'FSN5040'], {
        creditsRequired: 18,
        coursesRequired: 3,
        ruleText: 'Complete all three Dietetic Placements for 18 credits. Each placement is represented once even when its credits are delivered across more than one teaching period.',
        courseOptions: {
          FSN5038: { courseKind: 'internship' },
          FSN5039: { courseKind: 'internship' },
          FSN5040: { courseKind: 'internship' }
        }
      }),
      group(programmeId, 'capstone-project', 'Capstone Project', 'project', ['FSN5028'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete FSN5028 Capstone Project for 3 credits across its two 1.5-credit teaching periods.',
        courseOptions: { FSN5028: { courseKind: 'project' } }
      }),
      academicIntegrity(programmeId)
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const expectations = {
    'POLYU-TPG-048': [/Students must complete the following subjects/, /Global Food Safety Management/, /Capstone Project/],
    'POLYU-TPG-049': [/Students must complete the following subjects/, /Mental Health and the Aged/, /Research Methods & Data Analysis/],
    'POLYU-TPG-050': [/Students need to complete the following subjects/, /Practicum II/, /Research Methods & Data Analysis/],
    'POLYU-TPG-051': [/Students are required to complete the following subjects/, /Dietetic Placement III/, /Research Methods & Data Analysis/]
  };
  Object.entries(expectations).forEach(([programmeId, patterns]) => {
    const row = snapshot.rows.find((item) => item.programmeId === programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, programmeSources[programmeId]);
    patterns.forEach((pattern) => assert.match(row.curriculumText, pattern));
  });
  assert.match(snapshot.rows.find((item) => item.programmeId === 'POLYU-TPG-048').creditText, /31/);
  assert.match(snapshot.rows.find((item) => item.programmeId === 'POLYU-TPG-049').creditText, /31/);
  assert.match(snapshot.rows.find((item) => item.programmeId === 'POLYU-TPG-050').creditText, /31/);
  assert.match(snapshot.rows.find((item) => item.programmeId === 'POLYU-TPG-051').creditText, /64/);

  const programmes = [foodSafety(), nutritionHealthyAgeing(), nutritionInPractice(), dietetics()];
  const expectedCounts = [8, 11, 11, 18];
  programmes.forEach((programme, index) => {
    const courses = programme.courseGroups.flatMap((item) => item.courses);
    assert.equal(courses.length, expectedCounts[index]);
    assert.equal(new Set(courses.map((item) => item.code)).size, courses.length, `${programme.programmeId} has duplicate course codes`);
    assert.equal(courses.reduce((sum, item) => sum + item.credits, 0), programme.creditsRequired);
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: VERIFIED_AT,
    programmes
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((sum, programme) => sum + programme.courseGroups.flatMap((groupItem) => groupItem.courses).length, 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
