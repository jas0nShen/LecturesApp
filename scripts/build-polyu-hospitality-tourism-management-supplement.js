const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const candidatePath = path.join(ROOT, 'data', 'tpg-course-candidates', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-hospitality-tourism-management-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-102';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/24045-maf-paf-map-pap-mhf-phf-mhp-php-mvf-pvf-mvp-pvp-mwf-pwf-mwp-pwp-mlf-plf-mlp-plp';

const TRACKS = {
  AIH: 'POLYU-TPG-102-AIH',
  IEH: 'POLYU-TPG-102-IEH',
  IHM: 'POLYU-TPG-102-IHM',
  ITEM: 'POLYU-TPG-102-ITEM',
  LEM: 'POLYU-TPG-102-LEM',
  IWM: 'POLYU-TPG-102-IWM'
};
const ALL_TRACK_IDS = Object.values(TRACKS);
const NON_WINE_TRACK_IDS = [TRACKS.AIH, TRACKS.IEH, TRACKS.IHM, TRACKS.ITEM, TRACKS.LEM];

function buildSupplement() {
  const candidates = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
  const candidate = candidates.programmes.find((item) => item.programmeId === PROGRAMME_ID);
  assert(candidate, `Missing candidate ${PROGRAMME_ID}`);
  assert.equal(candidate.sourceUrl, SOURCE_URL);
  const coursesByCode = new Map(candidate.courses.map((course) => [course.code, course]));

  function course(code, options = {}) {
    const source = coursesByCode.get(code);
    assert(source && source.name && Number.isFinite(source.credits), `Missing complete official course row ${code}`);
    const normalizedNames = {
      HTM598: 'Consultancy Project',
      HTM5003: 'Management Practice'
    };
    return {
      code,
      name: normalizedNames[code] || source.name,
      credits: source.credits,
      sourceUrl: source.sourceUrl,
      appliesToTrackIds: options.appliesToTrackIds || [],
      ...(options.countsTowardTrackIds ? { countsTowardTrackIds: options.countsTowardTrackIds } : {}),
      ...(options.courseKind ? { courseKind: options.courseKind } : {}),
      ...(options.conditionalRequirement ? { conditionalRequirement: true } : {}),
      ...(options.subjectGroups ? { subjectGroups: options.subjectGroups } : {})
    };
  }

  const requiredByTrack = (regularValue, wineValue) => Object.fromEntries([
    ...NON_WINE_TRACK_IDS.map((trackId) => [trackId, regularValue]),
    [TRACKS.IWM, wineValue]
  ]);
  const exclusiveSpecialisationRequirements = {
    [TRACKS.AIH]: 4,
    [TRACKS.IEH]: 4,
    [TRACKS.IHM]: 4,
    [TRACKS.IWM]: 3
  };
  const exclusiveSpecialisationCredits = Object.fromEntries(
    Object.entries(exclusiveSpecialisationRequirements).map(([trackId, coursesRequired]) => [trackId, coursesRequired * 3])
  );

  const specialisationCodes = {
    [TRACKS.AIH]: ['HTM592', 'HTM593', 'HTM594', 'HTM595'],
    [TRACKS.IEH]: ['HTM569', 'HTM570', 'HTM571', 'HTM572'],
    [TRACKS.IHM]: ['HTM536', 'HTM537', 'HTM538', 'HTM539'],
    [TRACKS.ITEM]: ['HTM544', 'HTM545'],
    [TRACKS.LEM]: ['HTM574', 'HTM575', 'HTM576'],
    [TRACKS.IWM]: ['HTM554', 'HTM555', 'HTM556']
  };

  const specialisationCourses = Object.entries(specialisationCodes).flatMap(([trackId, codes]) => (
    codes.map((code) => course(code, {
      appliesToTrackIds: [trackId],
      countsTowardTrackIds: [trackId],
      subjectGroups: ['specialisation']
    }))
  ));

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: PROGRAMME_ID,
      status: 'verified',
      creditsRequired: 32,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official page publishes six award paths under one subject area. Research versus Consultancy Project pathways and cross-listed specialisation/elective subjects require manual audit review; the app must not infer completion from the visible course pool.',
      trackSelectionOptional: false,
      tracks: [
        ['AIH', 'Artificial Intelligence in Hospitality'],
        ['IEH', 'Innovation and Entrepreneurship in Hospitality'],
        ['IHM', 'International Hospitality Management'],
        ['ITEM', 'International Tourism and Event Management'],
        ['LEM', 'Luxury Experiences Management'],
        ['IWM', 'International Wine Management']
      ].map(([code, name]) => ({
        id: TRACKS[code],
        code,
        name,
        type: 'Award Path',
        creditsRequired: 32,
        sourceUrl: SOURCE_URL
      })),
      courseGroups: [
        {
          id: 'workshop-and-academic-integrity',
          name: 'Workshop and Academic Integrity',
          type: 'core',
          creditsRequired: 2,
          coursesRequired: 2,
          ruleText: 'All six MSc award paths complete HTM5002 and HTM5T02 for 2 credits in total.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: ['HTM5002', 'HTM5T02'].map((code) => course(code))
        },
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequiredByTrackIds: requiredByTrack(12, 9),
          coursesRequiredByTrackIds: requiredByTrack(4, 3),
          ruleText: 'AIH, IEH, IHM, ITEM and LEM complete HTM533, HTM534, HTM535 and HTM582 (12 credits). IWM completes HTM534, HTM535 and HTM582 (9 credits).',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('HTM533', { appliesToTrackIds: NON_WINE_TRACK_IDS }),
            ...['HTM534', 'HTM535', 'HTM582'].map((code) => course(code))
          ]
        },
        {
          id: 'award-path-specialisation',
          name: 'Award Path Specialisation Subjects',
          type: 'track_core',
          creditsRequiredByTrackIds: exclusiveSpecialisationCredits,
          coursesRequiredByTrackIds: exclusiveSpecialisationRequirements,
          ruleText: 'AIH, IEH and IHM each complete their four listed specialisation subjects. ITEM completes HTM520, HTM544, HTM545 and HTM561. LEM completes HTM541 and HTM574-HTM576. IWM completes HTM554-HTM556. The three cross-listed subjects are stored separately to avoid duplicate course codes.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: specialisationCourses
        },
        {
          id: 'cross-listed-specialisation-electives',
          name: 'Cross-listed Specialisation and Elective Subjects',
          type: 'elective',
          ruleText: 'HTM520 and HTM561 are ITEM specialisation subjects and IWM electives. HTM541 is a LEM specialisation subject and an elective for the other award paths. These roles must be checked by award path and must not be double counted.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('HTM520', { appliesToTrackIds: [TRACKS.ITEM, TRACKS.IWM], countsTowardTrackIds: [TRACKS.ITEM], subjectGroups: ['specialisation', 'elective'] }),
            course('HTM561', { appliesToTrackIds: [TRACKS.ITEM, TRACKS.IWM], countsTowardTrackIds: [TRACKS.ITEM], subjectGroups: ['specialisation', 'elective'] }),
            course('HTM541', { appliesToTrackIds: ALL_TRACK_IDS, countsTowardTrackIds: [TRACKS.LEM], subjectGroups: ['specialisation', 'elective'] })
          ]
        },
        {
          id: 'project-options',
          name: 'Research or Consultancy Project Option',
          type: 'project',
          coursesRequired: 1,
          ruleText: 'Choose HTM599 Research Project (6 credits) for the Research Component, or HTM598 Consultancy Project (3 credits) for the Non-Research Component. The paired elective requirement differs by award path and component and requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('HTM598', { courseKind: 'project', conditionalRequirement: true }),
            course('HTM599', { courseKind: 'research_project', conditionalRequirement: true })
          ]
        },
        {
          id: 'elective-pool',
          name: 'Elective Subject Pool',
          type: 'elective',
          ruleText: 'For AIH, IEH, IHM, ITEM and LEM, the Non-Research Component pairs HTM598 with one 3-credit elective; the Research Component uses HTM599 without an elective. For IWM, the Research Component requires two electives and HTM599, while the Non-Research Component requires three electives and HTM598. Cross-listed HTM520, HTM541 and HTM561 are stored in the separate cross-listed group.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            ...['HTM507', 'HTM513', 'HTM528', 'HTM568', 'HTM573', 'HTM577'].map((code) => course(code, { appliesToTrackIds: NON_WINE_TRACK_IDS })),
            ...['HTM540', 'HTM557'].map((code) => course(code, { appliesToTrackIds: ALL_TRACK_IDS })),
            ...['HTM558', 'HTM560'].map((code) => course(code, { appliesToTrackIds: [TRACKS.IWM] }))
          ]
        },
        {
          id: 'optional-non-credit',
          name: 'Optional Non-credit Subject',
          type: 'optional',
          ruleText: 'HTM5003 Management Practice is an optional, non-credit-bearing internship and is not part of the 32-credit graduation total.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [course('HTM5003')]
        }
      ]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, outputPath, programmes: supplement.programmes.length }));
}

if (require.main === module) main();

module.exports = { ALL_TRACK_IDS, TRACKS, buildSupplement };
