const fs = require('node:fs');
const path = require('node:path');

const commnSupplement = require('../data/ug-course-supplements/cuhk-commn-journalism-communication-courses-2026.json');
const glefnSupplement = require('../data/ug-course-supplements/cuhk-glefn-global-economics-finance-courses-2025.json');

const STUDY_SCHEME_URL =
  'https://www.com.cuhk.edu.hk/programs/applicable-to-students-admitted-in-2026-27/';
const COURSE_LIST_URL = 'https://www.com.cuhk.edu.hk/programmes/undergraduate/course-list/';
const PROGRAMME_URL = 'https://www.com.cuhk.edu.hk/programs/global-communication/';
const BROCHURE_URL = 'https://www.com.cuhk.edu.hk/pdf/GCOMN-online.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/gcomn/';
const ECON_SOURCE_URL =
  'https://admission.econ.cuhk.edu.hk/ug/wp-content/uploads/2025/07/ECONN_ENG_24.pdf';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-gcomn-global-communication-courses-2026.json'
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

const FACULTY_PACKAGE_CODES = splitCodes(`
COMM1500 ARCH1001 ARCH1002 ARCH1003 DSPS1001 DSPS1003 DSPS1004 ECON1210 ECON1220
ECON2011 GLSD1001 GPAD1020 GPAD1076 GPAD1077 GRMD1302 GRMD1401 GRMD1402 PSYC1000
PSYC1630 SOCI1001 SOCI1201 SOSC1001 SOSC1002 SOSC1003 SOWK1001 SOWK1113 SOWK1114
URSP1001
`);

const REQUIRED_ALTERNATIVE_CODES = splitCodes('COMM2160 COMM3650');
const REQUIRED_FIXED_CODES = splitCodes('COMM2560 COMM2922 COMM3710 COMM4150 COMM4250');

const ELECTIVE_GROUPS = {
  'Major Elective · Global Communication': splitCodes(`
COMM1120 COMM1150 COMM2510 COMM2540 COMM2590 COMM2741 COMM2811 COMM2850 COMM3200
COMM3510 COMM3550 COMM3690 COMM3700 COMM3721 COMM3722 COMM3841 COMM3930 GLSD3106
GLSD3111 GLSD3303 GLSD3402 GLSD3403 GLSD3404 GLSD3405
`),
  'Major Elective · Advertising and Public Relations': splitCodes(`
COMM2811 COMM2812 COMM2813 COMM2814 COMM2830 COMM2840 COMM2850 COMM3810 COMM3811
COMM3812 COMM3820 COMM3830 COMM3831 COMM3832 COMM3840 COMM3841 COMM3850 COMM3855
COMM3860 COMM3870 COMM3888 COMM4848
`),
  'Major Elective · Journalism': splitCodes(`
COMM2120 COMM2180 COMM2210 COMM2440 COMM2600 COMM2601 COMM2610 COMM2620 COMM2740
COMM2741 COMM2910 COMM3610 COMM3620 COMM3630 COMM3640 COMM3650 COMM3660 COMM3680
COMM3681 COMM3682 COMM3740 COMM3750 COMM3760
`),
  'Major Elective · Creative and New Media': splitCodes(`
COMM2570 COMM2590 COMM2733 COMM2925 COMM2926 COMM2928 COMM2940 COMM2962 COMM3690
COMM3711 COMM3733 COMM3800 COMM3910 COMM3920 COMM3921 COMM3922 COMM3930 COMM3933
COMM3939 COMM3940 COMM3941 COMM4730 COMM4733 COMM4935 COMM4956 COMM4962 CSAT2001
CSAT2002 CSAT3001 CSAT3002
`),
  'Major Elective · Communication Studies': splitCodes(`
COMM2140 COMM2920 COMM2930 COMM2932 COMM3130 COMM3131 COMM3132 COMM3191 COMM3193
COMM4040 COMM4191
`),
};

const EXTERNAL_ELECTIVE_ROWS = parseRows(`
GLSD3106|The Rise of China in the Global Context I: Diplomacy, Trade and Soft Power|0
GLSD3111|Special Topic in Global Media|0
GLSD3303|Understanding Global Issues from Movies|0
GLSD3402|Korea and the World: Politics, Economy and Culture|0
GLSD3403|European Union and the World|0
GLSD3404|Japan and Global Political Economy|0
GLSD3405|International Relations in Southeast Asia|0
CSAT2001|Media and Representation: History and Theory|0
CSAT2002|Creative Dialogue|0
CSAT3001|Technological Practices in Arts and Design|0
CSAT3002|Field Study in Arts Technology|0
`);

const ECON_FACULTY_ROWS = parseRows(`
ECON1210|Economics and Society|3
ECON1220|Contemporary Economic Thinking|3
`);

function buildSourceCourseMap() {
  const commRows = commnSupplement.supplements[0].courses.map((course) => ({
    code: course.code,
    title: course.title,
    credits: course.credits,
  }));
  const glefnRows = glefnSupplement.supplements[0].courses
    .filter((course) => FACULTY_PACKAGE_CODES.includes(course.code) && course.code !== 'COMM1500')
    .map((course) => ({
      code: course.code,
      title: course.title,
      credits: course.credits,
    }));
  const sourceRows = [...commRows, ...glefnRows, ...ECON_FACULTY_ROWS, ...EXTERNAL_ELECTIVE_ROWS];
  const byCode = new Map();
  for (const row of sourceRows) {
    const existing = byCode.get(row.code);
    if (existing && (existing.title !== row.title || existing.credits !== row.credits)) {
      throw new Error(`Conflicting source rows for ${row.code}`);
    }
    if (!existing) byCode.set(row.code, row);
  }
  return byCode;
}

function buildCourses() {
  const sourceByCode = buildSourceCourseMap();
  const requiredCodes = new Set([...REQUIRED_ALTERNATIVE_CODES, ...REQUIRED_FIXED_CODES]);
  const allCodes = new Set(FACULTY_PACKAGE_CODES);
  for (const code of requiredCodes) allCodes.add(code);
  for (const codes of Object.values(ELECTIVE_GROUPS)) {
    for (const code of codes) allCodes.add(code);
  }

  const courses = [...allCodes].map((code) => {
    const source = sourceByCode.get(code);
    if (!source) throw new Error(`Missing source row for GCOMN course ${code}`);

    const groups = [];
    if (code === 'COMM1500') {
      groups.push('Faculty Package · fixed course · 9-unit group');
    } else if (FACULTY_PACKAGE_CODES.includes(code)) {
      groups.push(
        'Faculty Package · choose two courses from different Programme/Departments/Schools · 9-unit group'
      );
    }
    if (REQUIRED_ALTERNATIVE_CODES.includes(code)) {
      groups.push('Major Required · choose COMM2160 or COMM3650 · 18-unit coded block');
    } else if (REQUIRED_FIXED_CODES.includes(code)) {
      groups.push('Major Required · fixed course · 18-unit coded block');
    }
    for (const [group, codes] of Object.entries(ELECTIVE_GROUPS)) {
      if (codes.includes(code)) groups.push(`${group} · at least 33 elective units overall`);
    }

    let courseType = 'major_elective';
    if (code === 'COMM4150') courseType = 'capstone';
    else if (FACULTY_PACKAGE_CODES.includes(code) || requiredCodes.has(code)) courseType = 'core';
    else if (code === 'COMM3200') courseType = 'internship';

    return {
      code,
      title: source.title,
      credits: source.credits,
      courseType,
      group: groups.join(' · '),
    };
  });

  if (courses.length !== 137) throw new Error(`Expected 137 GCOMN courses, got ${courses.length}`);
  return courses.sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Journalism and Communication',
    academicYear: 'Applicable to students admitted in 2026-27; reviewed on 2026-08-10',
    sourceUrl: STUDY_SCHEME_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      COURSE_LIST_URL,
      PROGRAMME_URL,
      BROCHURE_URL,
      glefnSupplement.sourceUrl,
      ECON_SOURCE_URL,
    ],
    note: 'The official 2026-27 Study Scheme page (117,411 bytes; SHA-256 89a8323be3ec9971f4b77281dd39b21c79a93d7ded2582d999eba0912be982ed; last modified 2026-05-19) publishes a minimum 72-unit Major and 137 unique named course codes: 99 COMM courses, 27 non-COMM Faculty Package candidates and 11 GLSD/CSAT electives. The fixed local structure is a 9-unit Faculty Package, an 18-unit coded Required block with COMM2160/COMM3650 as an alternative, and at least 33 elective units across five published groups with no more than 6 units of non-COMM courses. It separately requires at least 12 units of approved global-communication courses during compulsory resident study at one or two overseas institutions and permits approved CUHK make-up courses without publishing a fixed code list. The current School Course List supplies code-title-unit rows for the 99 COMM courses; the maintained official GLEFN scheme and official ECONN Course List cross-check the 27 Faculty Package candidates. The Study Scheme itself supplies code and title for the 11 GLSD/CSAT electives but not explicit per-course units, so those keep credits=0 rather than inferring values from group totals. The official 20-page 2025 brochure (14,225,425 bytes; SHA-256 8fcc03215d9173321a214fc8a7ea7bc668a2fa90c0a82b60907b2d8803dc6b94; last modified 2025-09-25) was text-extracted and curriculum pages 8-11 were rendered and visually reviewed. Because overseas course identities, approved make-up courses, cross-group no-double-counting, the non-COMM maximum and the COMM2160/COMM3650 alternative are not closed by the local rule engine, the complete 137-code named local pool remains browse-only with totalCreditRequired=0 and no graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'GCOMN',
        jupasCode: 'JS4858',
        programmeId: 'CUHK-UG-GCOMN-75',
        majorId: 'CUHK-UG-GCOMN-75-M1',
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
  FACULTY_PACKAGE_CODES,
  REQUIRED_ALTERNATIVE_CODES,
  REQUIRED_FIXED_CODES,
  ELECTIVE_GROUPS,
  EXTERNAL_ELECTIVE_ROWS,
  ECON_FACULTY_ROWS,
  buildCourses,
  buildSupplement,
};
