const fs = require('node:fs');
const path = require('node:path');

const CURRICULUM_URL =
  'https://gbs.bschool.cuhk.edu.hk/internationally-oriented-curriculum/';
const BROCHURE_URL =
  'https://ug.bschool.cuhk.edu.hk/wp-content/uploads/2025/10/GBS-Brochure-26-27.pdf';
const CUSIS_URL =
  'http://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/Public/tt_dsp_crse_catalog.aspx';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/ibbac-gbs/';
const CROSS_CHECK_URLS = [
  'https://www.glef.cuhk.edu.hk/site/assets/files/1672/glefn_eng_25_formatted.pdf',
  'https://ifaa.bschool.cuhk.edu.hk/wp-content/uploads/2025/04/IFAAB_ENG_25.docx',
  'https://pacc.bschool.cuhk.edu.hk/wp-content/uploads/2025/08/2025-PACC-Curriculum.jpg',
  'https://www.qfrm.cuhk.edu.hk/wp-content/uploads/2025/10/QFRM_ENG_25.pdf',
];
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-ibbac-gbs-global-business-studies-courses-2026.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title, credits, courseType, group] = line.split('|');
      return {
        code,
        title,
        credits: Number(credits),
        courseType,
        group,
      };
    });
}

const COURSE_ROWS = parseRows(`
DOTE1030|Economics for Business Studies I|3|core|Faculty Package · fixed course
DOTE1040|Economics for Business Studies II|3|core|Faculty Package · fixed course
MGNT1020|Management|3|core|Faculty Package · fixed course
ACCT2111|Introductory Financial Accounting|3|core|Major Required · Accounting · fixed course
ACCT2121|Introductory Management Accounting|3|core|Major Required · Accounting · fixed course
ACCT2151|Legal Environment for Business|2|core|Major Required · Accounting · choose ACCT2151 or ACCT3151
ACCT3151|Business Law|3|core|Major Required · Accounting · choose ACCT2151 or ACCT3151
IBBA3040|Business Lecture Series|1|core|Major Required · Business Seminar and Study Trip · fixed course
IBBA4010|Issues in Asian Business|3|core|Major Required · Business Seminar and Study Trip · study trip
DOTE2011|Statistical Analysis for Business Decisions|4|core|Major Required · Decisions, Operations and Technology · fixed course
DOTE2030|Operations Management|3|core|Major Required · Decisions, Operations and Technology · fixed course
DOTE2051|Business Information Systems|3|core|Major Required · Decisions, Operations and Technology · fixed course
FINA2010|Financial Management|3|core|Major Required · Finance · fixed course
MGNT2511|Global Experiential Learning I|1|core|Major Required · Management · fixed course
MGNT2512|Global Experiential Learning II|1|core|Major Required · Management · fixed course
MGNT2611|Business Sustainability|2|core|Major Required · Management · fixed course
MGNT4010|Strategic Management|3|capstone|Major Required · Management · Capstone Course
MGNT4510|China Business|3|core|Major Required · Management · fixed course
MKTG2010|Marketing Management|3|core|Major Required · Marketing · fixed course
MKTG3010|Marketing Research|3|core|Major Required · Marketing · fixed course
MKTG4070|Marketing in China|3|core|Major Required · Marketing · fixed course
`);

const OFFICIAL_NAMED_CODES = `
DOTE1030 DOTE1040 MGNT1020 ACCT2111 ACCT2121 ACCT2151 ACCT3151 IBBA3040 IBBA4010
DOTE2011 DOTE2030 DOTE2051 FINA2010 MGNT2511 MGNT2512 MGNT2611 MGNT4010 MGNT4510
MKTG2010 MKTG3010 MKTG4070
`
  .trim()
  .split(/\s+/);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK IBBAC-GBS course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Global Business Studies Programme',
    academicYear: '2026-27 brochure and current curriculum; reviewed on 2026-07-30',
    sourceUrl: CURRICULUM_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [BROCHURE_URL, CUSIS_URL, ...CROSS_CHECK_URLS],
    note: 'The current Programme curriculum page (last modified 2025-09-26) publishes a 123-unit curriculum: 39 University Core units, 9 Faculty Package units, 44-45 Major Required units, and 12 units of approved business-related courses at overseas universities in North America and Europe. Its fixed local named scope contains 21 unique codes: 3 Faculty Package courses and 18 Major Required codes, including both sides of the ACCT2151/ACCT3151 alternative. The official 12-page 2026-27 brochure (3,906,724 bytes; SHA-256 bd71261ecf592d34a6b9ea0f0ec40717ea21c4b1e4edccfb719aa601273fe841) was text-extracted and visually reviewed page by page; page 5 confirms the suggested study sequence and leaves overseas business-related courses open. Current CUSIS Course Catalogue results confirm IBBA4010, DOTE2030, MKTG3010 and MKTG4070 as 3-unit courses and resolve the Programme page typo "MGTNT 4510" to MGNT4510 China Business, 3 units. Credits for the remaining named courses are cross-checked against current-year official CUHK Programme schemes already maintained in this repository and linked as additional sources. Because the overseas course identities are approval-dependent, electives and other foundation courses are open, and the current local rule engine cannot prove the alternative and exchange paths, the 21-code local named scope remains browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'IBBAC-GBS',
        jupasCode: 'JS4214',
        programmeId: 'CUHK-UG-IBBAC-GBS-19',
        majorId: 'CUHK-UG-IBBAC-GBS-19-M1',
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
  OFFICIAL_NAMED_CODES,
  buildCourses,
  buildSupplement,
};
