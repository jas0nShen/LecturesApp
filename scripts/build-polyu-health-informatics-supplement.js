const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-health-informatics-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-079';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/06003-hif-hip';
const CURRICULUM_URL = 'https://www.polyu.edu.hk/fhss/study/postgraduate/mschi/';
const SUBJECT_PDF_ROOT = 'https://www.polyu.edu.hk/fhss/-/media/department/fhss/content/study/postgraduate/mschi';

const compulsorySubjects = [
  ['SN5023', 'Electronic Patient Records', 3, 'sn5023.pdf'],
  ['SN6006', 'Information Technology in Healthcare', 3, 'sn6006_sdf_20230629.pdf'],
  ['SN5303B', 'Professional Development in Health Informatics', 3, 'sn5303b.pdf']
];

const coreSubjects = [
  ['COMP5511', 'Artificial Intelligence Concepts', 3, 'comp5511.pdf'],
  ['SN5897', 'AI in Healthcare: Application and Innovation', 3, 'sn5897.pdf'],
  ['MM5425', 'Business Analytics', 3, 'mm5425.pdf'],
  ['SN5896', 'Concepts and Technological Applications of Smart Hospitals', 3, 'sn5896.pdf'],
  ['HTI5720', 'Digital Imaging & PACS', 3, 'hti5720.pdf'],
  ['HTI5601', 'Epidemiology', 3, 'hti5601-revised-2023.pdf'],
  ['HSS5304', 'Knowledge Management for Clinical Applications', 3, 'hss5304.pdf'],
  ['COMP5541', 'Machine Learning & Data Analytics', 3, 'comp5541.pdf'],
  ['MM5424', 'Management Information Systems', 3, 'mm5424.pdf'],
  ['BME5150', 'Medical Artificial Intelligence and Data Analytics', 3, 'bme5150.pdf'],
  ['LGT5037', 'Project Management', 3, 'lgt5037.pdf'],
  ['COMP5241', 'Software Engineering and Development', 3, 'comp5241.pdf'],
  ['MM5451', 'Technology Innovation & Management', 3, 'mm5451.pdf']
];

const electiveSubjects = [
  ['AMA601', 'Advanced Statistics in Health Care Research', 3, 'ama601.pdf'],
  ['HTI5725', 'Advanced Technology & Clinical Application in Nuclear Medicine Imaging', 3, 'hti5725-revised-2023.pdf'],
  ['COMP5434', 'Big Data Computing', 3, 'comp5434.pdf'],
  ['HTI5052', 'Bioinformatics in Health Sciences', 3, 'hti5052.pdf'],
  ['COMP5112', 'Data Structures & Database Systems', 3, 'comp5112.pdf'],
  ['BME5120', 'Digital Design and Manufacturing for Biomedical Engineering', 3, 'bme5120.pdf'],
  ['SN5180', 'Ethics & Law in Clinical Practice', 3, 'sn5180.pdf'],
  ['APSS601', 'Health & Social Policy Analysis', 3, 'apss601.pdf'],
  ['APSS6403', 'Health Care Ethics', 3, 'apss6403.pdf'],
  ['COMP5322', 'Internet Computing & Applications', 3, 'comp5322.pdf'],
  ['APSS6402', 'Issues in Health Sociology', 3, 'apss6402.pdf'],
  ['HTI5003', 'Medical Imaging Physics', 3, 'hti5003-revised-2023.pdf'],
  ['BME5133', 'Modern Rehabilitation Engineering and Robotics', 3, 'bme5133.pdf'],
  ['SN5181', 'Quality Management of Health Care Services', 3, 'sn5181.pdf'],
  ['AP50002', 'Radiation Protection and Radiation Safety', 3, 'ap50002.pdf'],
  ['HTI5002', 'Radiation Therapy Physics', 3, 'hti5002.pdf'],
  ['BME5155', 'Research Methods & Biostatistics', 3, 'bme5155.pdf'],
  ['RS517', 'Research Methods & Data Analysis', 3, 'rs517.pdf'],
  ['SN5307', 'Virtual Reality in Healthcare', 3, 'sn5307.pdf'],
  ['BME5111', 'Wearable Technology for Digital Health', 3, 'bme5111.pdf']
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.officialSubjectArea, 'Health Informatics');
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /4\s+Compulsory Subjects, 2\s+Core Subjects and 2\s+Elective Subjects/);
  assert.match(row.curriculumText, /any\s+3\s+Core\/Elective Subjects can replace\s+the Dissertation/);
  assert.match(row.curriculumText, /1-credit AIE subject/);

  const normalizedCurriculumText = row.curriculumText.replace(/\s+/g, ' ');
  [...compulsorySubjects, ...coreSubjects, ...electiveSubjects].forEach(([, name]) => {
    assert(normalizedCurriculumText.includes(name), `Official 2027 snapshot is missing ${name}`);
  });
  assert(row.curriculumText.includes('Dissertation'));

  const allCodes = [
    ...compulsorySubjects,
    ...coreSubjects,
    ...electiveSubjects,
    ['HSS5903'],
    ['HTI5T04']
  ].map(([code]) => code);
  assert.equal(new Set(allCodes).size, 38);

  const course = ([code, name, credits, pdf], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: pdf ? `${SUBJECT_PDF_ROOT}/${pdf}` : CURRICULUM_URL,
    ...options
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: PROGRAMME_ID,
      status: 'verified',
      creditsRequired: 31,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2027 Programme page publishes the 31-credit structure and current course pools. The current FHSS curriculum page links each matching Subject Description Form, which confirms the subject codes and credits. Students always complete three 3-credit Compulsory Subjects, the 1-credit AIE subject, two Core Subjects and two Elective Subjects, then either HSS5903 Dissertation or three additional subjects from the combined Core and Elective pools. The mutually exclusive Dissertation and taught paths require manual audit review and must not be combined.',
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 9,
          coursesRequired: 3,
          ruleText: 'Complete all three 3-credit Compulsory Subjects.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: compulsorySubjects.map((item) => course(item))
        },
        {
          id: 'core-subjects',
          name: 'Core Subjects',
          type: 'core',
          creditsRequired: 6,
          coursesRequired: 2,
          ruleText: 'Complete at least two Core Subjects for 6 credits. On the taught path without HSS5903 Dissertation, additional Core Subjects may count toward the three extra Core/Elective Subjects required in place of the Dissertation.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: coreSubjects.map((item) => course(item))
        },
        {
          id: 'elective-subjects',
          name: 'Elective Subjects',
          type: 'elective',
          creditsRequired: 6,
          coursesRequired: 2,
          ruleText: 'Complete at least two Elective Subjects for 6 credits. On the taught path without HSS5903 Dissertation, additional Elective Subjects may count toward the three extra Core/Elective Subjects required in place of the Dissertation.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: electiveSubjects.map((item) => course(item))
        },
        {
          id: 'dissertation-option',
          name: 'Dissertation Option',
          type: 'dissertation',
          ruleText: 'Complete HSS5903 Dissertation for 9 credits, or replace it with any three additional 3-credit subjects from the combined Core and Elective pools. The two paths are mutually exclusive.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: [course(['HSS5903', 'Dissertation', 9, 'hss5903.pdf'], {
            courseKind: 'dissertation',
            conditionalRequirement: true
          })]
        },
        {
          id: 'academic-integrity',
          name: 'Academic Integrity and Ethics',
          type: 'academic_integrity',
          creditsRequired: 1,
          coursesRequired: 1,
          ruleText: 'Complete HTI5T04 Academic Integrity and Ethics (Health and Social Sciences) for 1 credit.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [course(['HTI5T04', 'Academic Integrity and Ethics (Health and Social Sciences)', 1])]
        }
      ]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes[0].courseGroups.reduce((count, group) => count + group.courses.length, 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
