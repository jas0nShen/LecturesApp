const fs = require('node:fs');
const path = require('node:path');

const COURSE_LIST_URL = 'https://www.com.cuhk.edu.hk/programmes/undergraduate/course-list/';
const PROGRAMME_URL = 'https://www.com.cuhk.edu.hk/programs/journalism-and-communication/';
const BROCHURE_URL = 'https://www.com.cuhk.edu.hk/pdf/COMMN-online.pdf';
const OFFICIAL_URL = 'https://admission.cuhk.edu.hk/programme/commn/';
const OUTPUT_PATH = path.join(
  __dirname,
  '..',
  'data',
  'ug-course-supplements',
  'cuhk-commn-journalism-communication-courses-2026.json'
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

const COURSE_ROWS = parseRows(`
COMM1110|Media and Everyday Life|3
COMM1120|Development of Media and Communication|3
COMM1150|Introduction to Media Industries and Practices|3
COMM1170|Chinese News Reporting and Writing|3
COMM1180|English News Reporting and Writing|3
COMM1190|Media Writing|3
COMM1500|Perspectives in Global Communication|3
COMM2100|Audience Analysis and Strategy|3
COMM2110|Chinese News Production (Writing)|3
COMM2120|English News Production I|3
COMM2140|Media and Social Development in Mainland China|3
COMM2160|Communication Research Methods|3
COMM2170|Chinese News Production (Multimedia)|3
COMM2180|English News Production II|3
COMM2210|News and Society|3
COMM2240|Integrated Strategic Campaign I|3
COMM2300|Sound and Creative Media|3
COMM2320|Creative Media Curation and Management|3
COMM2440|Photojournalism|3
COMM2510|Media Research: Psychological and Sociological Perspectives|3
COMM2530|Critical Studies in Media and Communication|3
COMM2540|Public Sphere and Global Media|3
COMM2560|Field Study in Global Communication|3
COMM2570|Hong Kong Cinema|3
COMM2590|Global Cinema|3
COMM2600|Introduction to Chinese Journalism|3
COMM2601|Introduction to English Journalism|3
COMM2610|Foreign News Desk Practice|3
COMM2620|Feature Writing|3
COMM2733|Radio and Podcast Production|3
COMM2740|Chinese Broadcast News|3
COMM2741|English Broadcast News|3
COMM2811|English Writing for Public Relations|3
COMM2812|Chinese Writing for Public Relations|3
COMM2813|Social Media and Crisis Communication|3
COMM2814|Integrated Public Relations Campaign and Event Management|3
COMM2830|Account Planning and Management|3
COMM2840|Advertising and Society|3
COMM2850|Introduction to Integrated Marketing Communications|3
COMM2910|News Analysis|3
COMM2920|Media, Sex and Violence|3
COMM2922|Introduction to Creative and New Media|3
COMM2925|Principles of Editing in Creative Media|3
COMM2926|Creative Design and Layout|3
COMM2928|Art Direction|3
COMM2930|Understanding Movies|3
COMM2932|Film Genres: Love, Death and Laughs|3
COMM2940|Internet, Digital Media and Information Society|3
COMM2962|Photography|3
COMM3130|Media and Cultural Criticism|3
COMM3131|Special Topic in Communication Studies I|3
COMM3132|Special Topic in Communication Studies II|3
COMM3140|Chinese News Editing and Content Management|3
COMM3191|Film, Television and Hong Kong Culture|3
COMM3193|Media and Gender|3
COMM3200|Communication Professional Internship|3
COMM3310|Images and Creative Media|3
COMM3400|Integrated Strategic Campaign II|3
COMM3510|Critical Communication Theories and Research|3
COMM3550|Global Finance for Communication Professionals|3
COMM3600|Laws and Ethics for Communication|3
COMM3610|English News Content Management|3
COMM3620|Investigative Reporting|3
COMM3630|Digital Journalism|3
COMM3640|China News Reporting|3
COMM3650|Social Media Analytics for Communication Professionals|3
COMM3660|Infographics and Data Visualization|3
COMM3680|Business and Financial Reporting|3
COMM3681|Special Topic in Journalism I|3
COMM3682|Special Topic in Journalism II|3
COMM3690|User Interface Design: Socio-cultural Perspectives and Practices|3
COMM3700|Diversity Issues in Communication|3
COMM3710|Legal and Ethical Issues in Digital Media|3
COMM3711|Script Writing and Screenplay|3
COMM3721|Special Topic in Global Communication I|3
COMM3722|Special Topic in Global Communication II|3
COMM3733|Television Studio Production|3
COMM3740|Advanced Broadcast News|3
COMM3750|Visual Storytelling in Journalism|3
COMM3760|Health and Environmental Journalism|3
COMM3800|Digital Media Design and Application|3
COMM3810|Public Relations and Social Theory|3
COMM3811|Special Topic in Public Relations I|3
COMM3812|Special Topic in Public Relations II|3
COMM3820|Media Management for Public Relations|3
COMM3830|Legal Issues in Public Relations and Advertising|3
COMM3831|Special Topic in Advertising I|3
COMM3832|Special Topic in Advertising II|3
COMM3840|Chinese Copywriting for Advertising|3
COMM3841|English Copywriting for Advertising|3
COMM3850|Advertising Art Direction|3
COMM3855|Media Investment and Performance Marketing|3
COMM3860|Strategic Communication for Entrepreneurs|3
COMM3870|Social Responsibility and Sustainability Communication|3
COMM3888|Financial Public Relations|2
COMM3910|Sound Production|3
COMM3920|Creative Writing in Media|3
COMM3921|Special Topic in Creative and New Media I|3
COMM3922|Special Topic in Creative and New Media II|3
COMM3930|Digital Video Production|3
COMM3933|Music Industry, Production and Marketing|3
COMM3939|Film Directors|3
COMM3940|Immersive Storytelling|3
COMM3941|New Media and Entertainment Business|3
COMM4040|Directed Studies in Communication|3
COMM4150|Senior Research Project|3
COMM4191|Cultural Studies and Popular Culture|3
COMM4250|Global Digital Platforms: Culture, Power and Politics|3
COMM4730|Documentary|3
COMM4733|Advanced Television Studio Production|3
COMM4848|New Media Advertising|3
COMM4935|Cinematography|3
COMM4956|Fundamentals of Computer Animation|3
COMM4962|Advanced Photography|3
`);

const REQUIRED_ROLES = {
  COMM1120: ['core', 'Faculty Package · fixed course'],
  COMM1150: ['core', 'Major Required · Year 1'],
  COMM2160: ['core', 'Major Required · Year 2-3'],
  COMM2530: ['core', 'Major Required · Year 2-3'],
  COMM3200: ['internship', 'Major Required · Year 3 Summer internship'],
  COMM3600: ['core', 'Major Required · choose COMM3600 or COMM3710'],
  COMM3710: ['core', 'Major Required · choose COMM3600 or COMM3710'],
  COMM4150: ['capstone', 'Major Required · Senior Research Project'],
};

function buildCourses() {
  const coursesByCode = new Map(
    COURSE_ROWS.map((course) => {
      const [courseType, group] = REQUIRED_ROLES[course.code] || [
        'major_elective',
        'School undergraduate Course List · choose at least 11 electives across five streams',
      ];
      return [course.code, { ...course, courseType, group }];
    })
  );
  if (coursesByCode.size !== COURSE_ROWS.length) {
    throw new Error('CUHK COMMN course rows contain duplicate course codes');
  }
  return [...coursesByCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function buildSupplement() {
  return {
    provider: 'CUHK School of Journalism and Communication',
    academicYear: 'Current Course List and 2025 brochure; reviewed on 2026-08-10',
    sourceUrl: COURSE_LIST_URL,
    officialUrl: OFFICIAL_URL,
    additionalSourceUrls: [PROGRAMME_URL, BROCHURE_URL],
    note: 'The current official School undergraduate Course List (175,358 bytes; SHA-256 c34e9c6bcbc12d2561ab059225fcd61ffe03523c686fd94fbf258f1482aac31a; Last-Modified 2026-07-31) publishes 114 unique COMM course rows with code, title and units: 113 three-unit courses and COMM3888 at two units. The official 20-page 2025 Programme brochure (12,032,226 bytes; SHA-256 83da603ff46f256c1fafc7500f1777c96eaefcda99017e944b5d793897cd8031) was text-extracted, and its curriculum pages 8-11 were visually reviewed. It identifies eight unique fixed Major codes, four practicum paths whose four-course sequences are not coded in the brochure, and at least 11 electives chosen across Advertising and Public Relations, Journalism, Creative and New Media, Communication Studies and Global Communication. Only the eight roles explicitly named by the brochure are classified as fixed requirements here; the other current School courses remain a browse-only elective pool. Because practicum ownership, cross-Faculty Package choices, double-Major paths and the complete completion structure are not closed by the public evidence, totalCreditRequired=0 and no graduation completion percentage is generated.',
    supplements: [
      {
        universityCode: 'CUHK',
        programmeCode: 'COMMN',
        jupasCode: 'JS4850',
        programmeId: 'CUHK-UG-COMMN-78',
        majorId: 'CUHK-UG-COMMN-78-M1',
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
  REQUIRED_ROLES,
  buildCourses,
  buildSupplement,
};
