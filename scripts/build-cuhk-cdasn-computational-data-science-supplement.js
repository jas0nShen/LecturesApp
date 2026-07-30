const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://www.cdas.cuhk.edu.hk/en/curriculum';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/cdasn/';
const CSE_COURSE_URL = 'https://www.cse.cuhk.edu.hk/academics/ug-course-list/';
const MATH_COURSE_URL = 'https://www.math.cuhk.edu.hk/undergraduates/courses';
const RMSC_CURRICULUM_URL = 'https://rmsc.sta.cuhk.edu.hk/curriculum.php';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-cdasn-computational-data-science-courses-2025.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [
        code,
        title,
        credits,
        recommendedYear,
        semester,
        courseType,
        group,
      ] = line.split('|');
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
ENGG1110|Problem Solving By Programming|3|1|Term 1|foundation|Faculty Package · choose ENGG1110 or ESTR1002
ESTR1002|Problem Solving By Programming|3|1|Term 1|foundation|Faculty Package · choose ENGG1110 or ESTR1002
ENGG1111|AI Literacy Workshop|0|1|Term 1|foundation|Faculty Package · fixed zero-unit workshop
ENGG1120|Linear Algebra for Engineers|3|1|Term 2|foundation|Faculty Package · choose ENGG1120, ESTR1005 or MATH1030
ESTR1005|Linear Algebra for Engineers|3|1|Term 2|foundation|Faculty Package · choose ENGG1120, ESTR1005 or MATH1030
MATH1030|Linear Algebra I|3|1|Term 2|foundation|Faculty Package · choose ENGG1120, ESTR1005 or MATH1030
MATH1010|University Mathematics|3|1||foundation|Faculty Package · fixed course
CSCI1120|Introduction to Computing Using C++|3|2|Term 1|foundation|Foundation Courses · choose CSCI1120 or ESTR1100
ESTR1100|Introduction to Computing Using C++|3|2|Term 1|foundation|Foundation Courses · choose CSCI1120 or ESTR1100
CSCI2100|Data Structures|3|2|Term 2|foundation|Foundation Courses · choose CSCI2100 or ESTR2102
ESTR2102|Data Structures|3|2|Term 2|foundation|Foundation Courses · choose CSCI2100 or ESTR2102
ENGG2440|Discrete Mathematics for Engineers|3|2|Term 1|foundation|Foundation Courses · choose ENGG2440 or ESTR2004
ESTR2004|Discrete Mathematics for Engineers|3|2|Term 1|foundation|Foundation Courses · choose ENGG2440 or ESTR2004
STAT2001|Basic Concepts in Statistics and Probability I|3|1|Term 1|foundation|Foundation Courses · fixed course
STAT2005|Programming Languages for Statistics (R and SAS)|3|1|Term 2|foundation|Foundation Courses · fixed course
STAT2006|Basic Concepts in Statistics and Probability II|3|1|Term 2|foundation|Foundation Courses · fixed course
AIST3020|Introduction to Computer Systems|3|2|Term 2|core|Required Courses · Algorithms and Computer Systems · fixed course
CSCI3160|Design and Analysis of Algorithms|3|3|Term 1|core|Required Courses · Algorithms and Computer Systems · choose CSCI3160 or ESTR3104
ESTR3104|Design and Analysis of Algorithms|3|3|Term 1|core|Required Courses · Algorithms and Computer Systems · choose CSCI3160 or ESTR3104
CSCI3230|Fundamentals of Artificial Intelligence|3|3||core|Required Courses · Machine Learning · choose 3 units
ESTR3108|Fundamentals of Artificial Intelligence|3|3||core|Required Courses · Machine Learning · choose 3 units
CSCI3320|Fundamentals of Machine Learning|3|3||core|Required Courses · Machine Learning · choose 3 units
RMSC4002|Financial Data Analytics with Machine Learning|3|3||core|Required Courses · Machine Learning · choose 3 units
STAT4001|Data Mining and Statistical Learning|3|3||core|Required Courses · Machine Learning · choose 3 units
STAT3003|Survey Methods|3|3||core|Required Courses · Sampling and Computing Methods · choose 6 units
STAT3006|Statistical Computing|3|3||core|Required Courses · Sampling and Computing Methods · choose 6 units
STAT3010|Optimization for Statistics and Data Science|3|3||core|Required Courses · Sampling and Computing Methods · choose 6 units
STAT3008|Applied Regression Analysis|3|2|Term 1|core|Required Courses · Statistical Inference · fixed course
STAT4003|Statistical Inference|3|4|Term 1|core|Required Courses · Statistical Inference · fixed course
STAT3005|Nonparametric Statistics|3|4|Term 1|core|Required Courses · Statistical Modeling · choose STAT3005 or STAT4006
STAT4006|Categorical Data Analysis|3|4|Term 1|core|Required Courses · Statistical Modeling · choose STAT3005 or STAT4006
CDAS4998|Final Year Project I|3|4|Term 1|capstone|Research Component Courses · fixed course
CDAS4999|Final Year Project II|3|4|Term 2|capstone|Research Component Courses · fixed course
`);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK CDASN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Computational Data Science Programme',
    academicYear: '2025 entry only; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      'https://www.cdas.cuhk.edu.hk/en/admission',
      CSE_COURSE_URL,
      MATH_COURSE_URL,
      RMSC_CURRICULUM_URL,
    ],
    note: 'The official current curriculum page explicitly labels this structure for 2025 entry only and publishes a 75-unit Major: 9 Faculty Package units, 18 Foundation units, 24 Required units, 6 Research Component units and 18 Elective units. This supplement preserves the 33 unique codes explicitly named in the Faculty Package, Foundation, Required and Research Component sections, including all slash alternatives, their official titles, units and recommended-year roles. The page names four 18-unit elective options—Computational Data Science, Computational Physics, Computational Medicine and Computational Social Science—but does not publish closed course-code lists for those streams, so no stream elective is inferred or copied from another Programme. The recommended pattern says STAT4010 once, while the authoritative Course List and curriculum overview both name STAT3010 Optimization for Statistics and Data Science; this supplement keeps STAT3010 and does not import STAT4010. Because the four elective paths and their course pools are not publicly closed, this 33-course list is intentionally browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'CDASN',
        jupasCode: 'JS4416',
        programmeId: 'CUHK-UG-CDASN-40',
        majorId: 'CUHK-UG-CDASN-40-M1',
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
