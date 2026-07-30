const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://pacc.bschool.cuhk.edu.hk/wp-content/uploads/2025/08/2025-PACC-Curriculum.jpg';
const CURRICULUM_URL = 'https://pacc.bschool.cuhk.edu.hk/academic/';
const PATTERN_URL = 'https://pacc.bschool.cuhk.edu.hk/recommended-pattern-of-study/';
const PATTERN_IMAGE_URL =
  'https://pacc.bschool.cuhk.edu.hk/wp-content/uploads/2025/08/Freshmen-Handbook_2025-26-39.jpg';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/paccn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-paccn-professional-accountancy-courses-2025.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title, credits, recommendedYear, courseType, group] = line.split('|');
      return {
        code,
        title,
        credits: Number(credits),
        recommendedYear: Number(recommendedYear),
        semester: '',
        courseType,
        group,
      };
    });
}

const COURSE_ROWS = parseRows(`
DOTE1030|Economics for Business Studies I|3|1|foundation|Faculty Package · fixed course within the standard 60-unit Major requirement
DOTE1040|Economics for Business Studies II|3|1|foundation|Faculty Package · fixed course within the standard 60-unit Major requirement
MGNT1020|Management|3|1|foundation|Faculty Package · fixed course within the standard 60-unit Major requirement
ACCT2111|Introductory Financial Accounting|3|1|core|Major Required Courses · standard 60-unit path
ACCT2121|Introductory Management Accounting|3|2|core|Major Required Courses · standard 60-unit path
ACCT3003|Professional Seminar Series|1|2|core|Major Required Courses · standard 60-unit path
ACCT3004|Accounting Practicum & Experiential Learning|2|0|core|Major Required Courses · Global Accounting Stream only · additional to the standard 60-unit path
ACCT3111|Financial Reporting I|3|2|core|Major Required Courses · standard 60-unit path
ACCT3112|Financial Reporting II|3|3|core|Major Required Courses · standard 60-unit path
ACCT3121|Cost and Management Accounting|3|3|core|Major Required Courses · standard 60-unit path
ACCT3142|Contemporary Accounting Information Systems|3|2|core|Major Required Courses · standard 60-unit path
ACCT3151|Business Law|3|3|core|Major Required Courses · standard 60-unit path
ACCT3152|Company Law|3|3|core|Major Required Courses · standard 60-unit path
ACCT3161|Taxation|3|3|core|Major Required Courses · standard 60-unit path
ACCT4111|Advanced Financial Accounting|3|4|core|Major Required Courses · standard 60-unit path
ACCT4131|Auditing|3|3|core|Major Required Courses · standard 60-unit path
DOTE2011|Statistical Analysis for Business Decisions|4|2|core|Major Required Courses · standard 60-unit path
FINA2010|Financial Management|3|2|core|Major Required Courses · standard 60-unit path
MGNT2511|Global Experiential Learning I|1|1|core|Major Required Courses · standard 60-unit path
MGNT2512|Global Experiential Learning II|1|4|core|Major Required Courses · standard 60-unit path
MGNT4010|Strategic Management|3|4|core|Major Required Courses · standard 60-unit path
MKTG2010|Marketing Management|3|2|core|Major Required Courses · standard 60-unit path
ACCT4001|Capstone Project: Business Ethics & Entrepreneurship|2|4|capstone|Major Required Courses · compulsory Capstone within the standard 60-unit path
ACCT3005|Accounting Field Study & Experiential Learning|2|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT3241|Introduction to Python for Business and Accounting Analytics|3|4|major_elective|Major Elective Courses · choose 9 units · available as of 01/07/2024 · annual offering not guaranteed
ACCT4211|Accounting Information in Capital Market|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4212|China Business Valuation and Analysis|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4213|Financial Statement Analysis and Valuation|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4215|Contemporary Accounting Issues in Global Market|3|4|major_elective|Major Elective Courses · Global Accounting Stream only · annual offering not guaranteed
ACCT4221|Strategic Management Accounting|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4231|Internal Auditing and Risk Management|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4232|Forensic Accounting and Audit Analytics|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4242|Accounting Data Analytics for Business|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4243|Data Visualisation in Accounting|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4244|Blockchain Fundamentals for Accountants|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4251|Regulation and Compliance in the Financial Markets|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4252|Corporate Restructuring and Insolvency|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4253|Chinese Legal Environment for Business|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4261|Taxes and Business Strategy|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4262|China Taxation|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4263|International Taxation|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4271|Corporate Governance|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4272|ESG and Sustainability Accounting|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4281|Applied Accounting & Financial Strategy|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4282|Reporting Issues in the Financial Service Industry|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
ACCT4290|Professional Accounting Internship|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
DOTE3010|Artificial Intelligence Empowered Business|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
MATH1610|Linear Algebra for Advanced Accounting Analytics|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
MATH1620|Calculus for Advanced Accounting Analytics|3|4|major_elective|Major Elective Courses · choose 9 units · annual offering not guaranteed
`);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK PACCN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Professional Accountancy Programme',
    academicYear: 'PACC Curriculum 2025; suggested pattern for 2025 entrants; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [CURRICULUM_URL, PATTERN_URL, PATTERN_IMAGE_URL],
    note: 'The official PACC Curriculum 2025 image (500,028 bytes, 1,654 x 2,339 pixels; SHA-256 522be32c183c6e702a71b36dde5f83fc22ab1ce9295350f2510be933da633a07) was visually reviewed and agrees with the live curriculum table. It publishes 49 unique codes: 23 rows in the Major Required column and 26 in the Major Elective pool. Excluding ACCT3004, which is explicitly required only for the Global Accounting Stream, the standard Required rows total exactly 60 units; ACCT3004 is an additional 2-unit Stream-only Practicum. The official suggested pattern image for 2025 entrants (290,381 bytes, 2,200 x 1,700 pixels; SHA-256 3e8faa97a2cef37db1d1c8f2655b9f4e4373d90e83f6fca94315e3ff7e36efab) confirms the standard Required course years, compulsory 2-unit ACCT4001 Capstone and three 3-unit Major Elective slots. The published Elective pool requires 9 units but contains 2-unit ACCT3005, includes Stream-only ACCT4215, and is explicitly not guaranteed to be fully offered in each academic year. Because the current local rule engine cannot prove the Stream-specific additions, low-unit elective combinations, annual offerings and prerequisites, this complete 49-code course list remains browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'PACCN',
        jupasCode: 'JS4240',
        programmeId: 'CUHK-UG-PACCN-25',
        majorId: 'CUHK-UG-PACCN-25-M1',
        courses: buildCourses(),
      },
    ],
  };
}

function main() {
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(buildSupplement(), null, 2)}\n`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  COURSE_ROWS,
  buildCourses,
  buildSupplement,
};
