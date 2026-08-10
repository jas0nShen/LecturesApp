const fs = require('node:fs');
const path = require('node:path');

const CURRICULUM_URL = 'https://behm.cuhk.edu.hk/curriculum.html';
const BROCHURE_URL = 'https://www.sci.cuhk.edu.hk/wp-content/uploads/BEHM_UG.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/behmn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-behmn-biotechnology-entrepreneurship-healthcare-management-courses-2026.json'
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
LSCI1002|Introduction to Biological Sciences|3|core|Faculty Package · current named course
MEDF1012|Foundation Course for Health Sciences II|3|core|Faculty Package · current named course
MGNT1020|Management|3|core|Faculty Package · current named course
ACCT2111|Introductory Financial Accounting|3|core|Major Required · current named course
DOTE1030|Economics for Business Studies I|3|core|Major Required · current named course
MBTE2000|Introduction to Molecular Biotechnology|2|core|Major Required · current named course
DOTE2011|Statistical Analysis for Business Decisions|4|core|Major Required · current named course
FINA2010|Financial Management|3|core|Major Required · current named course
PHPC1001|Foundations in Public Health|2|core|Major Required · current named course
DOTE2030|Operations Management|3|core|Major Required · current named course
PHPC2016|Theories and Concepts of Health Behaviours|3|core|Major Required · current named course
ACCT2151|Legal Environment for Business|2|core|Concentration A Required · Biotechnology Entrepreneurship and Innovation
ACCT3151|Business Law|3|core|Concentration A Required · Biotechnology Entrepreneurship and Innovation
FINA3080|Investment Analysis and Portfolio Management|3|core|Concentration A Required · Biotechnology Entrepreneurship and Innovation
MGNT4090|Technology and Innovation Management|3|core|Concentration A Required · Biotechnology Entrepreneurship and Innovation
DOTE4220|Data Mining for Business Intelligence|3|major_elective|Concentration B Elective · Healthcare and Biomedicine Analytics
MGNT4010|Strategic Management|3|major_elective|Concentration B Elective · Healthcare and Biomedicine Analytics
`);

const CURRENT_PAGE_TITLES = [
  'Introduction to Biological Sciences',
  'Foundation Course for Health Sciences II',
  'Management',
  'Introductory Financial Accounting',
  'Economics for Business Studies I',
  'Introduction to Molecular Biotechnology',
  'Statistical Analysis for Business Decisions',
  'Financial Management',
  'Foundations in Public Health',
  'Operations Management',
  'Principles of Infectious Diseases',
  'Business and Social Aspects of Biotechnology',
  'Anatomy of an Entrepreneur',
  'Zero to IPO: Introduction to Biomedical Enterprises',
  'Internship',
  'Capstone Project I',
  'Capstone Project II',
  'Introduction to Bioethics',
  'Theories and Concepts of Health Behaviours',
  'Legal Environment for Business',
  'Business Law',
  'Intellectual Property Law for Entrepreneurs',
  'Investment Analysis and Portfolio Management',
  'Technology and Innovation Management',
  'Toolkit for Entrepreneurs',
  'Medical Biotechnology',
  'Industrial Applications of Plant Genetic Modification',
  'Project in Medical Biotechnology',
  'Transgenic Technologies in Animals and Their Applications',
  'Project in Transgenic Technologies in Animals and Their Applications',
  'Microbes and Bioremediation',
  'Biotechnology for Environment and Sustainability',
  'Project in Biotechnology for Environment and Sustainability',
  'Protein Engineering and Drug Design',
  'Project of Protein Engineering and Drug Design',
  'Business Analytics',
  'Business Process Analytics',
  'Economics and Financing in Healthcare Systems',
  'Health Services Management',
  'Decision Modeling and Analytics',
  'Economic Analytics',
  'Data Mining for Business Intelligence',
  'Innovations and Evidence-based Practice for Aged Care Services',
  'Health and Social Care Policy in Ageing',
  'Strategic Management',
  'Epidemiology',
  'Applied Economics Evaluation in Health Care',
  'Digital Health and Entrepreneurship',
  'Immunology',
  'Cancer Biology',
  'Stem Cell and Regenerative Medicine',
  'Bioinformatics, Genomics and Proteomics',
  'The Landscape of the Biomedical Industry',
];

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK BEHMN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function getUnresolvedTitles() {
  const resolvedTitles = new Set(COURSE_ROWS.map((course) => normalizeTitle(course.title)));
  return CURRENT_PAGE_TITLES.filter((title) => !resolvedTitles.has(normalizeTitle(title)));
}

function buildSupplement() {
  return {
    provider: 'CUHK Biotechnology, Entrepreneurship and Healthcare Management Programme',
    academicYear: 'Current curriculum and 2025 brochure; reviewed on 2026-08-10',
    sourceUrl: CURRICULUM_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      BROCHURE_URL,
      'https://gbs.bschool.cuhk.edu.hk/internationally-oriented-curriculum/',
      'https://www.sci.cuhk.edu.hk/nsci/curriculum/',
      'https://www.pharmacy.cuhk.edu.hk/1/education/ug/bpharm/',
      'https://spe.cuhk.edu.hk/programmes/bachelor-of-education-in-physical-education-exercise-science-and-health-js4329/',
      'https://www4.mae.cuhk.edu.hk/wp-content/uploads/2026/07/MAEGN_study-scheme_20260710.pdf',
      'https://www.qfin.cuhk.edu.hk/site/assets/files/1024/qfinn_eng_25.pdf',
    ],
    note: 'The current official Curriculum page (47,441 bytes; SHA-256 e952459f19cfc814214f1cf5af99d96afdd669c61a31412b241c13157bd5d165; Last-Modified 2025-07-03) publishes a minimum 68-unit Major with 53 unique visible course titles: three Faculty Package courses, 16 Major Required courses, two Concentrations and their Required/Elective pools. The official nine-page brochure (1,871,409 bytes; SHA-256 bc633cf5ff35ece38de3c3f2f5be930a9c8b28b9d133ffa5b0f269849d63435e) was text-extracted and visually reviewed page by page; it confirms the Programme identity and an earlier shorter title-only curriculum. Neither source publishes course codes or individual units. Exact title mappings for 17 current rows are cross-checked against the linked current official CUHK Programme schemes already maintained in this repository. The remaining 36 named rows have no unambiguous current code-and-unit evidence and are intentionally omitted. Because most named courses, both Concentration pools and the complete 68-unit path remain unresolved, only this 17-code evidence-backed subset is published for browse-only use with totalCreditRequired=0 and no graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'BEHMN',
        jupasCode: 'JS4725',
        programmeId: 'CUHK-UG-BEHMN-18',
        majorId: 'CUHK-UG-BEHMN-18-M1',
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
  CURRENT_PAGE_TITLES,
  buildCourses,
  buildSupplement,
  getUnresolvedTitles,
};
