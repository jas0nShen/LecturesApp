const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';
const OUTPUT_PATH = path.join(__dirname, '..', 'miniprogram', 'utils', 'ugCatalogue.js');

const SOURCES = [
  {
    code: 'HKU',
    file: 'hku_programme_year_semester_courses_2026.json',
    nameZh: '香港大学',
    shortName: 'HKU'
  },
  {
    code: 'CUHK',
    file: 'cuhk_programme_year_semester_courses_2026.json',
    nameZh: '香港中文大学',
    shortName: 'CUHK'
  },
  {
    code: 'HKUST',
    file: 'hkust_programme_year_semester_courses_2026.json',
    nameZh: '香港科技大学',
    shortName: 'HKUST'
  },
  {
    code: 'POLYU',
    file: 'polyu_programme_year_semester_courses_2026.json',
    nameZh: '香港理工大学',
    shortName: 'PolyU'
  },
  {
    code: 'CITYU',
    file: 'cityu_programme_year_semester_courses_2026.json',
    nameZh: '香港城市大学',
    shortName: 'CityUHK'
  },
  {
    code: 'HKBU',
    file: 'hkbu_programme_year_semester_courses_2026.json',
    nameZh: '香港浸会大学',
    shortName: 'HKBU'
  }
];

function slug(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function compactText(value, maxLength = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function listCourses(programme) {
  const rows = [];
  (programme.years || []).forEach((year) => {
    (year.semesters || []).forEach((semester) => {
      (semester.courses || []).forEach((course) => {
        rows.push({
          code: String(course.code || course.course_code || '').trim(),
          title: compactText(course.title || course.course_title || ''),
          track: compactText(course.track || ''),
          year: year.year || '',
          semester: semester.semester || '',
          dataStatus: semester.data_status || '',
          sourceUrl: course.source_url || programme.official_url || ''
        });
      });
    });
  });
  return rows;
}

function normalizeSource(source, sourceDir) {
  const raw = JSON.parse(fs.readFileSync(path.join(sourceDir, source.file), 'utf8'));
  const university = {
    id: source.code,
    code: source.code,
    shortName: source.shortName,
    nameEn: raw.university,
    nameZh: source.nameZh,
    academicYear: raw.entry_year || '2026'
  };
  const facultySet = new Set();
  const programmes = [];
  const majors = [];
  const courses = [];

  (raw.programmes || []).forEach((programme, programmeIndex) => {
    const programmeCode = String(programme.programme_code || programme.jupas_code || '').trim();
    const programmeKey = slug(programmeCode || programme.programme_name || programmeIndex);
    const programmeId = `${source.code}-UG-${programmeKey || 'PROGRAMME'}-${programmeIndex + 1}`;
    const faculty = programme.faculty || programme.school_or_faculty || '';
    if (faculty) facultySet.add(faculty);
    const programmeCourses = listCourses(programme);
    const codedProgrammeCourses = programmeCourses.filter((course) => course.code);

    programmes.push({
      id: programmeId,
      universityId: source.code,
      universityCode: source.code,
      facultyId: faculty ? `${source.code}-${slug(faculty)}` : `${source.code}-GENERAL`,
      code: programmeCode,
      jupasCode: programme.jupas_code || '',
      nameEn: programme.programme_name,
      nameZh: programme.programme_name,
      degreeLevel: 'undergraduate',
      curriculumYear: raw.entry_year || '2026',
      faculty,
      studyPeriod: programme.study_period || '',
      type: programme.type || programme.award || programme.study_level || '',
      officialUrl: programme.official_url || programme.source_url || '',
      sourceStatus: codedProgrammeCourses.length ? 'course_codes_available' : 'programme_summary_only',
      courseCount: programmeCourses.length,
      codedCourseCount: codedProgrammeCourses.length
    });

    const tracks = Array.isArray(programme.majors_or_tracks) && programme.majors_or_tracks.length
      ? programme.majors_or_tracks
      : [programme.programme_name];
    tracks.forEach((track, trackIndex) => {
      const majorId = `${programmeId}-M${trackIndex + 1}`;
      const trackCourses = programmeCourses.filter((course) => !course.track || course.track === track);
      const effectiveCourses = trackCourses.length ? trackCourses : programmeCourses;
      majors.push({
        id: majorId,
        programmeId,
        code: slug(track) || `M${trackIndex + 1}`,
        nameEn: track,
        nameZh: track,
        courseCount: effectiveCourses.length,
        codedCourseCount: effectiveCourses.filter((course) => course.code).length,
        officialUrl: programme.official_url || programme.source_url || ''
      });
      effectiveCourses
        .filter((course) => course.code)
        .forEach((course, courseIndex) => {
          courses.push({
            id: `${majorId}-C${courseIndex + 1}`,
            programmeId,
            majorId,
            courseCode: course.code,
            titleEn: course.title,
            titleZh: course.title,
            recommendedYear: Number(String(course.year).match(/\d+/)?.[0] || 0),
            semester: course.semester,
            courseType: 'programme_course',
            sourceUrl: course.sourceUrl
          });
        });
    });
  });

  const faculties = [...facultySet].sort().map((faculty) => ({
    id: `${source.code}-${slug(faculty)}`,
    universityId: source.code,
    nameEn: faculty,
    nameZh: faculty
  }));
  if (!faculties.length) {
    faculties.push({
      id: `${source.code}-GENERAL`,
      universityId: source.code,
      nameEn: 'General',
      nameZh: 'General'
    });
  }

  return { university, faculties, programmes, majors, courses };
}

function buildCatalogue(sourceDir = DEFAULT_SOURCE_DIR) {
  const pieces = SOURCES.map((source) => normalizeSource(source, sourceDir));
  return {
    generatedFrom: 'programme_year_semester_courses_2026',
    generatedAt: new Date().toISOString(),
    universities: pieces.map((piece) => piece.university),
    faculties: pieces.flatMap((piece) => piece.faculties),
    programmes: pieces.flatMap((piece) => piece.programmes),
    majors: pieces.flatMap((piece) => piece.majors),
    courses: pieces.flatMap((piece) => piece.courses)
  };
}

function main() {
  const sourceDirIndex = process.argv.indexOf('--source-dir');
  const sourceDir = sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(process.argv[sourceDirIndex + 1]);
  const catalogue = buildCatalogue(sourceDir);
  fs.writeFileSync(
    OUTPUT_PATH,
    `// Generated by npm run sync:ug-catalog. Do not edit manually.\nmodule.exports = ${JSON.stringify(catalogue, null, 2)};\n`
  );
  console.log(`Generated UG catalogue: ${catalogue.universities.length} universities, ${catalogue.programmes.length} programmes, ${catalogue.majors.length} majors/tracks, ${catalogue.courses.length} coded courses`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildCatalogue,
  listCourses,
  normalizeSource
};
