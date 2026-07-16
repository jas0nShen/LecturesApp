const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-industrial-systems-engineering-2027.json');
const VERIFIED_AT = '2026-07-16';
const HANDBOOK_URL = 'https://www.polyu.edu.hk/ise/-/media/department/ise/content/study/current-student/programme-related-info/programme-document/45100-pgs-handbook-251.pdf';
const SYLLABI_URL = 'https://www.polyu.edu.hk/ise/study/information-for-current-students/programme-related-info/subject-syllabi/';

const programmeSources = {
  'POLYU-TPG-053': 'https://www.polyu.edu.hk/study/pg/tpg/2027/45100-mls-ml',
  'POLYU-TPG-054': 'https://www.polyu.edu.hk/study/pg/tpg/2027/45100-mt-mtt',
  'POLYU-TPG-055': 'https://www.polyu.edu.hk/study/pg/tpg/2027/45100-smf-smp'
};

const curriculumSources = {
  'POLYU-TPG-053': 'https://www.polyu.edu.hk/ise/study/taught-postgraduate-programmes/master-of-science-in-industrial-logistics-systems/programme-curriculum/',
  'POLYU-TPG-054': 'https://www.polyu.edu.hk/ise/study/taught-postgraduate-programmes/master-of-science-in-knowledge-and-technology-management/programme-curriculum/',
  'POLYU-TPG-055': 'https://www.polyu.edu.hk/ise/study/taught-postgraduate-programmes/master-of-science-in-smart-manufacturing/programme-structure/'
};

const catalogue = {
  AAE5105: 'Fleet Management and Aviation Sustainability',
  AAE5112: 'Airport Operations and Management',
  AAE5301: 'Service Design and Fleet Management for Low-Altitude Economy',
  EEE5T03: 'Engineering Ethics and Academic Integrity',
  ISE512: 'Warehousing & Material Handling Systems',
  ISE518: 'Workflow Design and Management',
  ISE525: 'Global Operations and Logistics Management',
  ISE526: 'Enterprise Resources Planning',
  ISE527: 'Logistics Information Systems',
  ISE529: 'Dissertation (ILS)',
  ISE538: 'Process and Performance Management',
  ISE542: 'Managing Knowledge',
  ISE544: 'Supply Chain Management Enabling Technologies',
  ISE548: 'Risk and Crisis Management',
  ISE549: 'Management of Innovation and Technology',
  ISE550: 'Contemporary Logistics Issues in China',
  ISE559: 'Technology Audit and Assessment',
  ISE5001: 'Technology Transfer and Commercialisation',
  ISE5002: 'Field Study of Technology Organisations',
  ISE5003: 'Dissertation (KTM)',
  ISE5019: 'Optimization Modeling & Applications',
  ISE5021: 'Technology Project Management',
  ISE5022: 'Financial Decision Analysis for Technology Management',
  ISE5026: 'Technology Entrepreneurship and Innovation in Practice',
  ISE5301: 'Frontiers in Industry 4.0',
  ISE5311: 'Advanced Manufacturing Processes',
  ISE5312: 'Industrial Human-Robot Systems and Automation',
  ISE5321: 'Cyber-Physical Industry 4.0 Systems',
  ISE5322: 'Industrial Metaverse and Mixed Reality',
  ISE5323: 'Smart Product-Service Systems',
  ISE5331: 'Optimization and Data Analytics for Industry 4.0',
  ISE5332: 'Smart Manufacturing Operations Management',
  ISE5333: 'Industrial Blockchain and Applications',
  ISE5334: 'Industrial Prompt Engineering for Generative Artificial Intelligence',
  ISE5601: 'Managing and Measuring Intellectual Capital',
  ISE5606: 'Business Intelligence and Data Mining',
  ISE5699: 'Dissertation (SM)',
  LGT5002: 'International Logistics Systems, Operations and Management',
  LGT5007: 'Shipping Economics and Markets',
  LGT5010: 'Port Policy and Management',
  LGT5013: 'Transport Logistics in China',
  LGT5015: 'Supply Chain Management',
  LGT5017: 'Maritime Logistics',
  LGT5105: 'Management Operations Systems',
  LGT5164: 'Aviation Safety Management',
  MM5112: 'Organisation and Management'
};

function course(programmeId, code, options = {}) {
  assert(catalogue[code], `Missing ISE Scheme catalogue entry ${code}`);
  const dissertation = ['ISE529', 'ISE5003', 'ISE5699'].includes(code);
  const academicIntegrity = code === 'EEE5T03';
  return {
    code,
    name: options.name || catalogue[code],
    credits: dissertation ? 9 : (academicIntegrity ? 1 : 3),
    appliesToTrackIds: [],
    sourceUrl: dissertation ? SYLLABI_URL : curriculumSources[programmeId],
    ...(dissertation ? { courseKind: 'dissertation', conditionalRequirement: true } : {}),
    ...(academicIntegrity ? { courseKind: 'academic_integrity' } : {}),
    ...(options.conditionalRequirement ? { conditionalRequirement: true } : {})
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
    sourceUrl: options.sourceUrl || curriculumSources[programmeId],
    courses: codes.map((code) => course(programmeId, code, {
      conditionalRequirement: (options.conditionalCodes || []).includes(code),
      name: (options.titleOverrides || {})[code]
    }))
  };
}

function academicIntegrity(programmeId) {
  return group(programmeId, 'academic-integrity', 'Engineering Ethics and Academic Integrity', 'academic_integrity', ['EEE5T03'], {
    creditsRequired: 1,
    coursesRequired: 1,
    ruleText: 'Complete EEE5T03 Engineering Ethics and Academic Integrity for 1 credit.',
    sourceUrl: programmeSources[programmeId]
  });
}

function dissertation(programmeId, code) {
  return group(programmeId, 'dissertation-option', 'Dissertation Option', 'dissertation', [code], {
    ruleText: `The 9-credit ${code} ${catalogue[code]} is used only on the seven-taught-subject Dissertation path and replaces three taught subjects.`,
    sourceUrl: SYLLABI_URL
  });
}

function industrialLogisticsSystems() {
  const programmeId = 'POLYU-TPG-053';
  return {
    programmeId,
    faculty: 'Department of Industrial and Systems Engineering (ISE)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page, current ISE curriculum, current 2025/26 Scheme Handbook and official ISE Subject Syllabi publish the complete coded structure, including the 9-credit ISE529 Dissertation (ILS) and 1-credit EEE5T03. The MSc has either seven taught subjects plus Dissertation or ten taught subjects. Both paths require all four Compulsory Subjects; the Dissertation path requires at least one Core and at most two Electives, while the non-Dissertation path requires at least three Core Subjects including ISE550 and at most three Electives. The wider subject availability at registration, path-dependent Core minimum and ISE550 condition require manual audit review.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['ISE512', 'ISE526', 'ISE527', 'ISE544'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four Compulsory Subjects for 12 credits.'
      }),
      group(programmeId, 'core-subjects', 'Core Subjects', 'core', ['ISE518', 'ISE525', 'ISE548', 'ISE550', 'ISE5019', 'ISE5606'], {
        creditsRequired: 3,
        coursesRequired: 1,
        conditionalCodes: ['ISE550'],
        ruleText: 'Complete at least one Core Subject on the Dissertation path or at least three Core Subjects on the non-Dissertation path. ISE550 is compulsory within the non-Dissertation Core selection.'
      }),
      group(programmeId, 'elective-subjects', 'Elective Subjects', 'elective', ['ISE538', 'ISE5312', 'ISE5323', 'ISE5332', 'ISE5333', 'LGT5002', 'LGT5007', 'LGT5010', 'LGT5013', 'LGT5017', 'LGT5164'], {
        ruleText: 'Use at most two Elective Subjects on the Dissertation path or at most three on the non-Dissertation path. Subject availability is confirmed during registration.'
      }),
      dissertation(programmeId, 'ISE529'),
      academicIntegrity(programmeId)
    ]
  };
}

function knowledgeTechnologyManagement() {
  const programmeId = 'POLYU-TPG-054';
  return {
    programmeId,
    faculty: 'Department of Industrial and Systems Engineering (ISE)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page, current ISE curriculum, current 2025/26 Scheme Handbook and official ISE Subject Syllabi publish the complete coded structure, including the 9-credit ISE5003 Dissertation (KTM) and 1-credit EEE5T03. The MSc has either seven taught subjects plus Dissertation or ten taught subjects. Both paths require all four Compulsory Subjects; the Dissertation path requires at least one Core and at most two Electives, while the non-Dissertation path requires at least three Core Subjects including ISE5002 and at most three Electives. The current curriculum also states that a wider ISE Elective selection is available at registration, so path-dependent minima, ISE5002 and dynamic availability require manual audit review.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['ISE542', 'ISE549', 'ISE5001', 'ISE5601'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four Compulsory Subjects for 12 credits.'
      }),
      group(programmeId, 'core-subjects', 'Core Subjects', 'core', ['ISE518', 'ISE525', 'ISE559', 'ISE5002', 'ISE5021', 'ISE5606'], {
        creditsRequired: 3,
        coursesRequired: 1,
        conditionalCodes: ['ISE5002'],
        ruleText: 'Complete at least one Core Subject on the Dissertation path or at least three Core Subjects on the non-Dissertation path. ISE5002 is compulsory within the non-Dissertation Core selection.'
      }),
      group(programmeId, 'elective-subjects', 'Elective Subjects', 'elective', ['ISE5022', 'ISE5026', 'ISE5312', 'ISE5323', 'ISE5332', 'ISE5333', 'AAE5105', 'AAE5112', 'AAE5301', 'LGT5007', 'LGT5015', 'LGT5105', 'MM5112'], {
        ruleText: 'Use at most two Elective Subjects on the Dissertation path or at most three on the non-Dissertation path. A wider ISE selection may be available during registration.'
      }),
      dissertation(programmeId, 'ISE5003'),
      academicIntegrity(programmeId)
    ]
  };
}

function smartManufacturing() {
  const programmeId = 'POLYU-TPG-055';
  return {
    programmeId,
    faculty: 'Department of Industrial and Systems Engineering (ISE)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page, current ISE Programme Structure, current 2025/26 Scheme Handbook and official ISE Subject Syllabi publish the complete coded structure, including new ISE5334, the 9-credit ISE5699 Dissertation (SM) and 1-credit EEE5T03. The MSc has either seven taught subjects plus Dissertation or ten taught subjects. Both paths require all four Compulsory Subjects; the Dissertation path requires at least one Core and at most two Electives, while the non-Dissertation path requires at least three Core Subjects and at most three Electives. The current Programme Structure calls ISE538 Process and Performance Measurement while its linked Subject Syllabus is titled Process and Performance Management; the 2027 Programme title is retained and the title conflict and path rules require manual review.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['ISE5301', 'ISE5311', 'ISE5321', 'ISE5331'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four Compulsory Subjects for 12 credits.'
      }),
      group(programmeId, 'core-subjects', 'Core Subjects', 'core', ['ISE5312', 'ISE5322', 'ISE5323', 'ISE5332', 'ISE5333', 'ISE538', 'ISE5021'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete at least one Core Subject on the Dissertation path or at least three Core Subjects on the non-Dissertation path.',
        titleOverrides: { ISE538: 'Process and Performance Measurement' }
      }),
      group(programmeId, 'elective-subjects', 'Elective Subjects', 'elective', ['ISE5019', 'ISE5026', 'ISE5334'], {
        ruleText: 'Use at most two Elective Subjects on the Dissertation path or at most three on the non-Dissertation path.'
      }),
      dissertation(programmeId, 'ISE5699'),
      academicIntegrity(programmeId)
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const expectations = {
    'POLYU-TPG-053': [/7 taught subjects/, /ISE550/, /EEE5T03/],
    'POLYU-TPG-054': [/7 taught subjects/, /ISE5002/, /EEE5T03/],
    'POLYU-TPG-055': [/7 taught subjects/, /Industrial Prompt Engineering for Generative Artificial Intelligence/, /EEE5T03/]
  };
  Object.entries(expectations).forEach(([programmeId, patterns]) => {
    const row = snapshot.rows.find((item) => item.programmeId === programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, programmeSources[programmeId]);
    patterns.forEach((pattern) => assert.match(row.curriculumText, pattern));
  });

  const programmes = [industrialLogisticsSystems(), knowledgeTechnologyManagement(), smartManufacturing()];
  const expectedCounts = [23, 25, 16];
  programmes.forEach((programme, index) => {
    const courses = programme.courseGroups.flatMap((item) => item.courses);
    assert.equal(courses.length, expectedCounts[index]);
    assert.equal(new Set(courses.map((item) => item.code)).size, courses.length, `${programme.programmeId} has duplicate course codes`);
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
