const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.se.cuhk.edu.hk/wp-content/uploads/2025/09/2025-SEEM-Leaflet_final.pdf';
const PROGRAMME_URL = 'https://seem.se.cuhk.edu.hk/';
const DEPARTMENT_URL = 'https://www.se.cuhk.edu.hk/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/seemn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-seemn-systems-engineering-management-courses-2025.json'
);

const REQUIRED_ROWS = [
  [['ENGG1110', 'ESTR1002'], 'Problem Solving By Programming'],
  [['ENGG1125', 'ESTR1007'], 'Single Variable Calculus for Engineers'],
  [['ENGG1111'], 'AI Literacy Workshop'],
  [['ENGG1120', 'ESTR1005'], 'Linear Algebra for Engineers'],
  [['ENGG1130', 'ESTR1006'], 'Multivariable Calculus for Engineers'],
  [
    ['ENGG1310', 'ESTR1003'],
    'Engineering Physics: Electromagnetics, Optics and Modern Physics',
  ],
  [['ENGG2720', 'ESTR2014'], 'Complex Variables for Engineers'],
  [['ENGG2740', 'ESTR2016'], 'Differential Equations for Engineers'],
  [['PHYS1003'], 'General Physics for Engineers'],
  [['PHYS1110'], 'Engineering Physics: Mechanics and Thermodynamics'],
  [['SEEM2460', 'ESTR2540'], 'Introduction to Data Science'],
  [['CSCI1120', 'ESTR1100'], 'Introduction to Computing Using C++'],
  [['CSCI1130', 'ESTR1102'], 'Introduction to Computing Using Java'],
  [['ENGG2440', 'ESTR2004'], 'Discrete Mathematics for Engineers'],
  [['ENGG2760', 'ESTR2018'], 'Probability for Engineers'],
  [['SEEM2440', 'ESTR2500'], 'Engineering Economics'],
  [['CSCI2100', 'ESTR2102'], 'Data Structures'],
  [['ENGG2780', 'ESTR2020'], 'Statistics for Engineers'],
  [['SEEM2420'], 'Operations Research I'],
  [['SEEM2602'], 'Systems Engineering Practicum'],
  [['CSCI2040'], 'Introduction to Python'],
  [['SEEM3410'], 'System Simulation'],
  [['SEEM3440', 'ESTR3500'], 'Operations Research II'],
  [['SEEM3550', 'ESTR3506'], 'Fundamentals in Information Systems'],
  [['SEEM3650', 'ESTR3516'], 'Fundamentals in Decision and Data Analytics'],
  [['SEEM4998'], 'Final Year Project I'],
  [['SEEM3450', 'ESTR3502'], 'Engineering Innovation and Entrepreneurship'],
  [['SEEM4999'], 'Final Year Project II'],
];

const ELECTIVE_ROWS = [
  {
    codes: ['SEEM3430'],
    title: 'Information Systems Analysis and Design',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM4540'],
    title: 'Open Systems for E-Commerce',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['AIST3510', 'SEEM3510'],
    title: 'Human and Computer Interaction',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['CSCI4140'],
    title: 'Open Source Software Project Development',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['ENGG1820'],
    title: 'Engineering Internship',
    streams: ['Business Information Systems', 'Decision Analytics'],
  },
  {
    codes: ['FTEC4001'],
    title: 'Advanced Database Technologies',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['FTEC4005'],
    title: 'Financial Informatics',
    streams: ['Business Information Systems', 'Decision Analytics'],
  },
  {
    codes: ['FTEC4007'],
    title: 'Introduction to Blockchain and Distributed Ledger Technology',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM3460', 'ESTR3504'],
    title: 'Computer Processing System Concepts',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM3490'],
    title: 'Information Systems Management',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM3680', 'ESTR3512'],
    title: 'Technology, Consulting and Analytics in Practice',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM4570'],
    title: 'System Design and Implementation',
    streams: ['Business Information Systems'],
  },
  {
    codes: ['SEEM4630'],
    title: 'E-Commerce Data Mining',
    streams: ['Business Information Systems', 'Decision Analytics'],
  },
  {
    codes: ['SEEM3620', 'ESTR3514'],
    title: 'Introduction to Logistics and Supply Chain Management',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM4760', 'ESTR4512'],
    title: 'Stochastic Models for Decision Analytics',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['FTEC4002'],
    title: 'Behavioral Analytics',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['MKTG2010'],
    title: 'Marketing Management',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM2520'],
    title: 'Fundamentals in Financial Engineering and Financial Technology',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM3500'],
    title: 'Quality Control and Management',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM3580'],
    title: 'Risk Analysis for Financial Engineering',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM3590', 'ESTR3509'],
    title: 'Investment Science',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM3630', 'ESTR3510'],
    title: 'Service Management',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM4670'],
    title: 'Service Systems',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM4720', 'ESTR4506'],
    title: 'Computational Finance',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM4730', 'ESTR4508'],
    title: 'Data Analytics Models and Methods for Financial Engineering and Fintech',
    streams: ['Decision Analytics'],
  },
  {
    codes: ['SEEM4750', 'ESTR4510'],
    title: 'Advances in Logistics and Supply Chain Management',
    streams: ['Decision Analytics'],
  },
];

function expandRequiredRows() {
  return REQUIRED_ROWS.flatMap(([codes, title]) =>
    codes.map((code) => {
      let courseType = 'core';
      if (code === 'SEEM4998' || code === 'SEEM4999') courseType = 'capstone';
      if (code === 'SEEM2602') courseType = 'internship';
      return {
        code,
        title,
        credits: 0,
        courseType,
        group:
          courseType === 'capstone'
            ? 'Final Year Projects · SEEM4998 and SEEM4999'
            : 'Recommended Study Plan · Faculty Package, Foundation or Required course',
      };
    })
  );
}

function expandElectiveRows() {
  return ELECTIVE_ROWS.flatMap(({ codes, title, streams }) =>
    codes.map((code) => ({
      code,
      title,
      credits: code === 'ENGG1820' ? 1 : 0,
      courseType: code === 'ENGG1820' ? 'internship' : 'major_elective',
      group: `Major Elective · ${streams.join(' and ')} Stream${
        streams.length > 1 ? 's' : ''
      }`,
    }))
  );
}

function buildCourses() {
  const courses = [...expandRequiredRows(), ...expandElectiveRows()];
  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  if (coursesByCode.size !== courses.length) {
    throw new Error('CUHK SEEMN course list contains duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Systems Engineering and Engineering Management Department',
    academicYear: '2025 official programme leaflet; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL, DEPARTMENT_URL],
    note: 'The official six-page 2025 SEEM leaflet (2,264,700 bytes) was text-extracted, rendered and visually reviewed page by page. Page 3 publishes a recommended 75-unit study plan plus the Business Information Systems and Decision Analytics Stream lists. Expanding every slash-separated alternative and merging repeated cross-Stream courses produces 83 unique course codes: 44 Core, 35 Major Elective, 2 Final Year Project and 2 Internship/Practicum records. The leaflet prints ENGG1111 as 0 unit and ENGG1820 as 1 unit; it does not print a direct per-code value for the remaining courses, so those keep credits=0 rather than inferring values from term or group totals. Slash alternatives, the choice between PHYS1003 and PHYS1110, Stream required-versus-elective ownership, the six-course Stream rule, the adviser-defined no-Stream path and Faculty/Foundation/Required allocation require manual review. This evidence-backed union is intentionally browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'SEEMN',
        jupasCode: 'JS4458',
        programmeId: 'CUHK-UG-SEEMN-51',
        majorId: 'CUHK-UG-SEEMN-51-M1',
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
  ELECTIVE_ROWS,
  REQUIRED_ROWS,
  buildCourses,
  buildSupplement,
};
