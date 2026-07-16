const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const supplementsDir = path.join(ROOT, 'data', 'tpg-course-supplements');
const VERIFIED_AT = '2026-07-16';
const HANDBOOK_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026';
const COURSE_ROOT = `${HANDBOOK_ROOT}/course`;
const MCM_URL = 'https://scm.hkbu.edu.hk/en/education/taught-postgraduate/MCM.html';

const SOURCES = {
  MHM: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-chinese-medicine/master-of-science-in-personal-health-management-chinese`,
  MDD: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-chinese-medicine/master-of-science-in-drug-discovery-modernization-of`,
  MPS: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-chinese-medicine/master-of-pharmaceutical-sciences-in-chinese-medicine`
};

const MCM_TRACKS = {
  ICM: 'HKBU-TPG-040-STUDIES-APPLICATIONS-INTERNAL-CHINESE-MEDICINE',
  ACU: 'HKBU-TPG-040-STUDIES-APPLICATIONS-ACUPUNCTURE',
  OT: 'HKBU-TPG-040-STUDIES-APPLICATIONS-ORTHOPAEDICS-TRAUMATOLOGY-TUI-NA'
};

function course(code, name, credits, options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: `${COURSE_ROOT}/${code}`,
    ...options
  };
}

function group(id, name, type, sourceUrl, courses, options = {}) {
  return {
    id,
    name,
    type,
    appliesToTrackIds: [],
    sourceUrl,
    courses,
    ...options
  };
}

function buildMhm() {
  const sourceUrl = SOURCES.MHM;
  return {
    programmeId: 'HKBU-TPG-037',
    programmeName: 'Master of Science (MSc) in Personal Health Management (Chinese Medicine) (MHM)',
    faculty: 'School of Chinese Medicine',
    status: 'verified',
    creditsRequired: 30,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    tracks: [],
    statusNote: 'The current September 2026 admissions page confirms the same 30-unit structure as the linked official 2025-26 Handbook. The Handbook publishes eleven Compulsory Courses for 27 units and a final 3-unit choice between MHM7180 Dissertation and MHM7170 Formulation Theories and Practices of Chinese Medicinal Formulae. Students without prior Chinese Medicine or Pharmacy in Chinese Medicine study must additionally complete the zero-unit MHM7200 supplementary course. The Dissertation/Elective alternative and background-dependent supplementary requirement require manual audit review.',
    courseGroups: [
      group('compulsory-courses', 'Compulsory Courses', 'core', sourceUrl, [
        course('MHM7010', 'Introduction of Personal Health Management', 3),
        course('MHM7050', 'Food Therapy in Chinese Medicine', 2),
        course('MHM7060', 'Exercises for Health Preservation in Chinese Medicine (Theory and Practice)', 2),
        course('MHM7070', 'Serial Lectures in Health Management', 2),
        course('MHM7080', 'Rehabilitative Nursing in Chinese Medicine', 2),
        course('MHM7090', 'Health Management of Common Urban Diseases', 3),
        course('MHM7100', 'Cosmetology in Chinese Medicine', 2),
        course('MHM7110', 'Overview on Public Health and Preventive Medicine', 2),
        course('MHM7120', 'Introduction of Nutriology', 2),
        course('MHM7150', 'Constitutional Theory of Chinese Medicine', 3),
        course('MHM7160', 'Practicum', 4, { courseKind: 'practicum' })
      ], {
        creditsRequired: 27,
        coursesRequired: 11,
        ruleText: 'Complete all eleven Compulsory Courses for 27 units.'
      }),
      group('dissertation-or-elective', 'Dissertation or Elective Course', 'dissertation_or_elective', sourceUrl, [
        course('MHM7180', 'Dissertation', 3, { courseKind: 'dissertation', conditionalRequirement: true }),
        course('MHM7170', 'Formulation Theories and Practices of Chinese Medicinal Formulae', 3, { conditionalRequirement: true })
      ], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete either MHM7180 Dissertation or MHM7170 Formulation Theories and Practices of Chinese Medicinal Formulae for 3 units.'
      }),
      group('background-supplementary-course', 'Background-dependent Supplementary Course', 'conditional_supplementary', sourceUrl, [
        course('MHM7200', 'Overview on Chinese Medicine and Chinese Materia Medica', 0, { conditionalRequirement: true })
      ], {
        ruleText: 'Students who have not previously studied Chinese Medicine or Pharmacy in Chinese Medicine must complete this additional zero-unit supplementary course.'
      })
    ]
  };
}

function buildMdd() {
  const sourceUrl = SOURCES.MDD;
  return {
    programmeId: 'HKBU-TPG-038',
    programmeName: 'Master of Science (MSc) in Drug Discovery (Modernization of Chinese Medicine) (MDD)',
    faculty: 'School of Chinese Medicine',
    status: 'verified',
    creditsRequired: 30,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    tracks: [],
    statusNote: 'The current September 2026 admissions page confirms the same 30-unit structure as the linked official 2025-26 Handbook. The Handbook publishes eight 3-unit taught Compulsory Courses plus the two consecutive 1.5-unit Practicum codes MDD7130 and MDD7140 for 27 units, followed by a 3-unit choice between MDD7100 Dissertation and MDD7110 Formulation Theories and Practices of Chinese Medicinal Formulae. Students without prior Chinese Medicine or Pharmacy in Chinese Medicine study must additionally complete zero-unit MDD7120. The Dissertation/Elective alternative, linked Practicum sequence and conditional supplementary course require manual audit review.',
    courseGroups: [
      group('compulsory-courses', 'Compulsory Courses', 'core', sourceUrl, [
        course('MDD7010', 'Artificial Intelligence and Drug Design', 3),
        course('MDD7020', 'Advances in Chinese Medicines Research', 3),
        course('MDD7030', 'Pharmaceutical Manufacture and Quality Control', 3),
        course('MDD7040', 'Medical Statistics and Clinical Trial Design', 3),
        course('MDD7050', 'Translational Medicine and Drug Discovery: Theory and Practice (Chinese Medicines)', 3),
        course('MDD7060', 'Mechanism of Action and Safe Application of Chinese Medicines', 3),
        course('MDD7070', 'Progress in Advanced Pharmacy and Pharmacokinetics', 3),
        course('MDD7080', 'Clinical Translational Strategy of Innovative Drugs', 3),
        course('MDD7130', 'Practicum', 1.5, { courseKind: 'practicum', linkedSequenceId: 'MDD713-PRACTICUM' }),
        course('MDD7140', 'Practicum', 1.5, { courseKind: 'practicum', linkedSequenceId: 'MDD713-PRACTICUM' })
      ], {
        creditsRequired: 27,
        coursesRequired: 10,
        ruleText: 'Complete all eight taught Compulsory Courses and both consecutive Practicum parts for 27 units.'
      }),
      group('dissertation-or-elective', 'Dissertation or Elective Course', 'dissertation_or_elective', sourceUrl, [
        course('MDD7100', 'Dissertation', 3, { courseKind: 'dissertation', conditionalRequirement: true }),
        course('MDD7110', 'Formulation Theories and Practices of Chinese Medicinal Formulae', 3, { conditionalRequirement: true })
      ], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete either MDD7100 Dissertation or MDD7110 Formulation Theories and Practices of Chinese Medicinal Formulae for 3 units.'
      }),
      group('background-supplementary-course', 'Background-dependent Supplementary Course', 'conditional_supplementary', sourceUrl, [
        course('MDD7120', 'Overview on Chinese Medicine and Chinese Materia Medica', 0, { conditionalRequirement: true })
      ], {
        ruleText: 'Students who have not previously studied Chinese Medicine or Pharmacy in Chinese Medicine must complete this additional zero-unit supplementary course.'
      })
    ]
  };
}

function buildMps() {
  const sourceUrl = SOURCES.MPS;
  return {
    programmeId: 'HKBU-TPG-039',
    programmeName: 'Master of Pharmaceutical Sciences in Chinese Medicine (MPS)',
    faculty: 'School of Chinese Medicine',
    status: 'verified',
    creditsRequired: 29,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    tracks: [],
    statusNote: 'The current September 2026 admissions page confirms the same 29-unit structure as the linked official 2025-26 Handbook. The Handbook publishes ten Required Course codes for 23 units, including the consecutive one-unit Laboratory Practice parts MPS7131 and MPS7132. Students then complete either the paired 3-unit Dissertation parts MPS7081 and MPS7082 or both 3-unit taught alternatives MPS7140 and MPS7150. Students without prior Chinese Medicine or Pharmacy in Chinese Medicine study additionally complete zero-unit MPS7520. The paired completion paths, linked laboratory sequence and background-dependent supplementary course require manual audit review.',
    courseGroups: [
      group('required-courses', 'Required Courses', 'core', sourceUrl, [
        course('MPS7010', 'Research Methodology and Practice in Chinese Medicine', 3),
        course('MPS7020', 'Utilization of Medicinal Plant Resources and Advanced Pharmacognosy', 3),
        course('MPS7030', 'Mechanism of Action and Safe Application of Chinese Medicines', 3),
        course('MPS7040', 'Methods and Techniques for Quality Control of Chinese Medicines', 2),
        course('MPS7070', 'Advances in Chinese Medicines Research', 3),
        course('MPS7100', 'Marketing and Management of Industry for Chinese Medicines', 2),
        course('MPS7110', 'Translational Medicine and Drug Discovery: Theory and Practice (Chinese Medicines)', 3),
        course('MPS7120', 'Advanced Pharmaceutics in Chinese Medicines', 2),
        course('MPS7131', 'Laboratory Practice in Chinese Medicines', 1, { courseKind: 'practicum', linkedSequenceId: 'MPS713-LABORATORY-PRACTICE' }),
        course('MPS7132', 'Laboratory Practice in Chinese Medicines', 1, { courseKind: 'practicum', linkedSequenceId: 'MPS713-LABORATORY-PRACTICE' })
      ], {
        creditsRequired: 23,
        coursesRequired: 10,
        ruleText: 'Complete all ten Required Course codes, including both Laboratory Practice parts, for 23 units.'
      }),
      group('dissertation-or-taught-pair', 'Dissertation or Taught-course Pair', 'dissertation_or_taught_option', sourceUrl, [
        course('MPS7081', 'Dissertation', 3, { courseKind: 'dissertation', conditionalRequirement: true, linkedSequenceId: 'MPS708-DISSERTATION' }),
        course('MPS7082', 'Dissertation', 3, { courseKind: 'dissertation', conditionalRequirement: true, linkedSequenceId: 'MPS708-DISSERTATION' }),
        course('MPS7140', 'Thinking Approach and Methodology of Chinese Medicine', 3, { conditionalRequirement: true, linkedSequenceId: 'MPS-TAUGHT-ALTERNATIVE' }),
        course('MPS7150', 'Formulation Theories and Practices of Chinese Medicinal Formulae', 3, { conditionalRequirement: true, linkedSequenceId: 'MPS-TAUGHT-ALTERNATIVE' })
      ], {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'Complete either both Dissertation parts MPS7081 and MPS7082 or both taught alternatives MPS7140 and MPS7150 for 6 units; mixed pairs are not valid.'
      }),
      group('background-supplementary-course', 'Background-dependent Supplementary Course', 'conditional_supplementary', sourceUrl, [
        course('MPS7520', 'Overview on Chinese Medicine and Chinese Materia Medica', 0, { conditionalRequirement: true })
      ], {
        ruleText: 'Students who have not previously studied Chinese Medicine or Pharmacy in Chinese Medicine must complete this additional zero-unit supplementary course.'
      })
    ]
  };
}

function mcmCourse(code, name, credits, options = {}) {
  const programmePageOnlyCodes = new Set(['MCM7370', 'MCM7380', 'MCM7390', 'MCM7400']);
  return course(code, name, credits, {
    sourceUrl: programmePageOnlyCodes.has(code) ? MCM_URL : `${COURSE_ROOT}/${code}`,
    ...options
  });
}

function buildMcm() {
  const trackRows = [
    [MCM_TRACKS.ICM, 'Studies and Applications of Internal Chinese Medicine'],
    [MCM_TRACKS.ACU, 'Studies and Applications of Acupuncture'],
    [MCM_TRACKS.OT, 'Studies and Applications of Orthopaedics, Traumatology and Tui Na']
  ];
  const allTrackIds = trackRows.map(([id]) => id);
  return {
    programmeId: 'HKBU-TPG-040',
    programmeName: 'Master of Chinese Medicine (MCM)',
    faculty: 'School of Chinese Medicine',
    status: 'verified',
    creditsRequired: 32,
    creditUnit: 'units',
    sourceUrl: MCM_URL,
    ruleReviewStatus: 'manual_review_required',
    trackSelectionOptional: false,
    tracks: trackRows.map(([id, name]) => ({
      id,
      name,
      type: 'Concentration',
      creditsRequired: 32,
      sourceUrl: MCM_URL,
      lastVerifiedAt: VERIFIED_AT
    })),
    statusNote: 'The current September 2026 admissions page confirms a 32-unit award with 11 Common units and 21 Concentration units, and requires one of three Concentrations. The current School of Chinese Medicine Programme page publishes 22 unique codes: four Common Courses for 11 units; four Track-specific courses for 15 units in each Concentration; a 6-unit completion choice between the paired Dissertation codes MCM7370/MCM7380 and any two of four published taught alternatives; and optional MCM7280, whose 2 units and grade do not count toward the award or cGPA. MCM7080 is shared by the Acupuncture and Orthopaedics/Traumatology/Tui Na Concentrations. The paired Dissertation route, any-two taught route, mandatory Concentration and non-award optional course require manual audit review.',
    courseGroups: [
      group('common-courses', 'Common Courses', 'core', MCM_URL, [
        mcmCourse('MCM7030', 'Thinking Approach and Methodology of Chinese Medicine', 3),
        mcmCourse('MCM7320', 'Clinical Applications of the Different Theories of Chinese Medicine', 2),
        mcmCourse('MCM7040', 'Research Methodology and Practice in Chinese Medicine', 3),
        mcmCourse('MCM7060', 'Formulation Theories and Practices of Chinese Medicinal Formulae', 3)
      ], {
        creditsRequired: 11,
        coursesRequired: 4,
        ruleText: 'Complete all four Common Courses for 11 units.'
      }),
      group('concentration-courses', 'Concentration Courses', 'track_core_requirement', MCM_URL, [
        mcmCourse('MCM7100', 'Theoretical and Clinical Studies on the Miscellaneous Diseases of Internal Medicine', 4, { appliesToTrackIds: [MCM_TRACKS.ICM] }),
        mcmCourse('MCM7330', 'Studies and Applications of the Theory of Zhong Jing', 3, { appliesToTrackIds: [MCM_TRACKS.ICM] }),
        mcmCourse('MCM7070', 'Studies and Applications of the Science of Seasonal Febrile Diseases', 3, { appliesToTrackIds: [MCM_TRACKS.ICM] }),
        mcmCourse('MCM7120', 'Clinical Practice—Studies and Applications of Internal Chinese Medicine', 5, { appliesToTrackIds: [MCM_TRACKS.ICM], courseKind: 'practicum' }),
        mcmCourse('MCM7130', 'Clinical Acupuncture—Advanced Level', 4, { appliesToTrackIds: [MCM_TRACKS.ACU] }),
        mcmCourse('MCM7340', 'Advances in Acupuncture Research', 3, { appliesToTrackIds: [MCM_TRACKS.ACU] }),
        mcmCourse('MCM7080', 'Examination and Diagnosis of Musculoskeletal Disorders', 3, { appliesToTrackIds: [MCM_TRACKS.ACU, MCM_TRACKS.OT] }),
        mcmCourse('MCM7150', 'Clinical Practice—Studies and Applications of Acupuncture', 5, { appliesToTrackIds: [MCM_TRACKS.ACU], courseKind: 'practicum' }),
        mcmCourse('MCM7350', 'Tui Na Therapy of Chinese Medicine', 3, { appliesToTrackIds: [MCM_TRACKS.OT] }),
        mcmCourse('MCM7360', 'Advanced Orthopaedics and Traumatology of Chinese Medicine', 4, { appliesToTrackIds: [MCM_TRACKS.OT] }),
        mcmCourse('MCM7180', 'Clinical Practice—Studies and Applications of Orthopaedics and Traumatology and Tui Na', 5, { appliesToTrackIds: [MCM_TRACKS.OT], courseKind: 'practicum' })
      ], {
        creditsRequired: 15,
        coursesRequired: 4,
        creditsRequiredByTrackIds: Object.fromEntries(allTrackIds.map((id) => [id, 15])),
        coursesRequiredByTrackIds: Object.fromEntries(allTrackIds.map((id) => [id, 4])),
        ruleText: 'Complete the four courses assigned to the selected Concentration for 15 units. MCM7080 is shared by the Acupuncture and Orthopaedics, Traumatology and Tui Na Concentrations.'
      }),
      group('dissertation-or-taught-courses', 'Dissertation or Taught-course Option', 'dissertation_or_taught_option', MCM_URL, [
        mcmCourse('MCM7370', '專題論文', 3, { courseKind: 'dissertation', conditionalRequirement: true, linkedSequenceId: 'MCM737-DISSERTATION' }),
        mcmCourse('MCM7380', '專題論文', 3, { courseKind: 'dissertation', conditionalRequirement: true, linkedSequenceId: 'MCM737-DISSERTATION' }),
        mcmCourse('MCM7290', 'Mechanism of Action and Safe Application of Chinese Medicines', 3, { conditionalRequirement: true }),
        mcmCourse('MCM7390', '個體化健康管理概論', 3, { conditionalRequirement: true }),
        mcmCourse('MCM7300', 'Advances in Chinese Medicines Research', 3, { conditionalRequirement: true }),
        mcmCourse('MCM7400', '創新藥物臨床轉化策略', 3, { conditionalRequirement: true })
      ], {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'Complete both Dissertation parts MCM7370 and MCM7380, or choose any two of MCM7290, MCM7390, MCM7300 and MCM7400, for 6 units. A mixed Dissertation/taught pair is not valid.'
      }),
      group('optional-non-award-course', 'Optional Course Outside the Award Total', 'optional_non_award', MCM_URL, [
        mcmCourse('MCM7280', 'Marketing and Management of Industry for Chinese Medicines', 2)
      ], {
        ruleText: 'MCM7280 is optional. Its units do not count toward the 32-unit award and its grade does not count toward cGPA.'
      })
    ]
  };
}

function buildSupplements() {
  return [
    {
      filename: 'hkbu-chinese-medicine-2025.json',
      value: {
        schemaVersion: 1,
        schoolCode: 'HKBU',
        academicYear: '2025-26',
        verifiedAt: VERIFIED_AT,
        programmes: [buildMhm(), buildMdd(), buildMps()]
      }
    },
    {
      filename: 'hkbu-master-chinese-medicine-2026.json',
      value: {
        schemaVersion: 1,
        schoolCode: 'HKBU',
        academicYear: '2026-27',
        verifiedAt: VERIFIED_AT,
        programmes: [buildMcm()]
      }
    }
  ];
}

const supplements = buildSupplements();
const expectedCounts = new Map([
  ['HKBU-TPG-037', 14],
  ['HKBU-TPG-038', 13],
  ['HKBU-TPG-039', 15],
  ['HKBU-TPG-040', 22]
]);
for (const { value } of supplements) {
  for (const programme of value.programmes) {
    const codes = programme.courseGroups.flatMap((item) => item.courses.map((entry) => entry.code));
    const expected = expectedCounts.get(programme.programmeId);
    if (codes.length !== expected || new Set(codes).size !== expected) {
      throw new Error(`${programme.programmeId} expected ${expected} unique codes, received ${codes.length}/${new Set(codes).size}`);
    }
  }
}

if (require.main === module) {
  supplements.forEach(({ filename, value }) => {
    fs.writeFileSync(path.join(supplementsDir, filename), `${JSON.stringify(value, null, 2)}\n`);
    console.log(`Wrote data/tpg-course-supplements/${filename}`);
  });
}

module.exports = { MCM_TRACKS, buildSupplements };
