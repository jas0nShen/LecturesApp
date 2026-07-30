const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.bme.cuhk.edu.hk/new/files/undergraduatestd/new/StudyScheme2025-26.pdf';
const PROGRAMME_URL = 'https://www.bme.cuhk.edu.hk/new/bachelor.php';
const BROCHURE_URL =
  'https://www.bme.cuhk.edu.hk/new/files/CUHKBMEBooklet_2024_25.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/bmegn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-bmegn-biomedical-engineering-courses-2025.json'
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

const COURSE_LIST_ROWS = parseRows(`
BMEG2001|Introduction to Biomedical Engineering|1
BMEG2012|Biomedical Engineering Laboratory|2
BMEG2210|Orthopaedic Biomechanics and Musculoskeletal Injury|3
BMEG2218|Ethical Practice in Bionic Human|2
BMEG2300|Circuits and Signals for Biomedical Engineering|3
BMEG2410|Complex Analysis and Differential Equations|3
BMEG2603|Hospital Experience and Engineering Practicum|2
BMEG3102|Bioinformatics|3
BMEG3103|Big Data in HealthCare|3
BMEG3105|Data Analytics for Personalized Genomics and Precision Medicine|3
BMEG3111|Medical Instrumentation and Design|2
BMEG3130|Tele-Medicine and Mobile Healthcare|3
BMEG3140|Molecular and Cellular Engineering Laboratory|3
BMEG3210|Biofluids|3
BMEG3320|Biomedical Imaging|3
BMEG3330|Neuroengineering|3
BMEG3420|Medical Robotics|3
BMEG3430|Biomaterials and Tissue Engineering|3
BMEG3440|Global Engineering Medical Innovation|3
BMEG3910|Undergraduate Research in Biomedical Engineering|3
BMEG3920|Cross-Cultural Biomedical Collaboration for Global Health Challenges|3
BMEG4010|Global Medical Device Regulatory Affairs|3
BMEG4220|Wearable Biomedical Devices and Personalized Healthcare|3
BMEG4320|AI & Imaging for Biomedical Engineering|3
BMEG4410|BioMEMS|3
BMEG4450|Bionanotechnology|3
BMEG4510|Biomolecular Engineering|3
BMEG4520|Cardiovascular Engineering|3
BMEG4530|Musculoskeletal Tissue Engineering|3
BMEG4998|Final Year Project I|3
BMEG4999|Final Year Project II|3
BMEG5530|Tissue Engineering|3
BMEG5610|Research Methods in Biomedical Engineering|3
ENGG1130|Multivariable Calculus for Engineers|3
ENGG1310|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ESTR1003|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ESTR1006|Multivariable Calculus for Engineers|3
ESTR2201|Introduction to Biomedical Engineering|1
ESTR2204|Orthopaedic Biomechanics and Musculoskeletal Injury|3
ESTR2601|Circuits and Signals for Biomedical Engineering|3
ESTR2602|Biomedical Engineering Laboratory|2
ESTR3208|Biomaterials and Tissue Engineering|3
ESTR3212|Biofluids|3
ESTR3602|Neuroengineering|3
ESTR3603|Medical Instrumentation and Design|2
ESTR3604|Molecular and Cellular Engineering Laboratory|3
ESTR3605|Data Analytics for Personalized Genomics and Precision Medicine|3
ESTR4200|AI & Imaging for Biomedical Engineering|3
ESTR4202|Bionanotechnology|3
ESTR4203|BioMEMS|3
ESTR4204|Biomolecular Engineering|3
ESTR4214|Musculoskeletal Tissue Engineering|3
ESTR4601|Global Medical Device Regulatory Affairs|3
`);

const CORE_CODES = new Set([
  'BMEG2001',
  'BMEG2012',
  'BMEG2210',
  'BMEG2218',
  'BMEG2300',
  'BMEG2410',
  'BMEG3111',
  'BMEG3320',
  'BMEG3430',
  'BMEG4010',
  'ENGG1130',
  'ENGG1310',
  'ESTR1003',
  'ESTR1006',
  'ESTR2201',
  'ESTR2204',
  'ESTR2601',
  'ESTR2602',
  'ESTR3208',
  'ESTR3603',
  'ESTR4601',
]);

const STREAMS_BY_CODE = new Map();

function addStream(codes, stream) {
  for (const code of codes) {
    const streams = STREAMS_BY_CODE.get(code) || [];
    streams.push(stream);
    STREAMS_BY_CODE.set(code, streams);
  }
}

addStream(
  [
    'BMEG3103',
    'BMEG3130',
    'BMEG3210',
    'ESTR3212',
    'BMEG3330',
    'ESTR3602',
    'BMEG3420',
    'BMEG3440',
    'BMEG4220',
    'BMEG4410',
    'ESTR4203',
    'BMEG4450',
    'ESTR4202',
    'BMEG4520',
  ],
  'Medical Instrumentation and Biosensors'
);
addStream(
  [
    'BMEG3102',
    'BMEG3103',
    'BMEG3105',
    'ESTR3605',
    'BMEG3440',
    'BMEG4220',
    'BMEG4320',
    'ESTR4200',
    'BMEG4520',
  ],
  'Biomedical Imaging, Informatics and Modeling'
);
addStream(
  [
    'BMEG3105',
    'ESTR3605',
    'BMEG3140',
    'ESTR3604',
    'BMEG3210',
    'ESTR3212',
    'BMEG3440',
    'BMEG4410',
    'ESTR4203',
    'BMEG4450',
    'ESTR4202',
    'BMEG4510',
    'ESTR4204',
    'BMEG4520',
    'BMEG4530',
    'ESTR4214',
  ],
  'Molecular, Cell and Tissue Engineering'
);

function buildCourses() {
  const courses = COURSE_LIST_ROWS.map((course) => {
    if (course.code === 'BMEG4998' || course.code === 'BMEG4999') {
      return {
        ...course,
        courseType: 'capstone',
        group: 'Research Component Courses · 6 units',
      };
    }
    if (course.code === 'BMEG2603') {
      return {
        ...course,
        courseType: 'internship',
        group: 'Required Courses · Hospital Experience and Engineering Practicum',
      };
    }
    if (CORE_CODES.has(course.code)) {
      return {
        ...course,
        courseType: 'core',
        group:
          course.code.startsWith('ENGG') || /^ESTR100[36]$/.test(course.code)
            ? 'Foundation Courses'
            : 'Required Courses',
      };
    }
    const streams = STREAMS_BY_CODE.get(course.code);
    return {
      ...course,
      courseType: 'major_elective',
      group: streams
        ? `Elective Courses · ${streams.join(' / ')}`
        : 'Elective Courses · General Major pool',
    };
  });

  const coursesByCode = new Map(courses.map((course) => [course.code, course]));
  if (coursesByCode.size !== courses.length) {
    throw new Error('CUHK BMEGN course list contains duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Department of Biomedical Engineering',
    academicYear: '2025-26 intake Study Scheme; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL, BROCHURE_URL],
    note: 'The official 17-page Study Scheme applicable to students admitted in 2025-26 (363,024 bytes; SHA-256 1c008f46cf95a2318d9adf61fb61862448081427b3027400460f65a95762ee4f) was text-extracted, rendered and visually reviewed page by page. Pages 1-15 publish the 75-unit standard Major, 54-unit Associate Degree senior-entry path, 51-unit Higher Diploma senior-entry path, three optional Biomedical Engineering Streams, the ELITE Stream and the BME-BBA double-degree option. Pages 16-17 publish an explicit 53-course Course List with code, title and units; those 53 rows are preserved here and assigned Core, Elective, Capstone, Practicum and Stream roles only where the Major Requirement names them. Faculty Package courses, PHYS/CHEM/LSCI/SBMS/STAT requirements, CMBI4101-4103, ELEG3201/ESTR3200, MAEG5080, MBTE4320, the open CSCI allowance, ELITE substitutions and the BBA second-degree curriculum are not part of the explicit Course List and are not imported from similar Programmes. Because those external pools, alternative codes, senior-entry paths and double-degree rules are not closed in this local supplement, it is intentionally browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'BMEGN',
        jupasCode: 'JS4460',
        programmeId: 'CUHK-UG-BMEGN-39',
        majorId: 'CUHK-UG-BMEGN-39-M1',
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
  CORE_CODES,
  COURSE_LIST_ROWS,
  STREAMS_BY_CODE,
  buildCourses,
  buildSupplement,
};
