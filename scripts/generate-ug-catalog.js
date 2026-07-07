const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';
const OUTPUT_PATH = path.join(__dirname, '..', 'miniprogram', 'utils', 'ugCatalogue.js');
const HKU_CDS_OFFERINGS_PATH = path.join(__dirname, '..', 'data', 'hku-cds-offerings-2025.json');

const HKU_CDS_PROGRAMME_NAMES = new Set([
  'Computing and Data Science',
  'Computing and Data Science (Delta+)'
]);

const SOURCES = [
  {
    code: 'HKU',
    file: 'hku_programme_year_semester_courses_2026.json',
    nameZh: '香港大学',
    shortName: 'HKU'
  },
  {
    code: 'CUHK',
    file: 'cuhk_programme_year_semester_courses_2026.json',
    nameZh: '香港中文大学',
    shortName: 'CUHK'
  },
  {
    code: 'HKUST',
    file: 'hkust_programme_year_semester_courses_2026.json',
    nameZh: '香港科技大学',
    shortName: 'HKUST'
  },
  {
    code: 'POLYU',
    file: 'polyu_programme_year_semester_courses_2026.json',
    nameZh: '香港理工大学',
    shortName: 'PolyU'
  },
  {
    code: 'CITYU',
    file: 'cityu_programme_year_semester_courses_2026.json',
    nameZh: '香港城市大学',
    shortName: 'CityUHK'
  },
  {
    code: 'HKBU',
    file: 'hkbu_programme_year_semester_courses_2026.json',
    nameZh: '香港浸会大学',
    shortName: 'HKBU'
  }
];

const STATIC_UNIVERSITIES = [
  {
    id: 'EDUHK',
    code: 'EDUHK',
    shortName: 'EdUHK',
    nameEn: 'The Education University of Hong Kong',
    nameZh: '香港教育大学',
    academicYear: '2026',
    sourceStatus: 'university_index_only'
  },
  {
    id: 'LINGNAN',
    code: 'LINGNAN',
    shortName: 'Lingnan',
    nameEn: 'Lingnan University',
    nameZh: '岭南大学',
    academicYear: '2026',
    sourceStatus: 'university_index_only'
  }
];

const STATIC_PROGRAMME_GROUPS = [
  {
    universityCode: 'EDUHK',
    faculty: 'JUPAS Undergraduate Programmes',
    source: 'https://www.jupas.edu.hk/en/programme/eduhk/',
    programmes: [
      ['JS8001', 'BA(CDA)&BEd(MU)', 'Bachelor of Arts (Honours) in Creative and Digital Arts and Bachelor of Education (Honours) (Music)', '創意藝術與數碼藝術榮譽文學士及音樂教育榮譽學士'],
      ['JS8002', 'BA(CDA)&BEd(VA)', 'Bachelor of Arts (Honours) in Creative and Digital Arts and Bachelor of Education (Honours) (Visual Arts)', '創意藝術與數碼藝術榮譽文學士及視覺藝術教育榮譽學士'],
      ['JS8003', 'BA(DCCC)&BEd(CL)', 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication and Bachelor of Education (Honours) (Chinese Language)', '數碼中國文化與傳意榮譽文學士及中文教育榮譽學士'],
      ['JS8004', 'BA(ESDC)&BEd(EL)', 'Bachelor of Arts (Honours) in English Studies and Digital Communication and Bachelor of Education (Honours) (English Language)', '英語研究及數碼傳訊榮譽文學士及英文教育榮譽學士'],
      ['JS8005', 'BA(HE&AM)&BEd(CHI HIST)', 'Bachelor of Arts (Honours) in Heritage Education and Arts Management and Bachelor of Education (Honours) (Chinese History)', '文化傳承教育與藝術管理榮譽文學士及中國歷史教育榮譽學士'],
      ['JS8006', 'BSocSc(Psy)&BEd(ECE)', 'Bachelor of Social Sciences (Honours) in Psychology and Bachelor of Education (Honours) (Early Childhood Education)', '心理學榮譽社會科學學士及幼兒教育榮譽學士'],
      ['JS8007', 'BA(PF)&BEd(BAFS)', 'Bachelor of Arts (Honours) in Personal Finance and Bachelor of Education (Honours) (Business, Accounting and Financial Studies)', '個人理財榮譽文學士及企業、會計與財務概論教育榮譽學士'],
      ['JS8008', 'BSc(AIET)&BEd(ICT&PSci)', 'Bachelor of Science (Honours) in Artificial Intelligence and Educational Technology and Bachelor of Education (Honours) (Information and Communication Technology and Primary Science)', '人工智能與教育科技榮譽理學士及資訊及通訊科技及小學科學教育榮譽學士'],
      ['JS8009', 'BSc(AIET)&BEd(PM)', 'Bachelor of Science (Honours) in Artificial Intelligence and Educational Technology and Bachelor of Education (Honours) (Primary Mathematics)', '人工智能與教育科技榮譽理學士及小學數學教育榮譽學士'],
      ['JS8010', 'BSc(SPSC)&BEd(PE)', 'Bachelor of Science (Honours) in Sports Science and Coaching and Bachelor of Education (Honours) (Physical Education)', '運動科學及教練榮譽理學士及體育教育榮譽學士'],
      ['JS8011', 'BSc(IEM)&BEd(SCI)', 'Bachelor of Science (Honours) in Integrated Environmental Management and Bachelor of Education (Honours) (Science)', '綜合環境管理榮譽理學士及科學教育榮譽學士'],
      ['JS8012', 'BSocSc(SCS)&BEd(GEOG)', 'Bachelor of Social Sciences (Honours) in Sociology and Community Studies and Bachelor of Education (Honours) (Geography)', '社會學與社區研究榮譽社會科學學士及地理教育榮譽學士'],
      ['JS8013', 'BSocSc(SCS)&BEd(PHM)', 'Bachelor of Social Sciences (Honours) in Sociology and Community Studies and Bachelor of Education (Honours) (Primary Humanities)', '社會學與社區研究榮譽社會科學學士及小學人文科教育榮譽學士'],
      ['JS8651', 'BSocSc(Psy)', 'Bachelor of Social Sciences (Honours) in Psychology', '心理學榮譽社會科學學士'],
      ['JS8663', 'BA(SE)', 'Bachelor of Arts (Honours) in Special Education', '特殊教育榮譽文學士'],
      ['JS8674', 'BA(DCCC)', 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication', '數碼中國文化與傳意榮譽文學士'],
      ['JS8675', 'BA(ESDC)', 'Bachelor of Arts (Honours) in English Studies and Digital Communication', '英語研究及數碼傳訊榮譽文學士'],
      ['JS8685', 'BA(CDA)-MU', 'Bachelor of Arts (Honours) in Creative and Digital Arts (Music)', '創意藝術與數碼藝術榮譽文學士 (音樂)'],
      ['JS8686', 'BA(CDA)-VA', 'Bachelor of Arts (Honours) in Creative and Digital Arts (Visual Arts)', '創意藝術與數碼藝術榮譽文學士 (視覺藝術)'],
      ['JS8687', 'BA(HE&AM)', 'Bachelor of Arts (Honours) in Heritage Education and Arts Management', '文化傳承教育與藝術管理榮譽文學士'],
      ['JS8688', 'BA(PF)', 'Bachelor of Arts (Honours) in Personal Finance', '個人理財榮譽文學士'],
      ['JS8702', 'BSc(IEM)', 'Bachelor of Science (Honours) in Integrated Environmental Management', '綜合環境管理榮譽理學士'],
      ['JS8714', 'BSc(AI&EdTech)', 'Bachelor of Science (Honours) in Artificial Intelligence and Educational Technology', '人工智能與教育科技榮譽理學士'],
      ['JS8726', 'BSc(SPSC)', 'Bachelor of Science (Honours) in Sports Science and Coaching', '運動科學及教練榮譽理學士'],
      ['JS8727', 'BSc(SPR)', 'Bachelor of Science (Honours) in Speech Pathology and Rehabilitation', '言語病理學及復康榮譽理學士']
    ]
  },
  {
    universityCode: 'LINGNAN',
    faculty: 'JUPAS Undergraduate Programmes',
    source: 'https://www.jupas.edu.hk/en/programme/lingnanu/',
    programmes: [
      ['JS7101', 'BA (Hons) Chinese', 'Bachelor of Arts (Honours) in Chinese (Features: Chinese Language & Literature/Creative Writing/Digital Literature)', '中文(榮譽)文學士(課程特色: 中國語言與文學/創意寫作/數字人文)'],
      ['JS7123', 'BLA (Hons) GDS', 'Bachelor of Liberal Arts (Hons) in Global Development and Sustainability (Concentrations: Policy & Institutions/Culture & Community/Business & Economy/Human-Environment Interactions)', '環球可持續發展(榮譽)博雅學士'],
      ['JS7133', 'BA (Hons) ADA', 'Bachelor of Arts (Honours) in Animation and Digital Arts (Concentrations: Digital Animation/Arts & Technology)', '動畫及數碼藝術(榮譽)文學士'],
      ['JS7204', 'BA (Hons) Translation', 'Bachelor of Arts (Honours) in Translation (Concentrations: Cross-cultural Communication/Digital Corporate Communication)', '翻譯(榮譽)文學士'],
      ['JS7211', 'BBA (Hons) ACG', 'Bachelor of Business Administration (Honours)-Accounting and Corporate Governance (Concentrations: Professional Accounting/Corporate Governance)', '工商管理(榮譽)學士-會計與企業管治'],
      ['JS7212', 'BBA (Hons) BAI', 'Bachelor of Business Administration (Honours)-Business Analytics & Innovation (Features: e-Business/Information Systems/Operations Management/Data Science/Artificial Intelligence)', '工商管理(榮譽)學士-商業分析與創新'],
      ['JS7213', 'BBA (Hons) FIN', 'Bachelor of Business Administration (Honours)-Finance (Features: CFA Student Scholarship/Diverse Electives: Investment, Corporate Finance, FinTech)', '工商管理(榮譽)學士-金融'],
      ['JS7214', 'BBA (Hons) MA', 'Bachelor of Business Administration (Honours)-Management and Analytics (Concentration: Global Business Management & Analytics/Human Resource Management & Analytics)', '工商管理(榮譽)學士-管理與分析'],
      ['JS7215', 'BBA (Hons) MSM', 'Bachelor of Business Administration (Honours)-Marketing and Social Media (Features: Integrated Marketing/Social Media & Digital Marketing/Consumer Behaviour & Marketing Research)', '工商管理(榮譽)學士-市場學及社交媒體'],
      ['JS7216', 'BBA (Hons) in RIM', 'Bachelor of Business Administration (Honours) in Risk and Insurance Management (Optional Concentration: Insurance Technology)', '工商管理(榮譽)學士-風險及保險管理'],
      ['JS7225', 'BSc (Hons) Data Science', 'Bachelor of Science (Honours) in Data Science (Features: Big Data Analytics/Deep Learning/Generative AI)', '數據科學(榮譽)理學士'],
      ['JS7301', 'BSocSc (Hons) Economics', 'Bachelor of Social Sciences (Honours)-Economics (Optional Concentration: Global Economics & Banking)', '社會科學(榮譽)學士-經濟學'],
      ['JS7302', "BSocSc (Hons) Gov't & IA", 'Bachelor of Social Sciences (Honours) - Government and International Affairs', '社會科學(榮譽)學士 - 政府與國際事務學'],
      ['JS7303', 'BSocSc (Hons) Psychology', 'Bachelor of Social Sciences (Honours)-Psychology (Optional Concentrations: Counselling Psychology/Industrial & Organisational Psychology)', '社會科學(榮譽)學士-心理學'],
      ['JS7304', 'BSocSc (Hons) Sociology', 'Bachelor of Social Sciences (Honours)-Sociology (Optional Concentration: Social Innovation & Social Studies)', '社會科學(榮譽)學士-社會學'],
      ['JS7305', 'BSocSc (Hons) HSSM', 'Bachelor of Social Sciences (Honours) - Health and Social Services Management', '社會科學(榮譽)學士 - 健康及社會服務管理'],
      ['JS7306', 'BSocSc (Hons) SPPS', 'Bachelor of Social Sciences (Honours)-Social and Public Policy Studies (Optional Concentration: Smart Cities & Digital Society)', '社會科學(榮譽)學士-社會與公共政策研究'],
      ['JS7307', 'BSocSc (Hons) SocDS', 'Bachelor of Social Sciences (Honours)-Social Data Science (Concentrations: Economics/Government and International Affairs/Psychology/Sociology)', '社會科學(榮譽)學士-社會數據科學'],
      ['JS7503', 'BA (Hons) Eng Studies', 'Bachelor of Arts (Honours) in English Studies (Optional Concentrations: Literature/Linguistics)', '英語語言文學課程(榮譽)文學士'],
      ['JS7606', 'BA (Hons) Cultural Stud', 'Bachelor of Arts (Honours) in Cultural Studies (Optional Concentrations: Digital Culture & Media Practices/Cultural Commons, Social Innovation & Creativity)', '文化研究(榮譽)文學士'],
      ['JS7709', 'BA (Hons) History', 'Bachelor of Arts (Honours) in History (Optional Concentrations: Asian History/Global History)', '歷史(榮譽)文學士'],
      ['JS7802', 'BA (Hons) Philosophy', 'Bachelor of Arts (Honours) in Philosophy (Features: Ethics/Philosophy of AI/Logic)', '哲學(榮譽)文學士'],
      ['JS7905', 'BA (Hons) FVA', 'Bachelor of Arts (Honours) in Film and Visual Arts (Features: Film Studies/Global Media/Art History/Museum Studies)', '電影與視覺藝術(榮譽)文學士']
    ]
  }
];

function slug(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function compactText(value, maxLength = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function listCourses(programme) {
  const rows = [];
  (programme.years || []).forEach((year) => {
    (year.semesters || []).forEach((semester) => {
      (semester.courses || []).forEach((course) => {
        rows.push({
          code: String(course.code || course.course_code || '').trim(),
          title: compactText(course.title || course.course_title || ''),
          track: compactText(course.track || ''),
          year: year.year || '',
          semester: semester.semester || '',
          dataStatus: semester.data_status || '',
          sourceUrl: course.source_url || programme.official_url || ''
        });
      });
    });
  });
  return rows;
}

function getRecommendedYear(categories = []) {
  const matchedCategory = categories.find((category) => /Year\s+\d/i.test(category));
  return Number(String(matchedCategory || '').match(/Year\s+(\d)/i)?.[1] || 0);
}

function getCourseType(categories = [], title = '') {
  const searchable = `${categories.join(' ')} ${title}`.toLowerCase();
  if (searchable.includes('elective')) return 'major_elective';
  if (searchable.includes('project') || searchable.includes('final year')) return 'capstone';
  return 'core';
}

function buildHkuCdsSupplementCourses(programmeId, majorId) {
  const offerings = JSON.parse(fs.readFileSync(HKU_CDS_OFFERINGS_PATH, 'utf8'));
  return offerings.courses.map((course, index) => ({
    id: `${majorId}-HKU-CDS-${index + 1}`,
    programmeId,
    majorId,
    courseCode: course.courseCode,
    titleEn: course.title,
    titleZh: course.title,
    credits: course.details?.credits || 0,
    recommendedYear: getRecommendedYear(course.categories),
    semester: (course.terms || []).join(' / '),
    courseType: getCourseType(course.categories, course.title),
    prerequisites: course.details?.prerequisites || '',
    exclusions: course.details?.exclusions || '',
    description: course.details?.description || '',
    sourceUrl: course.officialUrl || offerings.sourceUrl,
    officialUrl: course.officialUrl || offerings.sourceUrl,
    sourceProvider: offerings.provider,
    academicYear: offerings.academicYear
  }));
}

function addHkuCdsSupplements(programmes, majors, courses) {
  programmes
    .filter((programme) => programme.universityCode === 'HKU' && HKU_CDS_PROGRAMME_NAMES.has(programme.nameEn))
    .forEach((programme) => {
      const programmeMajors = majors.filter((major) => major.programmeId === programme.id);
      programmeMajors.forEach((major) => {
        const supplementCourses = buildHkuCdsSupplementCourses(programme.id, major.id);
        courses.push(...supplementCourses);
        major.courseCount = supplementCourses.length;
        major.codedCourseCount = supplementCourses.length;
      });
      const programmeCourseCount = programmeMajors.reduce((sum, major) => sum + (major.codedCourseCount || 0), 0);
      programme.sourceStatus = 'course_codes_available';
      programme.courseCount = programmeCourseCount;
      programme.codedCourseCount = programmeCourseCount;
      programme.courseSourceUrl = 'https://www.cs.hku.hk/programmes/course-offered';
    });
}

function normalizeSource(source, sourceDir) {
  const raw = JSON.parse(fs.readFileSync(path.join(sourceDir, source.file), 'utf8'));
  const university = {
    id: source.code,
    code: source.code,
    shortName: source.shortName,
    nameEn: raw.university,
    nameZh: source.nameZh,
    academicYear: raw.entry_year || '2026'
  };
  const facultySet = new Set();
  const programmes = [];
  const majors = [];
  const courses = [];

  (raw.programmes || []).forEach((programme, programmeIndex) => {
    const programmeCode = String(programme.programme_code || programme.jupas_code || '').trim();
    const programmeKey = slug(programmeCode || programme.programme_name || programmeIndex);
    const programmeId = `${source.code}-UG-${programmeKey || 'PROGRAMME'}-${programmeIndex + 1}`;
    const faculty = programme.faculty || programme.school_or_faculty || '';
    if (faculty) facultySet.add(faculty);
    const programmeCourses = listCourses(programme);
    const codedProgrammeCourses = programmeCourses.filter((course) => course.code);

    programmes.push({
      id: programmeId,
      universityId: source.code,
      universityCode: source.code,
      facultyId: faculty ? `${source.code}-${slug(faculty)}` : `${source.code}-GENERAL`,
      code: programmeCode,
      jupasCode: programme.jupas_code || '',
      nameEn: programme.programme_name,
      nameZh: programme.programme_name,
      degreeLevel: 'undergraduate',
      curriculumYear: raw.entry_year || '2026',
      faculty,
      studyPeriod: programme.study_period || '',
      type: programme.type || programme.award || programme.study_level || '',
      officialUrl: programme.official_url || programme.source_url || '',
      sourceStatus: codedProgrammeCourses.length ? 'course_codes_available' : 'programme_summary_only',
      courseCount: programmeCourses.length,
      codedCourseCount: codedProgrammeCourses.length
    });

    const tracks = Array.isArray(programme.majors_or_tracks) && programme.majors_or_tracks.length
      ? programme.majors_or_tracks
      : [programme.programme_name];
    tracks.forEach((track, trackIndex) => {
      const majorId = `${programmeId}-M${trackIndex + 1}`;
      const trackCourses = programmeCourses.filter((course) => !course.track || course.track === track);
      const effectiveCourses = trackCourses.length ? trackCourses : programmeCourses;
      majors.push({
        id: majorId,
        programmeId,
        code: slug(track) || `M${trackIndex + 1}`,
        nameEn: track,
        nameZh: track,
        courseCount: effectiveCourses.length,
        codedCourseCount: effectiveCourses.filter((course) => course.code).length,
        officialUrl: programme.official_url || programme.source_url || ''
      });
      effectiveCourses
        .filter((course) => course.code)
        .forEach((course, courseIndex) => {
          courses.push({
            id: `${majorId}-C${courseIndex + 1}`,
            programmeId,
            majorId,
            courseCode: course.code,
            titleEn: course.title,
            titleZh: course.title,
            recommendedYear: Number(String(course.year).match(/\d+/)?.[0] || 0),
            semester: course.semester,
            courseType: 'programme_course',
            sourceUrl: course.sourceUrl
          });
        });
    });
  });

  const faculties = [...facultySet].sort().map((faculty) => ({
    id: `${source.code}-${slug(faculty)}`,
    universityId: source.code,
    nameEn: faculty,
    nameZh: faculty
  }));
  if (!faculties.length) {
    faculties.push({
      id: `${source.code}-GENERAL`,
      universityId: source.code,
      nameEn: 'General',
      nameZh: 'General'
    });
  }

  if (source.code === 'HKU') {
    addHkuCdsSupplements(programmes, majors, courses);
  }

  return { university, faculties, programmes, majors, courses };
}

function buildStaticCatalogue() {
  const faculties = [];
  const programmes = [];
  const majors = [];

  STATIC_PROGRAMME_GROUPS.forEach((group) => {
    const facultyId = `${group.universityCode}-${slug(group.faculty)}`;
    faculties.push({
      id: facultyId,
      universityId: group.universityCode,
      nameEn: group.faculty,
      nameZh: group.faculty
    });

    group.programmes.forEach(([jupasCode, shortName, nameEn, nameZh], index) => {
      const programmeId = `${group.universityCode}-UG-${jupasCode}-${index + 1}`;
      const officialUrl = `${group.source}${jupasCode}/`;
      programmes.push({
        id: programmeId,
        universityId: group.universityCode,
        universityCode: group.universityCode,
        facultyId,
        code: jupasCode,
        jupasCode,
        nameEn,
        nameZh,
        shortName,
        degreeLevel: 'undergraduate',
        curriculumYear: '2026',
        faculty: group.faculty,
        studyPeriod: '',
        type: 'Bachelor\'s Degree Programme',
        officialUrl,
        sourceStatus: 'programme_summary_only',
        courseCount: 0,
        codedCourseCount: 0
      });
      majors.push({
        id: `${programmeId}-M1`,
        programmeId,
        code: slug(shortName || jupasCode),
        nameEn,
        nameZh,
        courseCount: 0,
        codedCourseCount: 0,
        officialUrl
      });
    });
  });

  return { faculties, programmes, majors, courses: [] };
}

function validateSourceDir(sourceDir) {
  const missing = SOURCES
    .map((source) => path.join(sourceDir, source.file))
    .filter((filePath) => !fs.existsSync(filePath));
  if (missing.length) {
    throw new Error([
      `Missing UG source JSON files in ${sourceDir}`,
      'Run with --source-dir /path/to/pdf/outputs or place the generated JSON files there.',
      ...missing.map((filePath) => `- ${path.basename(filePath)}`)
    ].join('\n'));
  }
}

function buildCatalogue(sourceDir = DEFAULT_SOURCE_DIR) {
  validateSourceDir(sourceDir);
  const pieces = SOURCES.map((source) => normalizeSource(source, sourceDir));
  const staticCatalogue = buildStaticCatalogue();
  return {
    generatedFrom: 'programme_year_semester_courses_2026',
    generatedAt: new Date().toISOString(),
    universities: pieces.map((piece) => piece.university).concat(STATIC_UNIVERSITIES),
    faculties: pieces.flatMap((piece) => piece.faculties).concat(staticCatalogue.faculties),
    programmes: pieces.flatMap((piece) => piece.programmes).concat(staticCatalogue.programmes),
    majors: pieces.flatMap((piece) => piece.majors).concat(staticCatalogue.majors),
    courses: pieces.flatMap((piece) => piece.courses).concat(staticCatalogue.courses)
  };
}

function main() {
  const sourceDirIndex = process.argv.indexOf('--source-dir');
  const sourceDir = sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(process.argv[sourceDirIndex + 1]);
  const catalogue = buildCatalogue(sourceDir);
  fs.writeFileSync(
    OUTPUT_PATH,
    `// Generated by npm run sync:ug-catalog. Do not edit manually.\nmodule.exports = ${JSON.stringify(catalogue, null, 2)};\n`
  );
  console.log(`Generated UG catalogue: ${catalogue.universities.length} universities, ${catalogue.programmes.length} programmes, ${catalogue.majors.length} majors/tracks, ${catalogue.courses.length} coded courses`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCatalogue,
  buildStaticCatalogue,
  listCourses,
  normalizeSource,
  STATIC_PROGRAMME_GROUPS,
  SOURCES,
  STATIC_UNIVERSITIES,
  validateSourceDir
};
