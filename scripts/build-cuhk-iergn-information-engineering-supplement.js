const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://www.ie.cuhk.edu.hk/wp-content/uploads/2025/08/IERGN_ENG_25.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/iergn/';
const COURSE_PAGE_URL = 'https://www.ie.cuhk.edu.hk/courses-ierg';
const SHARED_ENGINEERING_SOURCE_URL = 'https://www.ee.cuhk.edu.hk/images/content/curriculum/undergraduate_programme/course_list/ELEGN_ENG_25.pdf';
const SHARED_COMPUTING_SOURCE_URL = 'https://www.qfin.cuhk.edu.hk/site/assets/files/1024/qfinn_eng_25.pdf';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-iergn-information-engineering-courses-2025.json'
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
ENGG1310|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ENGG1820|Engineering Internship|1
ENGG2420|Complex Analysis and Differential Equations for Engineers|3
ENGG2440|Discrete Mathematics for Engineers|3
ENGG2720|Complex Variables for Engineers|2
ENGG2740|Differential Equations for Engineers|2
ENGG2780|Statistics for Engineers|2
ENGG5301|Information Theory|3
ENGG5302|Random Processes|3
ENGG5303|Advanced Wireless Communications|3
ENGG5383|Applied Cryptography|3
ENGG5392|Lightwave System Technologies|3
ESTR1003|Engineering Physics: Electromagnetics, Optics and Modern Physics|3
ESTR2004|Discrete Mathematics for Engineers|3
ESTR2014|Complex Variables for Engineers|2
ESTR2016|Differential Equations for Engineers|2
ESTR2020|Statistics for Engineers|2
ESTR2300|Principles of Communication Systems|3
ESTR2302|Signals and Systems|3
ESTR2304|Basic Analog and Digital Circuits|3
ESTR2306|Introduction to Systems Programming|3
ESTR2308|Probability Models and Applications|3
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
IERG1000|Introduction of Information Engineering|1
IERG1080|Introduction to Python for Engineering Applications|3
IERG2051|Signals and Systems|3
IERG2060|Basic Analog and Digital Circuits|3
IERG2080|Introduction to Systems Programming|3
IERG2310|Principles of Communication Systems|3
IERG2470|Probability Models and Applications|3
IERG2820|Electronic Circuit Design Laboratory|1
IERG3010|Digital Communications|3
IERG3050|Simulation and Statistical Analysis|3
IERG3060|Microcontrollers and Embedded Systems|3
IERG3070|Operating Systems in Practice: A Linux Perspective|3
IERG3080|Information and Software Engineering Practice|3
IERG3280|Networks: Technology, Economics, and Social Interactions|3
IERG3300|Introduction to Stochastic Processes|3
IERG3310|Computer Networks|3
IERG3320|Social Media and Human Information Interaction|3
IERG3800|Information Infrastructure Design Lab|1
IERG3810|Microcontrollers and Embedded System Laboratory|1
IERG3820|Communications Laboratory|1
IERG3830|Product Design and Development|3
IERG3840|Web Application Development Project|1
IERG3842|Mobile Network Application Development Project|1
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
`);

const SHARED_ENGINEERING_ROWS = parseRows(`
ENGG1110|Problem Solving By Programming|3
ESTR1002|Problem Solving By Programming|3
ENGG1111|AI Literacy Workshop|0
ENGG1120|Linear Algebra for Engineers|3
ESTR1005|Linear Algebra for Engineers|3
ENGG1125|Single Variable Calculus for Engineers|3
ESTR1007|Single Variable Calculus for Engineers|3
ENGG1130|Multivariable Calculus for Engineers|3
ESTR1006|Multivariable Calculus for Engineers|3
CSCI2100|Data Structures|3
ESTR2102|Data Structures|3
PHYS1003|General Physics for Engineers|3
`);

const SHARED_COMPUTING_ROWS = parseRows(`
CSCI3150|Introduction to Operating Systems|3
CSCI3160|Design and Analysis of Algorithms|3
CSCI3320|Fundamentals of Machine Learning|3
CSCI4130|Introduction to Cyber Security|3
CSCI4180|Introduction to Cloud Computing and Storage|3
CSCI4190|Introduction to Social Networks|3
`);

const EXCLUDED_COURSE_LIST_CODES = new Set([
  'ENGG2420',
  'ENGG2740',
  'ENGG2780',
  'ESTR2016',
  'ESTR2020',
]);

const FACULTY_PACKAGE_CODES = new Set([
  'ENGG1110',
  'ESTR1002',
  'ENGG1111',
  'ENGG1120',
  'ESTR1005',
  'ENGG1125',
  'ESTR1007',
]);

const FOUNDATION_CODES = new Set([
  'ENGG1130',
  'ESTR1006',
  'ENGG2440',
  'ESTR2004',
  'ENGG2720',
  'ESTR2014',
  'IERG1080',
]);

const REQUIRED_CODES = new Set([
  'CSCI2100',
  'ESTR2102',
  'IERG1000',
  'IERG2051',
  'ESTR2302',
  'IERG2060',
  'ESTR2304',
  'IERG2080',
  'ESTR2306',
  'IERG2310',
  'ESTR2300',
  'IERG2470',
  'ESTR2308',
  'IERG2820',
  'IERG3060',
  'IERG3080',
  'ESTR3308',
  'IERG3310',
  'ESTR3310',
  'IERG3800',
  'IERG3810',
  'IERG3820',
]);

const REQUIRED_OPTION_CODES = new Set(['IERG3840', 'IERG3842']);
const CAPSTONE_CODES = new Set(['IERG4998', 'IERG4999']);
const CONDITIONAL_PHYSICS_CODES = new Set(['ENGG1310', 'ESTR1003', 'PHYS1003']);
const STREAM_ONLY_EXTERNAL_CODES = new Set(['CSCI3320', 'CSCI4180', 'CSCI4190']);

function classifyCourse(course) {
  if (CAPSTONE_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'capstone',
      group: 'Research Component Courses · IERG4998 and IERG4999 · 6 units required',
    };
  }
  if (FACULTY_PACKAGE_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group: 'Faculty Package · 9 units · slash-separated ENGG/ESTR entries are alternatives',
    };
  }
  if (FOUNDATION_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group: 'Foundation Courses · 11 units · slash-separated ENGG/ESTR entries are alternatives',
    };
  }
  if (REQUIRED_OPTION_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group: 'Major Required · choose IERG3840 or IERG3842 · 1 unit',
    };
  }
  if (REQUIRED_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group: 'Major Required · 32 units · slash-separated CSCI/IERG/ESTR entries are alternatives',
    };
  }
  if (CONDITIONAL_PHYSICS_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'core',
      group: 'Conditional first-year Physics requirement · depends on prior public-examination evidence',
    };
  }
  if (STREAM_ONLY_EXTERNAL_CODES.has(course.code)) {
    return {
      ...course,
      courseType: 'major_elective',
      group: 'Major Elective · named in an optional 12-unit Stream pool',
    };
  }
  return {
    ...course,
    courseType: 'major_elective',
    group: 'Major Elective · 16 units total · at least 13 units from the named course pool',
  };
}

function buildSupplement() {
  const rows = [
    ...PDF_COURSE_ROWS.filter((course) => !EXCLUDED_COURSE_LIST_CODES.has(course.code)),
    ...SHARED_ENGINEERING_ROWS,
    ...SHARED_COMPUTING_ROWS,
  ];
  const coursesByCode = new Map(rows.map((course) => [course.code, classifyCourse(course)]));

  return {
    provider: 'CUHK Department of Information Engineering 2025-26 Major Programme Requirement',
    academicYear: 'Applicable to students admitted in 2025-26; reviewed on 2026-07-30',
    sourceUrl: SOURCE_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [
      COURSE_PAGE_URL,
      SHARED_ENGINEERING_SOURCE_URL,
      SHARED_COMPUTING_SOURCE_URL,
    ],
    note: 'The official 2025-26 scheme closes a 75-unit ordinary Major Programme Requirement and separately publishes a 52-unit senior-year path, an IERG-IBBA double-degree option, five optional 12-unit IERG Streams and the Faculty ELITE Stream. The PDF Course List contains 122 code-title-unit rows; five rows not referenced by the ordinary Major requirement or its named Stream pools are excluded. Shared Faculty Package, Foundation, CSCI and conditional Physics course identities are cross-checked against the linked current official CUHK Engineering schemes. The ordinary path includes 9 Faculty Package units, 11 Foundation units, 32 Required units, a 1-unit IERG3840/IERG3842 choice, 6 Research Component units and 16 Elective units. The open 3000-level-or-above Engineering elective universe, slash-separated alternatives, conditional Physics and mathematics bridge rules, five optional Streams, ELITE approvals, senior-entry path and double-degree path require manual review. ESTR3102, ESTR3104, ESTR4106 and ELEG5491 are named by code in the requirement but are omitted because the reviewed sources do not provide a direct code-title-unit row. This 135-course evidence-backed scope is intentionally browse-only and must not produce a graduation completion percentage.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'IERGN',
        jupasCode: 'JS4446',
        programmeId: 'CUHK-UG-IERGN-47',
        majorId: 'CUHK-UG-IERGN-47-M1',
        courses: [...coursesByCode.values()].sort((left, right) =>
          left.code.localeCompare(right.code)
        ),
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
  EXCLUDED_COURSE_LIST_CODES,
  PDF_COURSE_ROWS,
  buildSupplement,
};
