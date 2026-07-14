const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-engineering-2025-2026.json');
const SOURCE = 'https://engg.hku.hk/Portals/0/MSc%28Eng%29_Syl_2025-26_20250812_v3_approved_1.pdf';

function course(code, name, subjectGroups, extra = {}) {
  return { code, name, credits: 6, subjectGroups, appliesToTrackIds: [], ...extra };
}

const civilGroups = {
  general: [
    ['CIVL6007', 'Behavioural travel demand modelling'],
    ['CIVL6009', 'Building planning and control'],
    ['CIVL6014', 'Construction dispute resolution'],
    ['CIVL6015', 'Construction financial management'],
    ['CIVL6037', 'Project management - human and organisational factors'],
    ['CIVL6046', 'Theory of traffic flow'],
    ['CIVL6047', 'Traffic management and control'],
    ['CIVL6049', 'Urban development management by engineering approach'],
    ['CIVL6054', 'Engineering for transport systems'],
    ['CIVL6058', 'Management of infrastructure megaprojects'],
    ['CIVL6059', 'Special topic in infrastructure project management'],
    ['CIVL6060', 'Operation and maintenance of building and civil engineering works'],
    ['CIVL7005', 'Sustainable construction technology: principles and practices'],
    ['CIVL7006', 'Optimization techniques for transportation applications'],
    ['CIVL7007', 'Building information modelling (BIM): Theories, development and application'],
    ['CIVL7018', 'Data science for civil engineering'],
    ['CIVL7019', 'Statistical methods for civil engineering'],
    ['CIVL7021', 'NEC contract management']
  ],
  environmental: [
    ['CIVL6005', 'Data analysis in hydrology'],
    ['CIVL6006', 'Advanced water and wastewater treatment'],
    ['CIVL6023', 'Environmental chemistry'],
    ['CIVL6025', 'Environmental impact assessment of engineering projects'],
    ['CIVL6029', 'Groundwater hydrology'],
    ['CIVL6034', 'Municipal wastewater treatment'],
    ['CIVL6040', 'Solid and hazardous waste management engineering'],
    ['CIVL6050', 'Urban hydrology and hydraulics'],
    ['CIVL6053', 'Wind engineering'],
    ['CIVL6061', 'Special topic in environmental engineering A'],
    ['CIVL6062', 'Special topic in environmental engineering B'],
    ['CIVL6081', 'Recent advances in water and environmental engineering'],
    ['CIVL7022', 'Carbon neutral engineering'],
    ['MEBS6004', 'Built environment'],
    ['MEBS6010', 'Indoor air quality'],
    ['MECH6017', 'Noise and vibration'],
    ['MECH6019', 'Sources and control of air pollution']
  ],
  geotechnical: [
    ['CIVL6004', 'Advanced soil mechanics'],
    ['CIVL6025', 'Environmental impact assessment of engineering projects'],
    ['CIVL6026', 'Finite element method'],
    ['CIVL6027', 'Foundation engineering'],
    ['CIVL6028', 'Ground improvement'],
    ['CIVL6043', 'Special topic in geotechnical engineering A'],
    ['CIVL6044', 'Special topic in geotechnical engineering B'],
    ['CIVL6077', 'Ground investigation and soil testing'],
    ['CIVL6078', 'Rock mechanics and rock engineering'],
    ['CIVL6079', 'Slope engineering'],
    ['CIVL6083', 'Practical design and construction of tunnels in Hong Kong'],
    ['CIVL7002', 'Geotechnical analysis and case histories'],
    ['CIVL7010', 'Advanced engineering geology']
  ],
  structural: [
    ['CIVL6003', 'Advanced reinforced concrete structure design'],
    ['CIVL6008', 'Bridge engineering'],
    ['CIVL6009', 'Building planning and control'],
    ['CIVL6013', 'Concrete technology'],
    ['CIVL6025', 'Environmental impact assessment of engineering projects'],
    ['CIVL6026', 'Finite element method'],
    ['CIVL6027', 'Foundation engineering'],
    ['CIVL6045', 'Tall building structures'],
    ['CIVL6053', 'Wind engineering'],
    ['CIVL6060', 'Operation and maintenance of building and civil engineering works'],
    ['CIVL6063', 'Special topic in structural engineering A'],
    ['CIVL6064', 'Special topic in structural engineering B'],
    ['CIVL6080', 'Fire engineering design of structures'],
    ['CIVL7003', 'Space structures'],
    ['CIVL7008', 'Seismic analysis for building structures'],
    ['CIVL7015', 'Durability design of concrete structures'],
    ['CIVL7020', 'Advanced prestressed concrete']
  ]
};

const civilConstructionManagementCodes = new Set([
  'CIVL6014', 'CIVL6015', 'CIVL6037', 'CIVL6049', 'CIVL6058', 'CIVL7005', 'CIVL7007'
]);

function flattenOfficialGroups(groups) {
  const byCode = new Map();
  Object.entries(groups).forEach(([group, entries]) => {
    entries.forEach(([code, name]) => {
      const existing = byCode.get(code);
      if (existing) {
        assert.equal(existing.name, name, `${code} has inconsistent official names`);
        existing.subjectGroups.push(group);
      } else {
        byCode.set(code, course(code, name, [group]));
      }
    });
  });
  return [...byCode.values()];
}

const civilCourses = flattenOfficialGroups(civilGroups).map((item) => ({
  ...item,
  ...(civilConstructionManagementCodes.has(item.code) ? { constructionManagement: true } : {})
}));

const bseCourses = [
  course('MEBS6000', 'Utility services', ['list-a']),
  course('MEBS6001', 'Electrical installations', ['list-a']),
  course('MEBS6002', 'Lighting engineering', ['list-a']),
  course('MEBS6003', 'Project management', ['list-a']),
  course('MEBS7012', 'Air conditioning and refrigeration', ['list-a']),
  course('MEBS7013', 'Fire service installations', ['list-a']),
  course('MEBS6004', 'Built environment', ['list-b']),
  course('MEBS6005', 'Building automation systems', ['list-b']),
  course('MEBS6010', 'Indoor air quality', ['list-b']),
  course('MEBS6011', 'Maintenance and management of building facilities', ['list-b']),
  course('MEBS6013', 'Testing and commissioning', ['list-b']),
  course('MEBS6014', 'Computer modelling and simulation', ['list-b']),
  course('MEBS6015', 'Natural and hybrid ventilation of buildings', ['list-b']),
  course('MEBS6016', 'Energy performance of buildings', ['list-b']),
  course('MEBS6017', 'Building intelligence', ['list-b']),
  course('MEBS6018', 'Clean electrical energy and smart-grids for buildings', ['list-b']),
  course('MEBS6019', 'Extra-low-voltage electrical systems in buildings', ['list-b']),
  course('MEBS6020', 'Sustainable building design', ['list-b']),
  course('MEBS7010', 'Vertical transportation and drive', ['list-b']),
  course('MEBS7011', 'Communication technology in building services', ['list-b']),
  course('MEBS7014', 'Advanced HVAC applications', ['list-b']),
  course('MEBS7015', 'Fire science and smoke control', ['list-b']),
  course('MECH7012', 'Principles of engineering management', ['list-b'])
];

const eeeGroups = {
  general: [
    ['ELEC6008', 'Pattern recognition and machine learning'],
    ['ELEC6027', 'Integrated circuit systems design'],
    ['ELEC6036', 'High-performance computer architecture'],
    ['ELEC6049', 'Digital system design techniques'],
    ['ELEC6063', 'Optoelectronics and lightwave technology'],
    ['ELEC6067', 'Magnetic resonance imaging (MRI) technology and applications'],
    ['ELEC6079', 'Biomedical ultrasound'],
    ['ELEC6081', 'Biomedical signals and systems'],
    ['ELEC6092', 'Green project management'],
    ['ELEC6105', 'Magnetics engineering for data storage and emerging applications'],
    ['ELEC6106', 'From AI software to hardware: an introduction of machine learning and EDA'],
    ['ELEC6601', 'Industrial marketing'],
    ['ELEC6602', 'Business venture in China'],
    ['ELEC6603', 'Success in industrial entrepreneurship'],
    ['ELEC6604', 'Neural networks, fuzzy systems and genetic algorithms'],
    ['ELEC7029', 'Analog IC design, computing and memories'],
    ['ELEC7030', 'Advanced CMOS analog/RF IC design'],
    ['ELEC7043', 'Digital image processing and computer vision'],
    ['ELEC7075', 'Advanced topics on circuits and systems'],
    ['ELEC7078', 'Advanced topics in electrical and electronic engineering'],
    ['ELEC7079', 'Investment and trading for engineering students'],
    ['ELEC7080', 'Algorithmic trading and high frequency trading'],
    ['ELEC7081', 'Advanced topics in computational finance'],
    ['ELEC7082', 'Artificial intelligence in finance'],
    ['ELEC7083', 'Distributed systems'],
    ['ELEC7084', 'Advanced database'],
    ['ELEC7086', 'Analog and mixed-signal IC for AI circuits'],
    ['ELEC7088', 'Artificial intelligence computing by edge processor']
  ],
  communications: [
    ['ELEC6006', 'Communications policy and regulations'],
    ['ELEC6026', 'Digital signal processing'],
    ['ELEC6065', 'Data compression'],
    ['ELEC6080', 'Telecommunications systems and management'],
    ['ELEC6097', 'IP networks'],
    ['ELEC6098', 'Electronic and mobile commerce'],
    ['ELEC6099', 'Wireless communications and networking'],
    ['ELEC6100', 'Digital communications'],
    ['ELEC6103', 'Satellite communications'],
    ['ELEC7051', 'Advanced topics in communication theory and systems'],
    ['ELEC7077', 'Advanced topics in multimedia signals and systems'],
    ['ELEC7085', 'Advanced satellite engineering and new space economy']
  ],
  power: [
    ['ELEC6084', 'Power delivery management for metropolitan cities'],
    ['ELEC6085', 'The role of a computerized SCADA system in power system operation'],
    ['ELEC6095', 'Smart grid'],
    ['ELEC7011', 'Energy Internet'],
    ['ELEC7012', 'Power systems practicum'],
    ['ELEC7013', 'Leadership in future energy industry'],
    ['ELEC7014', 'Building information modelling for E&M engineers'],
    ['ELEC7055', 'Power distribution systems'],
    ['ELEC7402', 'Advanced electric vehicle technology'],
    ['ELEC7403', 'Advanced power electronics'],
    ['ELEC7404', 'Advanced railway engineering'],
    ['ELEC7405', 'Advanced signaling systems for railway'],
    ['ELEC7408', 'Power, control and signalling facilities for high-speed trains'],
    ['ELEC7456', 'Advanced power system operation'],
    ['ELEC7466', 'Advanced topics in power system engineering'],
    ['ELEC7467', 'Power system protection'],
    ['ELEC7468', 'Metropolitan mass transit transportation'],
    ['ELEC7469', 'Advanced electrical energy and power conversion systems'],
    ['ELEC7470', 'Advanced optimization and control strategies in modern power systems'],
    ['MEBS6001', 'Electrical installations'],
    ['MEBS6019', 'Extra-low-voltage electrical systems in buildings']
  ]
};

const eeeCourses = Object.fromEntries(Object.entries(eeeGroups).map(([key, entries]) => [
  key,
  entries.map(([code, name]) => course(code, name, [key]))
]));

function group(id, name, type, ruleText, courses, extra = {}) {
  return { id, name, type, ruleText, appliesToTrackIds: [], sourceUrl: SOURCE, courses, ...extra };
}

function civilProgramme(programmeId, stream) {
  const streamLabels = {
    general: 'General',
    environmental: 'Environmental Engineering',
    geotechnical: 'Geotechnical Engineering',
    structural: 'Structural Engineering'
  };
  const focus = stream === 'general'
    ? 'Complete at least 36 discipline-course credits from official Groups A to D. Complete eight taught courses (48 credits) in total; no more than 12 credits may be approved external electives. General Stream students may take no more than four construction-management courses marked in Group A.'
    : `Complete at least 36 discipline-course credits from official Groups A to D, including at least 24 credits (four courses) in the ${streamLabels[stream]} subject group. Complete eight taught courses (48 credits) in total; no more than 12 credits may be approved external electives.`;
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl: SOURCE,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      group('discipline-courses', 'Discipline Courses - Official Groups A to D', 'discipline', focus, civilCourses.map((item) => ({
        ...item,
        ...(stream !== 'general' ? { streamSpecific: item.subjectGroups.includes(stream) } : {})
      })), { creditsRequired: 36 }),
      group('capstone-experience', 'Capstone Experience', 'dissertation', stream === 'general'
        ? 'Complete CIVL7009 Dissertation (24 credits) in any area of civil engineering.'
        : `Complete CIVL7009 Dissertation (24 credits) in the ${streamLabels[stream]} area. The dissertation-area requirement requires manual audit review.`, [
        { code: 'CIVL7009', name: 'Dissertation', credits: 24, courseKind: 'dissertation', appliesToTrackIds: [] }
      ], { creditsRequired: 24, coursesRequired: 1 })
    ]
  };
}

function bseProgramme() {
  return {
    programmeId: 'HKU-TPG-032',
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl: SOURCE,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      group('discipline-courses', 'Discipline Courses - Lists A and B', 'discipline', 'Complete eight taught courses (48 credits), including at least three courses (18 credits) from List A. No more than three courses (18 credits) may be approved external electives. The List A minimum and external-elective approvals require manual audit review.', bseCourses, { creditsRequired: 48, coursesRequired: 8 }),
      group('capstone-experience', 'Capstone Experience', 'dissertation', 'Complete MEBS6023 Dissertation (24 credits). Its prerequisite requires two specified List A courses; the co-requisite exception for full-time Year 1 students requires manual audit review.', [
        { code: 'MEBS6023', name: 'Dissertation', credits: 24, courseKind: 'dissertation', appliesToTrackIds: [] }
      ], { creditsRequired: 24, coursesRequired: 1 })
    ]
  };
}

function eeeProgramme(programmeId, stream) {
  const labels = { general: 'General', communications: 'Communications Engineering', power: 'Power Engineering' };
  const pool = stream === 'general' ? [...eeeCourses.general, ...eeeCourses.communications, ...eeeCourses.power] : eeeCourses[stream];
  const subjectRule = stream === 'general' ? 'official Groups A, B or C' : `official Group ${stream === 'communications' ? 'B' : 'C'} ${labels[stream]}`;
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl: SOURCE,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      group('discipline-courses', `Discipline Courses - ${labels[stream]} Stream`, 'discipline', `For the Project path, complete at least 36 credits from ${subjectRule}; up to 24 credits may be approved electives. For the Dissertation path, complete at least 30 credits from ${subjectRule}; up to 18 credits may be approved electives. The path-dependent minimum and external approvals require manual audit review.`, pool, { creditsRequired: 30 }),
      group('capstone-experience', 'Capstone Experience', 'project_or_dissertation', 'Complete either ELEC7022 Project (12 credits) with ten taught courses, or ELEC7021 Dissertation (24 credits) with eight taught courses. ELEC7023 Capstone Workshop (0 credits) is also compulsory. The mutually exclusive paths require manual audit review.', [
        { code: 'ELEC7021', name: 'Dissertation', credits: 24, courseKind: 'dissertation', appliesToTrackIds: [] },
        { code: 'ELEC7022', name: 'Project', credits: 12, courseKind: 'project', appliesToTrackIds: [] },
        { code: 'ELEC7023', name: 'Capstone Workshop', credits: 0, courseKind: 'workshop', appliesToTrackIds: [] }
      ]),
      group('professional-development', 'Professional Development', 'optional_non_counting', 'ELEC7900 is optional and does not count toward the curriculum requirements or degree classification.', [
        { code: 'ELEC7900', name: 'Leadership training in engineering professionals', credits: 0, courseKind: 'optional', appliesToTrackIds: [] }
      ])
    ]
  };
}

function buildSupplement() {
  assert.equal(civilCourses.length, 58, 'HKU Civil official course pool changed');
  assert.equal(bseCourses.length, 23, 'HKU Building Services official course pool changed');
  assert.deepEqual(Object.fromEntries(Object.entries(eeeCourses).map(([key, items]) => [key, items.length])), { general: 28, communications: 12, power: 21 });
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-14',
    programmes: [
      bseProgramme(),
      civilProgramme('HKU-TPG-033', 'environmental'),
      civilProgramme('HKU-TPG-034', 'general'),
      civilProgramme('HKU-TPG-035', 'geotechnical'),
      civilProgramme('HKU-TPG-036', 'structural'),
      eeeProgramme('HKU-TPG-037', 'communications'),
      eeeProgramme('HKU-TPG-038', 'general'),
      eeeProgramme('HKU-TPG-039', 'power')
    ]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: supplement.programmes.length,
    civilCourses: civilCourses.length,
    bseCourses: bseCourses.length,
    eeeCourses: Object.fromEntries(Object.entries(eeeCourses).map(([key, items]) => [key, items.length]))
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, civilCourses, bseCourses, eeeCourses };
