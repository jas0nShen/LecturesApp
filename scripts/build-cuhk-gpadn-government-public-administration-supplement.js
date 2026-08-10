const fs = require('node:fs');
const path = require('node:path');

const PROGRAMME_URL =
  'https://sgps.cuhk.edu.hk/en/study-programmes/undergraduate-programmes/bssc-in-government-and-public-administration/';
const STUDY_SCHEME_URL = 'https://sgps.cuhk.edu.hk/gpadn_eng_24/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/gpadn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-gpadn-government-public-administration-courses-2024.json'
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
GPAD1000|Learning GPA|3
GPAD1020|Fundamentals of Government|3
GPAD1030|Fundamentals of Public Administration|3
GPAD1050|Government of Hong Kong|3
GPAD1070|Government and Politics of China|3
GPAD1095|Issues of Political Philosophy|3
GPAD2111|Political Research Methodology|3
GPAD2130|Introductory Comparative Politics|3
GPAD2345|International Politics|3
GPAD1016|Politics of Sports|3
GPAD1046|The Art of Leadership|3
GPAD1055|Parliamentary Practices and Procedures|3
GPAD1056|Introductory Game Theory|3
GPAD2120|Democracies in the West|3
GPAD2140|Selected Topics in Comparative Politics I|3
GPAD2145|Electoral Studies|3
GPAD2196|Public Opinion Research: Theories and Practices|3
GPAD2215|Political Communication in Practice|3
GPAD2300|Understanding Human Rights|3
GPAD2395|Asian Comparative Politics|3
GPAD2450|Introduction to Political Economy|3
GPAD3040|Democratization|3
GPAD3050|Inter-governmental Relations|3
GPAD3160|Governance of European Union|3
GPAD3161|The Rise of Populism in Europe|3
GPAD3190|Politics of Development|3
GPAD3360|Global Environmental Politics|3
GPAD4080|Political Analysis|3
GPAD4142|Seminar in Comparative Politics|3
GPAD1066|China and The World|3
GPAD1073|Reading Chinese Culture and Politics through Movies|3
GPAD1074|Hong Kong Movies and Politics|3
GPAD1077|Critical Debates in Hong Kong|3
GPAD2015|Selected Topics in Hong Kong Politics I|3
GPAD2025|Selected Topics in Chinese Politics I|3
GPAD2350|Chinese Foreign Policy|3
GPAD2370|Taiwan Studies|3
GPAD2555|State-Society Relations in Contemporary China|3
GPAD3260|Public Policy and Administration in China|3
GPAD4027|Seminar in Chinese Politics|3
GPAD4030|Seminar in Hong Kong Studies|3
GPAD4065|Contentious Politics in China|3
GPAD4385|Institution and Reform in China|3
GPAD1076|Thinking Politically|3
GPAD1100|Politics, Law and Society|3
GPAD2020|Politics of Culture|3
GPAD2065|Values and Public Affairs|3
GPAD2075|Selected Topics in Political Theory I|3
GPAD3070|Contemporary Political Philosophy|3
GPAD3071|Gender and Politics|3
GPAD3146|The Idea of Freedom|3
GPAD3220|Politics of Space|3
GPAD3365|Ethics and International Affairs|3
GPAD4077|Seminar in Political Theory|3
GPAD4200|Reading Political Philosophy I: John Rawls|3
GPAD4211|Philosophy of Social Science|3
GPAD4335|Modern Chinese Political Thought|3
GPAD2185|International Organizations|3
GPAD2355|Globalization and Politics|3
GPAD2375|Asian International Relations|3
GPAD3451|International Political Economy|3
GPAD4225|Theories of International Relations|3
GPAD2035|Selected Topics in Public Administration I|3
GPAD2070|Social Networking Services, Social Listening and Public Affairs|3
GPAD2085|Public Governance and Civil Service in HK|3
GPAD2090|Governance and Public Policy|3
GPAD2095|Public Policy Workshop|3
GPAD2150|Public Human Resources Management|3
GPAD2160|Public Finance and Budgeting|3
GPAD2170|Public Organization and Management|3
GPAD3255|Public Policy Analysis|3
GPAD4020|Seminar in Public Administration|3
GPAD1010|Political Debate|3
GPAD1015|Politics and Mass Media|3
GPAD3111|Quantitative Methods in Political Science|3
GPAD4111|Applied Statistical Methods for the Social Sciences|3
GPAD4801|Professional Practicum I|3
GPAD4802|Professional Practicum II|3
GPAD4601|Independent Studies I|3
GPAD4602|Independent Studies II|3
GPAD4701|Graduation Thesis I|0
GPAD4702|Graduation Thesis II|6
`);

const FACULTY_PACKAGE_CODES = new Set(['GPAD1020']);
const REQUIRED_CODES = new Set(
  splitCodes('GPAD1000 GPAD1030 GPAD1050 GPAD1070 GPAD1095 GPAD2111 GPAD2130 GPAD2345')
);
const FIELD_GROUPS = {
  'Field Elective · Politics - Comparative Politics': splitCodes(`
GPAD1016 GPAD1046 GPAD1055 GPAD1056 GPAD2120 GPAD2140 GPAD2145 GPAD2196
GPAD2215 GPAD2300 GPAD2395 GPAD2450 GPAD3040 GPAD3050 GPAD3160 GPAD3161
GPAD3190 GPAD3360 GPAD4080 GPAD4142
`),
  'Field Elective · Politics - Greater China': splitCodes(`
GPAD1066 GPAD1073 GPAD1074 GPAD1077 GPAD2015 GPAD2025 GPAD2350 GPAD2370
GPAD2555 GPAD3260 GPAD4027 GPAD4030 GPAD4065 GPAD4385
`),
  'Field Elective · Politics - Political Theory': splitCodes(`
GPAD1076 GPAD1100 GPAD2020 GPAD2065 GPAD2075 GPAD2300 GPAD3070 GPAD3071
GPAD3146 GPAD3220 GPAD3365 GPAD4077 GPAD4200 GPAD4211 GPAD4335
`),
  'Field Elective · International Relations': splitCodes(`
GPAD1066 GPAD2185 GPAD2300 GPAD2350 GPAD2355 GPAD2375 GPAD3160 GPAD3161
GPAD3360 GPAD3365 GPAD3451 GPAD4225
`),
  'Field Elective · Public Administration and Policy': splitCodes(`
GPAD1046 GPAD2035 GPAD2065 GPAD2070 GPAD2085 GPAD2090 GPAD2095 GPAD2150
GPAD2160 GPAD2170 GPAD2196 GPAD2215 GPAD3255 GPAD3260 GPAD4020
`),
  'Field Elective · Professional Practicum': splitCodes(`
GPAD1010 GPAD1015 GPAD1055 GPAD1056 GPAD2070 GPAD2095 GPAD2150 GPAD2160
GPAD2170 GPAD2196 GPAD2215 GPAD2450 GPAD3111 GPAD3255 GPAD4111 GPAD4801
GPAD4802
`),
};
const CAPSTONE_CODES = new Set(
  splitCodes(`
GPAD4601 GPAD4602 GPAD4701 GPAD4702 GPAD4801 GPAD4802 GPAD4010 GPAD4020
GPAD4027 GPAD4030 GPAD4065 GPAD4077 GPAD4080 GPAD4111 GPAD4142 GPAD4200
GPAD4211 GPAD4225 GPAD4335 GPAD4385
`)
);
const PRACTICUM_CODES = new Set(['GPAD4801', 'GPAD4802']);
const RECOMMENDED_SCHEDULE = {
  GPAD1020: [1, 'Term 1'],
  GPAD1000: [1, 'Term 1'],
  GPAD1030: [1, 'Term 2'],
  GPAD1050: [2, 'Term 1'],
  GPAD1070: [2, 'Term 1'],
  GPAD1095: [2, 'Term 1'],
  GPAD2111: [2, 'Term 2'],
  GPAD2130: [3, 'Term 1'],
  GPAD2345: [3, 'Term 2'],
};

function buildCourses() {
  const courses = COURSE_ROWS.map((row) => {
    const groups = [];
    if (FACULTY_PACKAGE_CODES.has(row.code)) {
      groups.push('Faculty Package · fixed GPAD1020 plus two external courses · 9 units');
    }
    if (REQUIRED_CODES.has(row.code)) groups.push('Major Required · fixed course · 24 units');
    for (const [group, codes] of Object.entries(FIELD_GROUPS)) {
      if (codes.includes(row.code)) groups.push(`${group} · choose three courses in each of two fields`);
    }
    if (!FACULTY_PACKAGE_CODES.has(row.code) && !REQUIRED_CODES.has(row.code)) {
      groups.push('Free Major Elective · any five GPAD courses except GPAD1076 and GPAD1077');
    }
    if (CAPSTONE_CODES.has(row.code)) {
      groups.push('Capstone candidate · minimum 6 units · no double counting with Field Electives');
    }

    let courseType = 'major_elective';
    if (FACULTY_PACKAGE_CODES.has(row.code) || REQUIRED_CODES.has(row.code)) courseType = 'core';
    else if (PRACTICUM_CODES.has(row.code)) courseType = 'internship';
    else if (CAPSTONE_CODES.has(row.code)) courseType = 'capstone';

    const schedule = RECOMMENDED_SCHEDULE[row.code];
    return {
      ...row,
      courseType,
      group: groups.join(' · '),
      ...(schedule ? { recommendedYear: schedule[0], semester: schedule[1] } : {}),
    };
  });

  if (courses.length !== 82) throw new Error(`Expected 82 GPADN courses, got ${courses.length}`);
  if (new Set(courses.map((course) => course.code)).size !== 82) {
    throw new Error('Expected 82 unique GPADN course codes');
  }
  return courses.sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Governance and Policy Science',
    academicYear: 'Applicable to students admitted in 2024-25; reviewed on 2026-08-10',
    sourceUrl: STUDY_SCHEME_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL],
    note: 'The official seven-page 2024-25 Major Programme PDF (325,428 bytes; SHA-256 52987a25edcd5b2bdf6a034ebf4b214ff41d87af92c21a7188eb2d4337f5468c) was text-extracted and every page was rendered and visually reviewed. It publishes an explicit Course List of 82 unique GPAD codes with titles and units: 80 courses at 3 units, GPAD4701 at 0 units and GPAD4702 at 6 units. The standard Major totals 72 units: a 9-unit Faculty Package, 24 fixed Required units, six Field Elective courses across two of six fields for 18 units, five Free Major Electives for 15 units and at least 6 Capstone units. The senior-entry route totals 57 units with a different Faculty Package, Required and Free Elective composition. The current Programme page snapshot (52,414 bytes; SHA-256 229154f78334c6d6206bd23b0d597101a94117e68184616a6e1b3bf11ce003cb) links this as its latest published Major requirement. The requirement pages also list non-GPAD Faculty Package and Field candidates without their titles and per-course units, and list GPAD4010 as a Capstone seminar even though it has no row in the PDF Course List; none of those omitted rows is reconstructed from other Programmes or code arithmetic. Cross-field duplicate counting, the non-GPAD subject-area maximum, exclusion of GPAD1076/GPAD1077 from Free Major Electives, 2000-level minimums, standard versus senior-entry paths and multiple Capstone alternatives are not closed by the local rule engine. Therefore the complete 82-course GPAD Course List remains browse-only with totalCreditRequired=0 and no graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'GPADN',
        jupasCode: 'JS4848',
        programmeId: 'CUHK-UG-GPADN-77',
        majorId: 'CUHK-UG-GPADN-77-M1',
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
  FIELD_GROUPS,
  CAPSTONE_CODES,
  PRACTICUM_CODES,
  RECOMMENDED_SCHEDULE,
  buildCourses,
  buildSupplement,
};
