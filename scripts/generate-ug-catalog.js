const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';
const OUTPUT_DIR = path.join(__dirname, '..', 'miniprogram', 'utils');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'ugCatalogue.js');
const COURSE_SHARDS_PATH = path.join(OUTPUT_DIR, 'ugCourseShards.js');
const SUBPACKAGES_DIR = path.join(__dirname, '..', 'miniprogram', 'subpackages');
const HKU_CDS_OFFERINGS_PATH = path.join(__dirname, '..', 'data', 'hku-cds-offerings-2025.json');
const HKUST_COMP_REQUIREMENTS_PATH = path.join(__dirname, '..', 'data', 'hkust-comp-requirements-2025.json');
const CUHK_CSE_COURSES_PATH = path.join(__dirname, '..', 'data', 'cuhk-cse-ug-courses-2026.json');
const CITYU_CS_COURSES_PATH = path.join(__dirname, '..', 'data', 'cityu-cs-ug-courses-2025.json');
const LINGNAN_DATA_SCIENCE_COURSES_PATH = path.join(__dirname, '..', 'data', 'lingnan-data-science-courses-2025.json');
const UG_COURSE_SUPPLEMENTS_DIR = path.join(__dirname, '..', 'data', 'ug-course-supplements');

const HKU_CDS_PROGRAMME_NAMES = new Set([
  'Computing and Data Science',
  'Computing and Data Science (Delta+)'
]);

const CUHK_CSE_PROGRAMME_COURSE_PREFIXES = [
  {
    programmeName: 'Computer Science',
    majorName: 'Computer Science',
    prefixes: ['CSCI', 'ENGG']
  },
  {
    programmeName: 'Computer Engineering',
    majorName: 'Computer Engineering',
    prefixes: ['CENG', 'ENGG']
  },
  {
    programmeName: 'Artificial Intelligence: Systems and Technologies',
    majorName: 'Artificial Intelligence: Systems and Technologies',
    prefixes: ['AIST', 'ENGG']
  }
];

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

function mergeCodedCourses(courses) {
  const byCode = new Map();
  courses
    .filter((course) => course.code)
    .forEach((course) => {
      const existing = byCode.get(course.code);
      if (!existing) {
        byCode.set(course.code, {
          ...course,
          semesters: course.semester ? [course.semester] : [],
          years: course.year ? [course.year] : []
        });
        return;
      }
      if (course.title && course.title.length > existing.title.length) existing.title = course.title;
      if (course.sourceUrl && !existing.sourceUrl) existing.sourceUrl = course.sourceUrl;
      if (course.semester && !existing.semesters.includes(course.semester)) existing.semesters.push(course.semester);
      if (course.year && !existing.years.includes(course.year)) existing.years.push(course.year);
    });
  return [...byCode.values()].map((course) => ({
    ...course,
    semester: course.semesters.join(' / '),
    year: course.years[0] || course.year
  }));
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

function getHkustCourseType(groups = []) {
  if (groups.includes('foundation')) return 'foundation';
  if (groups.includes('required')) return 'core';
  return 'major_elective';
}

function addHkustComputerScienceSupplements(programmes, majors, courses) {
  const requirements = JSON.parse(fs.readFileSync(HKUST_COMP_REQUIREMENTS_PATH, 'utf8'));
  const programme = programmes.find((item) => (
    item.universityCode === 'HKUST'
    && item.nameEn === 'BEng/BSc in Computer Science'
  ));
  if (!programme) return;

  const programmeMajors = majors.filter((major) => major.programmeId === programme.id);
  requirements.programmes.forEach((requirement) => {
    const major = programmeMajors.find((item) => item.nameEn === requirement.majorName);
    if (!major) return;
    const supplementCourses = requirement.courses.map((course, index) => ({
      id: `${major.id}-HKUST-COMP-${index + 1}`,
      programmeId: programme.id,
      majorId: major.id,
      courseCode: course.code,
      titleEn: course.title,
      titleZh: course.title,
      credits: course.credits,
      recommendedYear: 0,
      semester: '',
      courseType: getHkustCourseType(course.groups),
      requirementGroups: course.groups,
      sourceUrl: requirement.pdfUrl,
      officialUrl: requirement.catalogUrl,
      sourceProvider: requirements.provider,
      academicYear: requirements.academicYear
    }));
    courses.push(...supplementCourses);
    major.courseCount = supplementCourses.length;
    major.codedCourseCount = supplementCourses.length;
    major.officialUrl = requirement.catalogUrl;
  });

  const programmeCourseCount = programmeMajors.reduce((sum, major) => sum + (major.codedCourseCount || 0), 0);
  if (programmeCourseCount) {
    programme.sourceStatus = 'course_codes_available';
    programme.courseCount = programmeCourseCount;
    programme.codedCourseCount = programmeCourseCount;
    programme.courseSourceUrl = requirements.programmes[0]?.pdfUrl || programme.officialUrl;
  }
}

function getPrimaryCourseCode(courseCode) {
  return String(courseCode || '').split('/')[0].trim();
}

function getCoursePrefix(courseCode) {
  return getPrimaryCourseCode(courseCode).match(/^[A-Z]+/)?.[0] || '';
}

function addCuhkCseSupplements(programmes, majors, courses) {
  const source = JSON.parse(fs.readFileSync(CUHK_CSE_COURSES_PATH, 'utf8'));
  CUHK_CSE_PROGRAMME_COURSE_PREFIXES.forEach((mapping) => {
    const programme = programmes.find((item) => (
      item.universityCode === 'CUHK'
      && item.nameEn === mapping.programmeName
    ));
    if (!programme) return;
    const major = majors.find((item) => item.programmeId === programme.id && item.nameEn === mapping.majorName);
    if (!major) return;

    const allowedPrefixes = new Set(mapping.prefixes);
    const supplementCourses = source.courses
      .filter((course) => allowedPrefixes.has(getCoursePrefix(course.code)))
      .map((course, index) => ({
        id: `${major.id}-CUHK-CSE-${index + 1}`,
        programmeId: programme.id,
        majorId: major.id,
        courseCode: course.code,
        titleEn: course.title,
        titleZh: course.title,
        credits: course.units,
        recommendedYear: Number(String(getPrimaryCourseCode(course.code)).match(/\d/)?.[0] || 0),
        semester: '',
        courseType: getCoursePrefix(course.code) === 'ENGG' ? 'foundation' : 'programme_course',
        sourceUrl: course.sourceUrl || source.sourceUrl,
        officialUrl: source.sourceUrl,
        sourceProvider: source.provider,
        academicYear: source.academicYear
      }));
    courses.push(...supplementCourses);
    major.courseCount = supplementCourses.length;
    major.codedCourseCount = supplementCourses.length;
    major.officialUrl = source.sourceUrl;
    programme.sourceStatus = 'course_codes_available';
    programme.courseCount = supplementCourses.length;
    programme.codedCourseCount = supplementCourses.length;
    programme.courseSourceUrl = source.sourceUrl;
  });
}

function getCityuCourseType(group = '') {
  if (group.includes('core')) return 'core';
  if (group.includes('capstone') || group.includes('project')) return 'capstone';
  if (group.includes('internship')) return 'internship';
  if (group.includes('supporting') || group.includes('college') || group.includes('gateway')) return 'foundation';
  return 'major_elective';
}

function getCityuRecommendedYear(level = '') {
  return Number(String(level || '').match(/\d/)?.[0] || 0);
}

function getCourseTypeFromGroup(group = '') {
  group = String(group || '').toLowerCase();
  if (group.includes('capstone') || group.includes('project')) return 'capstone';
  if (group.includes('core') || group.includes('required') || group.includes('compulsory') || group.includes('elementary') || group.includes('intermediate')) return 'core';
  if (group.includes('supporting') || group.includes('college') || group.includes('gateway')) return 'foundation';
  if (group.includes('internship')) return 'internship';
  return 'major_elective';
}

function normalizeComparableText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesText(value, expected) {
  if (!expected) return true;
  return normalizeComparableText(value) === normalizeComparableText(expected);
}

function includesText(value, expected) {
  if (!expected) return true;
  return normalizeComparableText(value).includes(normalizeComparableText(expected));
}

function getSupplementFiles(dir = UG_COURSE_SUPPLEMENTS_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => path.join(dir, fileName));
}

function loadGenericCourseSupplements(dir = UG_COURSE_SUPPLEMENTS_DIR) {
  return getSupplementFiles(dir).flatMap((filePath) => {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const supplements = Array.isArray(raw) ? raw : raw.supplements || [];
    return supplements.map((supplement) => ({
      provider: supplement.provider || raw.provider || path.basename(filePath),
      academicYear: supplement.academicYear || raw.academicYear || raw.curriculumYear || '',
      sourceUrl: supplement.sourceUrl || raw.sourceUrl || '',
      officialUrl: supplement.officialUrl || raw.officialUrl || supplement.sourceUrl || raw.sourceUrl || '',
      ...supplement
    }));
  });
}

function findSupplementProgramme(catalogue, supplement) {
  return catalogue.programmes.find((programme) => {
    if (supplement.universityCode && programme.universityCode !== supplement.universityCode) return false;
    if (supplement.programmeId && programme.id !== supplement.programmeId) return false;
    if (supplement.programmeCode && programme.code !== supplement.programmeCode) return false;
    if (supplement.jupasCode && programme.jupasCode !== supplement.jupasCode) return false;
    if (supplement.programmeName && !matchesText(programme.nameEn, supplement.programmeName)) return false;
    if (supplement.programmeNameIncludes && !includesText(programme.nameEn, supplement.programmeNameIncludes)) return false;
    return true;
  });
}

function findSupplementMajors(catalogue, programme, supplement) {
  const programmeMajors = catalogue.majors.filter((major) => major.programmeId === programme.id);
  if (supplement.majorId) return programmeMajors.filter((major) => major.id === supplement.majorId);
  if (supplement.majorName) return programmeMajors.filter((major) => matchesText(major.nameEn, supplement.majorName));
  if (supplement.majorNameIncludes) return programmeMajors.filter((major) => includesText(major.nameEn, supplement.majorNameIncludes));
  return programmeMajors;
}

function buildGenericSupplementCourse({ course, courseIndex, major, programme, supplement }) {
  const code = String(course.code || course.courseCode || course.course_code || '').trim();
  const title = compactText(course.title || course.titleEn || course.courseTitle || course.course_title || '');
  return {
    id: `${major.id}-SUP-${slug(code || title || courseIndex + 1)}-${courseIndex + 1}`,
    programmeId: programme.id,
    majorId: major.id,
    courseCode: code,
    titleEn: title,
    titleZh: compactText(course.titleZh || title),
    credits: Number(course.credits || course.units || 0),
    recommendedYear: course.recommendedYear !== undefined
      ? Number(course.recommendedYear)
      : (course.year !== undefined ? Number(course.year) : 0),
    semester: course.semester || '',
    courseType: course.courseType || getCourseTypeFromGroup(String(course.group || course.category || '')),
    requirementGroups: [course.group || course.category || 'programme_course'].filter(Boolean),
    prerequisites: course.prerequisites || '',
    exclusions: course.exclusions || '',
    description: course.description || '',
    sourceUrl: course.sourceUrl || supplement.sourceUrl || programme.officialUrl,
    officialUrl: course.officialUrl || supplement.officialUrl || supplement.sourceUrl || programme.officialUrl,
    sourceProvider: supplement.provider,
    academicYear: course.academicYear || supplement.academicYear || programme.curriculumYear
  };
}

function getSupplementCourses(supplement, allSupplements) {
  if (Array.isArray(supplement.courses)) return supplement.courses;

  const copyFrom = supplement.copyCoursesFrom || {};
  if (!copyFrom || !Object.keys(copyFrom).length) return [];

  const template = allSupplements.find((candidate) => {
    if (candidate === supplement) return false;
    if (copyFrom.universityCode && candidate.universityCode !== copyFrom.universityCode) return false;
    if (copyFrom.programmeId && candidate.programmeId !== copyFrom.programmeId) return false;
    if (copyFrom.programmeCode && candidate.programmeCode !== copyFrom.programmeCode) return false;
    if (copyFrom.jupasCode && candidate.jupasCode !== copyFrom.jupasCode) return false;
    if (copyFrom.programmeName && !matchesText(candidate.programmeName || '', copyFrom.programmeName)) return false;
    if (copyFrom.majorName && !matchesText(candidate.majorName || '', copyFrom.majorName)) return false;
    return Array.isArray(candidate.courses);
  });

  return template ? template.courses.map((course) => ({ ...course })) : [];
}

function addGenericCourseSupplements(catalogue, supplements = loadGenericCourseSupplements()) {
  supplements.forEach((supplement) => {
    const programme = findSupplementProgramme(catalogue, supplement);
    if (!programme) return;
    const targetMajors = findSupplementMajors(catalogue, programme, supplement);
    if (!targetMajors.length) return;
    const courses = getSupplementCourses(supplement, supplements);

    targetMajors.forEach((major) => {
      const existingCodes = new Set(catalogue.courses
        .filter((course) => course.majorId === major.id)
        .map((course) => course.courseCode)
        .filter(Boolean));
      const supplementCourses = courses
        .map((course, courseIndex) => buildGenericSupplementCourse({
          course,
          courseIndex,
          major,
          programme,
          supplement
        }))
        .filter((course) => course.courseCode && !existingCodes.has(course.courseCode));

      supplementCourses.forEach((course) => existingCodes.add(course.courseCode));
      catalogue.courses.push(...supplementCourses);
      major.courseCount = (major.courseCount || 0) + supplementCourses.length;
      major.codedCourseCount = (major.codedCourseCount || 0) + supplementCourses.length;
      major.officialUrl = supplement.officialUrl || major.officialUrl;
    });

    const programmeMajors = catalogue.majors.filter((major) => major.programmeId === programme.id);
    const programmeCourseCount = programmeMajors.reduce((sum, major) => sum + (major.codedCourseCount || 0), 0);
    if (programmeCourseCount) {
      programme.sourceStatus = 'course_codes_available';
      programme.courseCount = programmeCourseCount;
      programme.codedCourseCount = programmeCourseCount;
      programme.courseSourceUrl = supplement.sourceUrl || supplement.officialUrl || programme.courseSourceUrl || programme.officialUrl;
    }
  });
}

function addCityuCsSupplements(programmes, majors, courses) {
  const source = JSON.parse(fs.readFileSync(CITYU_CS_COURSES_PATH, 'utf8'));
  source.programmes.forEach((requirement) => {
    const programme = programmes.find((item) => (
      item.universityCode === 'CITYU'
      && item.nameEn.includes(requirement.matchName)
    ));
    if (!programme) return;
    const programmeMajors = majors.filter((major) => major.programmeId === programme.id);
    if (!programmeMajors.length) return;

    programmeMajors.forEach((major) => {
      const supplementCourses = requirement.courses.map((course, index) => ({
        id: `${major.id}-CITYU-CS-${index + 1}`,
        programmeId: programme.id,
        majorId: major.id,
        courseCode: course.code,
        titleEn: course.title,
        titleZh: course.title,
        credits: course.credits,
        recommendedYear: getCityuRecommendedYear(course.level),
        semester: '',
        courseType: getCityuCourseType(course.group),
        requirementGroups: [course.group],
        sourceUrl: requirement.pdfUrl || requirement.officialUrl,
        officialUrl: requirement.officialUrl || source.catalogueUrl,
        sourceProvider: source.provider,
        academicYear: source.academicYear
      }));
      courses.push(...supplementCourses);
      major.courseCount = supplementCourses.length;
      major.codedCourseCount = supplementCourses.length;
      major.officialUrl = requirement.officialUrl;
    });

    const programmeCourseCount = programmeMajors.reduce((sum, major) => sum + (major.codedCourseCount || 0), 0);
    if (programmeCourseCount) {
      programme.sourceStatus = 'course_codes_available';
      programme.courseCount = programmeCourseCount;
      programme.codedCourseCount = programmeCourseCount;
      programme.courseSourceUrl = requirement.pdfUrl || requirement.officialUrl;
    }
  });
}

function addLingnanDataScienceSupplements(catalogue) {
  const source = JSON.parse(fs.readFileSync(LINGNAN_DATA_SCIENCE_COURSES_PATH, 'utf8'));
  const programme = catalogue.programmes.find((item) => (
    item.universityCode === 'LINGNAN'
    && item.jupasCode === source.programmeCode
  ));
  if (!programme) return;
  const programmeMajors = catalogue.majors.filter((major) => major.programmeId === programme.id);
  if (!programmeMajors.length) return;

  programmeMajors.forEach((major) => {
    const supplementCourses = source.courses.map((course, index) => ({
      id: `${major.id}-LINGNAN-DS-${index + 1}`,
      programmeId: programme.id,
      majorId: major.id,
      courseCode: course.code,
      titleEn: course.title,
      titleZh: course.title,
      credits: course.credits,
      recommendedYear: Number(String(getPrimaryCourseCode(course.code)).match(/\d/)?.[0] || 0),
      semester: '',
      courseType: getCourseTypeFromGroup(course.group),
      requirementGroups: [course.group],
      sourceUrl: course.sourceUrl || source.sourceUrl,
      officialUrl: source.programmeUrl || source.sourceUrl,
      sourceProvider: source.provider,
      academicYear: source.academicYear
    }));
    catalogue.courses.push(...supplementCourses);
    major.courseCount = supplementCourses.length;
    major.codedCourseCount = supplementCourses.length;
    major.officialUrl = source.programmeUrl || source.sourceUrl;
  });

  const programmeCourseCount = programmeMajors.reduce((sum, major) => sum + (major.codedCourseCount || 0), 0);
  programme.sourceStatus = 'course_codes_available';
  programme.courseCount = programmeCourseCount;
  programme.codedCourseCount = programmeCourseCount;
  programme.courseSourceUrl = source.sourceUrl;
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

    const programmeRecord = {
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
    };
    programmes.push(programmeRecord);

    const tracks = Array.isArray(programme.majors_or_tracks) && programme.majors_or_tracks.length
      ? programme.majors_or_tracks
      : [programme.programme_name];
    let programmeCodedCourseCount = 0;
    tracks.forEach((track, trackIndex) => {
      const majorId = `${programmeId}-M${trackIndex + 1}`;
      const trackCourses = programmeCourses.filter((course) => !course.track || course.track === track);
      const effectiveCourses = trackCourses.length ? trackCourses : programmeCourses;
      const codedCourses = mergeCodedCourses(effectiveCourses);
      programmeCodedCourseCount += codedCourses.length;
      majors.push({
        id: majorId,
        programmeId,
        code: slug(track) || `M${trackIndex + 1}`,
        nameEn: track,
        nameZh: track,
        courseCount: codedCourses.length || effectiveCourses.length,
        codedCourseCount: codedCourses.length,
        officialUrl: programme.official_url || programme.source_url || ''
      });
      codedCourses
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
    if (programmeCodedCourseCount) {
      programmeRecord.courseCount = programmeCodedCourseCount;
      programmeRecord.codedCourseCount = programmeCodedCourseCount;
    }
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
  if (source.code === 'HKUST') {
    addHkustComputerScienceSupplements(programmes, majors, courses);
  }
  if (source.code === 'CUHK') {
    addCuhkCseSupplements(programmes, majors, courses);
  }
  if (source.code === 'CITYU') {
    addCityuCsSupplements(programmes, majors, courses);
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
  const catalogue = {
    generatedFrom: 'programme_year_semester_courses_2026',
    generatedAt: new Date().toISOString(),
    universities: pieces.map((piece) => piece.university).concat(STATIC_UNIVERSITIES),
    faculties: pieces.flatMap((piece) => piece.faculties).concat(staticCatalogue.faculties),
    programmes: pieces.flatMap((piece) => piece.programmes).concat(staticCatalogue.programmes),
    majors: pieces.flatMap((piece) => piece.majors).concat(staticCatalogue.majors),
    courses: pieces.flatMap((piece) => piece.courses).concat(staticCatalogue.courses)
  };
  addLingnanDataScienceSupplements(catalogue);
  addGenericCourseSupplements(catalogue);
  return catalogue;
}

function getCourseShardName(universityCode) {
  return slug(universityCode).toLowerCase() || 'general';
}

function splitCourseShardEntries(groupedCourses) {
  return [...groupedCourses.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([universityCode, courses]) => {
      const shardName = getCourseShardName(universityCode);
      if (universityCode !== 'CITYU') {
        return [{ universityCode, shardName, courses }];
      }

      const midpoint = Math.ceil(courses.length / 2);
      return [
        { universityCode, shardName: `${shardName}-a`, courses: courses.slice(0, midpoint) },
        { universityCode, shardName: `${shardName}-b`, courses: courses.slice(midpoint) }
      ];
    });
}

function groupCoursesByUniversity(catalogue) {
  const programmeById = new Map(catalogue.programmes.map((programme) => [programme.id, programme]));
  const grouped = new Map();
  (catalogue.courses || []).forEach((course) => {
    const programme = programmeById.get(course.programmeId);
    const universityCode = programme?.universityCode || programme?.universityId || 'GENERAL';
    if (!grouped.has(universityCode)) grouped.set(universityCode, []);
    grouped.get(universityCode).push(course);
  });
  return grouped;
}

function writeCommonJsModule(filePath, value, header = '// Generated by npm run sync:ug-catalog. Do not edit manually.') {
  fs.writeFileSync(filePath, `${header}\nmodule.exports = ${JSON.stringify(value, null, 2)};\n`);
}

function writeCourseShards(catalogue) {
  const groupedCourses = groupCoursesByUniversity(catalogue);
  // CityU's course library has grown beyond the useful headroom of one WeChat
  // subpackage. Keep its public university key stable while placing its rows in
  // two independently loaded packages.
  fs.rmSync(path.join(SUBPACKAGES_DIR, 'ug-data-cityu'), { recursive: true, force: true });

  const shardEntries = splitCourseShardEntries(groupedCourses)
    .map(({ universityCode, shardName, courses }) => {
      const packageRoot = path.join(SUBPACKAGES_DIR, `ug-data-${shardName}`);
      const courseDataDir = path.join(packageRoot, 'ugCourseData');
      const loaderDir = path.join(packageRoot, 'pages', 'loader');
      fs.rmSync(courseDataDir, { recursive: true, force: true });
      fs.mkdirSync(courseDataDir, { recursive: true });
      fs.mkdirSync(loaderDir, { recursive: true });
      writeCommonJsModule(path.join(courseDataDir, `${shardName}.js`), courses);
      fs.writeFileSync(path.join(loaderDir, 'index.js'), 'Page({});\n');
      fs.writeFileSync(path.join(loaderDir, 'index.json'), '{"navigationBarTitleText":"课程数据"}\n');
      fs.writeFileSync(path.join(loaderDir, 'index.wxml'), '<view></view>\n');
      fs.writeFileSync(path.join(loaderDir, 'index.wxss'), '\n');
      return {
        universityCode,
        shardName,
        courseCount: courses.length
      };
    });

  const entriesByUniversity = new Map();
  shardEntries.forEach((entry) => {
    if (!entriesByUniversity.has(entry.universityCode)) entriesByUniversity.set(entry.universityCode, []);
    entriesByUniversity.get(entry.universityCode).push(entry);
  });
  const loaderLines = [...entriesByUniversity.entries()].map(([universityCode, entries]) => {
    const modules = entries.map((entry) => (
      `require('../subpackages/ug-data-${entry.shardName}/ugCourseData/${entry.shardName}')`
    ));
    return `  ${JSON.stringify(universityCode)}: () => [].concat(${modules.join(', ')}),`;
  });
  const counts = Object.fromEntries([...entriesByUniversity.entries()].map(([universityCode, entries]) => [
    universityCode,
    entries.reduce((sum, entry) => sum + entry.courseCount, 0)
  ]));
  fs.writeFileSync(COURSE_SHARDS_PATH, [
    '// Generated by npm run sync:ug-catalog. Do not edit manually.',
    'const loaders = {',
    ...loaderLines,
    '};',
    `const counts = ${JSON.stringify(counts, null, 2)};`,
    'const cache = {};',
    '',
    'function getCoursesByUniversityCode(universityCode) {',
    '  const key = String(universityCode || \'\').toUpperCase();',
    '  if (!loaders[key]) return [];',
    '  if (!cache[key]) cache[key] = loaders[key]();',
    '  return cache[key];',
    '}',
    '',
    'function listAllCourses() {',
    '  return Object.keys(loaders).flatMap((universityCode) => getCoursesByUniversityCode(universityCode));',
    '}',
    '',
    'function getCourseCount(universityCode) {',
    '  if (universityCode) return counts[String(universityCode || \'\').toUpperCase()] || 0;',
    '  return Object.values(counts).reduce((sum, count) => sum + count, 0);',
    '}',
    '',
    'module.exports = {',
    '  getCourseCount,',
    '  getCoursesByUniversityCode,',
    '  listAllCourses',
    '};',
    ''
  ].join('\n'));

  return {
    courseShardCounts: counts,
    codedCourseCount: Object.values(counts).reduce((sum, count) => sum + count, 0)
  };
}

function writeCatalogue(catalogue) {
  const { courseShardCounts, codedCourseCount } = writeCourseShards(catalogue);
  const catalogueIndex = {
    ...catalogue,
    courses: undefined,
    courseShardCounts,
    codedCourseCount
  };
  delete catalogueIndex.courses;
  fs.writeFileSync(OUTPUT_PATH, [
    '// Generated by npm run sync:ug-catalog. Do not edit manually.',
    'const courseShards = require(\'./ugCourseShards\');',
    `const catalogue = ${JSON.stringify(catalogueIndex, null, 2)};`,
    'Object.defineProperty(catalogue, \'courses\', {',
    '  enumerable: true,',
    '  get() {',
    '    return courseShards.listAllCourses();',
    '  }',
    '});',
    'module.exports = catalogue;',
    ''
  ].join('\n'));
}

function main() {
  const sourceDirIndex = process.argv.indexOf('--source-dir');
  const sourceDir = sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(process.argv[sourceDirIndex + 1]);
  const catalogue = buildCatalogue(sourceDir);
  writeCatalogue(catalogue);
  console.log(`Generated UG catalogue: ${catalogue.universities.length} universities, ${catalogue.programmes.length} programmes, ${catalogue.majors.length} majors/tracks, ${catalogue.courses.length} coded courses`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCatalogue,
  buildStaticCatalogue,
  addGenericCourseSupplements,
  groupCoursesByUniversity,
  splitCourseShardEntries,
  listCourses,
  loadGenericCourseSupplements,
  normalizeSource,
  STATIC_PROGRAMME_GROUPS,
  SOURCES,
  STATIC_UNIVERSITIES,
  validateSourceDir
};
