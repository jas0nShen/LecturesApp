const fs = require('node:fs');
const path = require('node:path');

const CURRICULUM_URL =
  'https://dsps.ssc.cuhk.edu.hk/programme/curriculum-for-major-students/';
const COURSE_LIST_URL = 'https://dsps.ssc.cuhk.edu.hk/programme/dsps-courses/';
const BROCHURE_URL =
  'https://dsps.ssc.cuhk.edu.hk/site/assets/files/1/dsps_brochure_2026_entry.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/dspsn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-dspsn-data-science-policy-studies-courses-2023.json'
);

function splitCodes(value) {
  return value.trim().split(/\s+/);
}

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title, credits] = line.split('|');
      return { code, title, credits: Number(credits) };
    });
}

const COURSE_ROWS = parseRows(`
DSPS1001|Introduction to Policy Sciences|0
DSPS1003|Foundation of Data Science|3
DSPS1004|Statistics for Data Science and Policy Studies|3
DSPS3801|Internship|3
DSPS4801|Graduation Capstone Project I|3
DSPS4802|Graduation Capstone Project II|3
COMM3650|Social Media Analytics for Communication Professionals|0
DSPS2102|Statistical Analysis for Policy Decision|0
DSPS2104|Advanced Programming for Data Science|0
DSPS2201|Data Preprocessing for Data Analytics|0
DSPS2202|Database Systems for Data Science|0
DSPS2730|Calculus for Data Science|0
DSPS2830|Linear Algebra for Data Science|0
DSPS3190|Big Data Analytics for Public Policy|0
DSPS3202|Machine Learning for Public Policy|0
DSPS3330|AR/VR Applications for Policy Design|0
DSPS3350|Computer Simulation for Policymaking|0
DSPS3790|Social Network Analysis for Public Policy|0
DSPS3791|Natural Language Processing for Public Policy|0
DSPS3802|Advanced Data Visualization|0
ECON2121|Methods of Economic Statistics|0
ECON3121|Introductory Econometrics|0
GRMD2105|Introduction to GIS|0
SOCI4201|Quantitative Method: Survey and Unconventional Data Types|0
DSPS2301|Policy Analysis and Design Thinking|0
DSPS2320|AI Governance and Public Policy|0
DSPS2501|Managing Technology and Policy Innovation|0
DSPS3320|Data Science and Regulation|0
DSPS3501|Policy Leadership and Entrepreneurship Workshop|0
DSPS3803|AI for Social Good|0
DSPS4310|Policy and Programme Evaluation|0
GPAD2065|Values and Public Affairs|0
GPAD2085|Public Governance and Civil Service in HK|0
GPAD2090|Governance and Public Policy|0
GPAD2095|Public Policy Workshop|0
GPAD2160|Public Finance and Budgeting|0
GPAD2170|Public Organization and Management|0
DSPS3310|Collaborative Governance in a Global Context|0
GLSD2401|Global Sustainability|0
GLSD2501|World Economic Order|0
SOCI3241|Introduction to Global Sociology|0
PSYC3360|Human Intelligence|0
SOCI3102|Social Networks and Social Capital|0
SOCI3227|Social Demography|0
ECON3630|Law and Economics|0
PSYC3370|Psychology and Law|0
SOCI2216|Social Problems in China|0
SOCI3002|Social Stratification|0
SOCI3204|Sociology of Crime and Deviance|0
GRMD2401|Sustainable Development|0
GRMD2403|Nature Conservation in Hong Kong|0
GRMD2501|Theory and Practice of Smart Cities|0
GRMD3203|Urban Environmental Problems|0
GRMD3404|Natural Hazards and Human Responses|0
GRMD4401|Energy Resources for Carbon Neutrality|0
GRMD4502|Urban Big Data Analysis and Application|0
GRMD4503|Smart City Policies and Governance|0
URSP3100|Housing Issues and Policy|0
URSP3300|Sustainable Urban Transport|0
URSP3400|Essentials of the Land Development Process|0
URSP3600|Designing Smart Cities|0
`);

const FACULTY_PACKAGE_CODES = new Set(['DSPS1001']);
const REQUIRED_CODES = new Set(splitCodes('DSPS1003 DSPS1004 DSPS3801 DSPS4801 DSPS4802'));
const METHODS_AND_TOOLS_CODES = splitCodes(`
COMM3650 DSPS2102 DSPS2104 DSPS2201 DSPS2202 DSPS2730 DSPS2830 DSPS3190
DSPS3202 DSPS3330 DSPS3350 DSPS3790 DSPS3791 DSPS3802 ECON2121 ECON3121
GRMD2105 SOCI4201
`);
const POLICY_APPLICATION_GROUPS = {
  'Policy Applications · Policy Science and Public Governance': splitCodes(`
DSPS2301 DSPS2320 DSPS2501 DSPS3320 DSPS3501 DSPS3803 DSPS4310 GPAD2065
GPAD2085 GPAD2090 GPAD2095 GPAD2160 GPAD2170
`),
  'Policy Applications · Global Relationship': splitCodes(`
DSPS3310 GLSD2401 GLSD2501 SOCI3241
`),
  'Policy Applications · Human Resources': splitCodes(`
PSYC3360 SOCI3102 SOCI3227
`),
  'Policy Applications · Social Problems, Deviance, Law and Order': splitCodes(`
ECON3630 PSYC3370 SOCI2216 SOCI3002 SOCI3204
`),
  'Policy Applications · Sustainable Smart Cities': splitCodes(`
GRMD2401 GRMD2403 GRMD2501 GRMD3203 GRMD3404 GRMD4401 GRMD4502 GRMD4503
URSP3100 URSP3300 URSP3400 URSP3600
`),
};
const RECOMMENDED_SCHEDULE = {
  DSPS1001: [1, 'Term 1'],
  DSPS1003: [1, 'Term 1'],
  DSPS1004: [1, 'Term 2'],
  DSPS3202: [3, 'Term 2'],
  DSPS3501: [3, 'Term 2'],
  DSPS3801: [3, 'Term 2'],
  DSPS4801: [4, 'Term 1'],
  DSPS4802: [4, 'Term 2'],
};

function buildCourses() {
  const courses = COURSE_ROWS.map((row) => {
    const groups = [];
    if (FACULTY_PACKAGE_CODES.has(row.code)) {
      groups.push(
        'Faculty Package · fixed DSPS1001 plus two external courses from different academic units · 9 units'
      );
    }
    if (REQUIRED_CODES.has(row.code)) groups.push('Major Required · five fixed courses · 15 units');
    if (METHODS_AND_TOOLS_CODES.includes(row.code)) {
      groups.push('Major Elective · Methods and Tools · choose seven of 18 courses · 21 units');
    }
    for (const [group, codes] of Object.entries(POLICY_APPLICATION_GROUPS)) {
      if (codes.includes(row.code)) {
        groups.push(`${group} · choose any six courses across five areas · 18 units`);
      }
    }
    if (row.code === 'DSPS3202' || row.code === 'DSPS3501') {
      groups.push('Source conflict · Recommended Study Pattern labels this course Major Required');
    }

    let courseType = 'major_elective';
    if (FACULTY_PACKAGE_CODES.has(row.code) || ['DSPS1003', 'DSPS1004'].includes(row.code)) {
      courseType = 'core';
    } else if (row.code === 'DSPS3801') {
      courseType = 'internship';
    } else if (row.code === 'DSPS4801' || row.code === 'DSPS4802') {
      courseType = 'capstone';
    }

    const schedule = RECOMMENDED_SCHEDULE[row.code];
    return {
      ...row,
      courseType,
      group: groups.join(' · '),
      ...(schedule ? { recommendedYear: schedule[0], semester: schedule[1] } : {}),
    };
  });

  if (courses.length !== 61) throw new Error(`Expected 61 DSPSN courses, got ${courses.length}`);
  if (new Set(courses.map((course) => course.code)).size !== 61) {
    throw new Error('Expected 61 unique DSPSN course codes');
  }
  return courses.sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Governance and Policy Science',
    academicYear: 'Applicable to students admitted in 2023-24; reviewed on 2026-08-10',
    sourceUrl: CURRICULUM_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [COURSE_LIST_URL, BROCHURE_URL],
    note: 'The current official Curriculum for Major Students page snapshot (130,076 bytes; SHA-256 e9186a6300981adaa13903ad608c0de93c20a8a8927434ea013e30d5dc1f7782) publishes the complete 2023-24-entry 72-unit Study Scheme and a Course List with code-title pairs for DSPS1001, five fixed Required courses, 18 Methods and Tools candidates and 37 Policy Applications candidates across five areas. These 61 unique code-title pairs are published for browse-only use. The Faculty Package also names 26 external candidate codes, but the DSPS Course List does not publish their titles or per-course units, so they are not reconstructed from other Programmes. The 2026-entry brochure (2,534,909 bytes; SHA-256 36462789a0f03cfa1345d7231a3ad4786ceeccdd95012025bc0c1f2369d362dd) was text-extracted and all eight PDF pages were rendered and visually reviewed: pages 2-5 repeat the same curriculum spread, while pages 1 and 6-8 repeat the same cover/admissions spread. It confirms the same 72-unit category totals and explicitly gives 3 units each for Foundation of Data Science, Statistics for Data Science and Policy Studies and Internship, plus 6 Capstone units; the Study Pattern separately gives DSPS4801 and DSPS4802 as 3 units each. The remaining 56 published rows retain 0 as unknown because the official DSPS sources do not state per-course units and no group-total arithmetic is used. The curriculum-specific Course List labels DSPS2730 Calculus for Data Science and DSPS2830 Linear Algebra for Data Science, while the separate current DSPS Courses page snapshot (49,720 bytes; SHA-256 bd0ccd99ef15c3327b751f21836f779f021f16e5d4e824c4fb6ddd2cc9e1af76) swaps those two titles; this supplement preserves the curriculum-specific titles and records the conflict. The main Study Scheme lists DSPS3202 and DSPS3501 in elective pools, while the Recommended Study Pattern labels both Major Required. Faculty Package choice ownership, the up-to-three non-DSPS courses per subject-area rule, Resident Study Overseas substitutions, the two title conflicts and Required-versus-Elective inconsistency are not closed by the local rule engine. Therefore totalCreditRequired remains 0 and no graduation completion percentage is generated.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'DSPSN',
        jupasCode: 'JS4893',
        programmeId: 'CUHK-UG-DSPSN-70',
        majorId: 'CUHK-UG-DSPSN-70-M1',
        courses: buildCourses(),
      },
    ],
  };
}

function main() {
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(buildSupplement(), null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

if (require.main === module) main();

module.exports = {
  COURSE_ROWS,
  FACULTY_PACKAGE_CODES,
  REQUIRED_CODES,
  METHODS_AND_TOOLS_CODES,
  POLICY_APPLICATION_GROUPS,
  RECOMMENDED_SCHEDULE,
  buildCourses,
  buildSupplement,
};
