const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://ifaa.bschool.cuhk.edu.hk/wp-content/uploads/2025/04/IFAAB_ENG_25.docx';
const CURRICULUM_URL = 'https://ifaa.bschool.cuhk.edu.hk/curriculum/';
const BROCHURE_URL =
  'https://ifaa.bschool.cuhk.edu.hk/wp-content/uploads/2025/11/IFAA-Brochure_2025_Online.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/ifaab/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-ifaab-insurance-financial-actuarial-analysis-courses-2025.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title, credits, recommendedYear, semester, courseType, group] =
        line.split('|');
      return {
        code,
        title,
        credits: Number(credits),
        recommendedYear: Number(recommendedYear),
        semester,
        courseType,
        group,
      };
    });
}

const COURSE_ROWS = parseRows(`
ACCT1111|Foundations in Financial Accounting|3|1|Term 1|foundation|Faculty Package · fixed 9-unit package
DOTE1030|Economics for Business Studies I|3|1|Term 1|foundation|Faculty Package · fixed 9-unit package
DOTE1040|Economics for Business Studies II|3|1|Term 2|foundation|Faculty Package · fixed 9-unit package
MATH1530|Basic Mathematics for Business and Social Sciences|3|1|Term 1|foundation|Conditional prerequisite · required before MATH1010 unless the Mathematics Placement Test is passed · not counted in the 78-unit Major
ACCT2121|Introductory Management Accounting|3|2|Term 2|core|Required Courses · fixed course
CSCI1510|Computer Principles and C Programming|3|3|Term 1|core|Required Courses · programming · choose one of CSCI1510, CSCI1520, CSCI1540 or CSCI1580
CSCI1520|Computer Principles and C++ Programming|3|3|Term 1|core|Required Courses · programming · choose one of CSCI1510, CSCI1520, CSCI1540 or CSCI1580
CSCI1540|Fundamental Computing With C++|3|3|Term 1|core|Required Courses · programming · choose one of CSCI1510, CSCI1520, CSCI1540 or CSCI1580
CSCI1580|Visual Programming|3|3|Term 1|core|Required Courses · programming · choose one of CSCI1510, CSCI1520, CSCI1540 or CSCI1580
FINA2010|Financial Management|3|1|Term 2|core|Required Courses · fixed course
FINA2200|Introduction to Actuarial Science|3|1|Term 2|core|Required Courses · fixed course
FINA2220|Quantitative Methods for Actuarial Analysis I|3|2|Term 1|core|Required Courses · fixed course
FINA2230|Quantitative Methods for Actuarial Analysis II|3|2|Term 2|core|Required Courses · fixed course
FINA3080|Investment Analysis and Portfolio Management|3|2|Term 2|core|Required Courses · fixed course
FINA3210|Risk Management and Insurance|3|2|Term 1|core|Required Courses · fixed course
FINA3221|Basic Long-term Actuarial Mathematics|3|2|Term 2|core|Required Courses · fixed course
FINA3222|Basic Short-term Actuarial Mathematics|3|3|Term 1|core|Required Courses · fixed course
FINA3230|Life and Health Insurance|3|2|Term 2|core|Required Courses · fixed course
FINA3240|Corporate Property and Liability Insurance|3|3|Term 1|core|Required Courses · fixed course
FINA3290|Linear Models for Actuaries|3|3|Term 1|core|Required Courses · fixed course
MATH1010|University Mathematics|3|1|Term 1 / Term 2|core|Required Courses · fixed course · take after MATH1530 unless the Mathematics Placement Test is passed
MATH1540|University Mathematics for Financial Studies|3|2|Term 1|core|Required Courses · fixed course
MGNT1020|Management|3|4|Term 1|core|Required Courses · fixed course
ACCT3151|Business Law|3|0||major_elective|Major Elective Courses · choose 18 units
ACCT3161|Taxation|3|0||major_elective|Major Elective Courses · choose 18 units
CSCI2100|Data Structures|3|0||major_elective|Major Elective Courses · choose 18 units · CSCI2100 or CSCI2520
CSCI2520|Data Structures and Applications|3|0||major_elective|Major Elective Courses · choose 18 units · CSCI2100 or CSCI2520
DOTE2051|Business Information Systems|3|0||major_elective|Major Elective Courses · choose 18 units
DOTE3010|Artificial Intelligence Empowered Business|3|0||major_elective|Major Elective Courses · choose 18 units
FINA3010|Financial Markets|3|0||major_elective|Major Elective Courses · choose 18 units
FINA3030|Management of Financial Institutions|3|0||major_elective|Major Elective Courses · choose 18 units
FINA3070|Corporate Finance: Theory and Practice|3|0||major_elective|Major Elective Courses · choose 18 units
FINA3250|Derivatives for Actuaries I|3|0||major_elective|Major Elective Courses · choose 18 units · FINA3250 or FINA4110
FINA3260|Internship Experience|1|0||major_elective|Major Elective Courses · choose 18 units
FINA3295|Advanced Statistical Modeling for Insurance and Finance|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4030|Selected Topics in Finance|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4110|Options and Futures|3|0||major_elective|Major Elective Courses · choose 18 units · FINA3250 or FINA4110
FINA4120|Fixed Income Securities Analysis|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4140|Computational Finance|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4150|Quantitative Methods for Financial Derivatives|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4160|Intermediate Financial Theory|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4211|Advanced Long-term Actuarial Mathematics|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4215|Introduction to Actuarial Computing Using Prophet|1|0||major_elective|Major Elective Courses · choose 18 units
FINA4221|Advanced Short-term Actuarial Mathematics|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4280|Derivatives for Actuaries II|3|0||major_elective|Major Elective Courses · choose 18 units
IBBA3040|Business Lectures Series|1|0||major_elective|Major Elective Courses · choose 18 units
MATH2010|Advanced Calculus I|3|0||major_elective|Major Elective Courses · choose 18 units
MKTG2010|Marketing Management|3|0||major_elective|Major Elective Courses · choose 18 units
MGNT2511|Global Experiential Learning I|1|0||major_elective|Major Elective Courses · choose 18 units
MGNT2512|Global Experiential Learning II|1|0||major_elective|Major Elective Courses · choose 18 units
MGNT2611|Business Sustainability|2|0||major_elective|Major Elective Courses · choose 18 units
RMSC4001|Simulation Methods for Risk Management Science and Finance|3|0||major_elective|Major Elective Courses · choose 18 units
STAT3007|Introduction to Stochastic Processes|3|0||major_elective|Major Elective Courses · choose 18 units
FINA4270|Research Project in Insurance, Financial and Actuarial Analysis|3|4|Term 1 / Term 2|capstone|Capstone Courses · choose one 3-unit course
FINA4290|Actuarial Internship|3|4|Term 1 / Term 2|capstone|Capstone Courses · choose one 3-unit course
FINA4291|Internship in Insurance and Financial Institutions|3|4|Term 1 / Term 2|capstone|Capstone Courses · choose one 3-unit course
MGNT4010|Strategic Management|3|4|Term 1 / Term 2|capstone|Capstone Courses · choose one 3-unit course
`);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK IFAAB course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Insurance, Financial and Actuarial Analysis Programme',
    academicYear: '2025-26 intake and thereafter; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [CURRICULUM_URL, BROCHURE_URL],
    note: 'The official 2025-26 Student Scheme (39,685 bytes; SHA-256 dc1d963011c5d6661ac9978388006e679757cce5723ae1d438c111656f9c18b3) publishes a minimum 78-unit Major: a fixed 9-unit Faculty Package, 48 units of fixed Required Courses plus one 3-unit programming choice, 18 units selected from the published Major Elective pool, and one 3-unit Capstone choice. MATH1530 is a conditional prerequisite before MATH1010 unless the student passes the Programme Mathematics Placement Test; it is not counted in the 78-unit Major, so the recommended path may total 78-81 units. The current official curriculum page (68,936 bytes; SHA-256 eca72935f3dbca84102fbc32f9689914972471bb64c9d9606cae6fabbd58b749) and Student Scheme agree on all 57 unique course codes, titles and units, including current elective DOTE3010. The 20-page 2025 brochure (4,865,544 bytes; SHA-256 bf275481205b7bb9dbb7d041b581426a605e5905302ec3ddd8170a9cc41f749e) was visually reviewed on curriculum pages 3-4 and confirms the programming choice, conditional mathematics sequence, internship/exchange plans, elective pool and four Capstone options. Because the current local rule engine cannot prove the MATH1530 placement-test exception, 1/2-unit elective combinations, pairwise elective alternatives, internship/exchange plans and Capstone path without manual review, this complete 57-code course list remains browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'IFAAB',
        jupasCode: 'JS4238',
        programmeId: 'CUHK-UG-IFAAB-22',
        majorId: 'CUHK-UG-IFAAB-22-M1',
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
