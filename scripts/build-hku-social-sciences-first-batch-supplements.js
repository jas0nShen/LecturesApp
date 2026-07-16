const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-social-sciences-first-batch-2025.json');

const SOURCES = {
  macaifm: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R426&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y',
  macaifmProgramme: 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-creative-artificial-intelligence-filmmaking-and-media-socsc',
  mchds: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R266&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y',
  mchdsProgramme: 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-china-development-studies-socsc',
  mexartsth: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R319&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y',
  mexartsthProgramme: 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-expressive-arts-therapy-socsc',
  mipa: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R144&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y',
  mipaProgramme: 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-international-and-public-affairs-socsc'
};

function parseRows(value) {
  return value.trim().split('\n').map((line) => {
    const [code, name, credits, role = 'elective'] = line.split('|');
    return [code, name, Number(credits), role];
  });
}

const mchdsRows = parseRows(`
GEOG7101|The Chinese economies: location, transformation, and integration|6|compulsory
GEOG7120|Urban China: cultural basis and contemporary issues|6|compulsory
GEOG7116|Field trip|6|elective
GEOG7117|Public policies and regional development|6|elective
GEOG7124|Globalization and spatial economic transformation in China|6|elective
GEOG7126|Cultural tourism in Hong Kong, Macau and South China|6|elective
GEOG7129|Climate change, environmental resources and human carrying capacity in China|6|elective
GEOG7137|Land and housing in China|6|elective
GEOG7141|Politics of contemporary China|6|elective
GEOG7142|Big Data and GIS for China development studies|6|elective
GEOG7143|Green and blue infrastructure in China|6|elective
GEOG7144|Quantitative and spatial methods in social research|6|elective
GEOG7145|Innovation and knowledge generation in city-regions|6|elective
GEOG7146|Sustainability transitions in China: Theories, policies and practices|6|elective
GEOG7147|The Greater Bay Area: Economy, governance, regional integration|6|elective
GEOG7148|Tackling natural hazards on the China Coast: Resilience, adaptation and restoration|6|elective
GEOG7136|Research methods and directed project in China development studies|6|capstone
GEOG7122|Dissertation in China development studies|12|dissertation
`);

const mexartsthCoreRows = parseRows(`
EXAT7001|Theory and principles of expressive arts therapy|6|compulsory
EXAT7003|Community application of expressive arts|6|compulsory
EXAT7004|Working with individuals in expressive arts therapy|6|compulsory
EXAT7005|Working with groups in expressive arts therapy|6|compulsory
EXAT7006|Professional practice and ethics in expressive arts therapy|6|compulsory
EXAT7105|Assessment in clinical setting|6|compulsory
EXAT7106|Human development and expressive arts therapy|6|compulsory
EXAT7107|Micro-skills in counselling and psychotherapy|6|compulsory
MSBH6106|Abnormal psychology|6|compulsory
MSBH7005|Scientific inquiry and research methods in behavioral health|6|compulsory
`);

const mexartsthElectiveRows = parseRows(`
EXAT7100|Special topics in expressive arts therapy|6|elective
EXAT7101|Fundamentals of music therapy|6|elective
EXAT7102|Fundamentals of drama therapy|6|elective
EXAT7103|Fundamentals of art therapy|6|elective
EXAT7104|Fundamentals of dance and movement therapy|6|elective
SOWK6206|Play therapy|6|elective
SOWK6259|Contemporary perspectives on death, dying and bereavement|6|elective
SOWK6274|Theories and practices in positive psychology and strength-based interventions|6|elective
`);

const mexartsthCapstoneRows = parseRows(`
EXAT7020|Expressive arts therapy practicum and supervision|36|practicum
EXAT7022|Dissertation|12|dissertation
`);

const mipaRows = parseRows(`
POLI6004|Theories of international relations|6|compulsory
POLI6006|International political economy|6|compulsory
POLI6031|Capstone project|12|capstone
POLI6005|International organizations|6|elective
POLI6007|International relations in the Asia-Pacific|6|elective
POLI6008|Understanding global problems: theory and practice|6|elective
POLI6010|Chinese foreign policy|6|elective
POLI6029|War and armed conflict: philosophical issues|6|elective
POLI6032|International law|6|elective
POLI6033|Cross-Taiwan Strait relations|6|elective
POLI6035|War and strategy|6|elective
POLI6036|Special topics in international relations (I)|6|elective
POLI6037|Special topics in international relations (II)|6|elective
POLI6038|Special topics in international political economy (I)|6|elective
POLI6039|Special topics in international political economy (II)|6|elective
POLI6040|Special topics in Asia Pacific international relations (I)|6|elective
POLI6041|Special topics in Asia Pacific international relations (II)|6|elective
POLI6042|Special topics in global and regional governance (I)|6|elective
POLI6043|Special topics in global and regional governance (II)|6|elective
POLI6044|World energy issues: international political economy and security|6|elective
POLI6045|The politics of global inequality|6|elective
POLI6046|Political and sovereign risk assessment|6|elective
POLI6047|Law, politics and the international system|6|elective
POLI6048|International security|6|elective
POLI6049|Epistemics of international relations|6|elective
POLI7009|Governance and policy in international organizations|6|elective
POLI7011|Global information wars|6|elective
POLI7012|Comparative politics of modern Southeast Asia|6|elective
POLI7013|International development|6|elective
POLI7014|International relations and the Middle East|6|elective
POLI7015|Introduction to Research Methods in International Relations|6|elective
POLI7016|Causal Inference in International Affairs|6|elective
POLI7017|Politics and security on the Korean Peninsula|6|elective
POLI7018|Armed Nonstate Governance|6|elective
POLI7019|Workshop on Survey and Survey-Experimental Research|3|elective
POLI7020|Political Risk Analysis and Forecasting|3|elective
POLI8004|Government and law|6|elective
POLI8014|NGOs and governance|6|elective
POLI8033|Program evaluation|6|elective
POLI6021|Overseas study at Peking University: Current issues in China’s international relations|6|flex
POLI6023|Overseas study at Johns Hopkins University: SAIS programme|6|flex
POLI6024|Overseas study at Johns Hopkins University: SAIS programme|12|flex
POLI6030|Overseas study at George Washington University: U.S. foreign policy summer programme|6|flex
POLI6034|Overseas study at Seoul National University: Seminar on area studies – East Asia in the modern world|6|flex
POLI6052|Summer Overseas Study of International Relations in East and Southeast Asia|6|flex
`);

function course([code, name, credits, role]) {
  const result = {
    code,
    name,
    credits,
    subjectGroups: [role],
    appliesToTrackIds: []
  };
  if (role === 'dissertation') result.courseKind = 'dissertation';
  if (role === 'practicum') result.courseKind = 'practicum';
  if (role === 'capstone') result.courseKind = 'project';
  return result;
}

function group(id, name, type, creditsRequired, coursesRequired, ruleText, sourceUrl, rows) {
  return {
    id,
    name,
    type,
    creditsRequired,
    ...(coursesRequired ? { coursesRequired } : {}),
    ruleText,
    appliesToTrackIds: [],
    sourceUrl,
    courses: rows.map(course)
  };
}

function assertProgramme(programme, expectedCourses) {
  const courses = (programme.courseGroups || []).flatMap((entry) => entry.courses);
  assert.equal(courses.length, expectedCourses, `${programme.programmeId} course count changed`);
  assert.equal(new Set(courses.map((entry) => entry.code)).size, courses.length, `${programme.programmeId} repeats a course code`);
  courses.forEach((entry) => {
    assert(entry.code && entry.name, `${programme.programmeId} has an incomplete course`);
    assert(Number.isFinite(entry.credits) && entry.credits > 0, `${programme.programmeId}/${entry.code} has invalid credits`);
  });
}

function buildProgrammes() {
  const programmes = [
    {
      programmeId: 'HKU-TPG-049',
      status: 'blocked',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.macaifm,
      statusNote: 'The official 2026-27 Regulations and Syllabus publishes a complete proposed 60-credit course structure, but the document is expressly marked “subject to university’s approval”. The current HKU TPG Portal also marks the programme application as closed, and its MACAIFM abbreviation conflicts with MAAIFM in the Regulations and Syllabus. Because the public official evidence does not establish final University approval for the curriculum, no proposed courses are published.',
      additionalSources: [SOURCES.macaifmProgramme]
    },
    {
      programmeId: 'HKU-TPG-050',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.mchds,
      ruleReviewStatus: 'manual_review_required',
      trackSelectionOptional: false,
      tracks: [
        { id: 'HKU-TPG-050-NON-DISSERTATION', name: 'Non-dissertation Option', type: 'Award Path', creditsRequired: 60, sourceUrl: SOURCES.mchds },
        { id: 'HKU-TPG-050-DISSERTATION', name: 'Dissertation Option', type: 'Award Path', creditsRequired: 60, sourceUrl: SOURCES.mchds }
      ],
      statusNote: 'The official 2026-27 Regulations and Syllabuses publish both complete 60-credit paths. The non-dissertation option comprises two compulsory courses, seven electives and GEOG7136. The dissertation option comprises two compulsory courses, five electives, GEOG7136 and GEOG7122. Path selection, different elective counts and semester or year credit-load limits require manual audit review; elective offerings vary by year.',
      courseGroups: [{
        id: 'option-dependent-course-pool',
        name: 'Dissertation and Non-dissertation Course Pool',
        type: 'path_dependent_curriculum',
        creditsRequired: 60,
        creditsRequiredByTrackIds: {
          'HKU-TPG-050-NON-DISSERTATION': 60,
          'HKU-TPG-050-DISSERTATION': 60
        },
        coursesRequiredByTrackIds: {
          'HKU-TPG-050-NON-DISSERTATION': 10,
          'HKU-TPG-050-DISSERTATION': 9
        },
        ruleText: 'Both paths complete GEOG7101, GEOG7120 and GEOG7136. The non-dissertation option completes seven electives; the dissertation option completes five electives plus the 12-credit GEOG7122 dissertation. Full-time and part-time candidates must also observe the official semester or year credit-load limits.',
        appliesToTrackIds: [],
        sourceUrl: SOURCES.mchds,
        courses: mchdsRows.map(course)
      }],
      additionalSources: [SOURCES.mchdsProgramme]
    },
    {
      programmeId: 'HKU-TPG-051',
      status: 'verified',
      creditsRequired: 120,
      creditUnit: 'credits',
      sourceUrl: SOURCES.mexartsth,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses, applicable to candidates admitted in 2024-25 and thereafter, publish the complete 120-credit structure: ten compulsory courses, two electives, the 36-credit EXAT7020 practicum and the 12-credit EXAT7022 dissertation. Up to two approved compulsory-course exemptions must be replaced by electives of the same credit value, and up to two approved Faculty postgraduate courses may substitute for curriculum electives. Those approval-dependent substitutions and practicum requirements require manual audit review; not all electives are offered every year.',
      courseGroups: [
        group('compulsory-courses', 'Compulsory Courses', 'core', 60, 10, 'Complete all ten compulsory courses. Up to two approved exemptions must be replaced by electives carrying the same credit value.', SOURCES.mexartsth, mexartsthCoreRows),
        group('elective-courses', 'Elective Courses', 'elective', 12, 2, 'Complete two electives. With approval, up to two relevant postgraduate courses offered by another curriculum of the Faculty may substitute for these electives. Not all listed electives are offered every year.', SOURCES.mexartsth, mexartsthElectiveRows),
        group('practicum-and-dissertation', 'Practicum and Dissertation', 'capstone', 48, 2, 'Complete the 36-credit EXAT7020 practicum and supervision course and the 12-credit EXAT7022 dissertation.', SOURCES.mexartsth, mexartsthCapstoneRows)
      ],
      additionalSources: [SOURCES.mexartsthProgramme]
    },
    {
      programmeId: 'HKU-TPG-052',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.mipa,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete coded HKU course pool and the 60-credit completion framework: two compulsory courses, four electives, the equivalent of two further elective/FLEX courses or approved overseas study, internship or exchange, and the 12-credit POLI6031 capstone. POLI7019 and POLI7020 are 3-credit half-courses and two half-courses equal one course; POLI6024 carries 12 credits and equals two courses. Approved exchange study and FLEX choices from other departments are announced separately and may not carry a fixed MIPA code in this syllabus. Half-course aggregation, 4-6 elective selection, FLEX limits, external approvals and exchange credit equivalencies require manual audit review.',
      courseGroups: [{
        id: 'completion-path-course-pool',
        name: 'MIPA Course and FLEX Pool',
        type: 'path_dependent_curriculum',
        creditsRequired: 60,
        ruleText: 'Complete POLI6004 and POLI6006, four to six electives, and POLI6031. After the four required electives, complete the equivalent of two more courses through electives or no more than two FLEX courses, approved overseas study or internship, or an approved GWU, SNU or Geneva exchange. Two 3-credit half-courses equal one course; POLI6024 equals two courses. External and cross-department FLEX offerings require Programme approval and are announced separately.',
        appliesToTrackIds: [],
        sourceUrl: SOURCES.mipa,
        courses: mipaRows.map(course)
      }],
      additionalSources: [SOURCES.mipaProgramme]
    }
  ];

  assert.equal(programmes.length, 4, 'HKU Social Sciences first batch size changed');
  assert.deepEqual(programmes.map((entry) => entry.status), ['blocked', 'verified', 'verified', 'verified']);
  assertProgramme(programmes[0], 0);
  assertProgramme(programmes[1], 18);
  assertProgramme(programmes[2], 20);
  assertProgramme(programmes[3], 45);
  assert.equal(programmes.reduce((sum, entry) => sum + (entry.courseGroups || []).flatMap((groupEntry) => groupEntry.courses).length, 0), 83);
  return programmes;
}

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-16',
    programmes: buildProgrammes()
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: supplement.programmes.length,
    blocked: supplement.programmes.filter((entry) => entry.status === 'blocked').length,
    courses: supplement.programmes.reduce((sum, entry) => sum + (entry.courseGroups || []).flatMap((groupEntry) => groupEntry.courses).length, 0)
  }));
}

if (require.main === module) main();
module.exports = {
  buildSupplement,
  buildProgrammes,
  mchdsRows,
  mexartsthCoreRows,
  mexartsthElectiveRows,
  mexartsthCapstoneRows,
  mipaRows
};
