const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL =
  'https://www.ie.cuhk.edu.hk/wp-content/uploads/2025/08/MIEGN_ENG_25.pdf';
const STUDY_PLAN_URL =
  'https://www.ie.cuhk.edu.hk/wp-content/uploads/2025/08/Study_Plan_for_MIEG_Entrants_2025.pdf';
const PROGRAMME_URL =
  'https://www.ie.cuhk.edu.hk/programmes/bsc-in-mieg/major-programme-requirements/';
const COURSE_PAGE_URL = 'https://www.ie.cuhk.edu.hk/courses-mieg/';
const CSE_UG_COURSE_URL = 'https://www.cse.cuhk.edu.hk/academics/ug-course-list/';
const CSE_PG_COURSE_URL = 'https://www.cse.cuhk.edu.hk/academics/pg-course-list/';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/miegn/';
const LEAFLET_URL = 'https://www.ie.cuhk.edu.hk/mieg-leaflet';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-miegn-mathematics-information-engineering-courses-2025.json'
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

const PDF_COURSE_ROWS = parseRows(`
ENGG1110|Problem Solving By Programming|3
ENGG1310|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ENGG1820|Engineering Internship|1
ENGG5301|Information Theory|3
ENGG5302|Random Processes|3
ENGG5303|Advanced Wireless Communications|3
ENGG5383|Applied Cryptography|3
ENGG5392|Lightwave System Technologies|3
ENGG5501|Foundations of Optimization|3
ESTR1002|Problem Solving By Programming|3
ESTR1003|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ESTR2002|Probability and Statistics for Engineers|3
ESTR2004|Discrete Mathematics for Engineers|3
ESTR2300|Principles of Communication Systems|3
ESTR2304|Basic Analog and Digital Circuits|3
ESTR2306|Introduction to Systems Programming|3
ESTR2360|Fourier Analysis with Engineering Applications|3
ESTR2362|Discrete Structures and Probability|3
ESTR3300|Digital Communications|3
ESTR3302|Networks: Technology, Economics, and Social Interactions|3
ESTR3304|Introduction to Stochastic Processes|3
ESTR3306|Social Media and Human Information Interaction|3
ESTR3308|Information and Software Engineering Practice|3
ESTR3310|Computer Networks|3
ESTR4300|Web-scale Information Analytics|3
ESTR4302|Networking Protocols and Systems|3
ESTR4304|Wireless Communication Systems|3
ESTR4306|Introduction to Cyber Security|3
ESTR4308|Network Software Design and Programming|3
ESTR4312|Building Scalable Internet-based Services|3
ESTR4314|Hands-on Wireless Communication|3
ESTR4316|Programming Big Data Systems|3
ESTR4320|Optical Communications|3
ESTR4322|Introduction to Cryptography|3
ESTR4324|Data Science in Practice|3
ESTR4326|Blockchain and Applications|3
ESTR4328|Functional Programming|3
IERG1080|Introduction to Python for Engineering Applications|3
IERG2060|Basic Analog and Digital Circuits|3
IERG2080|Introduction to Systems Programming|3
IERG2310|Principles of Communication Systems|3
IERG2820|Electronic Circuit Design Laboratory|1
IERG3010|Digital Communications|3
IERG3050|Simulation and Statistical Analysis|3
IERG3060|Microcontrollers and Embedded Systems|3
IERG3080|Information and Software Engineering Practice|3
IERG3280|Networks: Technology, Economics, and Social Interactions|3
IERG3300|Introduction to Stochastic Processes|3
IERG3310|Computer Networks|3
IERG3320|Social Media and Human Information Interaction|3
IERG3800|Information Infrastructure Design Laboratory|1
IERG3810|Microcontrollers and Embedded Systems Laboratory|1
IERG3820|Communications Laboratory|1
IERG3830|Product Design and Development|3
IERG4004|E-payment Systems and Cryptocurrency Technologies|3
IERG4030|Optical Communications|3
IERG4060|Real-time Embedded Systems|3
IERG4080|Building Scalable Internet-based Services|3
IERG4090|Networking Protocols and Systems|3
IERG4100|Wireless Communication Systems|3
IERG4110|Hands-on Wireless Communication|3
IERG4120|Functional Programming|3
IERG4130|Introduction to Cyber Security|3
IERG4150|Introduction to Cryptography|3
IERG4160|Image Processing and Visual Understanding|3
IERG4180|Network Software Design and Programming|3
IERG4190|Multimedia Coding and Processing|3
IERG4210|Web Programming and Security|3
IERG4220|Secure Software Engineering|3
IERG4230|Introduction to Internet of Things|3
IERG4240|Positioning Principles and Technologies|3
IERG4300|Web-scale Information Analytics|3
IERG4320|Data Science in Practice|3
IERG4330|Programming Big Data Systems|3
IERG4340|Emerging Technologies in Information Engineering|3
IERG4350|Cloud Computing Security|3
IERG4360|Blockchain and Applications|3
IERG4831|Networking Laboratory I|2
IERG4841|Networking Laboratory II|2
IERG4851|Cyber Security Laboratory|1
IERG4998|Final Year Project I|3
IERG4999|Final Year Project II|3
IERG5020|Telecommunication Switching and Network Systems|3
IERG5040|Lightwave System Technologies|3
IERG5050|AI Foundation Models, Systems and Applications|3
IERG5090|Advanced Networking Protocols and Systems|3
IERG5100|Advanced Wireless Communications|3
IERG5110|Signal Processing in Wireless Communications and Sensing|3
IERG5130|Probabilistic Models and Inference Algorithms for Machine Learning|3
IERG5140|Lightwave Networks|3
IERG5154|Information Theory|3
IERG5200|Channel Coding and Modulation|3
IERG5230|Algorithms and Realization of Internet of Things Systems|3
IERG5240|Applied Cryptography|3
IERG5250|Edge AI and Applications|3
IERG5254|Network Information Theory|3
IERG5280|Wireless and Mobile Networking|3
IERG5290|Network Coding Theory|3
IERG5300|Random Processes|3
IERG5310|Security and Privacy in Cyber Systems|3
IERG5320|Digital Forensics|3
IERG5330|Network Economics|3
IERG5340|IT Innovation and Entrepreneurship|3
IERG5350|Reinforcement Learning|3
IERG5360|Program Representation, Modeling and Understanding for Software Security|3
IERG5380|Quantum Information Processing|3
IERG5400|Theory of Probability|3
IERG5450|AI for Science|3
IERG5460|Multimodal Machine Learning|3
IERG5470|Convex and Stochastic Optimization and their Applications|3
IERG5590|Advanced Topics in Blockchain|3
IERG5670|Computational Imaging Systems and Algorithms|3
MATH1010|University Mathematics|3
MATH1018|Honours University Mathematics|3
MATH1025|Essential Mathematical Methods|3
MATH1028|Honours Essential Mathematical Methods|3
MATH1030|Linear Algebra I|3
MATH1038|Honours Linear Algebra I|3
MATH1090|Introduction to Set Theory|3
MATH1098|Honours Introduction to Set Theory|3
MATH2010|Advanced Calculus I|3
MATH2018|Honours Advanced Calculus I|3
MATH2020|Advanced Calculus II|3
MATH2028|Honours Advanced Calculus II|3
MATH2040|Linear Algebra II|3
MATH2048|Honours Linear Algebra II|3
MATH2050|Mathematical Analysis I|3
MATH2058|Honours Mathematical Analysis I|3
MATH2060|Mathematical Analysis II|3
MATH2068|Honours Mathematical Analysis II|3
MATH2070|Algebraic Structures|3
MATH2078|Honours Algebraic Structures|3
MATH2230|Complex Variables with Applications|3
MATH3020|Axiomatic Set Theory and Applications|3
MATH3030|Abstract Algebra|3
MATH3040|Fields and Galois Theory|3
MATH3060|Mathematical Analysis III|3
MATH3070|Introduction to Topology|3
MATH3080|Number Theory|3
MATH3093|Fourier Analysis|3
MATH3215|Operations Research|3
MATH3230|Numerical Analysis|3
MATH3250|Discrete Mathematics|3
MATH3260|Graph Theory|3
MATH3270|Ordinary Differential Equations|3
MATH3290|Mathematical Modeling|3
MATH3310|Computational and Applied Mathematics|3
MATH3320|Foundation of Data Analytics|3
MATH3330|Big Data Computing|3
MATH3340|Mathematics of Machine Learning|3
MATH3360|Mathematical Imaging|3
MATH4010|Functional Analysis|3
MATH4020|Calculus of Variations|3
MATH4030|Differential Geometry|3
MATH4230|Optimization Theory|3
MATH4240|Stochastic Processes|3
MATH4260|Coding Theory and Cryptography|3
MATH4280|Data Analytics in Design and Innovation|3
MIEG2051|Fourier Analysis with Engineering Applications|3
MIEG2440|Discrete Structures and Probability|3
`);

const CSE_COURSE_ROWS = parseRows(`
AIST1110|Introduction to Computing using Python|3
CSCI1120|Introduction to Computing Using C++|3
ESTR1100|Introduction to Computing Using C++|3
CSCI1130|Introduction to Computing Using Java|3
ESTR1102|Introduction to Computing Using Java|3
CSCI2100|Data Structures|3
ESTR2102|Data Structures|3
CSCI3130|Formal Languages and Automata Theory|3
CSCI3150|Introduction to Operating Systems|3
ESTR3102|Introduction to Operating Systems|3
CSCI3160|Design and Analysis of Algorithms|3
ESTR3104|Design and Analysis of Algorithms|3
CSCI3230|Fundamentals of Artificial Intelligence|3
ESTR3108|Fundamentals of Artificial Intelligence|3
CSCI3320|Fundamentals of Machine Learning|3
CSCI4130|Introduction to Cyber Security|3
CSCI5030|Machine Learning Theory|3
CSCI5150|Machine Learning Algorithms and Applications|3
`);

const FACULTY_PACKAGE_CODES = new Set([
  'ENGG1110',
  'ESTR1002',
  'MATH1025',
  'MATH1028',
  'MATH1030',
  'MATH1038',
]);

const FOUNDATION_CODES = new Set([
  'AIST1110',
  'CSCI1120',
  'ESTR1100',
  'CSCI1130',
  'ESTR1102',
  'ENGG1310',
  'ESTR1003',
  'IERG1080',
  'MATH1010',
  'MATH1018',
]);

const REQUIRED_CODES = new Set([
  'CSCI2100',
  'ESTR2102',
  'CSCI3160',
  'ESTR3104',
  'IERG2060',
  'ESTR2304',
  'IERG2080',
  'ESTR2306',
  'IERG2310',
  'ESTR2300',
  'IERG2820',
  'IERG3080',
  'ESTR3308',
  'IERG3310',
  'ESTR3310',
  'IERG3800',
  'IERG3820',
  'MATH1090',
  'MATH1098',
  'MATH2010',
  'MATH2018',
  'MATH2020',
  'MATH2028',
  'MATH2040',
  'MATH2048',
  'MATH2050',
  'MATH2058',
  'MATH2060',
  'MATH2068',
  'MATH2070',
  'MATH2078',
  'MATH2230',
  'MIEG2051',
  'ESTR2360',
  'MIEG2440',
  'ESTR2362',
]);

const CAPSTONE_CODES = new Set(['IERG4998', 'IERG4999']);

function classifyCourse(course) {
  if (CAPSTONE_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'capstone',
      group:
        'Research Component Courses · IERG4998 and IERG4999 · 6 units required; ELITE uses ESTR4998 and ESTR4999',
    };
  }
  if (course.code === 'ENGG1820') {
    return {
      ...course,
      courseType: 'internship',
      group: 'Named MIEG Course List · Engineering Internship',
    };
  }
  if (FACULTY_PACKAGE_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group:
        'Direct-entry Faculty Package / Science-route Foundation · slash-separated MATH and ENGG/ESTR codes are alternatives',
    };
  }
  if (FOUNDATION_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group:
        'Foundation choice · direct-entry and Science-route placements differ · slash-separated CSCI/ESTR codes are alternatives',
    };
  }
  if (REQUIRED_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group:
        'Major Required · 54-unit block · slash-separated standard/Honours/ESTR codes are alternatives',
    };
  }
  return {
    ...course,
    courseType: 'major_elective',
    group:
      'Named Major Elective scope · direct entry completes 9 units and Science-route entry completes 6 units',
  };
}

function buildCourses() {
  const rows = [...PDF_COURSE_ROWS, ...CSE_COURSE_ROWS];
  const coursesByCode = new Map(rows.map((course) => [course.code, classifyCourse(course)]));
  if (coursesByCode.size !== rows.length) {
    throw new Error('CUHK MIEGN evidence rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider:
      'CUHK Mathematics and Information Engineering 2025-26 Major Programme Requirement',
    academicYear: 'Applicable to students admitted in 2025-26; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      STUDY_PLAN_URL,
      PROGRAMME_URL,
      COURSE_PAGE_URL,
      CSE_UG_COURSE_URL,
      CSE_PG_COURSE_URL,
      LEAFLET_URL,
    ],
    note:
      'The current official 2025-26 Major Programme Requirement was text-extracted and visually reviewed page by page. It publishes an 87-unit Major for both direct entrants and students admitted through the Faculty of Science Mathematics Enrichment Stream, with route-specific Faculty Package, Foundation and Elective totals, a common 54-unit Required block and a 6-unit Research Component. Its five-page Course List contains 160 unique code-title-unit rows. The current official CUHK CSE undergraduate and research-postgraduate course lists close another 18 explicitly named AIST/CSCI/ESTR code-title-unit rows from the MIEG requirement, producing 178 evidence-backed unique courses. The four-page official programme leaflet was also text-extracted and visually reviewed; it confirms the 87-unit Major, broad Year 1-4 sequence and 80+ elective description but does not add a coded completion path. PHYS1001/1002/1111, STAT1011, the Science Faculty Package alternatives, CSCI5320 and FTEC4004 remain outside this supplement because the reviewed MIEG course table does not publish their direct code-title-unit rows and the current linked departmental lists do not close every identity. Open AIST/CSCI/FTEC/SEEM/STAT 3000-level-or-above pools, ENGG 5000-level courses, slash alternatives, route-specific sequencing, ELITE substitutions and double counting require manual review. This evidence-backed course scope is intentionally browse-only and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'MIEGN',
        jupasCode: 'JS4733',
        programmeId: 'CUHK-UG-MIEGN-49',
        majorId: 'CUHK-UG-MIEGN-49-M1',
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
  CAPSTONE_CODES,
  CSE_COURSE_ROWS,
  PDF_COURSE_ROWS,
  REQUIRED_CODES,
  buildCourses,
  buildSupplement,
};
