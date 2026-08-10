const fs = require('node:fs');
const path = require('node:path');

const PROGRAMME_URL =
  'https://sgps.cuhk.edu.hk/study-programmes/undergraduate-programmes/bssc-in-global-studies/';
const BROCHURE_URL =
  'https://sgps.cuhk.edu.hk/wp-content/uploads/Web-GLSD_Ug-Admission_202526_FN.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/glsdn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-glsdn-global-studies-courses-2025.json'
);

function parseRows(value) {
  return value
    .trim()
    .split('\n')
    .map((line) => {
      const [code, title] = line.split('|');
      return { code, title };
    });
}

const COURSE_ROWS = parseRows(`
GLSD1001|Theoretical Perspectives on Globalization
GLSD1003|Globalization: Issues and Debates
GLSD2001|Research Methods for Global Studies
GLSD2101|Global Communication
GLSD2201|Globalization, Cultures, and Societies
GLSD2301|Global Politics
GLSD2401|Global Sustainability
GLSD2501|World Economic Order
GLSD2701|Field Studies
GLSD3101|Internet, Multimedia and Information Society
GLSD3102|Analysis of Global Popular Culture
GLSD3105|Understanding Global Cities and Urban Space
GLSD3106|The Rise of China in the Global Context I: Diplomacy, Trade and Soft Power
GLSD3111|Special Topic in Global Media
GLSD3201|Cultural Psychology and Globalization
GLSD3211|Special Topic in Cultures and Societies
GLSD3301|International Relations and International Law
GLSD3302|Sports and World Politics
GLSD3303|Understanding Global Issues from Movies
GLSD3311|Special Topic in World Politics
GLSD3401|Global Environmental Challenges
GLSD3402|Korea and the World: Politics, Economy and Culture
GLSD3403|European Union and the World
GLSD3404|Japan and Global Political Economy
GLSD3405|International Relations in Southeast Asia
GLSD3411|Special Topic in Sustainability and Environment
GLSD3501|Global Business Organizations
GLSD3511|Special Topic in Global Economy
GLSD3601|Internship
GLSD3701|Collaborative Project on Global Issues
GLSD4001|Global Studies Capstone Thesis I
GLSD4002|Global Studies Capstone Thesis II
GLSD4003|Global Studies Capstone Project I
GLSD4004|Global Studies Capstone Project II
GLSD4102|Developmental Study: Poverty, Inequality and Welfare of the World
GLSD4104|Global Development: Markets, States, Societies and IOs
GLSD4401|Traditional Security: Military, War and Peace
GLSD4402|New Security Challenges: Terrorism, Ethnic Conflicts and Human Trafficking
`);

const FACULTY_PACKAGE_CODES = new Set(['GLSD1001']);
const REQUIRED_CODES = new Set(['GLSD1003', 'GLSD2001']);
const INTERNSHIP_CODES = new Set(['GLSD3601']);
const CAPSTONE_CODES = new Set(['GLSD4001', 'GLSD4002', 'GLSD4003', 'GLSD4004']);

function buildCourses() {
  const courses = COURSE_ROWS.map(({ code, title }) => {
    if (FACULTY_PACKAGE_CODES.has(code)) {
      return {
        code,
        title,
        credits: 3,
        courseType: 'core',
        group: 'Faculty Package · fixed GLSD course · 9-unit package',
      };
    }
    if (REQUIRED_CODES.has(code)) {
      return {
        code,
        title,
        credits: 3,
        courseType: 'core',
        group: 'Major Required · fixed coded course · 30-unit required block',
      };
    }
    if (INTERNSHIP_CODES.has(code)) {
      return {
        code,
        title,
        credits: 3,
        courseType: 'internship',
        group: 'Major Required · Internship · 30-unit required block',
      };
    }
    if (CAPSTONE_CODES.has(code)) {
      return {
        code,
        title,
        credits: 3,
        courseType: 'capstone',
        group: 'Major Required · choose the 6-unit Thesis I/II or Project I/II sequence',
      };
    }
    return {
      code,
      title,
      credits: 3,
      courseType: 'major_elective',
      group: 'Official GLSD Course List · candidate for the interdisciplinary Major Elective structure',
    };
  });

  if (courses.length !== 38) throw new Error(`Expected 38 GLSDN courses, got ${courses.length}`);
  if (new Set(courses.map((course) => course.code)).size !== 38) {
    throw new Error('Expected 38 unique GLSDN course codes');
  }
  return courses;
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Governance and Policy Science',
    academicYear: '2025-26 brochure and current official Course List; reviewed on 2026-08-10',
    sourceUrl: PROGRAMME_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [BROCHURE_URL],
    note: 'The current official Programme page snapshot (59,460 bytes; SHA-256 35b63a466bb8765bab829248dced5d63e80478aa9542e506d7bfe1045aa6d228) publishes 38 unique GLSD course codes, titles and explicit 3-unit values. The official image-based 2025-26 brochure (23,539,417 bytes; 8 pages; SHA-256 514b0aedd3791bceddb537018bb18e4f6b22da003a70dce69ef73946aa1e4fd9) was rendered in full and visually reviewed; page 4 publishes a 60-unit Major comprising a 9-unit Faculty Package, 30 Major Required units and 21 Major Elective units. The required structure is Globalization: Issues and Debates 3 units, Research Methods for Global Studies 3, Language Courses 6, Resident Study Overseas 9, Internship 3 and Capstone Courses 6. The Programme page incorrectly labels that 30-unit fixed composition as Major Elective Courses (21 units); the brochure identifies it as Major Required Courses. The page describes the 21-unit Major Elective requirement through five interdisciplinary clusters but does not publish a closed Programme-specific code pool, while its separate Minor lists cannot be substituted for the Major pool. Language Courses and Resident Study Overseas have no fixed codes, and the Course List exposes two 6-unit Capstone sequences, Thesis I/II and Project I/II. Therefore the 38-course official GLSD list is published for browse-only planning, with conservative course roles, totalCreditRequired=0 and no graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'GLSDN',
        jupasCode: 'JS4892',
        programmeId: 'CUHK-UG-GLSDN-76',
        majorId: 'CUHK-UG-GLSDN-76-M1',
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
  INTERNSHIP_CODES,
  CAPSTONE_CODES,
  buildCourses,
  buildSupplement,
};
