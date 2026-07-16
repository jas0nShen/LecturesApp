const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-law-first-batch-2025.json');
const MCL_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/MCL_Reg_Syll_2025-26.pdf';
const LLM_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/LLM_Reg_Syll_2025-26.pdf';
const ADR_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/LLMADR_Reg_Syll_2025-26.pdf';
const CHINESE_LAW_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/LLMCL_Reg_Syll_2025-26.pdf';
const MCL_PROGRAMME_SOURCE = 'https://llm.law.hku.hk/mcl/';
const LLM_PROGRAMME_SOURCE = 'https://llm.law.hku.hk/llm/';
const ADR_PROGRAMME_SOURCE = 'https://llm.law.hku.hk/arbdr/';
const CHINESE_LAW_PROGRAMME_SOURCE = 'https://llm.law.hku.hk/chineselaw/';
const REGULATIONS_INDEX_SOURCE = 'https://dm.law.hku.hk/regulations/';

function parseRows(value) {
  return value.trim().split('\n').map((line) => {
    const [code, name, credits = '9'] = line.split('|');
    return [code, name, Number(credits)];
  });
}

const generalCapstoneRows = parseRows(`
LLAW6054|9-credit Dissertation
LLAW6014|18-credit Dissertation|18
LLAW6058|Armed conflict, humanitarian law and human rights
LLAW6334|Artificial intelligence and digital governance
LLAW6024|Banking law
LLAW6212|China intellectual property law
LLAW6185|China investment law
LLAW6156|Comparative constitutional law
LLAW6279|Comparative corporate law and theories
LLAW6082|Corporate governance and shareholder remedies
LLAW6120|Intellectual property and information technology
LLAW6037|International environmental law
LLAW6182|International organizations
LLAW6073|International protection of refugees and displaced persons
LLAW6170|Internet and social media law and policy
LLAW6336|Law and corporate finance in China
LLAW6339|Transitional justice
`);

const generalElectiveClusters = {
  'arbitration-and-dispute-resolution': parseRows(`
LLAW6241|Arbitration award writing
LLAW6138|Arbitration law
LLAW6238|Comparative arbitration in Asia
LLAW6174|Family mediation
LLAW6222|Financial dispute resolution: Hong Kong and international perspectives
LLAW6099|International commercial arbitration
LLAW6321|International commercial litigation
LLAW6007|International dispute settlement
LLAW6294|International investment: structuring, protecting, and resolving related disputes
LLAW6230|Law and practice of investment treaty arbitration
LLAW6324|Mediation advocacy
LLAW6163|Negotiation: settlement and advocacy
LLAW6196|Preventative law: approaches to conflict prevention and resolution
`),
  'chinese-law': parseRows(`
LLAW6025|China company law
LLAW6343|China data protection law
LLAW6139|China information technology and electronic commerce law
LLAW6212|China intellectual property law
LLAW6185|China investment law
LLAW6186|China trade law
LLAW6003|Civil and commercial law in the People's Republic of China
LLAW6335|Constitutional and administrative law in the PRC
LLAW6171|Corruption: China in comparative perspective
LLAW6114|Cross-border legal relations between the Mainland and Hong Kong (in Putonghua)
LLAW6307|Hong Kong National Security Law in comparative perspective
LLAW6008|Introduction to Chinese law and legal system
LLAW6336|Law and corporate finance in China
LLAW6110|Law and regulation of banking and insurance in the People’s Republic of China
LLAW6308|Law and society in China
LLAW6340|Legal pluralism in Hong Kong
LLAW6165|PRC economic law
LLAW6047|PRC property law
LLAW6048|PRC security and insolvency law
LLAW6201|PRC taxation law and policy
LLAW6167|PRC tort law
`),
  'competition-law-and-digital-regulation': parseRows(`
LLAW6304|AI and competition law
LLAW6187|Competition law and intellectual property
LLAW6264|Competition law and policy in China
LLAW6154|Competition law I
LLAW6155|Competition law II
LLAW6194|Competition law in the digital economy
LLAW6101|Competition, mergers and acquisitions
LLAW6141|Contemporary issues of comparative platform governance
LLAW6090|Economic foundations of competition law
LLAW6195|Intellectual property and competition in the digital economy
LLAW6295|Issues in consumer law: theory and policy
LLAW6311|Sustainability and competition law
`),
  'corporate-and-financial-law': parseRows(`
LLAW6024|Banking law
LLAW6279|Comparative corporate law and theories
LLAW6257|Compliance for listed companies
LLAW6245|Compliance in the Hong Kong securities industry
LLAW6082|Corporate governance and shareholder remedies
LLAW6002|Credit and security law
LLAW6084|Cross-border insolvency law
LLAW6127|Current issues in financial law
LLAW6087|Current issues in insolvency law
LLAW6088|Derivatives: law and regulation
LLAW6126|e-Finance: law, compliance and technology challenges
LLAW6210|Energy law
LLAW6249|Entertainment law
LLAW6303|EU financial regulation and technology
LLAW6282|Financial crime: governance, risk and compliance
LLAW6287|FinTech finance
LLAW6149|Healthcare law
LLAW6107|Insurance law
LLAW6206|International corporate finance
LLAW6057|International securities law
LLAW6096|International tax and tax planning
LLAW6239|Law and regulation of private banking and wealth management
LLAW6299|Law and wealth management
LLAW6256|Law of anti-money laundering and counter-terrorist financing and compliance issues
LLAW6283|Law of international civil aviation and aircraft finance
LLAW6055|Law of international finance
LLAW6260|Law of state immunity and sovereign debt
LLAW6265|Law, regulation and compliance for insurance industry in Hong Kong
LLAW6312|Legal and regulatory aspects of financial risk management
LLAW6323|Legal concepts and practical application in financial transactions
LLAW6224|Mergers and acquisitions
LLAW6298|Private equity and venture capital: law and practice
LLAW6098|Project finance
LLAW6093|Regulation of financial markets
LLAW6314|Regulatory aspects of ESG and sustainable finance
LLAW6305|Sanctions: law and practice
LLAW6049|Securities regulation I
LLAW6244|Securities regulation II
LLAW6102|White collar crime: law and practice
`),
  'human-rights-and-public-law': parseRows(`
LLAW6183|Animal law
LLAW6058|Armed conflict, humanitarian law and human rights
LLAW6153|Business and human rights
LLAW6060|Current issues in human rights
LLAW6062|Economic, social and cultural rights
LLAW6063|Equality and non-discrimination
LLAW6034|Human rights in Hong Kong
LLAW6070|Human rights in the People’s Republic of China
LLAW6068|Human rights: history, theory and politics
LLAW6072|International and regional protection of human rights
LLAW6036|International criminal law
LLAW6073|International protection of refugees and displaced persons
LLAW6131|Media law
LLAW6179|Multiculturalism and the law
LLAW6075|National protection of human rights
LLAW6242|Public interest clinic
LLAW6144|Rights and remedies in the criminal process
LLAW6076|Seminar in human rights research
LLAW6215|Seminar on human rights and constitutionalism in Asia
LLAW6339|Transitional justice
LLAW6316|Transnational criminal law
`),
  'information-technology-and-intellectual-property-law': parseRows(`
LLAW6243|Advanced intellectual property law
LLAW6333|AI and private law
LLAW6334|Artificial intelligence and digital governance
LLAW6124|Communications law
LLAW6285|Legal data science
LLAW6223|Copyright and creativity
LLAW6117|Data protection, cyber security and crime
LLAW6325|Digital transformation of legal services
LLAW6005|Hong Kong intellectual property law
LLAW6120|Intellectual property and information technology
LLAW6188|Intellectual property policy and practice
LLAW6140|Intellectual property, innovation and development
LLAW6132|International and comparative intellectual property law
LLAW6170|Internet and social media law and policy
LLAW6280|Introduction to artificial intelligence and law
LLAW6313|Law as data
LLAW6301|Law, innovation, technology and entrepreneurship (LITE) – postgraduate internship
LLAW6302|LITE lab: emerging technology and business models (postgraduate)
LLAW6181|Management and commercialization of intellectual property
LLAW6219|Patent law
LLAW6046|Privacy and data protection
LLAW6338|Regulatory ecosystem of artificial intelligence and advanced technology
LLAW6326|Topics in technology law
LLAW6200|Trademark law
`),
  'international-and-comparative-law': parseRows(`
LLAW6156|Comparative constitutional law
LLAW6248|Comparative contract law
LLAW6209|Comparative family law
LLAW6150|Comparative law
LLAW6251|Comparative property law
LLAW6133|International economic law
LLAW6037|International environmental law
LLAW6182|International organizations
LLAW6288|Introduction to European Union law
LLAW6227|Introduction to private international law (conflict of laws)
LLAW6109|Public international law
LLAW6211|World trade law, policy and business
`),
  'maritime-law': parseRows(`
LLAW6329|Admiralty law and practice
LLAW6332|Advanced topics in maritime law
LLAW6172|Carriage of goods by sea
LLAW6327|Law of marine insurance
LLAW6342|Law of the sea
LLAW6328|Maritime arbitration law
LLAW6225|PRC shipping law (in Putonghua)
LLAW6330|Shipping finance law
LLAW6331|Shipping management and law
`),
  'medical-ethics-and-law': parseRows(`
LLAW6271|Bioethics foundations
LLAW6300|Digitalisation: health, law and policy
LLAW6272|Medical law and ethics
LLAW6337|Medical malpractice
LLAW6247|Medico-legal issues
LLAW6291|Mental disability and the law
LLAW6318|Public health ethics and law
LLAW6274|The beginning and end of life
LLAW6275|The legal foundations of global health and development
LLAW6250|The regulation of biomedical research
LLAW6270|Understanding health systems: ethical and legal dimensions
`),
  others: parseRows(`
LLAW6022|Advanced research methodology
LLAW6231|Justice
LLAW6197|Law and social theory
LLAW6178|Law, economics, regulation and development
LLAW6164|Principles of family law
LLAW6341|Sports law
LLAW6306|The economic analysis of law
LLAW6322|The private law of cooperative institutions
LLAW6315|Theories and methods on law and society
`)
};

const competitionCompulsoryCodes = new Set(['LLAW6154', 'LLAW6155']);
const competitionCapstoneCodes = new Set(['LLAW6054', 'LLAW6014', 'LLAW6187', 'LLAW6141', 'LLAW6195', 'LLAW6295', 'LLAW6311']);
const competitionDesignatedCodes = new Set(['LLAW6304', 'LLAW6187', 'LLAW6264', 'LLAW6194', 'LLAW6101', 'LLAW6141', 'LLAW6090', 'LLAW6195', 'LLAW6295', 'LLAW6046', 'LLAW6311', 'LLAW6306']);
const maritimeCompulsoryCodes = new Set(['LLAW6172', 'LLAW6327']);
const maritimeCapstoneCodes = new Set(['LLAW6054', 'LLAW6014', 'LLAW6329', 'LLAW6332', 'LLAW6328', 'LLAW6225', 'LLAW6330', 'LLAW6331']);
const maritimeDesignatedCodes = new Set(['LLAW6329', 'LLAW6332', 'LLAW6186', 'LLAW6238', 'LLAW6107', 'LLAW6099', 'LLAW6321', 'LLAW6037', 'LLAW6342', 'LLAW6328', 'LLAW6225', 'LLAW6330', 'LLAW6331', 'LLAW6211']);
const medicalCompulsoryCodes = new Set(['LLAW6272', 'LLAW6274']);
const medicalCapstoneCodes = new Set(['LLAW6054', 'LLAW6014', 'LLAW6300', 'LLAW6291', 'LLAW6318', 'LLAW6275', 'LLAW6250']);
const medicalDesignatedCodes = new Set(['LLAW6271', 'LLAW6212', 'LLAW6209', 'LLAW6300', 'LLAW6005', 'LLAW6120', 'LLAW6140', 'LLAW6132', 'LLAW6337', 'LLAW6247', 'LLAW6291', 'LLAW6219', 'LLAW6164', 'LLAW6046', 'LLAW6318', 'LLAW6275', 'LLAW6250', 'LLAW6315']);

const adrRows = parseRows(`
LLAW6138|Arbitration law
LLAW6157|Arbitration practice, procedure and drafting
LLAW6161|Mediation
LLAW6135|Alternative dispute resolution
LLAW6054|9-credit Dissertation
LLAW6022|Advanced research methodology
LLAW6241|Arbitration award writing
LLAW6185|China investment law
LLAW6186|China trade law
LLAW6238|Comparative arbitration in Asia
LLAW6174|Family mediation
LLAW6222|Financial dispute resolution: Hong Kong and international perspectives
LLAW6099|International commercial arbitration
LLAW6321|International commercial litigation
LLAW6007|International dispute settlement
LLAW6294|International investment: structuring, protecting, and resolving related disputes
LLAW6230|Law and practice of investment treaty arbitration
LLAW6324|Mediation advocacy
LLAW6163|Negotiation: settlement and advocacy
LLAW6196|Preventative law: approaches to conflict prevention and resolution
LLAW6158|Contract law
LLAW6159|Evidence
LLAW6160|Legal system and methods
`);

const chineseLawRows = parseRows(`
LLAW6054|9-credit Dissertation
LLAW6014|18-credit Dissertation|18
LLAW6025|China company law
LLAW6212|China intellectual property law
LLAW6185|China investment law
LLAW6186|China trade law
LLAW6336|Law and corporate finance in China
LLAW6022|Advanced research methodology
LLAW6343|China data protection law
LLAW6139|China information technology and electronic commerce law
LLAW6003|Civil and commercial law in the People's Republic of China
LLAW6156|Comparative constitutional law
LLAW6248|Comparative contract law
LLAW6279|Comparative corporate law and theories
LLAW6209|Comparative family law
LLAW6150|Comparative law
LLAW6251|Comparative property law
LLAW6264|Competition law and policy in China
LLAW6335|Constitutional and administrative law in the PRC
LLAW6171|Corruption: China in comparative perspective
LLAW6114|Cross-border legal relations between the Mainland and Hong Kong (in Putonghua)
LLAW6307|Hong Kong National Security Law in comparative perspective
LLAW6070|Human rights in the People’s Republic of China
LLAW6132|International and comparative intellectual property law
LLAW6133|International economic law
LLAW6037|International environmental law
LLAW6182|International organizations
LLAW6008|Introduction to Chinese law and legal system
LLAW6110|Law and regulation of banking and insurance in the People’s Republic of China
LLAW6308|Law and society in China
LLAW6342|Law of the sea
LLAW6340|Legal pluralism in Hong Kong
LLAW6165|PRC economic law
LLAW6047|PRC property law
LLAW6048|PRC security and insolvency law
LLAW6225|PRC shipping law (in Putonghua)
LLAW6201|PRC taxation law and policy
LLAW6167|PRC tort law
LLAW6109|Public international law
`);

function mergeRows(...lists) {
  const byCode = new Map();
  lists.flat().forEach(([code, name, credits]) => {
    if (byCode.has(code)) {
      assert.deepEqual(byCode.get(code), [code, name, credits], `${code} has conflicting official rows`);
    } else {
      byCode.set(code, [code, name, credits]);
    }
  });
  return [...byCode.values()];
}

const generalElectiveRows = mergeRows(...Object.values(generalElectiveClusters));
const generalRows = mergeRows(generalCapstoneRows, generalElectiveRows);
const llmRows = mergeRows(generalRows, [['LLAW6160', 'Legal system and methods', 9]]);

function clusterRoles(code) {
  return Object.entries(generalElectiveClusters)
    .filter(([, rows]) => rows.some(([rowCode]) => rowCode === code))
    .map(([cluster]) => `general-elective-${cluster}`);
}

function llmRoles(code) {
  const roles = clusterRoles(code);
  if (generalCapstoneRows.some(([rowCode]) => rowCode === code)) roles.push('general-capstone');
  if (competitionCompulsoryCodes.has(code)) roles.push('competition-compulsory');
  if (competitionCapstoneCodes.has(code)) roles.push('competition-capstone');
  if (competitionDesignatedCodes.has(code)) roles.push('competition-designated-elective');
  if (maritimeCompulsoryCodes.has(code)) roles.push('maritime-compulsory');
  if (maritimeCapstoneCodes.has(code)) roles.push('maritime-capstone');
  if (maritimeDesignatedCodes.has(code)) roles.push('maritime-designated-elective');
  if (medicalCompulsoryCodes.has(code)) roles.push('medical-ethics-compulsory');
  if (medicalCapstoneCodes.has(code)) roles.push('medical-ethics-capstone');
  if (medicalDesignatedCodes.has(code)) roles.push('medical-ethics-designated-elective');
  if (code === 'LLAW6160') roles.push('medical-ethics-foundational');
  return roles;
}

function course([code, name, credits], subjectGroups = []) {
  return {
    code,
    name,
    credits,
    subjectGroups,
    appliesToTrackIds: [],
    ...(['LLAW6014', 'LLAW6054'].includes(code) ? { courseKind: 'dissertation', conditionalRequirement: true } : {})
  };
}

function buildSupplement() {
  assert.equal(generalCapstoneRows.length, 17, 'HKU general LLM capstone pool changed');
  assert.equal(Object.keys(generalElectiveClusters).length, 10, 'HKU general LLM cluster count changed');
  assert.equal(generalElectiveRows.length, 171, 'HKU general LLM elective pool changed');
  assert.equal(generalRows.length, 173, 'HKU general LLM unique course pool changed');
  assert.equal(llmRows.length, 174, 'HKU general and specialisation LLM course pool changed');
  assert.equal(adrRows.length, 23, 'HKU LLM(Arb&DR) named course pool changed');
  assert.equal(chineseLawRows.length, 39, 'HKU LLM(ChineseLaw) named course pool changed');
  assert.equal(competitionDesignatedCodes.size, 12);
  assert.equal(maritimeDesignatedCodes.size, 14);
  assert.equal(medicalDesignatedCodes.size, 18);

  const adrPool = mergeRows(adrRows, generalElectiveRows);
  const chineseLawPool = mergeRows(chineseLawRows, generalElectiveRows);
  assert.equal(adrPool.length, 178, 'HKU LLM(Arb&DR) full selectable pool changed');
  assert.equal(chineseLawPool.length, 173, 'HKU LLM(ChineseLaw) full selectable pool changed');

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-16',
    programmes: [
      {
        programmeId: 'HKU-TPG-040',
        status: 'blocked',
        creditsRequired: 72,
        creditUnit: 'credits',
        sourceUrl: MCL_SOURCE,
        statusNote: 'The official 2025-26 MCL Regulations and Syllabus is internally inconsistent about the designated-elective minimum: the Structure on page 6 requires at least five designated electives, while the Course List heading on page 7 requires at least four. The curriculum also permits 72-78 credits depending on approved 6-credit undergraduate selections. Because the required designated-elective count determines a completion path and cannot be resolved from the public official evidence without inference, no partial course structure is published.',
        additionalSources: [MCL_PROGRAMME_SOURCE, REGULATIONS_INDEX_SOURCE]
      },
      {
        programmeId: 'HKU-TPG-041',
        status: 'verified',
        creditsRequired: 72,
        creditUnit: 'credits',
        sourceUrl: LLM_SOURCE,
        ruleReviewStatus: 'manual_review_required',
        trackSelectionOptional: false,
        tracks: [
          { id: 'HKU-TPG-041-GENERAL', name: 'General Focus', type: 'Award Path', creditsRequired: 72, sourceUrl: LLM_SOURCE },
          { id: 'HKU-TPG-041-COMPETITION-LAW-POLICY', name: 'Competition Law and Policy', type: 'Specialisation', creditsRequired: 72, sourceUrl: LLM_SOURCE },
          { id: 'HKU-TPG-041-MARITIME-LAW', name: 'Maritime Law', type: 'Specialisation', creditsRequired: 72, sourceUrl: LLM_SOURCE },
          { id: 'HKU-TPG-041-MEDICAL-ETHICS-LAW', name: 'Medical Ethics and Law', type: 'Specialisation', creditsRequired: 72, sourceUrl: LLM_SOURCE }
        ],
        statusNote: 'The official 2025-26 Regulations and Syllabus publishes a 72-credit General Focus and three Specialisations: Competition Law and Policy, Maritime Law, and Medical Ethics and Law. The current September 2026 Programme page lists only Competition Law and Policy and Maritime Law, so this supplement is intentionally limited to academic year 2025-26 and must not be presented as the 2026-27 specialisation set. Courses with both capstone and elective roles appear once in the Programme-local pool and their official roles are recorded in subjectGroups. Dissertation approval and prerequisites, cross-cluster minima, cluster maxima, dual-role allocation, the 18-credit dissertation substitutions, and the qualification-dependent Medical Ethics foundational path require manual audit review. Not all listed courses are offered every year.',
        courseGroups: [{
          id: 'curriculum-course-pool',
          name: 'General and Specialisation Course Pool',
          type: 'path_dependent_curriculum',
          creditsRequired: 72,
          ruleText: 'General Focus: complete one 9-credit capstone plus seven electives, selecting at least one elective from at least four clusters and no more than two electives from any one cluster; an 18-credit dissertation reduces the remaining elective requirement to 54 credits. Competition Law and Policy and Maritime Law: complete two compulsory courses, one capstone, two designated electives and three other electives; an 18-credit dissertation reduces other electives by 9 credits. Medical Ethics and Law: complete two compulsory courses, one capstone, two designated electives, plus LLAW6160 and two other electives without a common-law qualification, or three other electives with one. Dual-role courses may satisfy only one role in the same completion path. These constraints require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: LLM_SOURCE,
          courses: llmRows.map((row) => course(row, llmRoles(row[0])))
        }],
        additionalSources: [LLM_PROGRAMME_SOURCE, REGULATIONS_INDEX_SOURCE]
      },
      {
        programmeId: 'HKU-TPG-042',
        programmeName: 'Master of Laws in Arbitration and Dispute Resolution (LLM(Arb&DR))',
        status: 'verified',
        creditsRequired: 72,
        creditUnit: 'credits',
        sourceUrl: ADR_SOURCE,
        ruleReviewStatus: 'manual_review_required',
        trackSelectionOptional: false,
        tracks: [
          { id: 'HKU-TPG-042-LAW-DEGREE', name: 'Candidates with a Degree in Law', type: 'Qualification Path', creditsRequired: 72, sourceUrl: ADR_SOURCE },
          { id: 'HKU-TPG-042-NON-LAW-DEGREE', name: 'Candidates without a Degree in Law', type: 'Qualification Path', creditsRequired: 72, sourceUrl: ADR_SOURCE }
        ],
        statusNote: 'The official 2025-26 Regulations and Syllabus publishes complete 72-credit paths for candidates with and without a law degree. Law-degree candidates complete three compulsory courses, LLAW6135, at least two designated electives, and up to two General LLM electives; candidates with a non-common-law law degree may substitute up to three foundational courses with approval. Non-law candidates complete three foundational compulsory courses and LLAW6135 in the first year, then three dispute-resolution compulsory courses and one designated elective in the second year. Qualification-path selection, approved foundational substitutions, dissertation approval and prerequisite, and General LLM cluster limits require manual audit review. Not all listed courses are offered every year.',
        courseGroups: [{
          id: 'qualification-path-course-pool',
          name: 'Qualification-dependent Course Pool',
          type: 'path_dependent_curriculum',
          creditsRequired: 72,
          coursesRequired: 8,
          ruleText: 'Law-degree path: complete LLAW6138, LLAW6157 and LLAW6161 (27 credits), LLAW6135 (9 credits), at least two designated electives (18-36 credits), and 0-18 credits of General LLM electives. With Programme Director approval, a non-common-law law graduate may use up to three of LLAW6158, LLAW6159 and LLAW6160 in place of electives. Non-law path: first year completes LLAW6158, LLAW6159, LLAW6160 and LLAW6135; second year completes LLAW6138, LLAW6157, LLAW6161 and one designated elective. LLAW6054 requires prior approval and successful completion of LLAW6022. These conditions require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: ADR_SOURCE,
          courses: adrPool.map((row) => {
            const code = row[0];
            const roles = clusterRoles(code);
            if (['LLAW6138', 'LLAW6157', 'LLAW6161'].includes(code)) roles.push('dispute-resolution-compulsory');
            if (code === 'LLAW6135') roles.push('capstone');
            if (adrRows.slice(4, 20).some(([rowCode]) => rowCode === code)) roles.push('designated-elective');
            if (['LLAW6158', 'LLAW6159', 'LLAW6160'].includes(code)) roles.push('foundational-compulsory');
            return course(row, roles);
          })
        }],
        additionalSources: [ADR_PROGRAMME_SOURCE, REGULATIONS_INDEX_SOURCE]
      },
      {
        programmeId: 'HKU-TPG-043',
        status: 'verified',
        creditsRequired: 72,
        creditUnit: 'credits',
        sourceUrl: CHINESE_LAW_SOURCE,
        ruleReviewStatus: 'manual_review_required',
        statusNote: 'The official 2025-26 Regulations and Syllabus publishes a complete 72-credit structure: one capstone, at least five designated electives, and up to two electives from the General LLM list. Courses that may serve as either capstone or designated elective appear once in the Programme-local pool and their roles are recorded in subjectGroups. Dissertation approval and prerequisite, dual-role allocation, the 18-credit dissertation substitution, and the General LLM cluster limit require manual audit review. Not all listed courses are offered every year.',
        courseGroups: [{
          id: 'curriculum-course-pool',
          name: 'Chinese Law and General LLM Course Pool',
          type: 'path_dependent_curriculum',
          creditsRequired: 72,
          ruleText: 'Complete one capstone and at least five designated electives from the Chinese Law list. Up to two other electives may be selected from the General LLM elective clusters, with no more than two courses from any one General LLM cluster. LLAW6014 carries 18 credits and reduces other electives to 0-9 credits; LLAW6014 and LLAW6054 are mutually exclusive, require prior approval, and require successful completion of LLAW6022. Courses marked as both capstone and designated elective may satisfy only one role in the same completion path. These constraints require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: CHINESE_LAW_SOURCE,
          courses: chineseLawPool.map((row) => {
            const code = row[0];
            const roles = clusterRoles(code);
            if (['LLAW6054', 'LLAW6014', 'LLAW6025', 'LLAW6212', 'LLAW6185', 'LLAW6186', 'LLAW6336'].includes(code)) roles.push('chinese-law-capstone');
            if (chineseLawRows.slice(2).some(([rowCode]) => rowCode === code)) roles.push('chinese-law-designated-elective');
            return course(row, roles);
          })
        }],
        additionalSources: [CHINESE_LAW_PROGRAMME_SOURCE, REGULATIONS_INDEX_SOURCE]
      }
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
    blocked: supplement.programmes.filter((programme) => programme.status === 'blocked').length,
    courses: supplement.programmes.reduce((total, programme) => total + (programme.courseGroups || []).reduce((sum, group) => sum + group.courses.length, 0), 0)
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, generalRows, adrRows, chineseLawRows };
