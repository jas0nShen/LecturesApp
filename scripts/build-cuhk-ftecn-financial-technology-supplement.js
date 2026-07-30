const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.se.cuhk.edu.hk/wp-content/uploads/2025/09/2025-SEEM-FinTech-Leaflet_final.pdf';
const PROGRAMME_URL =
  'https://www.se.cuhk.edu.hk/programmes/undergraduate-programmes/fintech-undergraduate-programme/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/ftecn/';
const ENGG1110_URL =
  'https://www.ie.cuhk.edu.hk/courses/engg1110-estr1002-problem-solving-by-programming/';
const ACCT2111_URL =
  'https://rgsntl.rgs.cuhk.edu.hk/aqs_prd_applx/public/handbook/view_document.aspx?id=1847&seq=1&lang=en';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-ftecn-financial-technology-courses-2025.json'
);

const COURSE_SECTIONS = [
  {
    name: 'Faculty Package',
    courseType: 'core',
    rows: [
      [['ENGG1110', 'ESTR1002'], 'Problem Solving By Programming'],
      [['ENGG1120', 'ESTR1005'], 'Linear Algebra for Engineers'],
      [['ENGG1125', 'ESTR1007'], 'Single Variable Calculus for Engineers'],
      [['ENGG1111'], 'AI Literacy Workshop'],
    ],
  },
  {
    name: 'FinTech Foundation Courses',
    courseType: 'core',
    rows: [
      [['AIST1110'], 'Introduction to Computing Using Python'],
      [['CSCI1120', 'ESTR1100'], 'Introduction to Computing Using C++'],
      [['CSCI1130', 'ESTR1102'], 'Introduction to Computing Using Java'],
      [['ENGG1130', 'ESTR1006'], 'Multivariable Calculus for Engineers'],
      [['ENGG2440', 'ESTR2004'], 'Discrete Mathematics for Engineers'],
      [['ENGG2760', 'ESTR2018'], 'Probability for Engineers'],
      [['ENGG2780', 'ESTR2020'], 'Statistics for Engineers'],
    ],
  },
  {
    name: 'Required Courses',
    courseType: 'core',
    rows: [
      [['CSCI2100', 'ESTR2102'], 'Data Structures'],
      [['ECON2011'], 'Basic Microeconomics'],
      [['FINA2310'], 'Fundamentals of Business Finance'],
      [['FTEC2101', 'ESTR2520'], 'Optimization Methods'],
      [['FTEC3001'], 'Financial Innovation & Structured Products'],
      [['FTEC3002'], 'Introduction to Financial Infrastructures'],
      [['FTEC4003'], 'Data Mining for FinTech'],
      [['SEEM2520'], 'Fundamentals in Financial Engineering and Financial Technology'],
      [['SEEM3500', 'ESTR3506'], 'Fundamentals in Information Systems'],
      [['SEEM3590', 'ESTR3509'], 'Investment Science'],
    ],
  },
  {
    name: 'Research Component Courses',
    courseType: 'capstone',
    rows: [
      [['FTEC4998'], 'Final Year Project I'],
      [['FTEC4999'], 'Final Year Project II'],
    ],
  },
  {
    name: 'Practicum Course',
    courseType: 'internship',
    rows: [[['FTEC2602'], 'Financial Technology Practicum']],
  },
  {
    name: 'Legal Course',
    courseType: 'core',
    rows: [[['FTEC2001'], 'FinTech Regulation and Legal Policy']],
  },
  {
    name: 'Elective Courses',
    courseType: 'major_elective',
    rows: [
      [['ACCT2111'], 'Introductory Financial Accounting'],
      [['AIST4010', 'ESTR4140'], 'Foundation of Applied Deep Learning'],
      [['CSCI2040'], 'Introduction to Python'],
      [['CSCI2120'], 'Introduction to Software Engineering'],
      [['CSCI3150', 'ESTR3102'], 'Introduction to Operating Systems'],
      [['CSCI3160', 'ESTR3104'], 'Design and Analysis of Algorithms'],
      [['CSCI3320'], 'Fundamentals of Machine Learning'],
      [['CSCI4130', 'IERG4130', 'ESTR4306'], 'Introduction to Cyber Security'],
      [['CSCI4160', 'ESTR4104'], 'Distributed and Parallel Computing'],
      [['CSCI4180', 'ESTR4106'], 'Introduction to Cloud Computing and Storage'],
      [['CSCI4430', 'ESTR4120'], 'Data Communication and Computer Networks'],
      [['IERG3310', 'ESTR3310'], 'Computer Networks'],
      [['IERG4004'], 'E-payment Systems and Cryptocurrency Technologies'],
      [['ECON2021'], 'Basic Macroeconomics'],
      [['ENGG1820'], 'Engineering Internship'],
      [['FINA3020'], 'International Finance'],
      [['FINA3030'], 'Management of Financial Institutions'],
      [['FINA3070'], 'Corporate Finance: Theory and Practice'],
      [['FINA3210'], 'Risk Management and Insurance'],
      [['FINA4010'], 'Security Analysis'],
      [['FTEC4001'], 'Advanced Database Technologies'],
      [['FTEC4002'], 'Behavioral Analytics'],
      [['FTEC4005'], 'Financial Informatics'],
      [['FTEC4006'], 'Internet Finance'],
      [['FTEC4007'], 'Introduction to Blockchain and Distributed Ledger Technology'],
      [['FTEC4008'], 'Natural Language Processing for FinTech'],
      [['IERG4080', 'ESTR4312'], 'Building Scalable Internet-based Services'],
      [['IERG4210'], 'Web Programming and Security'],
      [['MKTG4120'], 'Quantitative Marketing'],
      [['SEEM3410'], 'System Simulation'],
      [['SEEM3450', 'ESTR3502'], 'Engineering Innovation and Entrepreneurship'],
      [['SEEM3580'], 'Risk Analysis for Financial Engineering'],
      [
        ['SEEM4730', 'ESTR4508'],
        'Data Analytics Models and Methods for Financial Engineering and Fintech',
      ],
      [['SEEM4760', 'ESTR4512'], 'Stochastic Models for Decision Analytics'],
    ],
  },
];

const EXPLICIT_CREDITS = {
  CSCI2040: 2,
  CSCI2120: 2,
  ENGG1111: 0,
  ENGG1820: 1,
  ENGG2760: 2,
  ENGG2780: 2,
  ESTR2018: 2,
  ESTR2020: 2,
  FTEC2001: 2,
  FTEC2602: 1,
};

function buildCourses() {
  const courses = COURSE_SECTIONS.flatMap(({ name, courseType, rows }) =>
    rows.flatMap(([codes, title]) =>
      codes.map((code) => ({
        code,
        title,
        credits: EXPLICIT_CREDITS[code] ?? 0,
        courseType: code === 'ENGG1820' ? 'internship' : courseType,
        group: `Major Programme Requirement · ${name}`,
      }))
    )
  );
  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  if (coursesByCode.size !== courses.length) {
    throw new Error('CUHK FTECN course list contains duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Systems Engineering and Engineering Management Department',
    academicYear: '2025 official programme leaflet; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL, ENGG1110_URL, ACCT2111_URL],
    note: 'The official four-page 2025 Financial Technology leaflet (830,153 bytes; SHA-256 f81bf0927cde199d4e3468a7c0e02a4eafaac55cc4d98339f3d82eaacdd0ced7) was text-extracted, rendered and visually reviewed page by page. Page 2 publishes a 75-unit Major Programme Requirement table. Expanding every slash-separated alternative and merging the duplicated IERG4004 row produces 85 unique course codes: 35 Core, 46 Major Elective, 2 Final Year Project and 2 Internship/Practicum records. The leaflet truncates ENGG1110 to ENGG110 and ACCT2111 to ACCT211; the full current codes are confirmed by the CUHK Information Engineering course page and CUHK Business handbook respectively. The leaflet directly prints ENGG1111 as 0 unit, ENGG2760/ESTR2018, ENGG2780/ESTR2020, FTEC2001, CSCI2040 and CSCI2120 as 2 units, and FTEC2602 and ENGG1820 as 1 unit. It does not directly print per-code values for the remaining courses, so those keep credits=0 rather than inferring values from the 75-unit total. Slash alternatives, elective selection, the duplicated IERG4004 row, cross-faculty approved courses, and the SJTU/PKU dual-degree and IBBA double-major completion paths require manual review. This evidence-backed union is intentionally browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'FTECN',
        jupasCode: 'JS4428',
        programmeId: 'CUHK-UG-FTECN-46',
        majorId: 'CUHK-UG-FTECN-46-M1',
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
  COURSE_SECTIONS,
  EXPLICIT_CREDITS,
  buildCourses,
  buildSupplement,
};
