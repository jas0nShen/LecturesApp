const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-language-science-2027.json');
const VERIFIED_AT = '2026-07-15';

const programmeSources = {
  'POLYU-TPG-037': 'https://www.polyu.edu.hk/study/pg/tpg/2027/72017-clf-clp',
  'POLYU-TPG-038': 'https://www.polyu.edu.hk/study/pg/tpg/2027/72017-llf-llp-pdp'
};

const curriculumSources = {
  'POLYU-TPG-037': 'https://www.polyu.edu.hk/lst/study/taught-postgraduate-programmes/ma-scheme-in-chinese-linguistics-and-translation/chinese-linguistics/curriculum/',
  'POLYU-TPG-038': 'https://www.polyu.edu.hk/lst/study/taught-postgraduate-programmes/ma-scheme-in-chinese-linguistics-and-translation/chinese-language-and-literature/curriculum/'
};

const catalogue = {
  CBS500: ['Semantics and Pragmatics', 3],
  CBS5020: ['Special Education Needs in Speaking, Listening, Reading and Writing', 3],
  CBS5021: ['Special Education Needs Associated with Cognitive, Physical and Sensory Disorders', 3],
  CBS503: ['Language in Society', 3],
  CBS505B: ['Research Methods in Language Teaching and Language Studies', 3],
  CBS506: ['Introduction to Educational Linguistics', 3],
  CBS509: ['Sign Language and Linguistics', 3],
  CBS512: ['Introduction to Chinese Language Testing', 3],
  CBS514: ['Introduction to Cantonese Studies', 3],
  CBS516: ['Contrastive Analysis', 3],
  CBS527: ['Chinese Language Education in Primary and Secondary Schools', 3],
  CBS528B: ['The Development and Implementation of School-Based Chinese Language Curriculum in Hong Kong', 3],
  CBS529: ['Chinese Lexical Semantics and Corpus Linguistics', 3],
  CBS530: ['Description of Chinese II: Sounds and Script', 3],
  CBS532: ['Description of Chinese I: Words and Sentences', 3],
  CBS533: ['Description of Chinese II: Sounds and Script', 3],
  CBS538: ['MACL Dissertation', 9],
  CBS539: ['Description of Chinese I: Words and Sentences', 3],
  CBS540: ['Fiction in the Ming and Qing Era', 3],
  CBS543: ['Selected Readings of the Eight Writers of the Tang and Song Era', 3],
  CBS544: ['Poetry of the Tang and Song Era', 3],
  CBS545: ['Selected Readings of Vernacular Fiction', 3],
  CBS546: ['Hong Kong Literature', 3],
  CBS548: ['Contemporary Chinese Society through Literature', 3],
  CBS549: ['Teaching the Uses of Media for Teaching Chinese to Foreigners', 3],
  CBS552: ['Literary Theory and Modern Chinese Literature', 3],
  CBS553: ['Readings of Classical Literature', 3],
  CBS554: ['Introduction to Chinese Culture and Classics', 3],
  CBS559: ['Supervised International Chinese Teaching Internship II', 9],
  CBS561: ['Translation: Text and Context', 3],
  CBS562: ['Interpreting: Principles', 3],
  CBS564: ['Translation: Discourse and the Translator', 3],
  CBS565: ['Interpreting: Consecutive', 3],
  CBS566: ['Translation Studies', 3],
  CBS568: ['Advanced Translation', 3],
  CBS572B: ['Methodology of Teaching Chinese as a Second Language I', 3],
  CBS574: ['Second Language Acquisition and Foreign Language Learning', 3],
  CBS576: ['MATCFL Dissertation', 9],
  CBS5801: ['Teaching of Chinese: Reading and Writing', 3],
  CBS5802: ['Teaching of Chinese in International Schools', 3],
  CBS581: ['Teaching Chinese Grammar to Non-native Speakers', 3],
  CBS582: ['Advanced Legal Translation', 3],
  CBS583: ['Advanced Translation for Media', 3],
  CBS584: ['Advanced Translation for Business and Commerce', 3],
  CBS586: ['Teaching of Chinese Characters and Words to Non-native Learners', 3],
  CBS588: ['Teaching of Chinese: Listening and Speaking', 3],
  CBS590: ['Multimedia Applications for Language Professionals and Translators', 3],
  CBS591: ['Intercultural Communication', 3],
  CBS592: ['Psycholinguistics', 3],
  CBS593: ['MACLL Dissertation', 9],
  CBS595: ['Supervised Local Internship in Teaching Chinese as a Foreign Language', 3],
  CBS596: ['Neurolinguistics', 3],
  CBS597: ['Advanced Liaison Interpreting', 3],
  CBS598: ['Experimental Phonetics', 3],
  CBS599: ['Statistical Methods in Language Research', 3],
  CBS5T01: ['Professional Ethics and Academic Integrity', 1],
  CBS5401: ['Corporate Communication: Past and Present', 3],
  CBS5402: ['Communication in Multicultural & Multilingual Contexts', 3],
  CBS5403: ['Bilingualism: First Principles', 3],
  CBS5404: ['Strategic Corporate Communication', 3],
  CBS5405: ['Advanced Bilingual Workshop for Verbal and Non-verbal Corporate Communication', 3],
  CBS5406: ['Advanced Bilingual Workshop for Written Corporate Communication', 3],
  CBS5407: ['Symbolism & Corporate Communication', 3],
  CBS5408: ['Professional seminar: Practices & Challenges', 3],
  CBS5409: ['MABCC Internship', 3],
  CBS5410: ['MABCC Supervised Project', 9],
  CBS5411: ['Glocalization and Media Communication', 3],
  CBS5412: ['Crisis Communication and Management', 3],
  CBS5413: ['Digital Media Communication', 3],
  CBS5501: ['Computer Programming in Language and Communication', 3],
  CBS5502: ['Computational Linguistics and NLP Technologies', 3],
  CBS5503: ['Bilingual Communication and Language Technology in Chinese Context', 3],
  CBS5504: ['AI-Driven Cross-Cultural Linguistic Exploration: Preserving, Translating, and Interpreting Chinese and Bilingual Heritage', 3],
  CBS5505: ['Generative AI for Innovative Communications', 3],
  CHC5204: ['Islam, Christianity and Chinese Culture', 3],
  CHC5302: ['Appreciation of Chinese Classical Rhymed Writings', 3],
  ENGL554: ['Drama for Language Learning', 3],
  LST541: ['Chinese Opera: Literary and Cultural Evolution', 3]
};

const specialCourseKinds = {
  CBS538: 'dissertation',
  CBS5409: 'internship',
  CBS5410: 'project',
  CBS559: 'internship',
  CBS576: 'dissertation',
  CBS593: 'dissertation',
  CBS595: 'internship'
};

function course(programmeId, code, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing LST course catalogue entry ${code}`);
  return {
    code,
    name: options.name || entry[0],
    credits: entry[1],
    appliesToTrackIds: [],
    sourceUrl: curriculumSources[programmeId],
    ...(specialCourseKinds[code] ? { courseKind: specialCourseKinds[code] } : {}),
    ...(options.conditionalRequirement ? { conditionalRequirement: true } : {})
  };
}

function group(programmeId, id, name, type, codes, options = {}) {
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: [],
    sourceUrl: curriculumSources[programmeId],
    courses: codes.map((code) => course(programmeId, code, {
      conditionalRequirement: (options.conditionalCodes || []).includes(code),
      name: (options.titleOverrides || {})[code]
    }))
  };
}

function academicIntegrityGroup(programmeId) {
  return group(programmeId, 'academic-integrity', 'Professional Ethics and Academic Integrity', 'academic_integrity', ['CBS5T01'], {
    creditsRequired: 1,
    coursesRequired: 1,
    ruleText: 'Complete CBS5T01 Professional Ethics and Academic Integrity for 1 credit.'
  });
}

function chineseDescriptionGroups(programmeId) {
  return [
    group(programmeId, 'description-of-chinese-i', 'Description of Chinese I', 'core', ['CBS532', 'CBS539'], {
      creditsRequired: 3,
      coursesRequired: 1,
      conditionalCodes: ['CBS532', 'CBS539'],
      ruleText: 'Complete either CBS532 or CBS539 for 3 credits; the two codes are mutually exclusive alternatives.'
    }),
    group(programmeId, 'description-of-chinese-ii', 'Description of Chinese II', 'core', ['CBS530', 'CBS533'], {
      creditsRequired: 3,
      coursesRequired: 1,
      conditionalCodes: ['CBS530', 'CBS533'],
      ruleText: 'Complete either CBS530 or CBS533 for 3 credits; the two codes are mutually exclusive alternatives.'
    })
  ];
}

function chineseLinguistics() {
  const programmeId = 'POLYU-TPG-037';
  return {
    programmeId,
    faculty: 'Department of Language Science and Technology (LST)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page publishes the 31-credit Chinese Linguistics structure and title pools, and the current Department of Language Science and Technology Curriculum page publishes matching codes and explicit credits for the complete 41-code pool. The Compulsory requirement contains two mutually exclusive code pairs, fixed CBS500 and CBS503, and CBS5T01. The remaining requirement is six Elective Subjects across the three published areas. CBS538 MACL Dissertation carries 9 credits, is conditional on compulsory-credit, GPA, concurrent-registration and Programme Leader approval requirements, and is not treated as an ordinary one-for-one Elective without manual review. The shared Elective quota and Dissertation equivalence therefore remain manual-review rules.',
    courseGroups: [
      ...chineseDescriptionGroups(programmeId),
      group(programmeId, 'fixed-compulsory-subjects', 'Fixed Compulsory Subjects', 'core', ['CBS500', 'CBS503'], {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'Complete CBS500 and CBS503 for 6 credits.'
      }),
      group(programmeId, 'language-sciences-electives', 'Language Sciences Elective Subjects', 'elective', ['CBS509', 'CBS514', 'CBS516', 'CBS529', 'CBS538', 'CBS574', 'CBS590', 'CBS592', 'CBS596', 'CBS598', 'CBS599'], {
        conditionalCodes: ['CBS538'],
        ruleText: 'These subjects contribute to the shared six-Elective requirement. CBS538 is a conditional 9-credit Dissertation subject.'
      }),
      group(programmeId, 'language-education-electives', 'Language Education Elective Subjects', 'elective', ['CBS5020', 'CBS5021', 'CBS505B', 'CBS506', 'CBS512', 'CBS527', 'CBS528B', 'CBS549', 'CBS5801', 'CBS5802', 'CBS581', 'CBS586', 'CBS588'], {
        ruleText: 'These subjects contribute to the shared six-Elective requirement.'
      }),
      group(programmeId, 'other-electives', 'Other Elective Subjects', 'elective', ['CBS5413', 'CBS544', 'CBS561', 'CBS562', 'CBS564', 'CBS565', 'CBS566', 'CBS568', 'CBS591', 'CBS597'], {
        ruleText: 'These subjects contribute to the shared six-Elective requirement.'
      }),
      academicIntegrityGroup(programmeId)
    ]
  };
}

function chineseLanguageAndLiterature() {
  const programmeId = 'POLYU-TPG-038';
  return {
    programmeId,
    programmeName: 'Chinese Language and Literature',
    faculty: 'Department of Language Science and Technology (LST)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page corrects the directory label to Chinese Language and Literature and distinguishes the 31-credit MA from the 22-credit PgD exit award. The current Department of Language Science and Technology Curriculum page publishes matching codes and credits for the complete 44-code MA pool. The MA requires the two mutually exclusive Chinese-description code pairs, CBS552, CBS553, CBS554 and CBS5T01, plus five Elective Subjects including at least one from the Chinese Language Block and one from the Chinese Literature Block. CBS593 MACLL Dissertation is a conditional 9-credit Elective with compulsory-credit, GPA, concurrent-registration and Programme Leader approval requirements. The shared five-Elective quota, Dissertation equivalence and cross-block minimums require manual audit review; the PgD is not modelled as an MA completion path.',
    courseGroups: [
      ...chineseDescriptionGroups(programmeId),
      group(programmeId, 'chinese-literature-compulsory', 'Chinese Literature Compulsory Subjects', 'core', ['CBS552', 'CBS553'], {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'Complete both 3-credit Chinese Literature Compulsory Subjects.'
      }),
      group(programmeId, 'chinese-culture-compulsory', 'Chinese Culture Compulsory Subject', 'core', ['CBS554'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete CBS554 for 3 credits.'
      }),
      group(programmeId, 'chinese-language-electives', 'Chinese Language Block Elective Subjects', 'elective', ['CBS500', 'CBS5020', 'CBS5021', 'CBS503', 'CBS505B', 'CBS506', 'CBS509', 'CBS512', 'CBS514', 'CBS516', 'CBS527', 'CBS528B', 'CBS529', 'CBS549', 'CBS574', 'CBS5801', 'CBS5802', 'CBS581', 'CBS586', 'CBS588', 'CBS590', 'CBS592', 'CBS596', 'CBS598', 'CBS599'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete at least one 3-credit Elective Subject from the Chinese Language Block; additional selections contribute to the shared five-Elective requirement.'
      }),
      group(programmeId, 'chinese-literature-electives', 'Chinese Literature Block Elective Subjects', 'elective', ['CBS540', 'CBS543', 'CBS544', 'CBS545', 'CBS546', 'CBS548', 'LST541'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete at least one 3-credit Elective Subject from the Chinese Literature Block; additional selections contribute to the shared five-Elective requirement.'
      }),
      group(programmeId, 'other-lst-electives', 'Other LST Elective Subjects', 'elective', ['CBS5413', 'CBS593'], {
        conditionalCodes: ['CBS593'],
        ruleText: 'These subjects contribute to the shared five-Elective requirement. CBS593 is a conditional 9-credit Dissertation subject.'
      }),
      group(programmeId, 'non-lst-electives', 'Non-LST Elective Subjects', 'elective', ['CHC5204', 'CHC5302'], {
        ruleText: 'These subjects contribute to the shared five-Elective requirement.'
      }),
      academicIntegrityGroup(programmeId)
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const expectations = {
    'POLYU-TPG-037': [/11 subjects \(31 credits\)/, /5 must be Compulsory Subjects/, /MACL Dissertation/, /Professional Ethics and Academic Integrity/],
    'POLYU-TPG-038': [/MACLL students are required to take 11 subjects \(31 credits\)/, /at least\s+1 Elective Subject from the Chinese Language Block/, /MACLL Dissertation/, /Professional Ethics and Academic Integrity/]
  };
  Object.entries(expectations).forEach(([programmeId, patterns]) => {
    const row = snapshot.rows.find((item) => item.programmeId === programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, programmeSources[programmeId]);
    patterns.forEach((pattern) => assert.match(row.curriculumText, pattern));
  });

  const programmes = [
    chineseLinguistics(),
    chineseLanguageAndLiterature()
  ];
  const expectedCourseCounts = [41, 44];
  programmes.forEach((programme, index) => {
    const codes = programme.courseGroups.flatMap((item) => item.courses.map((itemCourse) => itemCourse.code));
    assert.equal(codes.length, expectedCourseCounts[index]);
    assert.equal(new Set(codes).size, codes.length, `${programme.programmeId} has duplicate course codes`);
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: VERIFIED_AT,
    programmes
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((total, programme) => total + programme.courseGroups.reduce((groupTotal, item) => groupTotal + item.courses.length, 0), 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
