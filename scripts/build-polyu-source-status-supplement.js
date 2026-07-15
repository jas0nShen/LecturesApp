const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-source-status-2027.json');
const verifiedIds = new Set([
  'POLYU-TPG-013',
  'POLYU-TPG-014',
  'POLYU-TPG-015',
  'POLYU-TPG-072',
  'POLYU-TPG-073',
  'POLYU-TPG-075',
  'POLYU-TPG-077',
  'POLYU-TPG-078',
  'POLYU-TPG-079',
  'POLYU-TPG-089',
  'POLYU-TPG-090',
  'POLYU-TPG-092',
  'POLYU-TPG-093',
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
      ...(override.verifiedAt ? { verifiedAt: override.verifiedAt } : {})
    };
  });
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
