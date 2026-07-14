const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-architecture-first-batch-2025-2026.json');
const source = (ref) => `https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=${ref}&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y`;

const categoryIds = {
  I: 'history-and-theory',
  II: 'urbanisation-and-habitation',
  III: 'technology-and-sustainability',
  IV: 'digital-media-and-fabrication',
  V: 'practice-and-management'
};

const marchElectiveRows = [
  ['ARCH7094', 'Global Perspectives in Architectural History', 'I'],
  ['ARCH7116', 'Urban Acupuncture', 'I'],
  ['ARCH7118', 'Buddhism, Architecture and Buddhist Architecture', 'I'],
  ['ARCH7119', 'Politics of / Space / of Performance', 'I'],
  ['ARCH7124', 'Utopian Architecture and the French Revolution', 'I'],
  ['ARCH7125', 'History, Theory and Society', 'I'],
  ['ARCH7147', 'Reflective Projections', 'I'],
  ['ARCH7160', 'The Modern Movement and Beyond', 'I'],
  ['ARCH7161', 'Vernacular Architecture of Asia', 'I'],
  ['ARCH7162', 'Architecture and Memory', 'I'],
  ['ARCH7163', 'Architectural Histories: Typology and Spaces of Cave Temples', 'I'],
  ['ARCH7164', 'ReBuilding Utopia: Visions of Architecture in the Post-War World', 'I'],
  ['ARCH7165', 'Modern Architecture and the Visual Realm', 'I'],
  ['ARCH7166', 'Research Seminar in Visual Cultures', 'I'],
  ['ARCH7167', 'Topics in Modernism', 'I'],
  ['ARCH7173', 'History of Modern Architecture', 'I'],
  ['ARCH7175', 'Architectural Studies Field Workshop', 'I'],
  ['ARCH7177', 'Critical Readings in Modernism', 'I'],
  ['ARCH7179', 'Architects and Politics: Exhibiting Politics', 'I'],
  ['ARCH7180', 'Topics in Architectural History and Theory', 'I'],
  ['ARCH7183', 'Topics in Architectural History, Theory and Criticism', 'I'],
  ['ARCH7184', 'Beyond the Border: Early Modernist Chinese Architects in the South', 'I'],
  ['ARCH7269', 'Architecture and the City', 'I'],
  ['ARCH7380', 'Republic of Excess: Korea and Contradiction', 'I'],
  ['ARCH7401', 'Real Utopias', 'I'],
  ['ARCH7404', 'Japan, Architecture, Myth: Unmasking Its Form and Content', 'I'],
  ['ARCH7406', 'Architects and their Chairs', 'I'],
  ['ARCH7260', 'Housing in Urban Development', 'II'],
  ['ARCH7264', 'Contemporary Urbanism', 'II'],
  ['ARCH7266', 'Globalization and Resistance in Architecture', 'II'],
  ['ARCH7268', 'Urbanism Field Workshop', 'II'],
  ['ARCH7270', 'The “Navel” of the Earth', 'II'],
  ['ARCH7271', 'Composed Grounds', 'II'],
  ['ARCH7273', 'Topics in Urban/Rural Studies', 'II'],
  ['ARCH7274', 'Topics in Urban Studies', 'II'],
  ['ARCH7275', 'A Visual Diary of Paris: Observe, Read, Collect, Draw, Record', 'II'],
  ['ARCH7276', 'City Metamorphosis: Urban Residual Space', 'II'],
  ['ARCH7277', 'Refugee Camp Design', 'II'],
  ['ARCH7278', 'Open Building in Transition', 'II'],
  ['ARCH7279', 'Matter, Density and Projection', 'II'],
  ['ARCH7280', 'Territories of Spatial Rituals', 'II'],
  ['ARCH7282', 'Urbanisation and Habitation', 'II'],
  ['ARCH7402', 'Propositions for Planetary Living-II', 'II'],
  ['ARCH7265', 'Inter Cities', 'III'],
  ['ARCH7330', 'Principles of Building', 'III'],
  ['ARCH7331', 'Introduction to Building Structures', 'III'],
  ['ARCH7332', 'Building Construction and Practice', 'III'],
  ['ARCH7355', 'Designing Care in the Commons', 'III'],
  ['ARCH7356', 'Nordic Latitudes', 'III'],
  ['ARCH7357', 'Impossible Architecture', 'III'],
  ['ARCH7358', 'Technology and Sustainability', 'III'],
  ['ARCH7360', 'Building Structures and Systems', 'III'],
  ['ARCH7361', 'Sustainable Building Systems', 'III'],
  ['ARCH7364', 'Nonspace: Materials, Processes, and Constructions', 'III'],
  ['ARCH7365', 'Design Research on Architecture and the Environment', 'III'],
  ['ARCH7375', 'Design After Nature', 'III'],
  ['ARCH7376', 'Inhabitable Territories', 'III'],
  ['ARCH7377', 'Concrete Approximations', 'III'],
  ['ARCH7378', 'Topics in Architectural Technologies', 'III'],
  ['ARCH7379', 'Performative Envelopes', 'III'],
  ['ARCH7382', 'Floating Marine Laboratory', 'III'],
  ['ARCH7384', 'Deep Drawing', 'III'],
  ['ARCH7385', 'Building in Common', 'III'],
  ['ARCH7403', 'Material History', 'III'],
  ['ARCH7476', 'Generative Design in Architecture', 'III'],
  ['ARCH7563', 'Community Building Workshop', 'III'],
  ['ARCH7460', 'Computer Graphics for Architects', 'IV'],
  ['ARCH7462', 'Computer-Aided Architectural Design Methods (CAAD Methods)', 'IV'],
  ['ARCH7465', 'Digital Media and Methods', 'IV'],
  ['ARCH7466', 'Parametric Structures', 'IV'],
  ['ARCH7467', 'Making Ways and Ways of Making', 'IV'],
  ['ARCH7469', 'Explorative Architecture Techniques', 'IV'],
  ['ARCH7470', 'Architecture By Nature', 'IV'],
  ['ARCH7471', 'Material Fabrications', 'IV'],
  ['ARCH7472', 'Topics in Advanced Technology', 'IV'],
  ['ARCH7474', 'Structural Research - Gridshells', 'IV'],
  ['ARCH7475', 'Visual Practices', 'IV'],
  ['ARCH7477', '3D Printed Matter', 'IV'],
  ['ARCH7478', 'Bending Bamboo Rules', 'IV'],
  ['ARCH7479', 'Temporary Site-Specific Installation', 'IV'],
  ['ARCH7480', 'Transfer - Structural Transformations', 'IV'],
  ['ARCH7481', 'Prototyping Play', 'IV'],
  ['ARCH7482', 'Digital Media and Fabrication', 'IV'],
  ['ARCH7405', 'Research on Participatory Design in Architecture', 'V'],
  ['ARCH7560', 'Aspects of Contract Management', 'V'],
  ['ARCH7561', 'Principles and Practices of Building Codes', 'V'],
  ['ARCH7564', 'Building Information Modelling in Architectural Practice', 'V'],
  ['ARCH7565', 'Introduction to Building Information Modelling and Management', 'V'],
  ['ARCH7568', 'Design Practice Field Workshop', 'V'],
  ['ARCH7569', 'Materials, Services and Structure - A Comprehensive Study', 'V'],
  ['ARCH7570', 'Project Management by Architect', 'V'],
  ['ARCH7571', 'Practice and Management', 'V'],
  ['ARCH7573', 'Architecture as Construction in Hong Kong', 'V'],
  ['ARCH7180', 'Topics in Architectural History and Theory', 'III'],
  ['ARCH7563', 'Community Building Workshop', 'V']
];

const designExcludedElectiveCodes = new Set(['ARCH7147', 'ARCH7279', 'ARCH7280', 'ARCH7330', 'ARCH7331', 'ARCH7465']);

const marchDesignCoreRows = [
  ['ARCH7073', 'Professional Practice I', 6],
  ['ARCH7074', 'Architecture and Its Discourses', 6],
  ['ARCH7075', 'Design and Technology of Sustainable Buildings', 6],
  ['ARCH7076', 'Advanced Structural Systems', 6],
  ['ARCH7077', 'Design and Construction Communication', 6],
  ['ARCH7079', 'Design 9', 12],
  ['ARCH7080', 'Design 10', 12],
  ['ARCH7081', 'Design 11', 18],
  ['ARCH7082', 'Design 12', 18],
  ['ARCH7093', 'Summer Studio', 6],
  ['ARCH7117', 'The Count-Down Town: Hong Kong Architecture & Urbanism from the 1840s to the Present', 6],
  ['ARCH7330', 'Principles of Building', 6],
  ['ARCH7331', 'Introduction to Building Structures', 6],
  ['ARCH7465', 'Digital Media and Methods', 6],
  ['ARCH8073', 'Professional Practice II', 6],
  ['ARCH8075', 'Design Methods', 6],
  ['ARCH8083', 'Design 13', 18],
  ['ARCH8084', 'Design 14', 18]
];

const marchCoreRows = [
  ['ARCH7073', 'Professional Practice I', 6],
  ['ARCH7074', 'Architecture and Its Discourses', 6],
  ['ARCH7075', 'Design and Technology of Sustainable Buildings', 6],
  ['ARCH7076', 'Advanced Structural Systems', 6],
  ['ARCH7077', 'Design and Construction Communication', 6],
  ['ARCH7081', 'Design 11', 18],
  ['ARCH7082', 'Design 12', 18],
  ['ARCH7117', 'The Count-Down Town: Hong Kong Architecture & Urbanism from the 1840s to the Present', 6],
  ['ARCH8073', 'Professional Practice II', 6],
  ['ARCH8075', 'Design Methods', 6],
  ['ARCH8083', 'Design 13', 18],
  ['ARCH8084', 'Design 14', 18]
];

const landscapeCoreRows = [
  ['LAND7131', 'MLA Design Studio I', 12, 'first-year'],
  ['LAND7132', 'MLA Design Studio II', 12, 'first-year'],
  ['LAND7152', 'Landscape Plants and Ecology I', 6, 'first-year'],
  ['LAND7151', 'Landscape Technology I', 6, 'first-year'],
  ['LAND7255', 'Landscape Plants and Ecology II', 6, 'first-year'],
  ['LAND7141', 'Landscape History and Theory I', 6, 'first-year'],
  ['LAND7142', 'Landscape History and Theory II', 6, 'first-year'],
  ['LAND7176', 'Landscape Media', 6, 'first-year'],
  ['LAND7233', 'MLA Design Studio III', 12, 'second-year'],
  ['LAND7291', 'Thesis Prep', 6, 'second-year'],
  ['LAND7299', 'Landscape Thesis', 12, 'second-year'],
  ['LAND7156', 'Landscape Technology II', 6, 'second-year'],
  ['LAND7281', 'Landscape Architecture Practice', 6, 'second-year']
];

const landscapeElectiveRows = [
  ['LAND7349', 'Chinese Landscapes', 'history-and-theory'],
  ['LAND7348', 'Case Studies in Contemporary Landscape Architecture', 'history-and-theory'],
  ['LAND7341', 'Advanced Topics in Landscape Architecture History', 'history-and-theory'],
  ['LAND7342', 'Advanced Topics in Landscape Architecture Theory', 'history-and-theory'],
  ['LAND7343', 'Advanced Topics in Urbanism', 'history-and-theory'],
  ['LAND7344', 'Research Seminar in Landscape Architectural History I', 'history-and-theory'],
  ['LAND7345', 'Research Seminar in Landscape Architectural History II', 'history-and-theory'],
  ['LAND7346', 'Reading Seminar in Landscape Architecture II', 'history-and-theory'],
  ['LAND7359', 'Components of Sustainable Landscape Design', 'technology-and-sustainability'],
  ['LAND7305', 'Horticulture and Design', 'technology-and-sustainability'],
  ['LAND7389', 'Landscape Practicum', 'technology-and-sustainability'],
  ['LAND7306', 'Urban Arboriculture', 'technology-and-sustainability'],
  ['LAND7351', 'Advanced Topics in Technology', 'technology-and-sustainability'],
  ['LAND7307', 'Advanced Topics in Sustainability', 'technology-and-sustainability'],
  ['LAND7352', 'Research Seminar in Landscape Technology', 'technology-and-sustainability'],
  ['LAND7308', 'Advanced Topics in Digital Media and Fabrication', 'digital-media-and-fabrication'],
  ['LAND7309', 'Research Seminar in Digital Media and Fabrication', 'digital-media-and-fabrication'],
  ['LAND7381', 'Advanced Topics in Landscape and Urban Research Methods', 'landscape-and-urban-research-methods'],
  ['LAND7386', 'Reading Topics in Landscape Architecture I', 'landscape-and-urban-research-methods'],
  ['LAND7391', 'Independent Study I', 'independent-studies']
];

function course(code, name, credits, extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function uniqueElectiveRows(rows) {
  const seen = new Map();
  rows.forEach(([code, name, category]) => {
    if (!seen.has(code)) seen.set(code, { code, name, categories: [] });
    const row = seen.get(code);
    if (!row.categories.includes(categoryIds[category])) row.categories.push(categoryIds[category]);
  });
  return [...seen.values()];
}

function buildMarchElectives(rows, conditionalCodes) {
  return uniqueElectiveRows(rows).map((row) => course(row.code, row.name, 6, {
    subjectGroups: row.categories,
    ...(conditionalCodes.includes(row.code) ? { conditionalRequirement: true } : {})
  }));
}

function buildMarchDesign() {
  const sourceUrl = source('R344');
  const rows = marchElectiveRows.filter(([code]) => !designExcludedElectiveCodes.has(code));
  return {
    programmeId: 'HKU-TPG-001', status: 'verified', creditsRequired: 204, creditUnit: 'credits', sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The detailed course table totals 168 Core credits plus 36 Elective credits, matching the 204-credit Programme total. The syllabus overview separately states 156 Core credits; this internal official-source conflict requires manual review.',
    courseGroups: [
      {
        id: 'core-courses', name: 'Core Courses', type: 'core', creditsRequired: 168, coursesRequired: 18,
        ruleText: 'Complete all 18 Core Courses shown in the detailed official course table. ARCH8084 Design 14 is the thesis-studio Capstone experience.',
        appliesToTrackIds: [], sourceUrl,
        courses: marchDesignCoreRows.map(([code, name, credits]) => course(code, name, credits, code === 'ARCH8084' ? { courseKind: 'project' } : {}))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 36, coursesRequired: 6,
        ruleText: 'Complete six 6-credit electives, normally no more than two from any one of the five categories. Candidates without approved prior equivalents must include ARCH7332, ARCH7573, one of ARCH7094/ARCH7173, and one of ARCH7260/ARCH7264/ARCH7269. Equivalence waivers, category limits and up to two approved Faculty electives require manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: buildMarchElectives(rows, ['ARCH7332', 'ARCH7573', 'ARCH7094', 'ARCH7173', 'ARCH7260', 'ARCH7264', 'ARCH7269'])
      }
    ]
  };
}

function buildMarch(programmeId, ref) {
  const sourceUrl = source(ref);
  return {
    programmeId, status: 'verified', creditsRequired: 144, creditUnit: 'credits', sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'core-courses', name: 'Core Courses', type: 'core', creditsRequired: 120, coursesRequired: 12,
        ruleText: 'Complete all 12 Core Courses for 120 credits. ARCH8084 Design 14 is the thesis-studio Capstone experience.',
        appliesToTrackIds: [], sourceUrl,
        courses: marchCoreRows.map(([code, name, credits]) => course(code, name, credits, code === 'ARCH8084' ? { courseKind: 'project' } : {}))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 24, coursesRequired: 4,
        ruleText: 'Complete four 6-credit electives, normally no more than two from any one category. Prior-study gaps may require one or more of ARCH7094, ARCH7173, ARCH7330, ARCH7331 or ARCH7332, and ARCH7465 is required without an approved equivalent. Conditional gap courses, waivers and up to one approved Faculty elective require manual audit review and must not be added automatically to the 144-credit base total.',
        appliesToTrackIds: [], sourceUrl,
        courses: buildMarchElectives(marchElectiveRows, ['ARCH7094', 'ARCH7173', 'ARCH7330', 'ARCH7331', 'ARCH7332', 'ARCH7465'])
      }
    ]
  };
}

function buildLandscapeArchitecture() {
  const sourceUrl = source('R67');
  const firstYear = landscapeCoreRows.filter((row) => row[3] === 'first-year');
  const secondYear = landscapeCoreRows.filter((row) => row[3] === 'second-year');
  return {
    programmeId: 'HKU-TPG-005', status: 'verified', creditsRequired: 120, creditUnit: 'credits', sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'first-year-core-courses', name: 'First Year Core Courses', type: 'core', creditsRequired: 60, coursesRequired: 8,
        ruleText: 'Complete all eight First Year Core Courses for 60 credits.', appliesToTrackIds: [], sourceUrl,
        courses: firstYear.map(([code, name, credits]) => course(code, name, credits))
      },
      {
        id: 'second-year-core-and-capstone', name: 'Second Year Core and Capstone Courses', type: 'core', creditsRequired: 42, coursesRequired: 5,
        ruleText: 'Complete all five listed Second Year courses for 42 credits. LAND7291 Thesis Prep and LAND7299 Landscape Thesis together form the Capstone experience.', appliesToTrackIds: [], sourceUrl,
        courses: secondYear.map(([code, name, credits]) => course(code, name, credits, ['LAND7291', 'LAND7299'].includes(code) ? { courseKind: 'project' } : {}))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 18, coursesRequired: 3,
        ruleText: 'Complete three 6-credit electives. No more than three may be chosen from any one of Categories I-IV and no more than two from Category V. Offering availability and approved Faculty electives require manual audit review.', appliesToTrackIds: [], sourceUrl,
        courses: landscapeElectiveRows.map(([code, name, category]) => course(code, name, 6, { subjectGroups: [category] }))
      }
    ]
  };
}

function buildSupplement() {
  const regularElectives = uniqueElectiveRows(marchElectiveRows);
  const designElectives = regularElectives.filter((row) => !designExcludedElectiveCodes.has(row.code));
  assert.equal(regularElectives.length, 93);
  assert.equal(designElectives.length, 87);
  assert.equal(marchDesignCoreRows.reduce((sum, row) => sum + row[2], 0), 168);
  assert.equal(marchCoreRows.reduce((sum, row) => sum + row[2], 0), 120);
  assert.equal(landscapeCoreRows.reduce((sum, row) => sum + row[2], 0), 102);
  assert.equal(landscapeElectiveRows.length, 20);
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-14',
    programmes: [buildMarchDesign(), buildMarch('HKU-TPG-002', 'R84'), buildMarch('HKU-TPG-003', 'R399'), buildLandscapeArchitecture()]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, file: path.basename(OUTPUT), programmes: supplement.programmes.length }));
}

if (require.main === module) main();
module.exports = { buildSupplement, marchElectiveRows, landscapeElectiveRows };
