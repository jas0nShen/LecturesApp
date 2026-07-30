const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.glef.cuhk.edu.hk/site/assets/files/1672/glefn_eng_25_formatted.pdf';
const STUDY_SCHEME_URL = 'https://www.glef.cuhk.edu.hk/program-structure/study-scheme/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/glefn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-glefn-global-economics-finance-courses-2025.json'
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
ARCH1001|Introduction to Architecture|3|core|Faculty Package · choose one course from the Social Science list
ARCH1002|Understanding Cities|3|core|Faculty Package · choose one course from the Social Science list
ARCH1003|Visual Studies|3|core|Faculty Package · choose one course from the Social Science list
COMM1110|Media and Everyday Life|3|core|Faculty Package · choose one course from the Social Science list
COMM1120|Development of Mass Communication|3|core|Faculty Package · choose one course from the Social Science list
COMM1150|Introduction to Media Industries and Practices|3|core|Faculty Package · choose one course from the Social Science list
COMM1500|Perspectives in Global Communication|3|core|Faculty Package · choose one course from the Social Science list
DOTE1030|Economics of Business Studies I|3|core|Faculty Package · choose DOTE1030 or ECON2011
DSPS1001|Introduction to Policy Sciences|3|core|Faculty Package · choose one course from the Social Science list
DSPS1003|Foundation of Data Science|3|core|Faculty Package · choose one course from the Social Science list
DSPS1004|Statistics for Data Science and Policy Studies|3|core|Faculty Package · choose one course from the Social Science list
ECON2011|Basic Microeconomics|3|core|Faculty Package · choose DOTE1030 or ECON2011
GLSD1001|Theoretical Perspectives on Globalization|3|core|Faculty Package · choose one course from the Social Science list
GPAD1020|Fundamentals of Government|3|core|Faculty Package · choose one course from the Social Science list
GPAD1076|Thinking Politically|3|core|Faculty Package · choose one course from the Social Science list
GPAD1077|Critical Debates in Hong Kong|3|core|Faculty Package · choose one course from the Social Science list
GRMD1302|People, Space and Place|3|core|Faculty Package · choose one course from the Social Science list
GRMD1401|A World of Diversity|3|core|Faculty Package · choose one course from the Social Science list
GRMD1402|Global Change and Environmental Sustainability|3|core|Faculty Package · choose one course from the Social Science list
PSYC1000|General Psychology|3|core|Faculty Package · choose one course from the Social Science list
PSYC1630|Communication for Healthy Relationship|3|core|Faculty Package · choose one course from the Social Science list
SOCI1001|Introduction to Sociology|3|core|Faculty Package · choose one course from the Social Science list
SOCI1201|Hong Kong Society: Identities and Boundaries|3|core|Faculty Package · choose one course from the Social Science list
SOSC1001|Design Thinking in Social Innovation|3|core|Faculty Package · choose one course from the Social Science list
SOSC1002|Managing Creativity and Group Dynamics in Innovation Teams|3|core|Faculty Package · choose one course from the Social Science list
SOSC1003|Introduction to Art Tech Design and Interactivity|3|core|Faculty Package · choose one course from the Social Science list
SOWK1001|Introduction to Social Work and Social Welfare|3|core|Faculty Package · choose one course from the Social Science list
SOWK1113|Self-development in Changing Society|3|core|Faculty Package · choose one course from the Social Science list
SOWK1114|From Understanding to Empowering the Socially Disadvantaged|3|core|Faculty Package · choose one course from the Social Science list
URSP1001|Introduction to Urban Studies|3|core|Faculty Package · choose one course from the Social Science list
IBBA3040|Business Lecture Series|1|core|Faculty of Business Administration Co-curricular Course
MGNT2511|Global Experiential Learning I|1|core|Faculty of Business Administration Co-curricular Course
MGNT2512|Global Experiential Learning II|1|core|Faculty of Business Administration Co-curricular Course · take after Global Experiential Learning Activities
DOTE1040|Economics of Business Studies II|3|core|Major Required · choose DOTE1040 or ECON2021
DOTE2011|Statistical Analysis for Business Decisions|4|core|Major Required · choose DOTE2011 or ECON2121
DOTE2021|Applied Econometrics for Business Decisions|3|core|Major Required · choose DOTE2021 or ECON3121
ECON1101|Mathematical Methods in Economics I|2|core|Major Required · fixed course
ECON1111|Mathematical Methods in Economics II|2|core|Major Required · fixed course
ECON2021|Basic Macroeconomics|3|core|Major Required · choose DOTE1040 or ECON2021
ECON2121|Methods of Economic Statistics|3|core|Major Required · choose DOTE2011 or ECON2121
ECON3121|Introductory Econometrics|3|core|Major Required · choose DOTE2021 or ECON3121
FINA2010|Financial Management|3|core|Major Required · fixed course
FINA3020|International Finance|3|core|Major Required · fixed course
GLEF3010|International Monetary Systems|3|core|Major Required · fixed course
GLEF3020|Global and Regional Economic Integration|3|core|Major Required · fixed course
GLEF3030|Global Financial Markets|3|core|Major Required · fixed course
ECON3011|Intermediate Microeconomic Theory|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3021|Intermediate Macroeconomic Theory|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3140|Financial Data Analysis|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3150|Mathematical Methods in Economics III|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3160|Game Theory|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3230|New Political Economy|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3240|Economics of Transition|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3320|Asia-Pacific Economies|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3350|China, Hong Kong, and the World Economy|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3420|Financial Economics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3430|Public Finance|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3460|Development Economics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3530|International Economic Relations|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3570|Information Technology and Economy|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3580|Emerging Financial Markets of China|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3590|Business Economics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON3620|International Macroeconomics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON4110|Introductory Mathematical Economics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON4120|Applied Forecasting Methods|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON4130|Economic Analysis for Social Networks|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON4430|Welfare Economics|3|major_elective|Major Elective · Economics · choose at least 9 units
ECON4470|Economics of Behavioural Finance|3|major_elective|Major Elective · Economics · choose at least 9 units
GLEF4010|China and Global Economy|3|major_elective|Major Elective · Economics · choose at least 9 units
GLEF4020|International Banking and Financial Regulation|3|major_elective|Major Elective · Economics · choose at least 9 units
GLEF4090|Research Project on Global Economics and Finance|3|major_elective|Major Elective · Economics · choose at least 9 units
ACCT2151|Legal Environment for Business|2|major_elective|Major Elective · Finance and Business · choose ACCT2151 or ACCT3151 · choose at least 9 FINA units
ACCT3151|Business Law|3|major_elective|Major Elective · Finance and Business · choose ACCT2151 or ACCT3151 · choose at least 9 FINA units
DOTE3010|Artificial Intelligence Empowered Business|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units
FINA3030|Management of Financial Institutions|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3040|Central Banking and Regulation of Financial Institution|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3060|Real Estate Finance and Investment|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3070|Corporate Finance: Theory and Practice|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3080|Investment Analysis and Portfolio Management|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3090|Understanding China's Financial System|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3310|Introduction to Investment Banking|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3320|Introduction to Credit Rating|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3330|Introduction to Alternative Investment|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3340|Trading Strategies: Behavioural and Technical Analysis|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3350|Foreign Exchange Market Practices|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3360|Derivative Warrants, Proprietary and Arbitrage Trading Concepts|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3370|Introduction to Bloomberg and Reuters|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3398|Special Issues in Finance|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3399|Current Issues in Finance|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA3420|Credit Rating in Global Economy|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4010|Security Analysis|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4020|Fund Management and Asset Allocation|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4030|Selected Topics in Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4040|Cases in Corporate Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4050|Mergers and Acquisitions|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4060|China Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4110|Options and Futures|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4120|Fixed Income Securities Analysis|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4130|Empirical Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4160|Intermediate Financial Theory|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4310|China Banking and Financial System|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4320|China Equity Securities Market|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4330|China Derivative Securities Market|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4340|Structured Products: Fundamentals and Analysis|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4350|Bond Markets: Analysis and Strategies|1|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4370|Derivatives Trading: Analysis and Strategies|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4380|Algorithmic Trading Strategies, Arbitrage and HFT|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4400|Behavioural Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4410|Current Developments in FinTec|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4420|Financial Markets from a Macro Perspective|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
FINA4430|Computerized Trading and Big Data|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units · no more than six 1-unit FINA courses
GLEF3040|Corporate Social Responsibility in a Globalized Economy|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units
GLEF3050|Issues in Global Finance|3|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units
MGNT2611|Business Sustainability|2|major_elective|Major Elective · Finance and Business · choose at least 9 FINA units
GLEF4070|Internship Experience in Global Economics and Finance|3|capstone|Major Elective · Capstone · choose 3 units · Co-operative Education may fulfil GLEF4070 subject to approval
GLEF4080|Practicum in Global Economics and Finance|3|capstone|Major Elective · Capstone · choose 3 units
`);

const OFFICIAL_COURSE_LIST_CODES = `
ACCT1111 ARCH1001 ARCH1002 ARCH1003 COMM1110 COMM1120 COMM1150 COMM1500 DOTE1030
DSPS1001 DSPS1003 DSPS1004 ECON2011 GLSD1001 GPAD1020 GPAD1076 GPAD1077 GRMD1302
GRMD1401 GRMD1402 PSYC1000 PSYC1630 SOCI1001 SOCI1201 SOSC1001 SOSC1002 SOSC1003
SOWK1001 SOWK1113 SOWK1114 URSP1001 IBBA3040 MGNT2511 MGNT2512 DOTE1040 DOTE2011
DOTE2021 ECON1101 ECON1111 ECON2021 ECON2121 ECON3121 FINA2010 FINA3020 GLEF3010
GLEF3020 GLEF3030 ECON3011 ECON3021 ECON3140 ECON3150 ECON3160 ECON3230 ECON3240
ECON3320 ECON3350 ECON3420 ECON3430 ECON3460 ECON3530 ECON3570 ECON3580 ECON3590
ECON3620 ECON4110 ECON4120 ECON4130 ECON4430 ECON4470 GLEF4010 GLEF4020 GLEF4090
ACCT2151 ACCT3151 DOTE3010 FINA3030 FINA3040 FINA3060 FINA3070 FINA3080 FINA3090
FINA3310 FINA3320 FINA3330 FINA3340 FINA3350 FINA3360 FINA3370 FINA3398 FINA3399
FINA3420 FINA4010 FINA4020 FINA4030 FINA4040 FINA4050 FINA4060 FINA4110 FINA4120
FINA4130 FINA4160 FINA4310 FINA4320 FINA4330 FINA4340 FINA4350 FINA4370 FINA4380
FINA4400 FINA4410 FINA4420 FINA4430 GLEF3040 GLEF3050 MGNT2611 GLEF4070 GLEF4080
`
  .trim()
  .split(/\s+/);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK GLEFN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Global Economics and Finance Programme',
    academicYear: 'Applicable to students admitted in 2025-26; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [STUDY_SCHEME_URL],
    note: 'The official five-page 2025-26 Study Scheme (619,001 bytes; SHA-256 9c0a7f3c108f6dbd0a61179076113aad73e67ed3bbc13168e657831c73b4fadd) was text-extracted and visually reviewed page by page. Its Course List publishes 117 unique code-title-unit rows: 31 Faculty Package candidates, 3 Faculty of Business Administration co-curricular courses, 13 Required candidates, 25 Economics electives, 43 Finance and Business electives and 2 Capstone alternatives. The standard Major requires at least 67 units: 9 Faculty Package, 3 co-curricular, 31 Required and 24 Elective units. Electives require at least 9 Economics units, at least 9 Finance and Business units including at least 9 FINA units, and 3 Capstone units, with no more than six one-unit FINA courses. The Required section also includes a 3-unit Overseas Experience fulfilled through approved exchange or study-abroad business courses, or approved CUHK make-up courses under special circumstances, without publishing a fixed course code. Because the current local rule engine cannot prove alternative Required choices, the open Overseas Experience course identity and approval path, category minimums, the FINA-only minimum and one-unit cap, or the Co-operative Education substitution for GLEF4070, the complete 117-code official Course List remains browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'GLEFN',
        jupasCode: 'JS4254',
        programmeId: 'CUHK-UG-GLEFN-20',
        majorId: 'CUHK-UG-GLEFN-20-M1',
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
  OFFICIAL_COURSE_LIST_CODES,
  buildCourses,
  buildSupplement,
};
