const fs = require('node:fs');
const path = require('node:path');

const CURRICULUM_URL = 'https://hre.bschool.cuhk.edu.hk/academics/curriculum/';
const BROCHURE_URL =
  'https://hre.bschool.cuhk.edu.hk/wp-content/uploads/2025/09/CUHK-HRE_brochure-2026-Entry.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/htmgb/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-htmgb-hospitality-real-estate-courses-2026.json'
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
ACCT1111|Foundations in Financial Accounting|3|core|Faculty Package · fixed course
DOTE1031|Basic Economics for the Hospitality and Tourism Industry|3|core|Faculty Package · fixed course
HTMG1010|Management of Hospitality Businesses|3|core|Faculty Package · fixed course
DOTE1021|Basic Quantitative Methods for the Hospitality and Tourism Industry|3|core|Core · fixed course
DOTE2051|Business Information Systems|3|core|Core · fixed course
FINA2010|Financial Management|3|core|Core · fixed course
HTMG1091|Distinguished Speaker Series I|0|core|Core · Distinguished Speaker Series
HTMG1092|Distinguished Speaker Series II|1|core|Core · Distinguished Speaker Series
HTMG2000|International Experience|1|core|Core · International Experience
HTMG2070|Food and Beverage Management|3|core|Core · fixed course
HTMG2091|Distinguished Speaker Series III|0|core|Core · Distinguished Speaker Series
HTMG2092|Distinguished Speaker Series IV|1|core|Core · Distinguished Speaker Series
HTMG3010|Management of Lodging Facilities|3|core|Core · fixed course
HTMG3030|Hospitality Real Estate Economics|3|core|Core · fixed course
HTMG3041|Law for Hospitality and Real Estate Industry|3|core|Core · fixed course
HTMG3091|Distinguished Speaker Series V|0|core|Core · Distinguished Speaker Series
HTMG3092|Distinguished Speaker Series VI|1|core|Core · Distinguished Speaker Series
HTMG4091|Distinguished Speaker Series VII|0|core|Core · Distinguished Speaker Series
HTMG4092|Distinguished Speaker Series VIII|1|core|Core · Distinguished Speaker Series
HTMG4800|Hospitality Strategic Management|3|core|Core · fixed course
HTMG4900|Hospitality and Real Estate Capstone Project|3|capstone|Core · Capstone Project
MKTG2010|Marketing Management|3|core|Core · fixed course
HTMG3020|Hospitality Organisation Behaviour|3|core|Stream Required · Hospitality
HTMG3060|Hospitality Service Management and Innovation|3|core|Stream Required · Hospitality
HTMG3521|Hospitality Revenue Management and Analytics|3|core|Stream Required · Hospitality
HTMG3527|Designing and Managing Customer Experience|3|core|Stream Required · Hospitality
HTMG3502|Real Estate Finance|3|core|Stream Required · Real Estate
HTMG3523|Introduction to Real Estate Investment|3|core|Stream Required · Real Estate
HTMG4100|Real Estate Valuation|3|core|Stream Required · Real Estate
HTMG4190|Global Real Estate Asset Management|3|core|Stream Required · Real Estate
HTMG4600|Facilities Development and Management for HRE|3|core|Stream Required · Hospitality and Real Estate shared
HTMG2900|Summer Internship I|1|internship|Summer Internship · fixed course
HTMG3900|Summer Internship II|1|internship|Summer Internship · fixed course
`);

const BROCHURE_CODES = `
HTMG1091 HTMG1092 HTMG2091 HTMG2092 HTMG3091 HTMG3092 HTMG4091 HTMG4092
DOTE1031 DOTE1021 HTMG1010 ACCT1111 DOTE2051 FINA2010 HTMG2070 MKTG2010
HTMG3010 HTMG3030 HTMG3041 HTMG2000 HTMG4900 HTMG4800
HTMG3020 HTMG3060 HTMG3521 HTMG3527 HTMG3502 HTMG3523 HTMG4100 HTMG4190
HTMG4600 HTMG2900 HTMG3900
`
  .trim()
  .split(/\s+/);

const UNCODED_ELECTIVE_TITLES = [
  'Financial Management and Cost Control for Hospitality Organisations',
  'Quantitative Methods for Real Estate',
  'Fundamental Research Methodology for Hospitality and Real Estate',
  'Digital Marketing for Hospitality Industry',
  'Land Conversion Process and Development Control',
  'Consultation Practicum in Hospitality and Real Estate',
  'Advanced Real Estate Investments',
  'Air Transportation',
  'Travel and Tourism Management',
  'Strategic Brand Management for the Hospitality Business',
  'Entrepreneurship in the Hospitality and Real Estate Industry',
  'Innovation in Hospitality and Real Estate Industry',
  'Hospitality and Real Estate Design Thinking',
  'Revitalisation of Heritage Buildings',
  'Business Sustainability',
  'Wine Culture and Appreciation',
  'Shopping Mall Investment and Management',
  'Smart MICE Management',
  'Talent Analytics Strategies',
  'Strategic Negotiation for Hospitality and Real Estate Industry',
  'Cruise Management',
  'Project Management for Hospitality and Real Estate',
];

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK HTMGB course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Hotel and Tourism Management',
    academicYear: '2026-entry brochure and current curriculum; reviewed on 2026-07-31',
    sourceUrl: CURRICULUM_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [BROCHURE_URL],
    note: 'The official 13-page 2026-entry brochure (24,956,061 bytes; SHA-256 b42f44b8d7e0ca40dab2358be889181a82ffcbb2800e8f552381b4cc943014f4) was text-extracted and visually reviewed page by page. Its Curriculum spread publishes 33 unique fixed codes with titles and units: 22 Core codes, nine unique Stream codes and two Summer Internship codes. Hospitality and Real Estate each require four stream-specific courses plus shared HTMG4600. The current Curriculum page, last modified 2025-05-28, corroborates the Faculty Package, Core and Stream roles and names 22 three-unit module electives, but neither source publishes codes for those electives; the three one-unit Executive-in-Residence slots also have no fixed codes. The brochure wording controls the coded rows where minor title wording differs from the older page. Because the elective and Executive-in-Residence identities are open and the local rule engine cannot prove the two stream completion paths, only the 33-code fixed scope is published for browse-only use with totalCreditRequired=0 and no graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'HTMGB',
        jupasCode: 'JS4226',
        programmeId: 'CUHK-UG-HTMGB-21',
        majorId: 'CUHK-UG-HTMGB-21-M1',
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
  BROCHURE_CODES,
  COURSE_ROWS,
  UNCODED_ELECTIVE_TITLES,
  buildCourses,
  buildSupplement,
};
