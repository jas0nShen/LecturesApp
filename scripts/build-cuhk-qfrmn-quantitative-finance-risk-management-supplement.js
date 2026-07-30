const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://www.qfrm.cuhk.edu.hk/wp-content/uploads/2025/10/QFRM_ENG_25.pdf';
const CURRICULUM_URL = 'https://www.qfrm.cuhk.edu.hk/overview/curriculum/';
const PROGRAMME_URL = 'https://www.qfrm.cuhk.edu.hk/overview/the-programme/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/qfrmn/';
const MATH1530_URL = 'https://www.math.cuhk.edu.hk/course/math1530';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-qfrmn-quantitative-finance-risk-management-courses-2025.json'
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
ACCT1111|Foundations in Financial Accounting|3|core|Major Required · choose ACCT1111 or ACCT2111
ACCT2111|Introductory Financial Accounting|3|core|Major Required · choose ACCT1111 or ACCT2111
CSCI1510|Computer Principles and C Programming|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI1520|Computer Principles and C++ Programming|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI1530|Computer Principles and Java Programming|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI1540|Fundamental Computing with C++|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI1550|Computer Principles and Python Programming|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI1580|Visual Programming|3|core|Major Required · choose one of CSCI1510, CSCI1520, CSCI1530, CSCI1540, CSCI1550 or CSCI1580
CSCI2100|Data Structures|3|core|Major Required · choose one of CSCI2100, CSCI2520, DOTE2051 or SEEM3550
CSCI2520|Data Structures and Applications|3|core|Major Required · choose one of CSCI2100, CSCI2520, DOTE2051 or SEEM3550
DOTE1030|Economics for Business Studies I|3|core|Faculty Package · fixed course
DOTE1040|Economics for Business Studies II|3|core|Faculty Package · fixed course
DOTE2051|Business Information Systems|3|core|Major Required · choose one of CSCI2100, CSCI2520, DOTE2051 or SEEM3550
FINA2010|Financial Management|3|core|Major Required · fixed course
FINA3010|Financial Markets|3|core|Major Required · fixed course
FINA3080|Investment Analysis and Portfolio Management|3|core|Major Required · fixed course
FINA3210|Risk Management and Insurance|3|core|Major Required · fixed course
MATH1010|University Mathematics|3|core|Faculty Package · choose MATH1010 or MATH1018 · take after MATH1530 unless the Mathematics Placement Test is passed
MATH1018|Honours University Mathematics|3|core|Faculty Package · choose MATH1010 or MATH1018 · take after MATH1530 unless the Mathematics Placement Test is passed
MATH1030|Linear Algebra I|3|core|Major Required · choose MATH1030 or MATH1038
MATH1038|Honours Linear Algebra I|3|core|Major Required · choose MATH1030 or MATH1038
MATH1530|Basic Mathematics for Business and Social Sciences|3|core|Conditional prerequisite · required before MATH1010 or MATH1018 for specified JUPAS admittees unless the Mathematics Placement Test is passed · not counted in the 84-unit Major
MATH2010|Advanced Calculus I|3|core|Major Required · choose MATH2010 or MATH2018
MATH2018|Honours Advanced Calculus I|3|core|Major Required · choose MATH2010 or MATH2018
RMSC2001|Introduction to Risk Management|3|core|Major Required · fixed course
RMSC4001|Simulation Methods for Risk Management Science and Finance|3|core|Major Required · fixed course
RMSC4003|Statistical Modelling in Financial Markets|3|core|Major Required · fixed course
SEEM3550|Fundamentals in Information Systems|3|core|Major Required · choose one of CSCI2100, CSCI2520, DOTE2051 or SEEM3550
STAT2001|Basic Concepts in Statistics and Probability I|3|core|Major Required · fixed course
STAT2006|Basic Concepts in Statistics and Probability II|3|core|Major Required · fixed course
STAT3007|Introduction to Stochastic Processes|3|core|Major Required · fixed course
STAT3008|Applied Regression Analysis|3|core|Major Required · fixed course
ACCT2121|Introductory Management Accounting|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
ACCT2151|Legal Environment for Business|2|major_elective|Major Elective · Business · ACCT2151 or ACCT3151 · choose at least 6 units · no more than six 1-unit courses
ACCT3151|Business Law|3|major_elective|Major Elective · Business · ACCT2151 or ACCT3151 · choose at least 6 units · no more than six 1-unit courses
ACCT4212|China Business Valuation and Analysis|3|major_elective|Major Elective · Business · choose one of ACCT4212, ACCT4213 or ACCT4214 · choose at least 6 units
ACCT4213|Financial Statement Analysis and Valuation|3|major_elective|Major Elective · Business · choose one of ACCT4212, ACCT4213 or ACCT4214 · choose at least 6 units
ACCT4214|Applied Financial Statement Analysis|3|major_elective|Major Elective · Business · choose one of ACCT4212, ACCT4213 or ACCT4214 · choose at least 6 units
ACCT4251|Regulation and Compliance in the Financial Markets|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
DOTE3010|Artificial Intelligence Empowered Business|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA2210|Interest Theory and Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3020|International Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3030|Management of Financial Institutions|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3040|Central Banking and Regulation of Financial Institutions|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3060|Real Estate Finance and Investment|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3070|Corporate Finance: Theory and Practice|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3090|Understanding China's Financial System|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3110|Issues in Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3230|Life and Health Insurance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3240|Corporate Property and Liability Insurance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3310|Introduction to Investment Banking|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3320|Introduction to Credit Rating|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3330|Introduction to Alternative Investment|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3340|Trading Strategies: Behavioral and Technical Analysis|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3350|Foreign Exchange Market Practices|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3360|Derivative Warrants, Proprietary and Arbitrage Trading Concepts|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3370|Introduction to Bloomberg and Reuters|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3398|Special Issues in Finance|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3399|Current Issues in Finance|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA3420|Credit Rating in Global Economy|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4010|Security Analysis|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4020|Fund Management and Asset Allocation|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4030|Selected Topics in Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4040|Cases in Corporate Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4050|Mergers And Acquisitions|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4060|China Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4310|China Banking and Financial System|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4320|China Equity Securities Market|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4330|China Derivative Securities Market|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4340|Structured Products: Fundamentals and Analysis|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4350|Bond Markets: Analysis and Strategies|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4400|Behavioral Finance|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4410|Current Developments in FinTec|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
IBBA3040|Business Lecture Series|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MGNT1020|Management|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MGNT2511|Global Experiential Learning I|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MGNT2512|Global Experiential Learning II|1|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MGNT2611|Business Sustainability|2|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MGNT4010|Strategic Management|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
MKTG2010|Marketing Management|3|major_elective|Major Elective · Business · choose at least 6 units · no more than six 1-unit courses
FINA4110|Options and Futures|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
FINA4120|Fixed Income Securities Analysis|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
FINA4150|Quantitative Methods for Financial Derivatives|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
FINA4160|Intermediate Financial Theory|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
FINA4370|Derivatives Trading: Analysis and Strategies|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
FINA4420|Financial Markets from Macro Perspective|3|major_elective|Major Elective · Quantitative Finance · choose at least 9 units
CSCI3150|Introduction to Operating Systems|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI3160|Design and Analysis of Algorithms|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI3170|Introduction to Database Systems|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI3230|Fundamentals of Artificial Intelligence|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI3320|Fundamentals of Machine Learning|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI4130|Introduction to Cyber Security|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI4160|Distributed and Parallel Computing|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI4180|Introduction to Cloud Computing and Storage|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI4190|Introduction to Social Networks|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
CSCI4230|Computational Learning Theory|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
ECON3420|Financial Economics|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
MATH3215|Operations Research|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
MATH3230|Numerical Analysis|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
MATH3240|Numerical Methods for Differential Equations|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
MATH4210|Financial Mathematics|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC3001|Principles of Credit Risk Management|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC4002|Financial Data Analytics with Machine Learning|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC4004|Theory of Risk and Insurance|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC4005|Stochastic Calculus for Finance and Risk|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC4006|Operational Risk Management|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
RMSC4007|Risk Management with Derivatives Concepts|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
STAT4001|Data Mining and Statistical Learning|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
STAT4004|Actuarial Science|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
STAT4010|Bayesian Learning|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
STAT4012|Statistical Principles of Deep Learning with Business Applications|3|major_elective|Major Elective · Risk Management Science · choose at least 9 units
FINA4130|Empirical Finance|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA4140|Computational Finance|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA4190|Research Project in Quantitative Finance|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA4380|Algorithmic Trading Strategies, Arbitrage and HFT|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA4390|Banking and Finance Practicum|3|capstone|Major Elective · Capstone/Research · choose at least 3 units · Co-operative Education may fulfil FINA4390 subject to approval
FINA4430|Computerized Trading and Big Data|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA6232|Seminar in Asset Pricing|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA6242|Seminar in Corporate Finance|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
FINA6252|Empirical Methods in Asset Pricing|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
RMSC4102|Research Project|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
RMSC4202|Practicum|3|capstone|Major Elective · Capstone/Research · choose at least 3 units
`);

function buildCourses() {
  const coursesByCode = new Map(COURSE_ROWS.map((course) => [course.code, course]));
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK QFRMN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK Quantitative Finance and Risk Management Science Programme',
    academicYear: 'Applicable to students admitted in 2025-26; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [CURRICULUM_URL, PROGRAMME_URL, MATH1530_URL],
    note: 'The official six-page 2025-26 Study Scheme (212,273 bytes; SHA-256 2d5b1fb60c763bdcda2b0f2109e93cdfe8110e58934b0dc6971b1cab198f466e) was text-extracted and visually reviewed page by page. It closes an 84-unit standard Major: 9 Faculty Package units, 48 Required units and 27 Elective units. Its Course List publishes 121 unique code-title-unit rows: 31 Required candidates, 48 Business electives, 6 Quantitative Finance electives, 25 Risk Management Science electives and 11 Capstone/Research electives. MATH1530 is additionally named as a conditional 3-unit prerequisite before MATH1010 or MATH1018 for specified JUPAS admittees unless the Programme Mathematics Placement Test is passed, producing a 122-code browsable scope. The standard Elective path requires at least 6 Business units, at least 9 Quantitative Finance units, at least 9 Risk Management Science units and at least 3 Capstone/Research units; the Business pool also limits one-unit courses and contains pairwise alternatives. The PDF separately publishes a CUHK-University of Edinburgh dual-degree transfer pattern, including MATH1050 as a substitute for RMSC2001 and external UoE courses, but does not include those courses in the official QFRMN Course List. Because the current local rule engine cannot prove alternative Required choices, the MATH1530 placement-test exception, Business pairwise alternatives and one-unit cap, category minimums, Co-operative Education substitution or the dual-degree transfer path, this complete 122-code current local course scope remains browse-only with totalCreditRequired=0 and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'QFRMN',
        jupasCode: 'JS4276',
        programmeId: 'CUHK-UG-QFRMN-27',
        majorId: 'CUHK-UG-QFRMN-27-M1',
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
  buildCourses,
  buildSupplement,
};
