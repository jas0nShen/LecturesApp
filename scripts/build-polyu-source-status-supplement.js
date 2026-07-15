const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-source-status-2027.json');
const verifiedIds = new Set([
  'POLYU-TPG-001',
  'POLYU-TPG-013',
  'POLYU-TPG-014',
  'POLYU-TPG-015',
  'POLYU-TPG-072',
  'POLYU-TPG-073',
  'POLYU-TPG-075',
  'POLYU-TPG-077',
  'POLYU-TPG-078',
  'POLYU-TPG-079',
  'POLYU-TPG-086',
  'POLYU-TPG-089',
  'POLYU-TPG-090',
  'POLYU-TPG-092',
  'POLYU-TPG-093',
  'POLYU-TPG-094',
  'POLYU-TPG-096',
  'POLYU-TPG-102',
  'POLYU-TPG-105'
]);
const statusOverrides = {
  'POLYU-TPG-080': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/hti/study/programmes/taught-postgraduate-programmes_list/master-of-science-in-medical-laboratory-science/',
    statusNote: 'The official 2027 Programme page and the September 2026 MSc Medical Laboratory Science leaflet publish the 31-credit generic and Molecular Diagnostics paths, course groups and current subject titles. Neither public source publishes the subject codes, and the leaflet directs readers to the Programme Requirement Document for curriculum details; that document is not publicly linked. The Programme remains blocked rather than inferring codes from other Health Technology awards.'
  },
  'POLYU-TPG-081': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/hti/study/programmes/taught-postgraduate-programmes_list/master-of-science-in-medical-imaging-and-radiation-science/',
    statusNote: 'The official 2027 Programme page and the September 2026 MSc Medical Imaging and Radiation Science leaflet publish the 31-credit generic path, three Specialisms, course groups and current subject titles. Neither public source publishes the subject codes, and the leaflet directs readers to the Programme Requirement Document for curriculum details; that document is not publicly linked. The Programme remains blocked rather than inferring codes from another Health Technology award.'
  },
  'POLYU-TPG-082': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/hti/study/programmes/taught-postgraduate-programmes_list/master-of-science-in-medical-physics/',
    statusNote: 'The official 2027 Programme page publishes the 31-credit rule, current course titles and per-course credits, while the September 2026 MSc Medical Physics leaflet confirms the public subject pools. Neither source publishes the subject codes, and the leaflet directs readers to the Programme Requirement Document for curriculum details; that document is not publicly linked. The Programme remains blocked rather than inferring codes from another Health Technology award.'
  },
  'POLYU-TPG-083': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/hti/study/programmes/taught-postgraduate-programmes_list/master-of-science-in-medical-data-science/',
    statusNote: 'The official 2027 Programme page and the September 2026 MSc Medical Data Science leaflet publish the 31-credit rule, course groups and current subject titles. Neither public source publishes the complete subject codes and per-course credits, and the leaflet directs readers to the Programme Requirement Document for curriculum details; that document is not publicly linked. The Programme remains blocked rather than exposing a partial code pool assembled from overlapping awards.'
  },
  'POLYU-TPG-084': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/hti/study/programmes/taught-postgraduate-programmes_list/master-of-medical-imaging/',
    statusNote: 'The official 2027 Programme page and the September 2026 Master of Medical Imaging leaflet publish the 91-credit professional structure and current Foundation, Professional and Clinical Practicum titles. Neither public source publishes the subject codes or per-course credit values, and the leaflet directs readers to the Programme Requirement Document for curriculum details; that document is not publicly linked. The Programme remains blocked rather than inventing the professional and practicum codes or splitting aggregate credits across courses.'
  },
  'POLYU-TPG-085': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/gs/prospective-students/tpg/master-of-technology-entrepreneurship/curriculum/',
    statusNote: 'The official 2027 Programme page, Graduate School Curriculum page and 2027-28 Programme brochure consistently publish the 37-credit structure, current Technology Core, Entrepreneurship Core, Project, Elective and Academic Integrity and Ethics subject titles, and the explicit credit value of every subject. The three public sources do not publish any subject code, including the 6-credit Project Part 1: Research and the 15-credit Project Part 2: Start-up completed at an MTRI. The Programme remains blocked rather than inventing a new subject prefix or exposing name-only courses.'
  },
  'POLYU-TPG-087': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/fb/study/tpg-landing/tpg/bm/resources/',
    statusNote: 'The official 2027 Programme page and 2027-28 MSc Business Management brochure publish the 43-credit structure, current subject titles, the 6-credit International Experience requirement and the two-of-eleven Elective rule. The public AF, LMS and MM Subject Syllabi catalogues recover many matching codes and 3-credit values, including BM-labelled AF entries, but they do not publish a uniquely identified code for International Experience. The MM catalogue also exposes two English AIE codes in one Subject Description and two different subjects named Marketing Management, so the current Programme-specific codes cannot be selected safely by title alone. The public Resources page links the 2025/26 Programme Requirement Document for Programme code 02022, but the document redirects to PolyU SSO. The Programme remains blocked rather than exposing an incomplete code pool or choosing among same-name subjects without the Programme Requirement Document.'
  },
  'POLYU-TPG-088': {
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    trackSelectionOptional: false,
    tracks: [
      {
        id: 'POLYU-TPG-088-DIGITAL-ASSET-MANAGEMENT',
        name: 'Digital Asset Management',
        type: 'Award Path',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/fb/study/tpg-landing/tpg/awm/programme_dam/'
      },
      {
        id: 'POLYU-TPG-088-FAMILY-OFFICE-WEALTH-MANAGEMENT',
        name: 'Family Office Wealth Management',
        type: 'Award Path',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/fb/study/tpg-landing/tpg/awm/programme_fowm/'
      }
    ],
    sourceUrl: 'https://www.polyu.edu.hk/fb/study/tpg-landing/tpg/awm/',
    statusNote: 'The official 2027 Programme page, the two current Faculty of Business Award Path pages and the 2027-28 MSc Asset and Wealth Management brochure consistently publish two 31-credit Award Paths, the 21-credit Compulsory Core requirement, the 1-credit AIE requirement, the 9-credit three-of-nine Elective requirement, the 6-credit Project and the 3-credit International Experience option. These public Programme sources publish subject titles but no subject codes. The public 2025/26 AF, LMS and MM Subject Syllabi catalogues recover codes for some overlapping titles, but they do not expose an AWM-labelled code table or exact current entries for Asset and Wealth Management, Asset and Wealth Management Operation, Digital Asset Management, Investment and Operations Management, or Wealth Planning and Family Office. The Programme uses singular Investment while the AF catalogue exposes AF5344 Investments, the MM catalogue exposes two different Marketing Management codes and multiple AIE variants, and its public International Experience entries are MBA-specific. The Programme remains blocked rather than mapping a future 2027 curriculum from partial, same-name or differently named 2025/26 subjects.'
  },
  'POLYU-TPG-091': {
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/61038',
    statusNote: 'The official 2027 Programme page publishes the 31-credit structure, the five required credit categories and the current 1-credit DSAI5T09 Academic Integrity and Ethics subject. The official 2026 MSc Metaverse Technology brochure publishes the complete grouped subject-title list, while the current COMP Subjects page and official COMP, EIE and MM catalogues recover codes for all but five cross-department subjects: Procedural Content Generation and AI in Games, Metaverse Economics & Ecosystems, UX Design Fundamentals, Advanced Visualisation and Interaction, and Entrepreneurship for Culture and Creative Industry. The older COMP curriculum page still names EEE5T03 as AIE, so the current 2027 Programme page takes precedence for the 2027-28 intake. None of the public official Programme, School of Design or subject-catalogue pages publishes codes for the five unresolved titles. The Programme remains blocked rather than exposing a partial pool or inferring codes from subject names.'
  },
  'POLYU-TPG-095': {
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/73040-ftm-ptm',
    statusNote: 'The official 2027 Programme page and current School of Design Programme Structure page publish the 31-credit curriculum: 12 Core credits, 12 Elective credits, a 6-credit Capstone Project and a 1-credit Academic Integrity and Ethics requirement. They also publish the current Practice Pathway, the STEM-only Applied Research Pathway introduced for the 2027-28 cohort, the pathway selection rules, subject titles and explicit credits where applicable. The official 2026 School of Design MSc prospectus identifies ABCT5T01 as the 1-credit Academic Integrity and Ethics in Science subject, resolving the otherwise unlabelled attendance reference on the Programme page. The public sources do not publish codes for the Core subjects, Research Seminars, Practice and Applied Research subjects, Capstone Project or the complete Other Elective pool; the 2027 page also adds Study Trip beyond the 2026 prospectus. Official curriculum tables for another Programme recover codes for four shared electives only, which does not establish the complete current MScIME code list. The Programme remains blocked rather than exposing a partial pool or inferring the unresolved codes from titles.'
  },
  'POLYU-TPG-097': {
    verifiedAt: '2026-07-15',
    creditsRequired: 34,
    creditUnit: 'credits',
    trackSelectionOptional: false,
    tracks: [
      {
        id: 'POLYU-TPG-097-FASHION-PRACTICE',
        code: 'FP',
        name: 'Fashion Practice',
        type: 'Pathway',
        creditsRequired: 34,
        sourceUrl: 'https://www.polyu.edu.hk/sft/admissions/taught-postgraduate-programmes/master-of-arts-in-fashion-design---fashion-practice/'
      },
      {
        id: 'POLYU-TPG-097-DIGITAL-FASHION-INNOVATION',
        code: 'DFI',
        name: 'Digital Fashion Innovation',
        type: 'Pathway',
        creditsRequired: 34,
        sourceUrl: 'https://www.polyu.edu.hk/sft/admissions/taught-postgraduate-programmes/master-of-arts-in-fashion-design---digital-fashion-innovation/'
      }
    ],
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14111-fpp-dfi',
    statusNote: 'The official 2027 Programme page, the two current School of Fashion and Textiles Pathway pages and the official 2027-28 Programme leaflet publish two required 34-credit Pathways: 12 Common Core credits, 9 Pathway Specialist credits, a 9-credit Personal Major Project, one Elective subject and a 1-credit Academic Integrity and Ethics requirement. The current official SFT Subject Synopsis table recovers codes for several shared and Fashion Practice subjects, including SFT5970-SFT5974, SFT5976 and SFT5977CP, plus some listed Electives. It does not publish codes for Contextual Thesis Report or the three new Digital Fashion Innovation Studio subjects. The current Fashion Practice title Life Cycle Assessment for Fashion Design also differs from the public SFT5102 Life Cycle Assessment of Fashion Products entry, so that code cannot be substituted by title similarity. The Subject Synopsis table publishes both SFT5R08 and SFT5T08 with the same Academic Integrity and Ethics in Design and Innovation title, while the current Programme sources do not identify which code applies. The public Programme pages provide aggregate group credits but not an explicit credit value for every named subject. The Programme remains blocked rather than exposing the partial Fashion Practice mapping, inventing the new Digital Fashion Innovation codes or selecting between ambiguous AIE entries.'
  },
  'POLYU-TPG-098': {
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    trackSelectionOptional: false,
    tracks: [
      {
        id: 'POLYU-TPG-098-GIP-STUDY-OPTION-1',
        name: 'Study Option 1',
        type: 'Global Immersion Study Pathway',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14105-ftg-ptg'
      },
      {
        id: 'POLYU-TPG-098-GIP-STUDY-OPTION-2',
        name: 'Study Option 2',
        type: 'Global Immersion Study Pathway',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14105-ftg-ptg'
      }
    ],
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14105-ftg-ptg',
    statusNote: 'The official 2027 Programme page publishes the complete 31-credit structure: three 9-credit Core subjects, one required 9-credit Global Immersion Study Pathway, four subjects selected from a 12-credit Elective pool, and a 1-credit Academic Integrity and Ethics requirement. Students must declare Study Option 1, comprising the New York, Paris and Hong Kong, China Fashion Seminars and Visits, or Study Option 2, comprising the Europe or North America and Asia International Study Tours and Workshops plus the Capstone Project - Innovative Business Proposal. The current official SFT Subject Synopsis table resolves SFT501-SFT503, SFT5041-SFT5043, SFT5051-SFT5053, SFT506, SFT508-SFT510, SFT512 and SFT513 for every named 3-credit curriculum subject. The same current table publishes both SFT5R08 and SFT5T08 as 1-credit Academic Integrity and Ethics in Design and Innovation subjects, and their June 2026 official Subject Description Forms are otherwise identical. Neither the Programme page nor another public Programme-specific official source identifies which AIE code belongs to Programme 14105. The Programme remains blocked rather than selecting an AIE code by prefix or exposing a structure with an ambiguous compulsory subject.'
  },
  'POLYU-TPG-099': {
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14107-ffs-pfs',
    statusNote: 'The official 2027 Programme page corrects the MA total to 31 credits and publishes five 15-credit Core subjects, the 9-credit Capstone Project of Sustainability and an eight-subject Elective pool from which MA students choose two. It separately publishes a 22-credit PgD exit award, which is not modelled as an MA completion path. The current official SFT Subject Synopsis table resolves SFT5100-SFT5108 for every SFT Core, Capstone and sustainability Elective title, ITC516 for Research Methodology, and SFT501, SFT503, SFT508 and SFT509 for the four cross-Programme Electives. The same current table publishes both SFT5R08 and SFT5T08 as 1-credit Academic Integrity and Ethics in Design and Innovation subjects, and their June 2026 official Subject Description Forms are otherwise identical. The 31-credit total requires the additional 1-credit AIE component, but neither the Programme page nor another public Programme-specific official source identifies which AIE code belongs to Programme 14107. The Programme remains blocked rather than retaining the stale 15-credit total, selecting an AIE code by prefix or exposing a structure with an ambiguous compulsory subject.'
  },
  'POLYU-TPG-100': {
    verifiedAt: '2026-07-15',
    programmeName: 'Intelligent Wearable Technology',
    creditsRequired: 34,
    creditUnit: 'credits',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/14110-iwt-pwt-pgd',
    statusNote: 'The official 2027 Programme page corrects the Programme name to Intelligent Wearable Technology and publishes a 34-credit MSc and a separate 22-credit PgD exit award. MSc Learning Mode I comprises seven 3-credit Compulsory subjects, one 3-credit Elective and the 9-credit Research Project; Learning Mode II comprises the same seven Compulsory subjects and four 3-credit Electives. The current official SFT Subject Synopsis table resolves SFT543-SFT549CP, including SFT545 Advanced Fiber Materials and the 9-credit SFT549CP Research Project, plus ITC516, ITC523, ITC528, ITC545, SFT5101, SFT5107 and SFT5108. Current official COMP and EIE subject pages resolve COMP5140, COMP5511, COMP5517, EIE560 and EIE568. No public current official source identifies the code for Metaverse Applications: Design and Case Studies. Each published MSc mode also totals 33 credits rather than the official 34, and the Programme page does not name the additional 1-credit component. Although the SFT Subject Synopsis table publishes both SFT5R08 and SFT5T08 as 1-credit Academic Integrity and Ethics in Design and Innovation subjects, the Programme page neither lists AIE nor identifies either code for Programme 14110. The Programme remains blocked rather than publishing a partial course pool, inferring the Metaverse Applications code or assigning the unexplained credit to an AIE subject.'
  },
  'POLYU-TPG-101': {
    verifiedAt: '2026-07-15',
    creditsRequired: 37,
    creditUnit: 'credits',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/24043',
    statusNote: 'The official 2027 Programme page corrects the total to 37 credits and publishes the complete three-semester joint-degree structure. At EHL Hospitality Business School, students complete four named 3-credit Compulsory subjects. At PolyU, they complete HTM5T02 Academic Integrity and Ethics in Business Studies and Research (1 credit), HTM562-HTM565 (3 credits each) and HTM566 Capstone Consulting Project (6 credits). At the University of Houston, they complete three named 3-credit Compulsory subjects and one 3-credit Elective. The official transfer rule counts 9 of the 12 credits completed at each partner institution, for 18 transferred credits plus 19 PolyU credits. The public Programme page does not publish course codes for any EHL or University of Houston subject and does not identify the University of Houston Elective title or code. No current public official EHL or University of Houston Programme or course-catalogue page was found that maps these exact joint-degree titles to stable codes. The Programme remains blocked rather than publishing only the six PolyU-coded subjects, inventing partner-institution codes or treating all 24 partner credits as degree credits.'
  },
  'POLYU-TPG-103': {
    verifiedAt: '2026-07-15',
    faculty: 'Faculty of Humanities',
    creditsRequired: 31,
    creditUnit: 'credits',
    trackSelectionOptional: false,
    tracks: [
      {
        id: 'POLYU-TPG-103-ENGLISH-FOR-PROFESSIONAL-COMMUNICATION',
        name: 'English for Professional Communication',
        type: 'Specialism',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/71026-mcf-mcp-mlf-mlp'
      },
      {
        id: 'POLYU-TPG-103-ENGLISH-LANGUAGE-TEACHING',
        name: 'English Language Teaching',
        type: 'Specialism',
        creditsRequired: 31,
        sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/71026-mcf-mcp-mlf-mlp'
      }
    ],
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/71026-mcf-mcp-mlf-mlp',
    statusNote: 'The official 2027 Programme page corrects the MA total to 31 credits, identifies the Faculty of Humanities, requires applicants to choose English for Professional Communication or English Language Teaching, and publishes the current Compulsory, Specialism-specific Core, Specialism-specific Elective and Common Elective subject-title pools. The current Department of English and Communication Full Subject List recovers exact code entries for 27 named taught subjects. It also publishes ENGL5012 Research Project in Language Studies, ENGL580 Research Project and ENGL587 Research Project; the linked official Subject Description Forms assign 6 credits to each, describe ENGL580 as professional-communication research and ENGL587 as classroom-based or classroom-oriented research, but the Programme page uses only generic or plural Research Project labels and does not explicitly assign those codes or state whether ENGL5012 is included. The current Full Subject List does not publish entries for Professional Ethics and Academic Integrity or the subject-to-approval Time in Second Language Teaching and Learning. In addition, the December 2025 official Programme flyer linked from the Department 2027/28 page publishes an all-coursework Route and a coursework-and-research Route with three Specialism-specific Core subjects for either Specialism, while the 2027 Programme page requires three such Core subjects for EPC but five for ELT and does not describe those two Routes. The Programme remains blocked rather than selecting the AIE or Time subject codes from another Programme, guessing the Research Project membership, or choosing between conflicting official completion paths.'
  },
  'POLYU-TPG-076': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/ama/study/pg/master-operational-and-risk-analysis/curriculum/',
    statusNote: 'The official 2027 Programme page publishes a 31-credit structure and an elective list that includes Advanced Topics in InsurTech and Supply Chain Management. The current AMA Curriculum code table does not identify those two current elective entries and instead includes Current Topics in Actuarial Science. The remaining compulsory, elective, Dissertation and AIE codes can be mapped, but this mismatch leaves the current elective pool incomplete; no code is inferred from another Programme.'
  },
  'POLYU-TPG-074': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/rs/study/taught-postgraduate-studies/msc-programme-2026-or-after/msc-in-advanced-physiotherapy/curriculum/',
    statusNote: 'The official 2027 Programme page, the current Department of Rehabilitation Sciences Curriculum page, and the July 2026 v14 Programme leaflet publish the 31-credit paths, three Specialisms, fixed Core and Clinical Practice subject codes, and per-course credits. All three sources label the compulsory 6-credit component only as Project Study and do not publish its subject code. RS567 must not be inferred from another Rehabilitation Sciences Programme.'
  },
  'POLYU-TPG-104': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/sn/study/postgraduate-programmes/master-of-science-in-nursing/programme-structure/',
    statusNote: 'The official 2027 Programme page, School of Nursing programme pamphlet and 2025-intake Subject Offering Pattern publish the 31-credit completion paths, eight specialisms, and coded Core, Dissertation, Practicum, specialty and general elective subjects. They do not publish the AIE subject code or explicit per-course credits for the taught subjects. Those fields must not be inferred from another FHSS Programme or from the aggregate group totals.'
  }
};

function main() {
  const programmes = source.rows.filter((row) => !verifiedIds.has(row.programmeId)).map((row) => {
    const override = statusOverrides[row.programmeId] || {};
    return {
      programmeId: row.programmeId,
      status: 'blocked',
      sourceUrl: override.sourceUrl || row.sourceUrl,
      statusNote: override.statusNote || (row.error
        ? `The official Programme page could not be fetched during the 2026-07-11 verification: ${row.error}`
        : row.courseCodes && row.courseCodes.length
          ? 'The official Programme page contains only a partial coded course list or lacks explicit per-course credits; a departmental curriculum or handbook is still required.'
          : 'The official Programme page does not publish a complete coded course list; a departmental curriculum or handbook is still required.'),
      ...(override.programmeName ? { programmeName: override.programmeName } : {}),
      ...(override.faculty ? { faculty: override.faculty } : {}),
      ...(override.creditsRequired ? { creditsRequired: override.creditsRequired } : {}),
      ...(override.creditUnit ? { creditUnit: override.creditUnit } : {}),
      ...(override.trackSelectionOptional !== undefined ? { trackSelectionOptional: override.trackSelectionOptional } : {}),
      ...(override.tracks ? { tracks: override.tracks } : {}),
      ...(override.verifiedAt ? { verifiedAt: override.verifiedAt } : {})
    };
  });
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
