const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-med-2025.json');
const REGULATIONS_SOURCE = 'https://www4.hku.hk/pubunit/drcd/files/pgdr2025-26/Education/MEd.pdf';
const PROGRAMME_SOURCE = 'https://web.edu.hku.hk/programme/med/structure';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-education-edu&mode=1';
const FIELDS_SOURCE = 'https://web.edu.hku.hk/programme/med/fields-of-studies';

const TRACKS = {
  GENERALIST: 'HKU-TPG-031-GENERALIST',
  CHINESE_LANGUAGE: 'HKU-TPG-031-CHINESE-LANGUAGE-EDUCATION',
  COMPARATIVE_GLOBAL: 'HKU-TPG-031-COMPARATIVE-GLOBAL-STUDIES',
  CLIL: 'HKU-TPG-031-CONTENT-LANGUAGE-INTEGRATED-LEARNING',
  CURRICULUM_PEDAGOGY: 'HKU-TPG-031-CURRICULUM-PEDAGOGY',
  EARLY_CHILDHOOD: 'HKU-TPG-031-EARLY-CHILDHOOD-EDUCATION',
  ADMINISTRATION: 'HKU-TPG-031-EDUCATIONAL-ADMINISTRATION-MANAGEMENT',
  ENGLISH_LANGUAGE: 'HKU-TPG-031-ENGLISH-LANGUAGE-EDUCATION',
  GIFTED: 'HKU-TPG-031-GIFTED-EDUCATION-TALENT-DEVELOPMENT',
  GUIDANCE: 'HKU-TPG-031-GUIDANCE-COUNSELLING',
  HIGHER_EDUCATION: 'HKU-TPG-031-HIGHER-EDUCATION',
  MATHEMATICS: 'HKU-TPG-031-MATHEMATICS-EDUCATION',
  PSYCHOLOGICAL: 'HKU-TPG-031-PSYCHOLOGICAL-STUDIES-EDUCATION',
  SCIENCE: 'HKU-TPG-031-SCIENCE-EDUCATION',
  STEM: 'HKU-TPG-031-STEM-EDUCATION',
  CHINESE_SECOND_LANGUAGE: 'HKU-TPG-031-TEACHING-CHINESE-SECOND-LANGUAGE',
  CHINESE_INTERNATIONAL: 'HKU-TPG-031-CHINESE-LANGUAGE-LITERATURE-INTERNATIONAL',
  MATHEMATICS_INTERNATIONAL: 'HKU-TPG-031-MATHEMATICS-INTERNATIONAL-CONTEXT',
  SCIENCE_INTERNATIONAL: 'HKU-TPG-031-SCIENCE-INTERNATIONAL-CONTEXT'
};

const trackRows = [
  [TRACKS.GENERALIST, 'Generalist', 'Strand'],
  [TRACKS.CHINESE_LANGUAGE, 'Chinese Language Education', 'Specialism'],
  [TRACKS.COMPARATIVE_GLOBAL, 'Comparative and Global Studies in Education and Development', 'Specialism'],
  [TRACKS.CLIL, 'Content and Language Integrated Learning', 'Specialism'],
  [TRACKS.CURRICULUM_PEDAGOGY, 'Curriculum and Pedagogy', 'Specialism'],
  [TRACKS.EARLY_CHILDHOOD, 'Early Childhood Education', 'Specialism'],
  [TRACKS.ADMINISTRATION, 'Educational Administration and Management', 'Specialism'],
  [TRACKS.ENGLISH_LANGUAGE, 'English Language Education', 'Specialism'],
  [TRACKS.GIFTED, 'Gifted Education and Talent Development', 'Specialism'],
  [TRACKS.GUIDANCE, 'Guidance and Counselling', 'Specialism'],
  [TRACKS.HIGHER_EDUCATION, 'Higher Education', 'Specialism'],
  [TRACKS.MATHEMATICS, 'Mathematics Education', 'Specialism'],
  [TRACKS.PSYCHOLOGICAL, 'Psychological Studies in Education', 'Specialism'],
  [TRACKS.SCIENCE, 'Science Education', 'Specialism'],
  [TRACKS.STEM, 'STEM Education', 'Specialism'],
  [TRACKS.CHINESE_SECOND_LANGUAGE, 'Teaching Chinese as a Second Language', 'Specialism'],
  [TRACKS.CHINESE_INTERNATIONAL, 'Teaching Chinese Language and Literature in International Education', 'Specialism'],
  [TRACKS.MATHEMATICS_INTERNATIONAL, 'Teaching of Mathematics in an International Context', 'Specialism'],
  [TRACKS.SCIENCE_INTERNATIONAL, 'Teaching of Science in an International Context', 'Specialism']
];

const courseRows = [
  ['MEDD8001', 'Educational Issues and Research'],
  ['MEDD8008', 'Research Project'],
  ['MEDD8009', 'Professional Portfolio'],
  ['MEDD8853', 'The Chinese Language Curriculum and its School-Based Application [中國語文課程與校本課程的應用]'],
  ['MEDD8854', 'Assessment in Chinese Language Education [中國語文教育: 評估]'],
  ['MEDD8855', 'Psycholinguistic and the Chinese Language Learning Process [心理語言學及中國語文學習過程]'],
  ['MEDD8856', 'Chinese Reading Comprehension Instruction: Theories and Practices [中文閱讀理解教學理論與實踐]'],
  ['MEDD6095', 'Addressing the Global-Local Nexus in Education'],
  ['MEDD6097', 'Themes and Approaches in The Field of Comparative Education'],
  ['MEDD6098', 'Critical Issues in Educational Reform'],
  ['MEDD6099', 'Education for Sustainable Development'],
  ['MEDD8843', 'Textual Analysis I: Academic Literacies in Science and Mathematics'],
  ['MEDD8844', 'Textual Analysis II: Academic Literacies in the Social Sciences and Humanities'],
  ['MEDD8845', 'Principles and Practice: Bridging Pedagogy in Content and Language Integrated Learning'],
  ['MEDD8846', 'Principles and Practice: Course Design in Content and Language Integrated Learning'],
  ['MEDD6128', 'Curriculum Conceptions and Design'],
  ['MEDD6131', 'Comparative Perspectives on Curriculum'],
  ['MEDD8819', 'Linking Curriculum to Learning and Pedagogy'],
  ['MEDD8820', 'Curriculum Implementation: Issues and Challenges'],
  ['MEDD6141', 'Promoting Child Development in Early Childhood Education'],
  ['MEDD6142', 'Learning and Teaching in Early Childhood Education'],
  ['MEDD6143', 'Planning, Management, Evaluation and Leadership in Early Childhood Education'],
  ['MEDD6144', 'Contemporary Issues in Early Childhood Education'],
  ['MEDD6192', 'Educational Leadership and School Management'],
  ['MEDD6193', 'Concepts and Issues in School-Based Management'],
  ['MEDD6195', 'Administrative and Organisational Theory for Educational Institutions'],
  ['MEDD7100', 'Legal Aspects of Educational Administration'],
  ['MEDD6311', 'English Language Curriculum and Assessment'],
  ['MEDD6702', 'Language Awareness: Grammar and Lexis'],
  ['MEDD6703', 'Second Language Acquisition'],
  ['MEDD6709', 'An Introduction to Sociolinguistics'],
  ['MEDD7038', 'Counselling, Career Education and Talent Development in Schools'],
  ['MEDD8831', 'Nurturing Creativity: Theories and Practices'],
  ['MEDD8876', 'Psychology and Education of Gifted and Talented Individuals'],
  ['MEDD8877', 'Social and Emotional Needs of Gifted Individuals'],
  ['MEDD8878', 'Practicum in Gifted Education and Talent Development'],
  ['MEDD6248', 'Theories and Practices in Counselling and Group Guidance'],
  ['MEDD8601', 'Comprehensive Guidance and Positive Youth Development: A Whole-School Approach'],
  ['MEDD8602', 'Practicum in Counselling and Group Guidance'],
  ['MEDD8884', 'Career Counselling and Talent Development in Schools'],
  ['MEDD8678', 'Counselling Process, Ethics and Skills'],
  ['MEDD6344', 'Aims of Higher Education'],
  ['MEDD8917', 'Instructional Design in Higher Education'],
  ['MEDD8918', 'Contemporary Issues in Higher Education'],
  ['MEDD8919', 'Science and Higher Education Systems and Policy'],
  ['MEDD6387', 'Research into the Teaching and Learning of Mathematics'],
  ['MEDD6388', 'Curriculum Research and Development in Mathematics'],
  ['MEDD6389', 'The Philosophical, Social and Cultural Aspects of Mathematics Education'],
  ['MEDD6390', 'Innovation and Development of Instructional Design in Mathematics'],
  ['MEDD6441', 'Developmental Psychology for Educators'],
  ['MEDD6442', 'Cognition, Learning and Instruction'],
  ['MEDD6443', 'Student Development: Theory, Research and Practice'],
  ['MEDD6444', 'Effective Talk in the Classroom'],
  ['MEDD6467', 'Teaching and Learning in Science'],
  ['MEDD6469', 'Trends and Issues of Science Education'],
  ['MEDD8644', 'Assessment in Science Education'],
  ['MEDD8897', 'Science Curriculum: Concepts and Themes'],
  ['MEDD8862', 'Classroom Practice of STEM Education'],
  ['MEDD8859', 'Learning, Teaching and Assessment in STEM Education'],
  ['MEDD8860', 'Emerging Technologies in STEM Education'],
  ['MEDD8894', 'Design Thinking and Education'],
  ['MEDD8895', 'STEM across the Curriculum and the Society'],
  ['MEDD8896', 'Computational Thinking and Education'],
  ['MEDD6051', 'Teaching Chinese Language in International Contexts [對外漢語教學]'],
  ['MEDD6052', 'Chinese (L2) Assessment and Reporting [中文第二語言教學評估與報告]'],
  ['MEDD6054', 'Chinese (L2) School-Based Curriculum Design [中文第二語言校本課程設計]'],
  ['MEDD6055', 'Research and Teaching Practice in Second Language Classrooms [中文第二語言教學研究與實踐]'],
  ['MEDD7104', 'Integrating the IB Philosophy into Chinese Language Teaching [融合國際文憑課程理念的中國語言教學]'],
  ['MEDD8837', 'World Literature and New Textualities in International Chinese Education [國際中文教育中的世界文學與新興文本]'],
  ['MEDD8838', 'Teaching Language and Literature in International Chinese Education [國際中文教育: 語言和文學教學]'],
  ['MEDD8839', 'Literature and the Art of Performance [文學與表演藝術]'],
  ['MEDD8840', 'Theories of Pedagogy and Teaching Practice [教學法與教學實踐]'],
  ['MEDD8841', 'Integrating the IB Philosophy into Chinese Language and Literature Teaching [融合國際文憑課程理念的中國語言及文學教學]'],
  ['MEDD8851', 'Chinese L2 Pedagogy [中文(二語)教學法]'],
  ['MEDD8852', 'Chinese L2 Curriculum Design and Assessment [中文(二語)課程設計與評估]'],
  ['MEDD6381', 'Integrating IB Philosophy into the Teaching of Chinese Language, Mathematics and Science'],
  ['MEDD6382', 'Research and/or Mathematics Teaching Practice in Classrooms'],
  ['MEDD8806', 'Research and Science Teaching Practice in Classrooms'],
  ['MEDD8807', 'The Philosophical, Social and Cultural Aspects of Science Education'],
  ['MEDD8815', 'Introduction to Statistical Methods'],
  ['MEDD8886', 'Qualitative Methods: Research Design, Data Collection and Analysis'],
  ['MEDD8887', 'Narrative Analysis in Education'],
  ['MEDD8888', 'Methods for Evaluation Research in Education'],
  ['MEDD8892', 'Statistical Methods in Educational Research'],
  ['MEDD8898', 'Exploring Written Discourse in Education'],
  ['MEDD8899', 'Advanced Statistical Methods in Educational Research'],
  ['MEDD8900', 'Analysing Textual and Documentary Data in Qualitative Research'],
  ['MEDD8901', 'Conducting Mixed Methods Research and Action Research in Your Schools'],
  ['MEDD8907', 'Statistical Analyses for Advancing Educational Equity and Social Justice'],
  ['MEDD8908', 'Foundations of Qualitative Education Research: Concepts, Strategies and Methods'],
  ['MEDD8910', 'Introduction to Regression Analysis and Data Visualisation'],
  ['MEDD8921', 'Conducting Cross-Cultural Educational Research'],
  ['MEDD8922', 'Philosophical and Ethical Issues in Educational Research'],
  ['MEDD8923', 'Qualitative Literature Reviews: From Systematic to Scoping Reviews'],
  ['MEDD8924', 'Understanding Subjective Experience through Q Methodology and Narrative Inquiry'],
  ['MEDD8925', 'Analysing Textual and Documentary Data in Quantitative Research'],
  ['MEDD8926', 'Methods and Measurement in Comparative Research: Happiness, Well-Being, and Education'],
  ['MEDD8927', 'Introduction to Data and Text Analytics with Programming'],
  ['MEDD8932', 'Conducting Quantitative Research Using Secondary Data with R Software'],
  ['MEDD8933', 'Identifying Evidence-based Practices in School Settings: Experimental Research Method and Design'],
  ['MEDD8936', 'Case Study Research: Examining and Responding to Contemporary Educational Challenges'],
  ['MEDD6609', 'Digital Technology and Educational Leadership'],
  ['MEDD7102', 'Pedagogical Frameworks for Mathematics, Science and Related Subjects'],
  ['MEDD7117', 'Drama Appreciation and Teaching'],
  ['MEDD7124', 'Individual and Home Predictors of Students\u2019 Academic Achievement'],
  ['MEDD8666', 'Abnormal Psychology and Positive Psychology'],
  ['MEDD8669', 'Teacher and Classroom Predictors of Students\u2019 Academic Achievement'],
  ['MEDD8679', 'Counselling Assessment and Interventions'],
  ['MEDD8801', 'Classical Chinese Language and the Reading of Classical Texts'],
  ['MEDD8802', 'Sociology of Education: Classic and Contemporary Theories'],
  ['MEDD8817', 'The Learning Brain'],
  ['MEDD8826', 'Technology and Second Language Teaching and Learning'],
  ['MEDD8829', 'Effective Strategies for Learning and Teaching in Small Class Environment for Primary Education'],
  ['MEDD8833', 'Teaching Chinese Language and Literature in IB Language A Curriculum [國際文憑課程 (語言 A): 中國語言和文學教學]'],
  ['MEDD8834', 'World Literature and New Textualities in the IB Chinese A Curriculum [國際文憑中文課程的世界文學與新興文本]'],
  ['MEDD8835', 'Writing for Academic Success'],
  ['MEDD8836', 'Personal Growth of Teachers and Guidance Personnel'],
  ['MEDD8874', 'Issues in Contemporary Curriculum Development'],
  ['MEDD8881', 'Learning Design and Technology'],
  ['MEDD8889', 'Strategic Leadership in School Administration and Management for Career Advancement'],
  ['MEDD8890', 'Edu-preneurial Leadership in Continuing Professional Development for Career Advancement'],
  ['MEDD8893', 'Teaching Argumentative Discourse in Chinese Language: A Critical Discussion Perspective'],
  ['MEDD8903', 'Introduction to Educational and Psychological Measurement'],
  ['MEDD8904', 'Introduction to Factor Analysis and Structural Equation Modeling'],
  ['MEDD8909', 'Use of Assessment for Learning to Develop Critical Thinking of Secondary Students'],
  ['MEDD8913', 'Educational Leadership for Equity and Social Justice'],
  ['MEDD8914', 'Implementing STEM/STEAM-Rich Making: Opportunities and Challenges'],
  ['MEDD8915', 'Integrating IB Philosophy into the Teaching of Mathematics'],
  ['MEDD8916', 'Public Policy in Early Childhood and Primary Education'],
  ['MEDD8920', 'Classroom Research in General Studies and Liberal Education'],
  ['MEDD8928', 'Educational Change in a Global Era: Theories and Debates'],
  ['MEDD8931', 'People-centric Design for Education Using Simulation Technology'],
  ['MEDD8934', 'Artificial Intelligence and Language Education'],
  ['MEDD8935', 'Theories of Learning in STEM Education']
];

const requiredCodesByTrack = {
  [TRACKS.CHINESE_LANGUAGE]: ['MEDD8853', 'MEDD8854', 'MEDD8855', 'MEDD8856'],
  [TRACKS.COMPARATIVE_GLOBAL]: ['MEDD6095', 'MEDD6097', 'MEDD6098', 'MEDD6099'],
  [TRACKS.CLIL]: ['MEDD8843', 'MEDD8844', 'MEDD8845', 'MEDD8846'],
  [TRACKS.CURRICULUM_PEDAGOGY]: ['MEDD6128', 'MEDD6131', 'MEDD8819', 'MEDD8820'],
  [TRACKS.EARLY_CHILDHOOD]: ['MEDD6141', 'MEDD6142', 'MEDD6143', 'MEDD6144'],
  [TRACKS.ADMINISTRATION]: ['MEDD6192', 'MEDD6193', 'MEDD6195', 'MEDD7100'],
  [TRACKS.ENGLISH_LANGUAGE]: ['MEDD6311', 'MEDD6702', 'MEDD6703', 'MEDD6709'],
  [TRACKS.GIFTED]: ['MEDD7038', 'MEDD8831', 'MEDD8876', 'MEDD8877', 'MEDD8878'],
  [TRACKS.GUIDANCE]: ['MEDD6248', 'MEDD8601', 'MEDD8602', 'MEDD8884', 'MEDD8678'],
  [TRACKS.HIGHER_EDUCATION]: ['MEDD6344', 'MEDD8917', 'MEDD8918', 'MEDD8919'],
  [TRACKS.MATHEMATICS]: ['MEDD6387', 'MEDD6388', 'MEDD6389', 'MEDD6390'],
  [TRACKS.PSYCHOLOGICAL]: ['MEDD6441', 'MEDD6442', 'MEDD6443', 'MEDD6444'],
  [TRACKS.SCIENCE]: ['MEDD6467', 'MEDD6469', 'MEDD8644', 'MEDD8897', 'MEDD8862'],
  [TRACKS.STEM]: ['MEDD8859', 'MEDD8860', 'MEDD8894', 'MEDD8895', 'MEDD8896'],
  [TRACKS.CHINESE_SECOND_LANGUAGE]: ['MEDD6051', 'MEDD6052', 'MEDD6054', 'MEDD6055', 'MEDD7104'],
  [TRACKS.CHINESE_INTERNATIONAL]: ['MEDD8837', 'MEDD8838', 'MEDD8839', 'MEDD8840', 'MEDD8841', 'MEDD8851', 'MEDD8852'],
  [TRACKS.MATHEMATICS_INTERNATIONAL]: ['MEDD6381', 'MEDD6382', 'MEDD6387', 'MEDD6389'],
  [TRACKS.SCIENCE_INTERNATIONAL]: ['MEDD6381', 'MEDD6467', 'MEDD8806', 'MEDD8807']
};

const specialistElectiveCodesByTrack = {
  [TRACKS.MATHEMATICS_INTERNATIONAL]: ['MEDD6388', 'MEDD6390'],
  [TRACKS.SCIENCE_INTERNATIONAL]: ['MEDD6469', 'MEDD8897']
};

const advancedResearchMethodCodes = [
  'MEDD8815', 'MEDD8886', 'MEDD8887', 'MEDD8888', 'MEDD8892', 'MEDD8898',
  'MEDD8899', 'MEDD8900', 'MEDD8901', 'MEDD8907', 'MEDD8908', 'MEDD8910',
  'MEDD8921', 'MEDD8922', 'MEDD8923', 'MEDD8924', 'MEDD8925', 'MEDD8926',
  'MEDD8927', 'MEDD8932', 'MEDD8933', 'MEDD8936'
];

const generalElectiveCodes = [
  ...advancedResearchMethodCodes,
  'MEDD6248', 'MEDD6609', 'MEDD7102', 'MEDD7117', 'MEDD7124', 'MEDD8666',
  'MEDD8669', 'MEDD8678', 'MEDD8679', 'MEDD8801', 'MEDD8802', 'MEDD8817',
  'MEDD8826', 'MEDD8829', 'MEDD8831', 'MEDD8833', 'MEDD8834', 'MEDD8835',
  'MEDD8836', 'MEDD8860', 'MEDD8874', 'MEDD8876', 'MEDD8877', 'MEDD8881',
  'MEDD8884', 'MEDD8889',
  'MEDD8890', 'MEDD8893', 'MEDD8903', 'MEDD8904', 'MEDD8909', 'MEDD8913',
  'MEDD8914', 'MEDD8915', 'MEDD8916', 'MEDD8920', 'MEDD8928', 'MEDD8931',
  'MEDD8934', 'MEDD8935'
];

function buildCoursePool() {
  const titleByCode = new Map(courseRows);
  const rolesByCode = new Map(courseRows.map(([code]) => [code, {
    requiredForTrackIds: new Set(),
    countsTowardTrackIds: new Set(),
    subjectGroups: new Set()
  }]));

  Object.entries(requiredCodesByTrack).forEach(([trackId, codes]) => {
    codes.forEach((code) => {
      assert(titleByCode.has(code), `Unknown required course ${code}`);
      rolesByCode.get(code).requiredForTrackIds.add(trackId);
      rolesByCode.get(code).countsTowardTrackIds.add(trackId);
    });
  });
  Object.entries(specialistElectiveCodesByTrack).forEach(([trackId, codes]) => {
    codes.forEach((code) => {
      assert(titleByCode.has(code), `Unknown specialist elective ${code}`);
      rolesByCode.get(code).countsTowardTrackIds.add(trackId);
    });
  });
  generalElectiveCodes.forEach((code) => rolesByCode.get(code).subjectGroups.add('General Elective'));
  advancedResearchMethodCodes.forEach((code) => rolesByCode.get(code).subjectGroups.add('Advanced Research Methods'));

  return courseRows.filter(([code]) => !['MEDD8001', 'MEDD8008', 'MEDD8009'].includes(code)).map(([code, name]) => {
    const roles = rolesByCode.get(code);
    const isGeneralElective = generalElectiveCodes.includes(code);
    const course = {
      code,
      name,
      credits: 6,
      appliesToTrackIds: isGeneralElective ? [] : [...roles.countsTowardTrackIds]
    };
    if (roles.requiredForTrackIds.size) course.requiredForTrackIds = [...roles.requiredForTrackIds];
    if (roles.countsTowardTrackIds.size) course.countsTowardTrackIds = [...roles.countsTowardTrackIds];
    if (roles.subjectGroups.size) course.subjectGroups = [...roles.subjectGroups];
    const prerequisiteCodes = {
      MEDD8878: ['MEDD8876'],
      MEDD8602: ['MEDD6248', 'MEDD8678'],
      MEDD8892: ['MEDD8815'],
      MEDD8903: ['MEDD8815'],
      MEDD8904: ['MEDD8815']
    }[code];
    if (prerequisiteCodes) course.prerequisiteCodes = prerequisiteCodes;
    if (code === 'MEDD8874') course.impermissibleWithCodes = ['MEDD6128', 'MEDD6131', 'MEDD8819', 'MEDD8820'];
    if (code === 'MEDD8889') course.excludesTrackIds = [TRACKS.ADMINISTRATION];
    if (code === 'MEDD8890') course.prerequisiteNote = 'MEDD8889 is required except for students specialising in Educational Administration and Management.';
    return course;
  });
}

function requirementOverrides(trackIds, defaultValue, exceptionalValues = {}) {
  return Object.fromEntries(trackIds.map((trackId) => [trackId, exceptionalValues[trackId] ?? defaultValue]));
}

function buildSupplement() {
  const coursePool = buildCoursePool();
  const specialistTrackIds = trackRows.map(([trackId]) => trackId).filter((trackId) => trackId !== TRACKS.GENERALIST);
  const specialistElectiveTrackIds = specialistTrackIds.filter((trackId) => trackId !== TRACKS.CHINESE_INTERNATIONAL);
  const specialistCreditOverrides = requirementOverrides(specialistTrackIds, 24, {
    [TRACKS.GIFTED]: 30,
    [TRACKS.GUIDANCE]: 30,
    [TRACKS.SCIENCE]: 30,
    [TRACKS.STEM]: 30,
    [TRACKS.CHINESE_SECOND_LANGUAGE]: 30,
    [TRACKS.CHINESE_INTERNATIONAL]: 42
  });
  const specialistCourseOverrides = Object.fromEntries(Object.entries(specialistCreditOverrides).map(([trackId, credits]) => [trackId, credits / 6]));
  const electiveCreditOverrides = requirementOverrides(specialistElectiveTrackIds, 18, {
    [TRACKS.GIFTED]: 12,
    [TRACKS.GUIDANCE]: 12,
    [TRACKS.SCIENCE]: 12,
    [TRACKS.STEM]: 12,
    [TRACKS.CHINESE_SECOND_LANGUAGE]: 12
  });
  const electiveCourseOverrides = Object.fromEntries(Object.entries(electiveCreditOverrides).map(([trackId, credits]) => [trackId, credits / 6]));

  assert.equal(trackRows.length, 19);
  assert.equal(courseRows.length, 134);
  assert.equal(new Set(courseRows.map(([code]) => code)).size, 134);
  assert.equal(generalElectiveCodes.length, 62);
  assert.equal(new Set(generalElectiveCodes).size, 62);
  assert.equal(advancedResearchMethodCodes.length, 22);
  assert.equal(coursePool.length, 131);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-031',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      trackSelectionOptional: false,
      tracks: trackRows.map(([id, name, type]) => ({ id, name, type, creditsRequired: 60, sourceUrl: REGULATIONS_SOURCE })),
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete 60-credit MEd curriculum, 134 unique course codes, the Generalist Strand and 18 Specialist Strand specialisms. Every path includes MEDD8001 (6 credits), 42 credits of specialist and/or elective courses, and a 12-credit capstone. The Specialist paths differ: five specialisms require a named fifth Specialist Elective plus two General Electives, Teaching Chinese Language and Literature in International Education requires three Specialist Electives and MEDD8009 only, and the two International Context specialisms require at least one of two named Specialist Electives. MEDD8008 also requires an Advanced Research Methods elective. The current 2026 Fields of Studies page lists 15 offered specialisms and omits Gifted Education and Talent Development, Mathematics Education, and Teaching of Mathematics in an International Context; the Syllabuses state that not all specialisms or courses are offered every year. Annual availability, cross-role courses, prerequisites, impermissible combinations and these path conditions require manual audit review.',
      courseGroups: [
        {
          id: 'compulsory-core-course',
          name: 'Compulsory Core Course',
          type: 'core',
          creditsRequired: 6,
          coursesRequired: 1,
          ruleText: 'Complete MEDD8001 Educational Issues and Research for 6 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [{ code: 'MEDD8001', name: 'Educational Issues and Research', credits: 6, appliesToTrackIds: [] }]
        },
        {
          id: 'specialist-course-requirement',
          name: 'Specialist Course Requirement',
          type: 'track_core_requirement',
          creditsRequired: 24,
          coursesRequired: 4,
          creditsRequiredByTrackIds: specialistCreditOverrides,
          coursesRequiredByTrackIds: specialistCourseOverrides,
          ruleText: 'Generalist students have no Specialist Course requirement. Most specialisms require four named Specialist Courses. Gifted Education and Talent Development, Guidance and Counselling, Science Education, STEM Education, and Teaching Chinese as a Second Language also require one named Specialist Elective. Teaching Chinese Language and Literature in International Education requires four Specialist Courses plus all three named Specialist Electives. Required course roles are identified by requiredForTrackIds in the course pool.',
          appliesToTrackIds: specialistTrackIds,
          sourceUrl: REGULATIONS_SOURCE,
          courses: []
        },
        {
          id: 'generalist-elective-course-requirement',
          name: 'Generalist Elective Requirement',
          type: 'elective_requirement',
          creditsRequired: 42,
          coursesRequired: 7,
          ruleText: 'Generalist Strand students complete seven General Elective Courses for 42 credits.',
          appliesToTrackIds: [TRACKS.GENERALIST],
          sourceUrl: REGULATIONS_SOURCE,
          courses: []
        },
        {
          id: 'elective-course-requirement',
          name: 'Specialist Strand Elective Requirement',
          type: 'elective_requirement',
          creditsRequired: 18,
          coursesRequired: 3,
          creditsRequiredByTrackIds: electiveCreditOverrides,
          coursesRequiredByTrackIds: electiveCourseOverrides,
          ruleText: 'Generalist students complete seven General Electives. Most Specialist students complete three General or Specialist Electives. Five named specialisms complete two General Electives after their fifth required Specialist Elective. Teaching Chinese Language and Literature in International Education has no General Elective requirement. The two International Context specialisms complete three electives including at least one of their two named Specialist Electives.',
          appliesToTrackIds: specialistElectiveTrackIds,
          sourceUrl: REGULATIONS_SOURCE,
          courses: []
        },
        {
          id: 'specialist-general-elective-course-pool',
          name: 'Specialist and General Elective Course Pool',
          type: 'track_core_elective',
          creditsRequired: null,
          coursesRequired: null,
          ruleText: 'The pool stores every unique 6-credit Specialist and General Elective course once. Track-specific roles are recorded in requiredForTrackIds and countsTowardTrackIds. The 22 courses tagged Advanced Research Methods satisfy the additional method-course condition for the MEDD8008 Research Project path. Not all specialisms or courses are offered every year.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coursePool
        },
        {
          id: 'capstone-course',
          name: 'Capstone Course',
          type: 'project_or_portfolio',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete either MEDD8008 Research Project or MEDD8009 Professional Portfolio for 12 credits. MEDD8008 requires at least one Advanced Research Methods elective. Teaching Chinese Language and Literature in International Education students must complete MEDD8009 and cannot choose MEDD8008.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [
            { code: 'MEDD8008', name: 'Research Project', credits: 12, courseKind: 'research_project', conditionalRequirement: true, excludesTrackIds: [TRACKS.CHINESE_INTERNATIONAL], appliesToTrackIds: [] },
            { code: 'MEDD8009', name: 'Professional Portfolio', credits: 12, courseKind: 'portfolio', conditionalRequirement: true, appliesToTrackIds: [] }
          ]
        }
      ],
      additionalSources: [PROGRAMME_SOURCE, ADMISSIONS_SOURCE, FIELDS_SOURCE]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT), programmes: 1, tracks: trackRows.length, courses: courseRows.length }));
}

if (require.main === module) main();
module.exports = {
  buildSupplement,
  buildCoursePool,
  TRACKS,
  trackRows,
  courseRows,
  generalElectiveCodes,
  advancedResearchMethodCodes
};
