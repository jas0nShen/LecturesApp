const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://mase.ee.cuhk.edu.hk/course-list-and-descriptions';
const PROGRAMME_INFO_URL = 'https://mase.ee.cuhk.edu.hk/programme-information';
const PROGRAMME_STRUCTURE_URL = 'https://mase.ee.cuhk.edu.hk/programme-structure';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/masen/';
const BROCHURE_URL = 'https://mase.erg.cuhk.edu.hk/sites/default/files/2025-10/MASE%20Leaflet%20_20251009.pdf';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-masen-materials-science-engineering-courses.json'
);

const COURSE_GROUPS = {
  faculty: [
    [['ENGG1110', 'ESTR1002'], 'Problem Solving by Programming'],
    [['ENGG1125', 'ESTR1007'], 'Single Variable Calculus for Engineers'],
    [['ENGG1130', 'ESTR1006'], 'Multivariable Calculus for Engineers'],
  ],
  foundation: [
    [['CHEM1070'], 'Principles of Modern Chemistry'],
    [['ENGG1310', 'ESTR1003'], 'Engineering Physics: Electromagnetics, Optics and Modern Physics'],
    [['ENGG2780', 'ESTR2020'], 'Statistics for Engineers'],
    [['LSCI1002'], 'Introduction to Biological Sciences'],
    [['PHYS1110'], 'Engineering Physics: Mechanics and Thermodynamics'],
  ],
  required: [
    [['ELEG2202'], 'Fundamentals of Electric Circuits'],
    [['ELEG3301'], 'Principles of Semiconductor Devices'],
    [['MAEG3010'], 'Mechanics of Materials'],
    [['MAEG3020', 'ESTR3404'], 'Manufacturing Technology'],
    [['MASE1001'], 'Introduction to Materials Science and Engineering I'],
    [['MASE1002'], 'Introduction to Materials Science and Engineering II'],
    [['MASE1801'], 'Materials Laboratory'],
    [['MASE2002'], 'Introduction to Polymer Science'],
    [['MASE2202'], 'Fundamentals of Inorganic Materials Processing'],
    [['MASE2601'], 'Technology, Society and Engineering Practice'],
    [['MASE3002'], 'Characterization of Materials'],
    [['MASE4998'], 'Final Year Project I'],
    [['MASE4999'], 'Final Year Project II'],
    [['ENGG1820'], 'Engineering Internship'],
  ],
  elective: [
    [['BMEG3430'], 'Biomaterials and Tissue Engineering'],
    [['CHEM4303'], 'Introduction to Nanoscience and Nanotechnology'],
    [
      ['CSCI1120', 'ESTR1100', 'IERG1080'],
      'Introduction to Computing Using C++ or Introduction to Python for Engineering Applications',
    ],
    [['CSCI3230', 'ESTR3108'], 'Fundamentals of Artificial Intelligence'],
    [['EEEN4020', 'ESTR4402'], 'Solar Energy and Photovoltaic Technology'],
    [['EEEN4050', 'ESTR4422'], 'Energy Storage Devices and Systems'],
    [['EESC4240'], 'Air Pollution Science and Engineering'],
    [['ELEG4304'], 'Wearable Devices'],
    [['MAEG4020', 'ESTR4410'], 'Finite Element Modelling and Analysis'],
    [['MASE3102'], 'Microelectronic Materials'],
    [['MASE3104'], 'Solid-State Sensors'],
    [['MASE3202'], 'Additive Manufacturing of Materials'],
    [['MASE4102'], 'Photonic Materials and Devices'],
    [['MASE4202'], 'Semiconductor Microfabrication Principles and Technologies'],
    [['MASE4204'], 'AI Assisted Design and Manufacturing'],
    [['MASE4206'], 'Electrochemical Corrosion'],
    [['MASE4208'], 'Introduction to Materials Simulation'],
    [['MASE4302'], 'Materials and Sustainability'],
    [['PHYS3021'], 'Quantum Mechanics I'],
    [['PHYS3023'], 'Introduction to Quantum Information Physics'],
    [['PHYS4031'], 'Statistical Mechanics'],
    [['PHYS4050'], 'Solid State Physics'],
    [['PHYS4440'], 'Topics in Nanoscience and Technology'],
    [['SEEM3500'], 'Quality Control and Management'],
  ],
};

const GROUP_METADATA = {
  faculty: {
    courseType: 'core',
    group: 'Faculty Package · 9 units · slash-separated ENGG/ESTR codes are alternatives',
  },
  foundation: {
    courseType: 'core',
    group: 'Foundation Courses · 14 units · slash-separated ENGG/ESTR codes are alternatives',
  },
  required: {
    courseType: 'core',
    group: 'Required Courses · 38 units including compulsory internship and research project',
  },
  elective: {
    courseType: 'major_elective',
    group: 'Elective Courses · 15 units shown by the department · minimum 12 non-project units',
  },
};

function expandGroup(groupKey, rows) {
  const metadata = GROUP_METADATA[groupKey];
  return rows.flatMap(([codes, title]) =>
    codes.map((code) => {
      let courseType = metadata.courseType;
      if (code === 'MASE4998' || code === 'MASE4999') courseType = 'capstone';
      if (code === 'ENGG1820') courseType = 'internship';
      return {
        code,
        title,
        credits: 0,
        courseType,
        group: metadata.group,
      };
    })
  );
}

function buildCourses() {
  const courses = Object.entries(COURSE_GROUPS).flatMap(([groupKey, rows]) =>
    expandGroup(groupKey, rows)
  );
  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  if (coursesByCode.size !== courses.length) {
    throw new Error('CUHK MASEN course list contains duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Materials Science and Engineering Undergraduate Programme',
    academicYear: 'Current department course list; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      PROGRAMME_INFO_URL,
      PROGRAMME_STRUCTURE_URL,
      BROCHURE_URL,
    ],
    note: 'The current official department course page publishes 46 named rows that expand to 58 unique course codes: 6 Faculty Package alternatives, 7 Foundation codes, 15 Required codes and 30 Elective codes. The Programme Information page states a 76-unit programme structure comprising 9 Faculty Package units, 14 Foundation units, 38 Required units including compulsory internship and research project, and 15 Elective units. The four-page official programme brochure was text-extracted and visually reviewed page by page; it confirms the broad Year 1-5 sequence, 20+ electives and compulsory internship but does not add per-code units. The department page does not publish a direct per-code unit value, so every course keeps credits=0 rather than inferring individual units from group totals. Slash-separated alternatives, the three-way CSCI1120/ESTR1100/IERG1080 computing choice, the relation between the stated 15 elective units and the minimum 12 non-project units, study sequencing, the separate MASE & X double-major routes and university requirements require manual review. This evidence-backed course-code union is intentionally browse-only and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'MASEN',
        jupasCode: 'JS4470',
        programmeId: 'CUHK-UG-MASEN-48',
        majorId: 'CUHK-UG-MASEN-48-M1',
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
  COURSE_GROUPS,
  buildCourses,
  buildSupplement,
};
