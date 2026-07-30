const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www4.mae.cuhk.edu.hk/wp-content/uploads/2025/10/EEEN_2025Sep17_A4.pdf';
const PROGRAMME_URL =
  'https://www4.mae.cuhk.edu.hk/energy-and-environmental-engineering/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/eeenn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-eeenn-energy-environmental-engineering-courses-2025.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title, credits] = line.split('|');
      return { code, title, credits: Number(credits) };
    });
}

const FACULTY_PACKAGE_ROWS = parseRows(`
ENGG1110|Problem Solving By Programming|3
ENGG1111|AI Literacy Workshop|0
ENGG1120|Linear Algebra for Engineers|3
ENGG1125|Single Variable Calculus for Engineers|3
`);

const FOUNDATION_ROWS = parseRows(`
ENGG1130|Multivariable Calculus for Engineers|3
MAEG1020|Computational Design and Fabrication|3
PHYS1110|Engineering Physics: Mechanics and Thermodynamics|3
ENGG2740|Differential Equations for Engineers|2
`);

const REQUIRED_ROWS = parseRows(`
EEEN2020|Renewable Energy Technologies|3
EEEN2040|Heating, Ventilation and Air-Conditioning (HVAC) I|3
ELEG2202|Fundamentals of Electric Circuits|3
MAEG2030|Thermodynamics|3
MAEG2601|Technology, Society and Engineering Practice|2
EEEN2602|Engineering Practicum|1
EEEN2030|Energy and Environmental Economics and Management|3
EEEN3030|Engineering Materials|3
EESC2800|Introduction to Environmental Engineering|3
ELEG3207|Introduction to Power Electronics|3
MAEG3030|Fluid Mechanics|3
EEEN4070|Green Building and Sustainable Technologies|3
EEEN4998|Final Year Project I|3
EEEN4999|Final Year Project II|3
MAEG4030|Heat Transfer|3
`);

const ELECTIVE_ROWS = parseRows(`
CHEM4280|Chemistry in Biofuel|2
EEEN4010|Kinetic Energy Harvesting Devices and Systems|3
EEEN4020|Solar Energy and Photovoltaic Technology|3
EEEN4030|Nuclear Energy and Risk Assessment|3
EEEN4050|Energy Storage Devices and Systems|3
EEEN4060|Energy Distribution|3
ELEG3601|Introduction to Electric Power Systems|3
MAEG5120|Nanomaterials and Nanotechnology: Fundamentals and Applications|3
MAEG5150|Advanced Heat Transfer and Fluid Mechanics|3
EEEN3010|Heating, Ventilation and Air-Conditioning (HVAC) II|3
EEEN3020|Energy Utilization and Human Behavior|3
MAEG3050|Introduction to Control Systems|3
MAEG3920|Engineering Design and Applications|3
EESC2020|Climate System Dynamics|3
EESC3230|Principles of Environmental Protection and Pollution Control|3
EESC4240|Air Pollution Science and Engineering|3
EESC4340|Environmental Impact Assessment|3
GRMD3203|Urban Environmental Problems|3
GRMD4202|Hydrology and Water Resources|3
GRMD4204|Environmental Planning and Assessment|3
MAEG4080|Introduction to Combustion|3
MAEG5140|Materials Characterization Techniques|3
CHEM1380|Basic Chemistry for Engineers|3
CSCI1020|Hands-on Introduction to C++|1
CSCI2040|Introduction to Python|2
CSCI2100|Data Structures|3
EESC2515|Environmental Chemistry|3
EESC3200|Atmospheric Dynamics|3
EESC3220|Atmospheric Chemistry|3
EESC3320|Hydrogeology|3
EESC3600|Ecosystems and Climate|3
EESC3800|Global Environmental Change|3
EESC4335|Chemical Treatment Processes|3
EESC4540|Remote Sensing - Principles and Applications|3
ENGG1820|Engineering Internship|1
ENGG2720|Complex Variables for Engineers|2
ENGG2760|Probability for Engineers|2
ENGG2780|Statistics for Engineers|2
GRMD2404|Energy and Society|3
GRMD3202|Environmental Management|3
GRMD3401|Energy Resources for Carbon Neutrality|3
GRMD3403|Methods for Resource Evaluation and Planning|3
PHYS4420|Physics in Meteorology|3
`);

const STREAMS_BY_CODE = new Map([
  ...[
    'CHEM4280',
    'EEEN4010',
    'EEEN4020',
    'EEEN4030',
    'EEEN4050',
    'EEEN4060',
    'ELEG3601',
    'MAEG5120',
    'MAEG5150',
  ].map((code) => [code, 'Sustainable Energy Technology Stream']),
  ...[
    'EEEN3010',
    'EEEN3020',
    'MAEG3050',
    'MAEG3920',
    'MAEG5150',
  ].map((code) => [code, 'Green Building Technology Stream']),
  ...[
    'EESC2020',
    'EESC3230',
    'EESC4240',
    'EESC4340',
    'GRMD3203',
    'GRMD4202',
    'GRMD4204',
    'MAEG4080',
    'MAEG5140',
  ].map((code) => [code, 'Environmental Engineering Stream']),
]);

function buildCourses() {
  const courses = [
    ...FACULTY_PACKAGE_ROWS.map((course) => ({
      ...course,
      courseType: 'core',
      group: 'Faculty Package · 9 units',
    })),
    ...FOUNDATION_ROWS.map((course) => ({
      ...course,
      courseType: 'core',
      group: 'Foundation Courses · 11 units',
    })),
    ...REQUIRED_ROWS.map((course) => {
      let courseType = 'core';
      if (course.code === 'EEEN4998' || course.code === 'EEEN4999') {
        courseType = 'capstone';
      }
      if (course.code === 'EEEN2602') {
        courseType = 'internship';
      }
      return {
        ...course,
        courseType,
        group:
          courseType === 'capstone'
            ? 'Final Year Projects · 6 units'
            : 'Required Courses · 36 units',
      };
    }),
    ...ELECTIVE_ROWS.map((course) => {
      const stream = STREAMS_BY_CODE.get(course.code);
      const courseType = course.code === 'ENGG1820' ? 'internship' : 'major_elective';
      return {
        ...course,
        courseType,
        group: stream
          ? `Major Elective · ${stream}`
          : 'Major Elective · Core or Non-Core pool',
      };
    }),
  ];

  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  if (coursesByCode.size !== courses.length) {
    throw new Error('CUHK EEENN course list contains duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Energy and Environmental Engineering Programme',
    academicYear: '2025 official programme leaflet; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL],
    note: 'The official four-page 2025 Programme leaflet (7,237,631 bytes) was rendered and visually reviewed page by page. Page 3 publishes 66 unique named course codes across the 9-unit Faculty Package, 11-unit Foundation block, 36-unit Required block, 13-unit Major Elective requirement and 6-unit Final Year Projects; it states that every course is 3 units unless another value is printed. The local list preserves the printed 0-, 1- and 2-unit exceptions and the three named Streams. Core versus Non-Core elective eligibility, the minimum 6 Core Elective units, the 12-unit Stream qualification rule, open elective choices, Year/Semester sequencing and University Core/Free Elective requirements still require manual review. The evidence-backed 66-course union is intentionally browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'EEENN',
        jupasCode: 'JS4462',
        programmeId: 'CUHK-UG-EEENN-45',
        majorId: 'CUHK-UG-EEENN-45-M1',
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
  FACULTY_PACKAGE_ROWS,
  FOUNDATION_ROWS,
  REQUIRED_ROWS,
  STREAMS_BY_CODE,
  buildCourses,
  buildSupplement,
};
