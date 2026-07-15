const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-design-2027.json');
const PROGRAMME_SOURCE = 'https://www.polyu.edu.hk/study/pg/tpg/2027/73035-ibd-ibp-isd-isp-ssd-ssp-ted-tep';
const TRACKS = {
  IBD: {
    id: 'POLYU-TPG-096-INNOVATIVE-BUSINESS-DESIGN',
    code: 'IBD',
    name: 'Innovative Business Design',
    sourceUrl: 'https://www.polyu.edu.hk/sd/study/tpg/innovative-business-design/programme-structure/'
  },
  ISD: {
    id: 'POLYU-TPG-096-INTELLIGENT-SYSTEMS-DESIGN',
    code: 'ISD',
    name: 'Intelligent Systems Design',
    sourceUrl: 'https://www.polyu.edu.hk/sd/study/tpg/intelligent-systems-design/programme-structure/'
  },
  SSD: {
    id: 'POLYU-TPG-096-SMART-SERVICE-DESIGN',
    code: 'SSD',
    name: 'Smart Service Design',
    sourceUrl: 'https://www.polyu.edu.hk/sd/study/tpg/smart-service-design/programme-structure/'
  },
  TED: {
    id: 'POLYU-TPG-096-TRANSITIONAL-ENVIRONMENTS-DESIGN',
    code: 'TED',
    name: 'Transitional Environments Design',
    sourceUrl: 'https://www.polyu.edu.hk/sd/study/tpg/transitional-environments-design/programme-structure/'
  }
};

const trackIds = Object.values(TRACKS).map((track) => track.id);

function course(code, name, credits, appliesToTrackIds, sourceUrl, courseKind) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds,
    sourceUrl,
    ...(courseKind ? { courseKind } : {})
  };
}

function commonCourse(code, name, credits, courseKind) {
  return course(code, name, credits, [], TRACKS.IBD.sourceUrl, courseKind);
}

function crossRoleCourse(code, name) {
  return course(code, name, 3, trackIds, TRACKS.IBD.sourceUrl);
}

function trackCourse(track, code, name, credits, courseKind) {
  return course(code, name, credits, [TRACKS[track].id], TRACKS[track].sourceUrl, courseKind);
}

function buildSupplement() {
  const creditsRequiredByTrackIds = Object.fromEntries(trackIds.map((trackId) => [trackId, 21]));
  const coursesRequiredByTrackIds = Object.fromEntries(trackIds.map((trackId) => [trackId, 7]));
  const projectCreditsByTrackIds = Object.fromEntries(trackIds.map((trackId) => [trackId, 9]));
  const projectCoursesByTrackIds = Object.fromEntries(trackIds.map((trackId) => [trackId, 2]));

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: 'POLYU-TPG-096',
      status: 'verified',
      creditsRequired: 37,
      creditUnit: 'credits',
      sourceUrl: PROGRAMME_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2027 Programme page and the four current School of Design Programme Structure pages publish the complete 37-credit curriculum for Innovative Business Design, Intelligent Systems Design, Smart Service Design and Transitional Environments Design. Every Specialism requires 6 Common credits, 15 Specialism credits, 12 credits from Elective Pool A, 3 credits from Elective Pool B and the 1-credit ABCT5T01 AIE subject. Several SD subjects change role between Specialism Core and Elective pools, and ISD and SSD each contain a one-of Specialism Major choice. The shared cross-role subjects are stored once to preserve Programme-level code uniqueness; the exact official role mapping and non-double-counting rule remain marked for manual audit review.',
      trackSelectionOptional: false,
      tracks: Object.values(TRACKS).map((track) => ({
        id: track.id,
        code: track.code,
        name: track.name,
        type: 'Specialism',
        creditsRequired: 37,
        sourceUrl: track.sourceUrl
      })),
      courseGroups: [
        {
          id: 'compulsory-common-subjects',
          name: 'Compulsory Common Subjects',
          type: 'core',
          creditsRequired: 6,
          coursesRequired: 2,
          ruleText: 'Complete both 3-credit Compulsory Common subjects.',
          appliesToTrackIds: [],
          sourceUrl: TRACKS.IBD.sourceUrl,
          courses: [
            commonCourse('SD5008', 'Research and Analysis for Design', 3),
            commonCourse('SD5009', 'Research and Academic Writing', 3)
          ]
        },
        {
          id: 'specialism-studio-and-project-subjects',
          name: 'Compulsory Specialism Studio and Project Subjects',
          type: 'track_core_project',
          creditsRequiredByTrackIds: projectCreditsByTrackIds,
          coursesRequiredByTrackIds: projectCoursesByTrackIds,
          ruleText: 'Complete the two exclusive Specialism subjects for the selected Specialism: IBD completes SD5138 and SD5139; ISD completes SD5538 and SD5539; SSD completes SD5438 and SD5439; TED completes SD5738 and SD5739. Together with the 6 compulsory cross-role credits identified in the next group, these subjects satisfy the 15-credit Compulsory Specialism requirement.',
          appliesToTrackIds: trackIds,
          sourceUrl: PROGRAMME_SOURCE,
          courses: [
            trackCourse('IBD', 'SD5138', 'Theme-Based Project', 3, 'project'),
            trackCourse('IBD', 'SD5139', 'Entrepreneurship Project', 6, 'project'),
            trackCourse('ISD', 'SD5538', 'ISD Specialism Studio', 3),
            trackCourse('ISD', 'SD5539', 'ISD Capstone Research Project', 6, 'project'),
            trackCourse('SSD', 'SD5438', 'SSD Specialism Studio', 3),
            trackCourse('SSD', 'SD5439', 'SSD Capstone Research Project', 6, 'project'),
            trackCourse('TED', 'SD5738', 'Urban Systems and Strategies', 3),
            trackCourse('TED', 'SD5739', 'TED Capstone Research Project', 6, 'project')
          ]
        },
        {
          id: 'specialism-core-and-elective-cross-role-subjects',
          name: 'Specialism Core and Elective Cross-role Subjects',
          type: 'track_core_elective_cross_role',
          creditsRequiredByTrackIds,
          coursesRequiredByTrackIds,
          ruleText: 'Complete 21 credits in the selected Specialism: 6 compulsory cross-role credits, 12 credits from Elective Pool A and 3 credits from Elective Pool B. IBD compulsory cross-role subjects are SD5116 and SD5132. ISD completes SD5532 and one of SD5513 or SD5514. SSD completes SD5432 and one of SD5412, SD5413 or SD5414. TED completes SD5716 and SD5717. A subject used for the compulsory role must not be counted again toward either Elective pool. The remaining official Pool A and Pool B choices are listed in the selected Specialism page; confirm the valid non-duplicating combination during manual audit review.',
          appliesToTrackIds: trackIds,
          sourceUrl: TRACKS.IBD.sourceUrl,
          courses: [
            crossRoleCourse('SD5114', 'Design Methods (Advanced)'),
            crossRoleCourse('SD5115', 'Design Project Management'),
            crossRoleCourse('SD5116', 'Design for Transformation'),
            crossRoleCourse('SD5411', 'Designing Services'),
            crossRoleCourse('SD5511', 'UX Design Fundamentals'),
            crossRoleCourse('SD5512', 'Prototyping and Scripting'),
            crossRoleCourse('SD5711', 'Design for the Biosphere'),
            crossRoleCourse('SD5712', 'Design for Change'),
            crossRoleCourse('SD5713', 'Design Systems Thinking'),
            crossRoleCourse('SD5117', 'Innovate with Lifestyle and Culture'),
            crossRoleCourse('SD5412', 'Advanced Service Design Methods and Tools'),
            crossRoleCourse('SD5413', 'Socio-Technical Service Ecosystem'),
            crossRoleCourse('SD5414', 'Systemic Innovation and Designing Future Services'),
            crossRoleCourse('SD5513', 'Theories in Interaction Design'),
            crossRoleCourse('SD5514', 'Advanced Visualisation and Interaction'),
            crossRoleCourse('SD5716', 'Regenerative Ecosystems Design'),
            crossRoleCourse('SD5717', 'Territories, Societies, and Spatial Complexes'),
            crossRoleCourse('SD5131', 'Interdisciplinary Project'),
            crossRoleCourse('SD5431', 'Interdisciplinary Studio'),
            crossRoleCourse('SD5731', 'Regenerative Environments Design'),
            crossRoleCourse('SD5132', 'Lab Studies in Human Cyber-Physical Systems'),
            crossRoleCourse('SD5531', 'Lab Studies in Systems Design'),
            crossRoleCourse('SD5532', 'Lab Studies in Intelligent Systems Construction'),
            crossRoleCourse('SD5432', 'Lab Studies in Data-Driven Service Design'),
            crossRoleCourse('SD5732', 'Lab Studies in Applied Technologies for Territorial Design')
          ]
        },
        {
          id: 'academic-integrity-and-ethics',
          name: 'Academic Integrity and Ethics Requirement',
          type: 'academic_integrity',
          creditsRequired: 1,
          coursesRequired: 1,
          ruleText: 'Complete the 1-credit ABCT5T01 subject. Tuition fees are not charged for this subject.',
          appliesToTrackIds: [],
          sourceUrl: TRACKS.IBD.sourceUrl,
          courses: [
            commonCourse('ABCT5T01', 'Academic Integrity and Ethics in Science', 1, 'academic_integrity')
          ]
        }
      ]
    }]
  };
}

function main() {
  const value = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT), programmes: value.programmes.length }));
}

if (require.main === module) main();

module.exports = { TRACKS, buildSupplement };
