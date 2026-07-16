const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-law-second-batch-2025.json');
const SOURCES = {
  cr: 'https://dm.law.hku.hk/wp-content/uploads/LLMCR_Reg_Syll_2025-26.pdf',
  cfl: 'https://dm.law.hku.hk/wp-content/uploads/LLMCFL_Reg_Syll_2025-26.pdf',
  hr: 'https://dm.law.hku.hk/wp-content/uploads/LLMHR_Reg_Syll_2025-26.pdf',
  tipl: 'https://dm.law.hku.hk/wp-content/uploads/LLMTIPL_Reg_Syll_2025-26.pdf'
};

const crFoundationRows = [
  ['LLAW6255', 'Compliance and financial markets', 9],
  ['LLAW6254', 'Compliance: regulation in practice', 9]
];

const crCapstoneRows = [
  ['LLAW6054', '9-credit dissertation', 9],
  ['LLAW6014', '18-credit dissertation', 18],
  ['LLAW6245', 'Compliance in the Hong Kong securities industry', 9],
  ['LLAW6127', 'Current issues in financial law', 9],
  ['LLAW6312', 'Legal and regulatory aspects of financial risk management', 9],
  ['LLAW6244', 'Securities regulation II', 9]
];

const crCoreRows = [
  ['LLAW6153', 'Business and human rights', 9],
  ['LLAW6025', 'China company law', 9],
  ['LLAW6257', 'Compliance for listed companies', 9],
  ['LLAW6088', 'Derivatives: law and regulation', 9],
  ['LLAW6303', 'EU financial regulation and technology', 9],
  ['LLAW6282', 'Financial crime: governance, risk and compliance', 9],
  ['LLAW6222', 'Financial dispute resolution: Hong Kong and international perspectives', 9],
  ['LLAW6107', 'Insurance law', 9],
  ['LLAW6133', 'International economic law', 9],
  ['LLAW6057', 'International securities law', 9],
  ['LLAW6110', 'Law and regulation of banking and insurance in the People’s Republic of China', 9],
  ['LLAW6239', 'Law and regulation of private banking and wealth management', 9],
  ['LLAW6256', 'Law of anti-money laundering and counter-terrorist financing and compliance issues', 9],
  ['LLAW6046', 'Privacy and data protection', 9],
  ['LLAW6049', 'Securities regulation I', 9]
];

const crSpecializedRows = [
  ['LLAW6022', 'Advanced research methodology', 9],
  ['LLAW6304', 'AI and competition law', 9],
  ['LLAW6139', 'China information technology and electronic commerce law', 9],
  ['LLAW6185', 'China investment law', 9],
  ['LLAW6186', 'China trade law', 9],
  ['LLAW6124', 'Communications law', 9],
  ['LLAW6279', 'Comparative corporate law and theories', 9],
  ['LLAW6187', 'Competition law and intellectual property', 9],
  ['LLAW6264', 'Competition law and policy in China', 9],
  ['LLAW6154', 'Competition law I', 9],
  ['LLAW6155', 'Competition law II', 9],
  ['LLAW6194', 'Competition law in the digital economy', 9],
  ['LLAW6101', 'Competition, mergers and acquisitions', 9],
  ['LLAW6141', 'Contemporary issues of comparative platform governance', 9],
  ['LLAW6082', 'Corporate governance and shareholder remedies', 9],
  ['LLAW6171', 'Corruption: China in comparative perspective', 9],
  ['LLAW6002', 'Credit and security law', 9],
  ['LLAW6084', 'Cross-border insolvency law', 9],
  ['LLAW6114', 'Cross-border legal relations between the Mainland and Hong Kong (in Putonghua)', 9],
  ['LLAW6117', 'Data protection, cyber security and crime', 9],
  ['LLAW6090', 'Economic foundations of competition law', 9],
  ['LLAW6126', 'e-Finance: law, compliance and technology challenges', 9],
  ['LLAW6210', 'Energy law', 9],
  ['LLAW6195', 'Intellectual property and competition in the digital economy', 9],
  ['LLAW6120', 'Intellectual property and information technology', 9],
  ['LLAW6206', 'International corporate finance', 9],
  ['LLAW6007', 'International dispute settlement', 9],
  ['LLAW6037', 'International environmental law', 9],
  ['LLAW6295', 'Issues in consumer law: theory and policy', 9],
  ['LLAW6299', 'Law and wealth management', 9],
  ['LLAW6283', 'Law of international civil aviation and aircraft finance', 9],
  ['LLAW6055', 'Law of international finance', 9],
  ['LLAW6323', 'Legal concepts and practical application in financial transactions', 9],
  ['LLAW6302', 'LITE lab: emerging technology and business models (postgraduate)', 9],
  ['LLAW6224', 'Mergers and acquisitions', 9],
  ['LLAW6201', 'PRC taxation law and policy', 9],
  ['LLAW6314', 'Regulatory aspects of ESG and sustainable finance', 9],
  ['LLAW6305', 'Sanctions: law and practice', 9],
  ['LLAW6311', 'Sustainability and competition law', 9],
  ['LLAW6250', 'The regulation of biomedical research', 9],
  ['LLAW6102', 'White collar crime: law and practice', 9]
];

const cflCapstoneRows = [
  ['LLAW6054', '9-credit Dissertation', 9],
  ['LLAW6014', '18-credit Dissertation', 18],
  ['LLAW6279', 'Comparative corporate law and theories', 9],
  ['LLAW6082', 'Corporate governance and shareholder remedies', 9],
  ['LLAW6127', 'Current issues in financial law', 9],
  ['LLAW6287', 'FinTech finance', 9],
  ['LLAW6057', 'International securities law', 9],
  ['LLAW6055', 'Law of international finance', 9],
  ['LLAW6224', 'Mergers and acquisitions', 9]
];

const cflDesignatedRows = [
  ['LLAW6022', 'Advanced research methodology', 9],
  ['LLAW6304', 'AI and competition law', 9],
  ['LLAW6024', 'Banking law', 9],
  ['LLAW6153', 'Business and human rights', 9],
  ['LLAW6025', 'China company law', 9],
  ['LLAW6185', 'China investment law', 9],
  ['LLAW6186', 'China trade law', 9],
  ['LLAW6124', 'Communications law', 9],
  ['LLAW6187', 'Competition law and intellectual property', 9],
  ['LLAW6264', 'Competition law and policy in China', 9],
  ['LLAW6154', 'Competition law I', 9],
  ['LLAW6155', 'Competition law II', 9],
  ['LLAW6194', 'Competition law in the digital economy', 9],
  ['LLAW6101', 'Competition, mergers and acquisitions', 9],
  ['LLAW6245', 'Compliance in the Hong Kong securities industry', 9],
  ['LLAW6141', 'Contemporary issues of comparative platform governance', 9],
  ['LLAW6158', 'Contract law', 9],
  ['LLAW6002', 'Credit and security law', 9],
  ['LLAW6084', 'Cross-border insolvency law', 9],
  ['LLAW6087', 'Current issues in insolvency law', 9],
  ['LLAW6088', 'Derivatives: law and regulation', 9],
  ['LLAW6325', 'Digital transformation of legal services', 9],
  ['LLAW6126', 'E-Finance: law, compliance and technology challenges', 9],
  ['LLAW6210', 'Energy law', 9],
  ['LLAW6303', 'EU financial regulation and technology', 9],
  ['LLAW6282', 'Financial crime: governance, risk and compliance', 9],
  ['LLAW6222', 'Financial dispute resolution: Hong Kong and international perspectives', 9],
  ['LLAW6149', 'Healthcare law', 9],
  ['LLAW6107', 'Insurance law', 9],
  ['LLAW6195', 'Intellectual property and competition in the digital economy', 9],
  ['LLAW6099', 'International commercial arbitration', 9],
  ['LLAW6206', 'International corporate finance', 9],
  ['LLAW6133', 'International economic law', 9],
  ['LLAW6294', 'International investment: structuring, protecting, and resolving related disputes', 9],
  ['LLAW6096', 'International tax and tax planning', 9],
  ['LLAW6336', 'Law and corporate finance in China', 9],
  ['LLAW6110', 'Law and regulation of banking and insurance in the People’s Republic of China', 9],
  ['LLAW6239', 'Law and regulation of private banking and wealth management', 9],
  ['LLAW6299', 'Law and wealth management', 9],
  ['LLAW6256', 'Law of anti-money laundering and counter-terrorist financing and compliance issues', 9],
  ['LLAW6283', 'Law of international civil aviation and aircraft finance', 9],
  ['LLAW6260', 'Law of state immunity and sovereign debt', 9],
  ['LLAW6265', 'Law, regulation and compliance for insurance industry in Hong Kong', 9],
  ['LLAW6312', 'Legal and regulatory aspects of financial risk management', 9],
  ['LLAW6323', 'Legal concepts and practical application in financial transactions', 9],
  ['LLAW6302', 'LITE lab: emerging technology and business models (postgraduate)', 9],
  ['LLAW6181', 'Management and commercialization of intellectual property', 9],
  ['LLAW6165', 'PRC economic law', 9],
  ['LLAW6048', 'PRC security and insolvency law', 9],
  ['LLAW6201', 'PRC taxation law and policy', 9],
  ['LLAW6298', 'Private equity and venture capital: law and practice', 9],
  ['LLAW6098', 'Project finance', 9],
  ['LLAW6093', 'Regulation of financial markets', 9],
  ['LLAW6314', 'Regulatory aspects of ESG and sustainable finance', 9],
  ['LLAW6049', 'Securities regulation I', 9],
  ['LLAW6244', 'Securities regulation II', 9],
  ['LLAW6330', 'Shipping finance law', 9],
  ['LLAW6341', 'Sports law', 9],
  ['LLAW6311', 'Sustainability and competition law', 9]
];

const hrCompulsoryRows = [
  ['LLAW6068', 'Human rights: history, theory and politics', 9],
  ['LLAW6072', 'International and regional protection of human rights', 9]
];

const hrCapstoneRows = [
  ['LLAW6054', '9-credit dissertation', 9],
  ['LLAW6014', '18-credit dissertation', 18],
  ['LLAW6058', 'Armed conflict, humanitarian law and human rights', 9],
  ['LLAW6060', 'Current issues in human rights', 9],
  ['LLAW6063', 'Equality and non-discrimination', 9],
  ['LLAW6073', 'International protection of refugees and displaced persons', 9],
  ['LLAW6242', 'Public interest clinic', 9],
  ['LLAW6339', 'Transitional justice', 9]
];

const hrDesignatedRows = [
  ['LLAW6022', 'Advanced research methodology', 9],
  ['LLAW6183', 'Animal law', 9],
  ['LLAW6271', 'Bioethics foundations', 9],
  ['LLAW6153', 'Business and human rights', 9],
  ['LLAW6156', 'Comparative constitutional law', 9],
  ['LLAW6062', 'Economic, social and cultural rights', 9],
  ['LLAW6307', 'Hong Kong National Security Law in comparative perspective', 9],
  ['LLAW6034', 'Human rights in Hong Kong', 9],
  ['LLAW6070', 'Human rights in the People’s Republic of China', 9],
  ['LLAW6036', 'International criminal law', 9],
  ['LLAW6037', 'International environmental law', 9],
  ['LLAW6182', 'International organizations', 9],
  ['LLAW6247', 'Medico-legal issues', 9],
  ['LLAW6291', 'Mental disability and the law', 9],
  ['LLAW6179', 'Multiculturalism and the law', 9],
  ['LLAW6075', 'National protection of human rights', 9],
  ['LLAW6046', 'Privacy and data protection', 9],
  ['LLAW6318', 'Public health ethics and law', 9],
  ['LLAW6109', 'Public international law', 9],
  ['LLAW6144', 'Rights and remedies in the criminal process', 9],
  ['LLAW6215', 'Seminar on human rights and constitutionalism in Asia', 9],
  ['LLAW6274', 'The beginning and end of life', 9],
  ['LLAW6275', 'The legal foundations of global health and development', 9],
  ['LLAW6316', 'Transnational criminal law', 9]
];

const tiplIpRows = [
  ['LLAW6223', 'Copyright and creativity', 9],
  ['LLAW6219', 'Patent law', 9],
  ['LLAW6200', 'Trademark law', 9]
];

const tiplTechnologyRows = [
  ['LLAW6046', 'Privacy and data protection', 9],
  ['LLAW6117', 'Data protection, cyber security and crime', 9],
  ['LLAW6170', 'Internet and social media law and policy', 9]
];

const tiplAiRows = [
  ['LLAW6280', 'Introduction to artificial intelligence and law', 9],
  ['LLAW6338', 'Regulatory ecosystem of artificial intelligence and advanced technology', 9],
  ['LLAW6333', 'AI and private law', 9]
];

const tiplCapstoneRows = [
  ['LLAW6054', '9-credit dissertation', 9],
  ['LLAW6014', '18-credit dissertation', 18],
  ['LLAW6304', 'AI and competition law', 9],
  ['LLAW6334', 'Artificial intelligence and digital governance', 9],
  ['LLAW6325', 'Digital transformation of legal services', 9],
  ['LLAW6120', 'Intellectual property and information technology', 9],
  ['LLAW6132', 'International and comparative intellectual property law', 9],
  ['LLAW6326', 'Topics in technology law', 9]
];

const tiplDesignatedRows = [
  ['LLAW6243', 'Advanced intellectual property law', 9],
  ['LLAW6022', 'Advanced research methodology', 9],
  ['LLAW6343', 'China data protection law', 9],
  ['LLAW6139', 'China information technology and electronic commerce law', 9],
  ['LLAW6212', 'China intellectual property law', 9],
  ['LLAW6124', 'Communications law', 9],
  ['LLAW6187', 'Competition law and intellectual property', 9],
  ['LLAW6264', 'Competition law and policy in China', 9],
  ['LLAW6154', 'Competition law I', 9],
  ['LLAW6155', 'Competition law II', 9],
  ['LLAW6194', 'Competition law in the digital economy', 9],
  ['LLAW6101', 'Competition, mergers and acquisitions', 9],
  ['LLAW6141', 'Contemporary issues of comparative platform governance', 9],
  ['LLAW6300', 'Digitalisation: health, law and policy', 9],
  ['LLAW6090', 'Economic foundations of competition law', 9],
  ['LLAW6126', 'e-finance: law, compliance and technology challenges', 9],
  ['LLAW6210', 'Energy law', 9],
  ['LLAW6249', 'Entertainment law', 9],
  ['LLAW6287', 'FinTech finance', 9],
  ['LLAW6005', 'Hong Kong intellectual property law', 9],
  ['LLAW6195', 'Intellectual property and competition in the digital economy', 9],
  ['LLAW6188', 'Intellectual property policy and practice', 9],
  ['LLAW6140', 'Intellectual property, innovation and development', 9],
  ['LLAW6295', 'Issues in consumer law: theory and policy', 9],
  ['LLAW6313', 'Law as data', 9],
  ['LLAW6301', 'Law, innovation, technology and entrepreneurship (LITE) – postgraduate internship', 9],
  ['LLAW6285', 'Legal data science', 9],
  ['LLAW6302', 'LITE lab: emerging technology and business model (postgraduate)', 9],
  ['LLAW6181', 'Management and commercialization of intellectual property', 9],
  ['LLAW6311', 'Sustainability and competition law', 9],
  ['LLAW6274', 'The beginning and end of life', 9],
  ['LLAW6275', 'The legal foundations of global health and development', 9],
  ['LLAW6250', 'The regulation of biomedical research', 9],
  ['ICOM7125', 'Digital forensics', 6],
  ['ICOM6027', 'E-Crimes: digital crime scene and legal sanctions', 6]
];

function course([code, name, credits]) {
  const result = { code, name, credits, appliesToTrackIds: [] };
  if (code === 'LLAW6014' || code === 'LLAW6054') result.courseKind = 'dissertation';
  return result;
}

function group(id, name, type, creditsRequired, coursesRequired, ruleText, sourceUrl, rows) {
  return {
    id,
    name,
    type,
    creditsRequired,
    coursesRequired,
    ruleText,
    appliesToTrackIds: [],
    sourceUrl,
    courses: rows.map(course)
  };
}

function assertProgramme(programme, expectedCourseCount) {
  const codes = programme.courseGroups.flatMap((entry) => entry.courses.map((item) => item.code));
  assert.equal(codes.length, expectedCourseCount, `${programme.programmeId} course count changed`);
  assert.equal(new Set(codes).size, expectedCourseCount, `${programme.programmeId} repeats a course code`);
}

function buildProgrammes() {
  const programmes = [
    {
      programmeId: 'HKU-TPG-044',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.cr,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete 72-credit programme-specific course list: two compulsory 9-credit foundation courses, at least two 9-credit Core Compliance and Regulation courses, at least one 9-credit Specialized Topics course and one 9- or 18-credit capstone. LLAW6245, LLAW6127, LLAW6312 and LLAW6244 can serve as either capstone or Core; they are stored only in the Capstone group to keep course codes unique. The dissertation options are mutually exclusive and require prior completion of LLAW6022 and approval. Up to two General LLM electives may be used subject to a per-Cluster cap. LLAW6093 is expressly prohibited and is not included in the course pool. Overlapping roles, dissertation conditions and annual offerings require manual review.',
      courseGroups: [
        group('compulsory-foundations', 'Compulsory Foundation Courses', 'core', 18, 2, 'Complete both foundation courses as a first priority before other course selections. LLAW6093 Regulation of Financial Markets is expressly prohibited.', SOURCES.cr, crFoundationRows),
        group('capstone-courses', 'Capstone Courses', 'capstone', 9, 1, 'Complete one 9-credit capstone, or the 18-credit LLAW6014 dissertation. LLAW6245, LLAW6127, LLAW6312 and LLAW6244 also belong to the Core list; if more than one is selected, one counts as capstone and the others may count as Core. LLAW6014 and LLAW6054 are mutually exclusive, require prior completion of LLAW6022 and Programme Director approval, and part-time candidates may take a capstone only in their second year.', SOURCES.cr, crCapstoneRows),
        group('core-compliance-regulation', 'Core Compliance and Regulation Courses', 'core', 18, 2, 'Complete at least two Core courses for 18 credits. The four dual-role courses stored in the Capstone group may also satisfy this minimum when they are not used as the capstone.', SOURCES.cr, crCoreRows),
        group('specialized-topics', 'Specialized Topics Courses', 'elective', 9, 1, 'Complete at least one Specialized Topics course for 9 credits. The 72-credit balance may come from the programme lists or up to two General LLM electives, with no more than two General LLM electives from one Cluster. Not all courses are offered every year.', SOURCES.cr, crSpecializedRows)
      ]
    },
    {
      programmeId: 'HKU-TPG-045',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.cfl,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete 72-credit programme-specific course list. Candidates take one 9- or 18-credit capstone and at least five designated electives, with at least six programme-list courses overall. Seven subject courses can serve as either capstone or designated electives and are stored only in the Capstone group to keep course codes unique. Up to two General LLM electives may be used, reduced to one with the 18-credit dissertation. Overlapping roles, dissertation conditions, the General LLM Cluster cap and annual offerings require manual review.',
      courseGroups: [
        group('capstone-courses', 'Capstone Courses', 'capstone', 9, 1, 'Complete one capstone. The seven non-dissertation courses also belong to the Designated Electives list; if more than one is selected, one counts as capstone and the others may count as designated electives. LLAW6014 and LLAW6054 are mutually exclusive, require prior completion of LLAW6022 and Programme Director approval, and part-time candidates may take a dissertation only in their second year.', SOURCES.cfl, cflCapstoneRows),
        group('designated-electives', 'Designated Electives', 'elective', 45, 5, 'Complete at least five designated electives and at least six courses from the programme Course List overall. The seven dual-role courses stored in the Capstone group may satisfy designated-elective places when they are not used as the capstone. Up to two General LLM electives may be used, or one when LLAW6014 is selected, with no more than two from one Cluster. Not all courses are offered every year.', SOURCES.cfl, cflDesignatedRows)
      ]
    },
    {
      programmeId: 'HKU-TPG-046',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.hr,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete 72-credit programme-specific course list: two compulsory courses, one 9- or 18-credit capstone and at least three designated electives, with at least six programme-list courses overall. Six subject courses have dual capstone and designated-elective roles and are stored only in the Capstone group to keep course codes unique. Up to two General LLM electives may be used, reduced to one with the 18-credit dissertation. Overlapping roles, dissertation conditions, the General LLM Cluster cap and annual offerings require manual review.',
      courseGroups: [
        group('compulsory-courses', 'Compulsory Courses', 'core', 18, 2, 'Complete both compulsory courses for 18 credits.', SOURCES.hr, hrCompulsoryRows),
        group('capstone-courses', 'Capstone Courses', 'capstone', 9, 1, 'Complete one capstone. The six non-dissertation courses also belong to the Designated Electives list; if more than one is selected, one counts as capstone and the others may count as designated electives. LLAW6014 and LLAW6054 are mutually exclusive, require prior completion of LLAW6022 and Programme Director approval, and part-time candidates may take a dissertation only in their second year.', SOURCES.hr, hrCapstoneRows),
        group('designated-electives', 'Designated Electives', 'elective', 27, 3, 'Complete at least three designated electives and at least six courses from the programme Course List overall. The six dual-role courses stored in the Capstone group may satisfy designated-elective places when they are not used as the capstone. Up to two General LLM electives may be used, or one when LLAW6014 is selected, with no more than two from one Cluster. Not all courses are offered every year.', SOURCES.hr, hrDesignatedRows)
      ]
    },
    {
      programmeId: 'HKU-TPG-047',
      programmeName: 'Master of Laws in Technology and Intellectual Property Law (LLM(T&IPL))',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.tipl,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete programme-specific course list and a variable 72- to 78-credit curriculum. Candidates select one compulsory course from each of Intellectual Property, Technology and Artificial Intelligence, one capstone, and at least two designated electives, with at least six programme-list courses overall. The nine compulsory options and six subject capstones also have designated-elective roles and are stored only in their compulsory or Capstone group to keep course codes unique. A candidate taking either one of the two 6-credit ICOM electives must complete 78 credits, while taking both requires 75 credits; otherwise the normal minimum is 72 credits. Credit totals, overlapping roles, dissertation conditions, optional General LLM electives and annual offerings require manual review.',
      courseGroups: [
        group('intellectual-property-compulsory', 'Intellectual Property and Related Laws', 'core', 9, 1, 'Complete one course from this specialization. Additional courses selected from this group may count as designated electives.', SOURCES.tipl, tiplIpRows),
        group('technology-compulsory', 'Technology and Related Laws', 'core', 9, 1, 'Complete one course from this specialization. Additional courses selected from this group may count as designated electives.', SOURCES.tipl, tiplTechnologyRows),
        group('artificial-intelligence-compulsory', 'Artificial Intelligence and Related Laws', 'core', 9, 1, 'Complete one course from this specialization. Additional courses selected from this group may count as designated electives.', SOURCES.tipl, tiplAiRows),
        group('capstone-courses', 'Capstone Courses', 'capstone', 9, 1, 'Complete one capstone. The six non-dissertation courses also belong to the Designated Electives list; if more than one is selected, one counts as capstone and the others may count as designated electives. LLAW6014 and LLAW6054 are mutually exclusive, require prior completion of LLAW6022 and Programme Director approval, and part-time candidates may take a dissertation only in their second year.', SOURCES.tipl, tiplCapstoneRows),
        group('designated-electives', 'Designated Electives', 'elective', 18, 2, 'Complete at least two designated electives and at least six courses from the programme Course List overall. Extra compulsory-list choices and the six dual-role courses stored in the Capstone group may satisfy designated-elective places. The normal minimum is 72 credits; taking one 6-credit ICOM elective requires 78 total credits, while taking both requires 75. Up to two General LLM electives may be used, or one with LLAW6014, with no more than two from one Cluster. Not all courses are offered every year.', SOURCES.tipl, tiplDesignatedRows)
      ]
    }
  ];

  const expectedCounts = new Map([
    ['HKU-TPG-044', 64],
    ['HKU-TPG-045', 68],
    ['HKU-TPG-046', 34],
    ['HKU-TPG-047', 52]
  ]);
  assert.equal(programmes.length, 4);
  for (const programme of programmes) assertProgramme(programme, expectedCounts.get(programme.programmeId));
  assert.equal(programmes.reduce((sum, programme) => sum + expectedCounts.get(programme.programmeId), 0), 218);
  assert(!programmes[0].courseGroups.some((entry) => entry.courses.some((item) => item.code === 'LLAW6093')), 'HKU-TPG-044 must not include prohibited LLAW6093');
  return programmes;
}

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: buildProgrammes()
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((sum, programme) => sum + programme.courseGroups.reduce((groupSum, entry) => groupSum + entry.courses.length, 0), 0)
  }));
}

if (require.main === module) main();
module.exports = {
  buildSupplement,
  buildProgrammes,
  crFoundationRows,
  crCapstoneRows,
  crCoreRows,
  crSpecializedRows,
  cflCapstoneRows,
  cflDesignatedRows,
  hrCompulsoryRows,
  hrCapstoneRows,
  hrDesignatedRows,
  tiplIpRows,
  tiplTechnologyRows,
  tiplAiRows,
  tiplCapstoneRows,
  tiplDesignatedRows
};
