const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-logistics-management-2027.json');
const VERIFIED_AT = '2026-07-16';
const LMS_SUBJECT_LIST_URL = 'https://www.polyu.edu.hk/lms/study/subject-syllabi/';

const programmeSources = {
  'POLYU-TPG-058': 'https://www.polyu.edu.hk/study/pg/tpg/2027/44087-ifm-tfp-ipm-tpp',
  'POLYU-TPG-059': 'https://www.polyu.edu.hk/study/pg/tpg/2027/44087-iss',
  'POLYU-TPG-060': 'https://www.polyu.edu.hk/study/pg/tpg/2027/44089-sfm-sfp-gpm-spp',
  'POLYU-TPG-061': 'https://www.polyu.edu.hk/study/pg/tpg/2027/44092-ofm-opm',
  'POLYU-TPG-062': 'https://www.polyu.edu.hk/study/pg/tpg/2027/44094-bfm-bpm'
};

const requirementDocuments = {
  'POLYU-TPG-058': 'https://www.polyu.edu.hk/lms/-/media/department/lms/content/study/tpg/istl/student-resources/programme-requirement-documents/istl-2025-26.pdf',
  'POLYU-TPG-059': 'https://www.polyu.edu.hk/lms/-/media/department/lms/content/study/tpg/istl-iss/student-resources/programme-requirement-document/istl-iss-2025-26.pdf',
  'POLYU-TPG-060': 'https://www.polyu.edu.hk/lms/-/media/department/lms/content/study/tpg/gscm/student-resources/programme-requirement-documents/gscm-2025-26.pdf',
  'POLYU-TPG-061': 'https://www.polyu.edu.hk/lms/-/media/department/lms/content/study/tpg/om/student-resources/programme-requirement-documents/om-2025-26.pdf',
  'POLYU-TPG-062': 'https://www.polyu.edu.hk/lms/-/media/department/lms/content/study/tpg/gbda/student-resources/programme-requirement-documents/gbda-2025-26.pdf'
};

const catalogue = {
  AF5104: ['International Accounting', 3],
  AF5108: ['Accounting for Managers', 3],
  AF5326: ['Managerial Finance', 3],
  AF5362: ['International Financial Management', 3],
  AF5618: ['Global Economic Environment for Management', 3],
  AF5627: ['Managerial Economics with an Application to China Business', 3],
  LGT5001: ['Organisational Management in Shipping and Logistics', 3],
  LGT5002: ['International Logistics Systems, Operations and Management', 3],
  LGT5007: ['Shipping Economics and Markets', 3],
  LGT5010: ['Port Policy and Management', 3],
  LGT5011: ['Admiralty Law', 3],
  LGT5012: ['Law and Practice in Marine Insurance', 3],
  LGT5013: ['Transport Logistics in China', 3],
  LGT5014: ['Air Transport Logistics and Management', 3],
  LGT5015: ['Supply Chain Management', 3],
  LGT5017: ['Maritime Logistics', 3],
  LGT5034: ['Global Sourcing and Supply', 3],
  LGT5037: ['Project Management', 3],
  LGT5040: ['Supplier Development', 3],
  LGT5046: ['Contract Management', 3],
  LGT5064: ['Shipping Law', 3],
  LGT5065: ['Finance for Shipping and Logistics', 3],
  LGT5067: ['Intermodal Transport Management', 3],
  LGT5071: ['Ship Chartering Strategies', 3],
  LGT5072: ['Liner Shipping Management', 3],
  LGT5073: ['Risk Management in Operations', 3],
  LGT5079: ['Strategic Management for International Shipping', 3],
  LGT5083: ['Digital Procurement Management and Analytics', 3],
  LGT5101: ['Statistics for Management', 3],
  LGT5102: ['Models for Decision Making', 3],
  LGT5105: ['Managing Operations Systems', 3],
  LGT5107: ['Total Quality Management', 3],
  LGT5109: ['International Operations Management', 3],
  LGT5111: ['Practice of Operations Management', 3],
  LGT5113: ['Enterprise Resource Planning', 3],
  LGT5122: ['Applications of Decision Making Models', 3],
  LGT5133: ['Strategies and Technologies in Warehousing Management', 3],
  LGT5137: ['Lean Six Sigma and Quality Management Techniques', 3],
  LGT5150: ['Quality Management Approaches for Operational Enhancement', 3],
  LGT5152: ['Information Systems for Supply Chain Management', 3],
  LGT5159: ['Implementation and Auditing of Quality Management Systems', 3],
  LGT5161: ['Air Transport Regulatory Policy', 3],
  LGT5162: ['Airline Strategic Management', 3],
  LGT5163: ['Aviation Marketing', 3],
  LGT5164: ['Aviation Safety Management', 3],
  LGT5165: ['AI and Digitalisation in the Global Shipping Industry', 3],
  LGT5169: ['Airport Business Management', 3],
  LGT5170: ['Maritime Arbitration Law', 3],
  LGT5171: ['Contemporary Issues in Operations Management', 3],
  LGT5172: ['Managerial Thinking and Skills Workshop', 3],
  LGT5202: ['Project', 6],
  LGT5215: ['Practice of Global Supply Chain Management', 3],
  LGT5222: ['Maritime Industry Internship', 6],
  LGT5315: ['Research Project in International Shipping and Transport Logistics', 3],
  LGT5415: ['Research Project in Global Business and Decision Analysis', 3],
  LGT5419: ['Coding for Management with Python', 3],
  LGT5425: ['Business Analytics', 3],
  LGT5426: ['Managing Innovation', 3],
  LGT5427: ['Global Business', 3],
  LGT5428: ['International Trade and Logistics Management', 3],
  LGT5429: ['Global Risk and Decision Analysis', 3],
  LGT5T21: ['Academic Integrity and Ethics in Business', 1],
  MM501: ['Research Methods', 3],
  MM5112: ['Organization and Management', 3],
  MM531: ['Strategic Management', 3],
  MM539: ['International Management', 3],
  MM544: ['E-Commerce', 3],
  MM5712: ['Marketing Management in China', 3],
  MM576: ['Marketing Management', 3],
  MM5791: ['Global Marketing in Cross-Cultural Perspectives', 3]
};

const OM_TRACKS = {
  ANALYTICS: 'POLYU-TPG-061-OPERATIONS-ANALYTICS',
  QUALITY: 'POLYU-TPG-061-QUALITY-MANAGEMENT',
  STRATEGY: 'POLYU-TPG-061-OPERATIONS-STRATEGY'
};

function course(programmeId, code, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing LMS catalogue entry ${code}`);
  const sourceUrl = code.startsWith('LGT') ? LMS_SUBJECT_LIST_URL : requirementDocuments[programmeId];
  return {
    code,
    name: entry[0],
    credits: entry[1],
    appliesToTrackIds: options.appliesToTrackIds || [],
    sourceUrl,
    ...options
  };
}

function group(programmeId, id, name, type, codes, options = {}) {
  const courseOptions = options.courseOptions || {};
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ...(options.creditsRequiredByTrackIds ? { creditsRequiredByTrackIds: options.creditsRequiredByTrackIds } : {}),
    ...(options.coursesRequiredByTrackIds ? { coursesRequiredByTrackIds: options.coursesRequiredByTrackIds } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: options.appliesToTrackIds || [],
    sourceUrl: programmeSources[programmeId],
    courses: codes.map((code) => course(programmeId, code, courseOptions[code]))
  };
}

function academicIntegrity(programmeId) {
  return group(programmeId, 'academic-integrity', 'Academic Integrity and Ethics in Business', 'academic_integrity', ['LGT5T21'], {
    creditsRequired: 1,
    coursesRequired: 1,
    ruleText: 'Complete LGT5T21 Academic Integrity and Ethics in Business for 1 credit.',
    courseOptions: { LGT5T21: { courseKind: 'academic_integrity' } }
  });
}

const shippingRestrictedCodes = [
  'LGT5001', 'LGT5010', 'LGT5071', 'LGT5072', 'LGT5079', 'LGT5165',
  'LGT5007', 'LGT5065',
  'LGT5012', 'LGT5064',
  'LGT5014', 'LGT5015'
];

const shippingFreeCodes = [
  'LGT5017', 'AF5108', 'LGT5011', 'LGT5046', 'LGT5170',
  'LGT5067', 'LGT5161', 'LGT5162', 'LGT5163', 'LGT5164', 'LGT5169',
  'LGT5013', 'LGT5037', 'LGT5073', 'LGT5101', 'LGT5113', 'LGT5122',
  'LGT5133', 'LGT5152', 'LGT5419', 'LGT5202', 'MM501', 'MM544', 'LGT5137', 'LGT5315'
];

function shippingMixedMode() {
  const programmeId = 'POLYU-TPG-058';
  return {
    programmeId,
    faculty: 'Department of Logistics and Maritime Studies (LMS)',
    status: 'verified',
    creditsRequired: 34,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current 2025/26 LMS Programme Requirement Document publish the 34-credit MSc structure and complete title/code mapping. The current LMS Subject Syllabi list resolves the two former placeholders as LGT5165 AI and Digitalisation in the Global Shipping Industry and LGT5315 Research Project in International Shipping and Transport Logistics. The five Restricted Electives must satisfy four focus-area minima; additional Restricted Electives may count as Free Electives, and LGT5202 Project replaces two of the five Free Electives. These cross-group and Project-equivalence rules require manual audit review. The 19-credit PgD is an early-exit award and is not modelled as MSc completion.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['LGT5002'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete LGT5002 for 3 credits in addition to the 1-credit AIE subject.'
      }),
      academicIntegrity(programmeId),
      group(programmeId, 'restricted-electives', 'Restricted Elective Subjects', 'restricted_elective', shippingRestrictedCodes, {
        creditsRequired: 15,
        coursesRequired: 5,
        ruleText: 'Complete five 3-credit Restricted Electives: at least two International Shipping subjects, at least one Shipping Economics and Finance subject, at least one Shipping Law and Insurance subject, and at least one International Logistics subject. Additional Restricted Electives may count as Free Electives.'
      }),
      group(programmeId, 'free-electives-and-project', 'Free Elective Subjects and Project Option', 'elective', shippingFreeCodes, {
        creditsRequired: 15,
        ruleText: 'Complete either five 3-credit Free Electives or LGT5202 Project for 6 credits plus three 3-credit Free Electives. LGT5315 is a 3-credit Research Project option in the published Free Elective pool.',
        courseOptions: {
          LGT5202: { courseKind: 'project', conditionalRequirement: true },
          LGT5315: { courseKind: 'research_project', conditionalRequirement: true }
        }
      })
    ]
  };
}

function shippingFullTimeStream() {
  const programmeId = 'POLYU-TPG-059';
  const freeCodes = [...shippingFreeCodes, 'LGT5105'];
  return {
    programmeId,
    faculty: 'Department of Logistics and Maritime Studies (LMS)',
    status: 'verified',
    creditsRequired: 46,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current 2025/26 full-time-stream Programme Requirement Document publish the complete 40-academic-credit plus 6-training-credit structure. The current LMS Subject Syllabi list resolves the former placeholders as LGT5165 and LGT5315 and identifies LGT5222 Maritime Industry Internship as the 6-credit training subject. Students choose four International Shipping Core Subjects, three Restricted Electives satisfying three focus minima, and either five Free Electives or LGT5202 Project plus three Free Electives. Additional Restricted Electives may count as Free Electives, so the shared pools and Project equivalence require manual audit review.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['LGT5002'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete LGT5002 for 3 academic credits in addition to the 1-credit AIE subject.'
      }),
      academicIntegrity(programmeId),
      group(programmeId, 'international-shipping-core', 'International Shipping Core Subjects', 'core', ['LGT5001', 'LGT5010', 'LGT5071', 'LGT5072', 'LGT5079', 'LGT5165'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete any four International Shipping Core Subjects for 12 credits.'
      }),
      group(programmeId, 'restricted-electives', 'Restricted Elective Subjects', 'restricted_elective', ['LGT5007', 'LGT5065', 'LGT5012', 'LGT5064', 'LGT5014', 'LGT5015'], {
        creditsRequired: 9,
        coursesRequired: 3,
        ruleText: 'Complete three Restricted Electives for 9 credits, including at least one from each of Shipping Economics and Finance, Shipping Law and Insurance, and International Logistics. Additional Restricted Electives may count as Free Electives.'
      }),
      group(programmeId, 'free-electives-and-project', 'Free Elective Subjects and Project Option', 'elective', freeCodes, {
        creditsRequired: 15,
        ruleText: 'Complete either five 3-credit Free Electives or LGT5202 Project for 6 credits plus three 3-credit Free Electives. LGT5315 is a 3-credit Research Project option in the published pool.',
        courseOptions: {
          LGT5202: { courseKind: 'project', conditionalRequirement: true },
          LGT5315: { courseKind: 'research_project', conditionalRequirement: true }
        }
      }),
      group(programmeId, 'maritime-industry-internship', 'Mandatory Training Subject', 'internship', ['LGT5222'], {
        creditsRequired: 6,
        coursesRequired: 1,
        ruleText: 'Complete the 240-hour LGT5222 Maritime Industry Internship for 6 training credits; the official Programme page notes that exemptions may be granted to eligible local scholarship recipients with relevant experience.',
        courseOptions: { LGT5222: { courseKind: 'internship' } }
      })
    ]
  };
}

function globalSupplyChainManagement() {
  const programmeId = 'POLYU-TPG-060';
  return {
    programmeId,
    faculty: 'Department of Logistics and Maritime Studies (LMS)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page, current 2025/26 Programme Requirement Document and LMS Subject Syllabi publish the complete 31-credit MSc structure and exact codes. The three Restricted Electives must satisfy separate operations, procurement and information-technology minima; additional Restricted Electives may count as Free Electives. LGT5202 Project carries 6 credits inside the 12-credit Free Elective requirement and therefore replaces two ordinary Free Electives. These cross-group and Project-equivalence rules require manual audit review. The 19-credit PgD is an early-exit award and is not modelled as MSc completion.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['LGT5002', 'LGT5015', 'LGT5034'], {
        creditsRequired: 9,
        coursesRequired: 3,
        ruleText: 'Complete all three 3-credit Compulsory Subjects in addition to the 1-credit AIE subject.'
      }),
      academicIntegrity(programmeId),
      group(programmeId, 'restricted-electives', 'Restricted Elective Subjects', 'restricted_elective', ['LGT5105', 'LGT5109', 'LGT5046', 'LGT5083', 'LGT5152', 'MM544'], {
        creditsRequired: 9,
        coursesRequired: 3,
        ruleText: 'Complete three 3-credit Restricted Electives: at least one operations subject, at least one procurement subject, and at least one information-technology subject. Additional Restricted Electives may count as Free Electives.'
      }),
      group(programmeId, 'free-electives-and-project', 'Free Elective Subjects and Project Option', 'elective', ['AF5108', 'LGT5001', 'LGT5013', 'LGT5014', 'LGT5017', 'LGT5037', 'LGT5040', 'LGT5073', 'LGT5101', 'LGT5102', 'LGT5107', 'LGT5113', 'LGT5122', 'LGT5133', 'LGT5137', 'LGT5419', 'LGT5425', 'LGT5426', 'LGT5202', 'LGT5215'], {
        creditsRequired: 12,
        ruleText: 'Complete four 3-credit Free Electives, or use the 6-credit LGT5202 Project in place of two ordinary Free Electives.',
        courseOptions: { LGT5202: { courseKind: 'project', conditionalRequirement: true } }
      })
    ]
  };
}

function operationsManagement() {
  const programmeId = 'POLYU-TPG-061';
  const allTrackIds = Object.values(OM_TRACKS);
  const trackCredits = Object.fromEntries(allTrackIds.map((trackId) => [trackId, 9]));
  const trackCourses = Object.fromEntries(allTrackIds.map((trackId) => [trackId, 3]));
  const specialisedOptions = {
    LGT5015: { appliesToTrackIds: [OM_TRACKS.ANALYTICS], subjectGroups: ['specialised', 'free-elective'] },
    LGT5113: { appliesToTrackIds: [OM_TRACKS.ANALYTICS], subjectGroups: ['specialised', 'free-elective'] },
    LGT5425: { appliesToTrackIds: [OM_TRACKS.ANALYTICS], subjectGroups: ['specialised', 'free-elective'] },
    MM544: { appliesToTrackIds: [OM_TRACKS.ANALYTICS], subjectGroups: ['specialised', 'free-elective'] },
    LGT5101: { appliesToTrackIds: [OM_TRACKS.QUALITY], subjectGroups: ['specialised', 'free-elective'] },
    LGT5107: { appliesToTrackIds: [OM_TRACKS.QUALITY], subjectGroups: ['specialised', 'free-elective'] },
    LGT5137: { appliesToTrackIds: [OM_TRACKS.QUALITY], subjectGroups: ['specialised', 'free-elective'] },
    LGT5150: { appliesToTrackIds: [OM_TRACKS.QUALITY], subjectGroups: ['specialised', 'free-elective'] },
    LGT5073: { appliesToTrackIds: [OM_TRACKS.STRATEGY], subjectGroups: ['specialised', 'free-elective'] },
    LGT5133: { appliesToTrackIds: [OM_TRACKS.STRATEGY], subjectGroups: ['specialised', 'free-elective'] },
    MM5112: { appliesToTrackIds: [OM_TRACKS.STRATEGY], subjectGroups: ['specialised', 'free-elective'] },
    MM531: { appliesToTrackIds: [OM_TRACKS.STRATEGY], subjectGroups: ['specialised', 'free-elective'] }
  };
  return {
    programmeId,
    faculty: 'Department of Logistics and Maritime Studies (LMS)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    trackSelectionOptional: false,
    tracks: [
      { id: OM_TRACKS.ANALYTICS, code: 'OA', name: 'Operations Analytics', type: 'Stream', creditsRequired: 31, sourceUrl: programmeSources[programmeId] },
      { id: OM_TRACKS.QUALITY, code: 'QM', name: 'Quality Management', type: 'Stream', creditsRequired: 31, sourceUrl: programmeSources[programmeId] },
      { id: OM_TRACKS.STRATEGY, code: 'OS', name: 'Operations Strategy', type: 'Stream', creditsRequired: 31, sourceUrl: programmeSources[programmeId] }
    ],
    statusNote: 'The official 2027 Programme page, current 2025/26 Programme Requirement Document and LMS Subject Syllabi publish the complete 31-credit structure, three required Streams and exact course codes, including the former placeholder LGT5150 Quality Management Approaches for Operational Enhancement. Students complete any three Specialised Subjects from one Stream. Extra Specialised Subjects in that Stream may count as Free Electives, and the 6-credit LGT5202 Project may replace both ordinary Free Electives. These cross-role and Project-equivalence rules require manual audit review. The 22-credit PgD is an early-exit award and is not modelled as MSc completion.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['AF5108', 'LGT5105', 'LGT5109', 'LGT5426'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four 3-credit Compulsory Subjects in addition to the 1-credit AIE subject.'
      }),
      academicIntegrity(programmeId),
      group(programmeId, 'specialised-subjects', 'Stream Specialised Subjects', 'track_core', ['LGT5015', 'LGT5113', 'LGT5425', 'MM544', 'LGT5101', 'LGT5107', 'LGT5137', 'LGT5150', 'LGT5073', 'LGT5133', 'MM5112', 'MM531'], {
        creditsRequired: 9,
        coursesRequired: 3,
        creditsRequiredByTrackIds: trackCredits,
        coursesRequiredByTrackIds: trackCourses,
        appliesToTrackIds: allTrackIds,
        ruleText: 'Choose one Stream and complete any three of its four Specialised Subjects for 9 credits. A fourth Specialised Subject in the selected Stream may count as a Free Elective.',
        courseOptions: specialisedOptions
      }),
      group(programmeId, 'restricted-elective', 'Restricted Elective Subject', 'restricted_elective', ['LGT5002', 'LGT5034', 'LGT5037', 'LGT5040', 'LGT5102', 'LGT5171', 'MM576'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete any one 3-credit Restricted Elective. Additional Restricted Electives may count as Free Electives.'
      }),
      group(programmeId, 'free-electives-and-project', 'Free Elective Subjects and Project Option', 'elective', ['LGT5111', 'LGT5122', 'LGT5159', 'LGT5419', 'LGT5427', 'LGT5429', 'MM501', 'LGT5202'], {
        creditsRequired: 6,
        ruleText: 'Complete two 3-credit Free Electives or the 6-credit LGT5202 Project. Eligible extra Specialised or Restricted Elective subjects also count toward this requirement and are kept in their official groups to avoid duplicate course codes.',
        courseOptions: { LGT5202: { courseKind: 'project', conditionalRequirement: true } }
      })
    ]
  };
}

function globalBusinessDecisionAnalysis() {
  const programmeId = 'POLYU-TPG-062';
  return {
    programmeId,
    faculty: 'Department of Logistics and Maritime Studies (LMS)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and current 2025/26 Programme Requirement Document publish the complete 31-credit title/code mapping, including AF5627 Managerial Economics with an Application to China Business. The detailed curriculum requires three Restricted Electives satisfying methodology, supply-chain/operations, and accounting/finance/management/marketing minima, plus 9 Free Elective credits. The overview separately describes a 6-credit Research-based Project alternative while the detailed pool lists both the 3-credit LGT5415 Research Project and 6-credit LGT5202 Project; a 6-credit Project alone would leave the published 31-credit total short. The Project equivalence and cross-group rules therefore require manual audit review and no completion percentage should be inferred from the course pool. The 19-credit PgD is an early-exit award and is not modelled as MSc completion.',
    courseGroups: [
      group(programmeId, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['LGT5427', 'LGT5428', 'LGT5102', 'LGT5425'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four 3-credit Compulsory Subjects in addition to the 1-credit AIE subject.'
      }),
      academicIntegrity(programmeId),
      group(programmeId, 'restricted-electives', 'Restricted Elective Subjects', 'restricted_elective', ['LGT5037', 'LGT5101', 'LGT5122', 'LGT5429', 'LGT5419', 'LGT5034', 'LGT5109', 'LGT5171', 'LGT5002', 'AF5104', 'AF5108', 'AF5326', 'MM539', 'MM576', 'MM5791', 'LGT5426'], {
        creditsRequired: 9,
        coursesRequired: 3,
        ruleText: 'Complete three 3-credit Restricted Electives: at least one methodology subject, at least one supply-chain/logistics/operations subject, and at least one accounting/finance/management/marketing subject. Additional Restricted Electives may count as Free Electives.'
      }),
      group(programmeId, 'free-electives-and-projects', 'Free Elective Subjects and Research-based Project Options', 'elective', ['AF5362', 'AF5618', 'AF5627', 'LGT5001', 'LGT5007', 'LGT5014', 'LGT5015', 'LGT5067', 'LGT5073', 'LGT5083', 'LGT5046', 'LGT5105', 'LGT5172', 'LGT5137', 'MM5712', 'LGT5415', 'LGT5202'], {
        creditsRequired: 9,
        ruleText: 'Complete 9 Free Elective credits. The official sources list LGT5415 as a 3-credit Research Project and LGT5202 as a 6-credit Project, but do not state a self-consistent automatic substitution rule for the 31-credit total; confirm any Project path manually.',
        courseOptions: {
          LGT5415: { courseKind: 'research_project', conditionalRequirement: true },
          LGT5202: { courseKind: 'project', conditionalRequirement: true }
        }
      })
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const expected = {
    'POLYU-TPG-058': [/34 for MSc/, /5\s+Restricted Elective Subjects/, /Research Project in International Shipping and Transport Logistics/],
    'POLYU-TPG-059': [/46 \(40 academic credits and 6 training credits\)/, /240-hour Maritime Industry Internship/, /4\s+International Shipping Core Subjects/],
    'POLYU-TPG-060': [/31 for MSc/, /Global Sourcing\s+and Supply/, /Practice of Global Supply Chain Management/],
    'POLYU-TPG-061': [/^31$/, /Operations\s+Analytics\s+Stream/, /Quality Management Approaches for Operational Enhancement/],
    'POLYU-TPG-062': [/^31$/, /Managerial Economics with an Application to China Business/, /Research Project in Global Business and Decision Analysis/]
  };
  Object.entries(expected).forEach(([programmeId, patterns]) => {
    const row = snapshot.rows.find((item) => item.programmeId === programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, programmeSources[programmeId]);
    assert(patterns[0].test(row.creditText), `${programmeId} official credit text changed`);
    patterns.slice(1).forEach((pattern) => assert(pattern.test(row.curriculumText), `${programmeId} official curriculum changed: ${pattern}`));
  });

  const programmes = [
    shippingMixedMode(),
    shippingFullTimeStream(),
    globalSupplyChainManagement(),
    operationsManagement(),
    globalBusinessDecisionAnalysis()
  ];
  const expectedCourseCounts = [39, 41, 30, 32, 38];
  programmes.forEach((programme, index) => {
    const codes = programme.courseGroups.flatMap((group) => group.courses.map((item) => item.code));
    assert.equal(codes.length, expectedCourseCounts[index], `${programme.programmeId} course count changed`);
    assert.equal(new Set(codes).size, codes.length, `${programme.programmeId} repeats a course code`);
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
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((count, programme) => count + programme.courseGroups.flatMap((group) => group.courses).length, 0)
  }));
}

if (require.main === module) main();

module.exports = { OM_TRACKS, buildSupplement };
