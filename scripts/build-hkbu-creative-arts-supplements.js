const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const supplementsDir = path.join(ROOT, 'data', 'tpg-course-supplements');
const VERIFIED_AT = '2026-07-16';
const HANDBOOK_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026';
const COURSE_ROOT = `${HANDBOOK_ROOT}/course`;
const MFA_URL = 'https://af.hkbu.edu.hk/en/programmes/mfa-cacp/mfacacp-programme-structure.html';

const SOURCES = {
  PRODUCING: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-creative-arts/academy-of-film/master-of-arts-in-producing-for-film-television-and-new`,
  MUSIC: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-creative-arts/academy-of-music/master-of-arts-in-music`,
  VISUAL_ARTS: `${HANDBOOK_ROOT}/academic-programmes/postgraduate-programmes/school-of-creative-arts/academy-of-visual-arts/master-of-arts-in-visual-arts`
};

const MFA_TRACKS = {
  NARRATIVE: 'HKBU-TPG-045-NARRATIVE-FILM-PRODUCTION',
  DOCUMENTARY: 'HKBU-TPG-045-DOCUMENTARY-FILM-PRODUCTION',
  SCRIPTWRITING: 'HKBU-TPG-045-FILM-TV-SCRIPTWRITING'
};

const VISUAL_ARTS_TRACKS = {
  SMA: 'HKBU-TPG-048-STUDIO-MEDIA-ARTS',
  CD: 'HKBU-TPG-048-CRAFT-DESIGN'
};

function course(code, name, credits = 3, options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: `${COURSE_ROOT}/${code}`,
    ...options
  };
}

function group(id, name, type, sourceUrl, courses, options = {}) {
  return {
    id,
    name,
    type,
    appliesToTrackIds: [],
    sourceUrl,
    courses,
    ...options
  };
}

function mfaCourse(code, name, credits = 3, options = {}) {
  return course(code, name, credits, { sourceUrl: MFA_URL, ...options });
}

function buildMfa() {
  const trackRows = [
    [MFA_TRACKS.NARRATIVE, 'Narrative Film Production'],
    [MFA_TRACKS.DOCUMENTARY, 'Documentary Film Production'],
    [MFA_TRACKS.SCRIPTWRITING, 'Film or TV Scriptwriting']
  ];
  const requiredFor = (trackId) => ({
    conditionalRequirement: true,
    requiredForTrackIds: [trackId],
    typeByTrackIds: { [trackId]: 'track_core' }
  });
  return {
    programmeId: 'HKBU-TPG-045',
    programmeName: 'Master of Fine Arts (MFA) in Cinematic Arts and Creative Practice',
    faculty: 'Academy of Film, School of Creative Arts',
    status: 'verified',
    creditsRequired: 48,
    creditUnit: 'units',
    sourceUrl: MFA_URL,
    ruleReviewStatus: 'manual_review_required',
    trackSelectionOptional: false,
    tracks: trackRows.map(([id, name]) => ({
      id,
      name,
      type: 'Thesis Form',
      creditsRequired: 48,
      sourceUrl: MFA_URL,
      lastVerifiedAt: VERIFIED_AT
    })),
    statusNote: 'The current Academy of Film course list is explicitly applicable to the September 2026 intake and onwards and replaces the linked older 66-unit MFA Handbook structure. It publishes a 48-unit award: eleven Core codes for 36 units, including the 9-unit CTV7501/CTV7502 MFA Thesis Project sequence, plus four 3-unit Electives. The current 39-code Elective pool requires at least 6 units from Creativity and Production and at least 3 units from Theory and Specialised Topics. Each of the three Thesis Forms also requires its published two-course production or writing prerequisite pair, which counts within the Elective structure. Annual availability, quotas, category minima and Thesis-form prerequisites require manual audit review; the old CTV7081/CTV7082 Thesis codes are not retained.',
    courseGroups: [
      group('core-courses', 'Core Courses', 'core', MFA_URL, [
        mfaCourse('CTV7101', 'Introduction to Film Production'),
        mfaCourse('CTV7131', 'Script Writing and Pre-production Planning with AI'),
        mfaCourse('CTV7121', 'Film History and Aesthetics'),
        mfaCourse('CTV7111', 'Documentary Film Art and Style'),
        mfaCourse('CTV7370', 'Cinematography for Directors'),
        mfaCourse('CTV7141', 'Introduction to Cross-Media Creation and Application with AI and UE5'),
        mfaCourse('CTV7151', 'Post-Production in the Age of AI'),
        mfaCourse('CTV7201', 'Digital Production Design'),
        mfaCourse('CTV7020', 'Digital Media Content Production'),
        mfaCourse('CTV7501', 'MFA Thesis Project I (Conceptualization and Pre-Production Planning)', 3, { courseKind: 'thesis_project', linkedSequenceId: 'CTV750-MFA-THESIS-PROJECT' }),
        mfaCourse('CTV7502', 'MFA Thesis Project II (Enhance Your Cinematic Craft)', 6, { courseKind: 'thesis_project', linkedSequenceId: 'CTV750-MFA-THESIS-PROJECT' })
      ], {
        creditsRequired: 36,
        coursesRequired: 11,
        ruleText: 'Complete all eleven Core codes for 36 units, including both MFA Thesis Project parts CTV7501 and CTV7502.'
      }),
      group('elective-requirement', 'Elective Requirement', 'elective_requirement', MFA_URL, [], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete four 3-unit Electives. At least two must come from Creativity and Production and at least one from Theory and Specialised Topics. The selected Thesis Form also requires its designated two-course prerequisite pair within this Elective structure.'
      }),
      group('creativity-production-electives', 'Creativity and Production Electives', 'elective', MFA_URL, [
        mfaCourse('CTV7150', 'Dramatic Film/TV Production', 3, requiredFor(MFA_TRACKS.NARRATIVE)),
        mfaCourse('CTV7170', 'Advanced Dramatic Film/TV Production', 3, requiredFor(MFA_TRACKS.NARRATIVE)),
        mfaCourse('CTV7160', 'Documentary Film/TV Production', 3, requiredFor(MFA_TRACKS.DOCUMENTARY)),
        mfaCourse('CTV7413', 'Advanced Documentary Film Production', 3, requiredFor(MFA_TRACKS.DOCUMENTARY)),
        mfaCourse('CTV7110', 'Advanced Script Writing', 3, requiredFor(MFA_TRACKS.SCRIPTWRITING)),
        mfaCourse('CTV7403', 'Drama Series Writing', 3, requiredFor(MFA_TRACKS.SCRIPTWRITING)),
        mfaCourse('CTV7040', 'Film Production II'),
        mfaCourse('CTV7050', 'Advanced Television Studio Production'),
        mfaCourse('CTV7100', 'Script Writing'),
        mfaCourse('CTV7120', 'Creativity Workshop'),
        mfaCourse('CTV7130', 'Comedy: Theory and Practice'),
        mfaCourse('CTV7360', 'Idea, Story, Script'),
        mfaCourse('CTV7380', 'Dramaturgy and Directing'),
        mfaCourse('CTV7400', 'Explorations in Digital Media'),
        mfaCourse('CTV7410', 'Digital Media Production'),
        mfaCourse('CTV7420', 'Basic Acting Techniques'),
        mfaCourse('CTV7430', 'Visual Effects'),
        mfaCourse('CTV7470', 'Special Topics - Professional Development I'),
        mfaCourse('CTV7530', 'Special Topics - Professional Development II'),
        mfaCourse('CTV7490', 'Sound Design for Media'),
        mfaCourse('CTV7510', 'Advertising Fundamentals and Promotional Film Production'),
        mfaCourse('CTV7202', 'Writing for Games'),
        mfaCourse('CTV7550', 'Vertical and Horizontal Screen Drama Production')
      ], {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'At least two Electives (6 units) must come from this category. Narrative Film Production requires CTV7150 and CTV7170; Documentary Film Production requires CTV7160 and CTV7413; Film or TV Scriptwriting requires CTV7110 and CTV7403.'
      }),
      group('theory-specialised-electives', 'Theory and Specialised Topics Electives', 'elective', MFA_URL, [
        mfaCourse('CTV7070', 'Media Management'),
        mfaCourse('CTV7230', 'Seminar on Chinese Cinemas'),
        mfaCourse('CTV7240', 'Film Theory and Criticism'),
        mfaCourse('CTV7260', 'Hong Kong Media and Globalization'),
        mfaCourse('CTV7270', 'Current Issues of Asian Media'),
        mfaCourse('CTV7290', 'Critique of Contemporary Arts'),
        mfaCourse('CTV7300', 'Seminar on Great Works and Human Condition'),
        mfaCourse('CTV7450', 'Alternative Cinema'),
        mfaCourse('CTV7460', 'Film and Other Arts'),
        mfaCourse('CTV7480', 'Special Topics - Aesthetics and Appreciation I'),
        mfaCourse('CTV7500', 'Film and Literature'),
        mfaCourse('CTV7520', 'Special Topics - Aesthetics and Appreciation II'),
        mfaCourse('CTV7540', 'Seminar on Television and New Media'),
        mfaCourse('CTV7560', 'Film Festival: Creative Strategy and Global Practice')
      ], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'At least one Elective (3 units) must come from this category.'
      }),
      group('other-electives', 'Other Elective Courses', 'elective', MFA_URL, [
        mfaCourse('CTV7310', 'Independent Study'),
        mfaCourse('CTV7330', 'Internship', 3, { courseKind: 'internship' })
      ], {
        ruleText: 'These courses may be used for the remaining Elective space, subject to availability and quota.'
      })
    ]
  };
}

const producingElectives = [
  ['AF7450', 'Case Studies in Production and the Market'],
  ['AF7460', 'Overview of New Media Contents and its Future: Internet Movie, Drama Series and Short Video'],
  ['AF7470', 'Seminar on Non-Mainstream Producing'],
  ['AF7480', 'Film, Television, New Media and Globalization'],
  ['AF7490', 'Multimedia Management'],
  ['AF7520', 'Interactive Media Design'],
  ['AF7530', 'Principles and Applications of Computer Graphics'],
  ['AF7540', 'The Art and Practice of Digital Media'],
  ['AF7550', 'Graduate Seminar on Chinese New Waves Cinema'],
  ['AF7560', 'Multimedia Platform Programming Positioning and Branding'],
  ['AF7570', 'Non-Scripted (Reality Show) Creation and Production'],
  ['AF7580', "Graduate Seminar on a Director's Palette"],
  ['AF7590', 'Digital Multimedia Communication'],
  ['AF7600', 'Narrative Storytelling'],
  ['AF7610', 'Film Festival and Film Programme Curation'],
  ['COMM7040', 'Issues in Intercultural Communication'],
  ['COMM7170', 'Communication Campaign Workshop'],
  ['COMM7200', 'New Media Workshop'],
  ['COMM7270', 'Media Policies and Regulations'],
  ['COMM7300', 'Consumer Insights'],
  ['JOUR7030', 'Research Methods in Media and Communication']
];

const producingExternalElectives = [
  ['CTV7230', 'Seminar on Chinese Cinemas'],
  ['CTV7270', 'Current Issues of Asian Media'],
  ['CTV7290', 'Critique of Contemporary Arts'],
  ['CTV7300', 'Seminar on Great Works and Human Condition'],
  ['CTV7450', 'Alternative Cinema'],
  ['CTV7460', 'Film and Other Arts'],
  ['CTV7480', 'Special Topics - Aesthetics and Appreciation I'],
  ['CTV7500', 'Film and Literature'],
  ['CTV7520', 'Special Topics - Aesthetics and Appreciation II'],
  ['CTV7540', 'Seminar on Television and New Media']
];

function buildProducing() {
  const sourceUrl = SOURCES.PRODUCING;
  return {
    programmeId: 'HKBU-TPG-046',
    programmeName: 'Master of Arts (MA) in Producing for Film, Television and New Media',
    faculty: 'Academy of Film, School of Creative Arts',
    status: 'verified',
    creditsRequired: 27,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    tracks: [],
    statusNote: 'The current September 2026 admissions page confirms the same 27-unit structure as the linked official 2025-26 Handbook. Students complete five Required Courses for 15 units and four Electives for 12 units. The Handbook publishes 21 Programme Electives and ten MFA Electives, but permits at most two courses (6 units) from other programmes and warns that listed Electives depend on Programme arrangements and may not be offered every year. The cross-pool maximum and annual availability require manual audit review.',
    courseGroups: [
      group('required-courses', 'Required Courses', 'core', sourceUrl, [
        course('AF7410', 'Financial Management for Film, Television and New Media'),
        course('AF7420', 'Promotion, Advertising and Distribution for Film, Television and New Media'),
        course('AF7430', 'Law, and Film, Television and New Media'),
        course('AF7440', 'Script Analysis for the Producer'),
        course('AF7510', 'Fundamentals of Media Arts')
      ], {
        creditsRequired: 15,
        coursesRequired: 5,
        ruleText: 'Complete all five Required Courses for 15 units.'
      }),
      group('elective-requirement', 'Elective Requirement', 'elective_requirement', sourceUrl, [], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete four 3-unit Electives. At most two courses (6 units) may come from other programmes.'
      }),
      group('programme-electives', 'Programme Electives', 'elective', sourceUrl, producingElectives.map(([code, name]) => course(code, name)), {
        ruleText: 'Choose from the official Programme Elective pool, subject to annual Programme arrangements.'
      }),
      group('mfa-electives', 'MFA Electives', 'elective', sourceUrl, producingExternalElectives.map(([code, name]) => course(code, name)), {
        creditsMax: 6,
        coursesMax: 2,
        ruleText: 'At most two MFA Electives (6 units) may count toward the award. Offerings depend on Programme arrangements and are not guaranteed every year.'
      })
    ]
  };
}

const musicElectives = [
  ['MUS7270', 'Music Technology'],
  ['MUS7280', 'Creativity in Music'],
  ['MUS7290', 'Psychology and Sociology in Music'],
  ['MUS7300', 'Curriculum Development and Music Materials'],
  ['MUS7310', 'Choral Pedagogy'],
  ['MUS7320', 'Conducting Practicum'],
  ['MUS7340', 'Virtual Music Classroom'],
  ['MUS7350', 'Piano Pedagogy'],
  ['MUS7360', 'Pedagogy Workshop'],
  ['MUS7370', 'Music and Culture'],
  ['MUS7380', 'The Teaching of Chinese Music'],
  ['MUS7390', 'Composition Seminar'],
  ['MUS7400', 'Current Practices in 21st Century Composition'],
  ['MUS7411', 'Dissertation Project'],
  ['MUS7412', 'Dissertation Project'],
  ['MUS7420', 'Choral Training from a Kodály Perspective'],
  ['MUS7430', 'Music in Early Childhood'],
  ['MUS7440', 'Current Practices in Early Childhood Music Education'],
  ['MUS7450', 'Sources, Genres, and Performance: Analytical Approaches'],
  ['MUS7460', 'Sources, Genres, and Performance: Historical Perspectives'],
  ['MUS7470', 'Advanced Piano Pedagogy Workshop'],
  ['MUS7480', 'Advanced Studies in Chinese Music'],
  ['MUS7490', 'Orff and Dalcroze Approaches to Music Teaching'],
  ['MUS7500', 'Issues in the Study of Popular Music: Rock Music in Global Perspective'],
  ['MUS7510', 'Arranging for Small Ensembles'],
  ['MUS7520', 'Studies in Choral Literature'],
  ['MUS7530', 'Studies in Piano Literature'],
  ['MUS7540', 'Current Topics in World Music'],
  ['MUS7550', 'Arranging for Choirs and Vocal Ensembles'],
  ['MUS7600', 'Special Topics in Music I'],
  ['MUS7610', 'Special Topics in Music II'],
  ['MUS7620', 'Special Topics in Music III'],
  ['MUS7630', 'Special Topics in Music IV'],
  ['MUS7660', 'Advanced Music Ensemble I'],
  ['MUS7670', 'Advanced Music Ensemble II'],
  ['MUS7680', 'Recital Project I'],
  ['MUS7690', 'Recital Project II'],
  ['MUS7700', 'Performance Seminar I'],
  ['MUS7710', 'Performance Seminar II'],
  ['MUS7720', 'Post-Instrumental Practice'],
  ['MUS7730', 'Performance Practice in Context'],
  ['MUS7740', 'Music Business and Marketing Strategies'],
  ['MUS7750', 'Introduction to Film Scoring'],
  ['MUS7760', 'Live Performance Workshop for Commercial Music']
];

function buildMusic() {
  const sourceUrl = SOURCES.MUSIC;
  return {
    programmeId: 'HKBU-TPG-047',
    programmeName: 'Master of Arts (MA) in Music',
    faculty: 'Academy of Music, School of Creative Arts',
    status: 'verified',
    creditsRequired: 27,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'verified',
    tracks: [],
    statusNote: 'The current September 2026 admissions page confirms the same 27-unit structure as the linked official 2025-26 Handbook. Students complete MUS7260 Research Methods in Music for 3 units and choose any eight of the 44 published 3-unit Electives for 24 units. The Handbook states a direct eight-of-the-pool rule and does not impose a concentration or category minimum.',
    courseGroups: [
      group('required-course', 'Required Course', 'core', sourceUrl, [
        course('MUS7260', 'Research Methods in Music')
      ], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete MUS7260 Research Methods in Music for 3 units.'
      }),
      group('elective-courses', 'Elective Courses', 'elective', sourceUrl, musicElectives.map(([code, name]) => course(code, name, 3, {
        ...(code === 'MUS7411' || code === 'MUS7412' ? { courseKind: 'dissertation_project' } : {}),
        ...(code === 'MUS7680' || code === 'MUS7690' ? { courseKind: 'recital_project' } : {})
      })), {
        creditsRequired: 24,
        coursesRequired: 8,
        ruleText: 'Choose any eight 3-unit Electives from the published pool for 24 units.'
      })
    ]
  };
}

function buildVisualArts() {
  const sourceUrl = SOURCES.VISUAL_ARTS;
  const trackRows = [
    [VISUAL_ARTS_TRACKS.SMA, 'Studio and Media Arts'],
    [VISUAL_ARTS_TRACKS.CD, 'Craft and Design']
  ];
  const trackIds = trackRows.map(([id]) => id);
  return {
    programmeId: 'HKBU-TPG-048',
    programmeName: 'Master of Arts (MA) in Visual Arts',
    faculty: 'Academy of Visual Arts, School of Creative Arts',
    status: 'verified',
    creditsRequired: 30,
    creditUnit: 'units',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    trackSelectionOptional: false,
    tracks: trackRows.map(([id, name]) => ({
      id,
      name,
      type: 'Concentration',
      creditsRequired: 30,
      sourceUrl,
      lastVerifiedAt: VERIFIED_AT
    })),
    statusNote: 'The current September 2026 admissions page confirms the same 30-unit structure as the linked official 2025-26 Handbook and requires applicants to declare one of two Concentrations. All students complete four 3-unit Required Courses. Studio and Media Arts students complete VASA7010–VASA7040 and Craft and Design students complete VACD7010–VACD7040, each as four 4.5-unit Studio Project parts totalling 18 units. The Handbook states that Studio Project I must be completed before Studio Project II; the mandatory Concentration and linked project progression require manual audit review.',
    courseGroups: [
      group('required-courses', 'Required Courses', 'core', sourceUrl, [
        course('VACC7010', 'Research Methodology for the Visual Arts'),
        course('VACC7020', 'Visual Arts Theory and Criticism'),
        course('VACC7030', 'Critically Engaged: Creative Practices in Context'),
        course('VACC7040', 'Arts and the Public: Interpretation and Presentation')
      ], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four Required Courses for 12 units.'
      }),
      group('concentration-studio-projects', 'Concentration-based Studio Projects', 'track_core_requirement', sourceUrl, [
        course('VASA7010', 'SMA Studio Project IA', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.SMA], courseKind: 'studio_project', linkedSequenceId: 'VASA-STUDIO-PROJECT-I' }),
        course('VASA7020', 'SMA Studio Project IB', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.SMA], courseKind: 'studio_project', linkedSequenceId: 'VASA-STUDIO-PROJECT-I' }),
        course('VASA7030', 'SMA Studio Project IIA', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.SMA], courseKind: 'studio_project', linkedSequenceId: 'VASA-STUDIO-PROJECT-II' }),
        course('VASA7040', 'SMA Studio Project IIB', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.SMA], courseKind: 'studio_project', linkedSequenceId: 'VASA-STUDIO-PROJECT-II' }),
        course('VACD7010', 'CD Studio Project IA', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.CD], courseKind: 'studio_project', linkedSequenceId: 'VACD-STUDIO-PROJECT-I' }),
        course('VACD7020', 'CD Studio Project IB', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.CD], courseKind: 'studio_project', linkedSequenceId: 'VACD-STUDIO-PROJECT-I' }),
        course('VACD7030', 'CD Studio Project IIA', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.CD], courseKind: 'studio_project', linkedSequenceId: 'VACD-STUDIO-PROJECT-II' }),
        course('VACD7040', 'CD Studio Project IIB', 4.5, { appliesToTrackIds: [VISUAL_ARTS_TRACKS.CD], courseKind: 'studio_project', linkedSequenceId: 'VACD-STUDIO-PROJECT-II' })
      ], {
        creditsRequired: 18,
        coursesRequired: 4,
        creditsRequiredByTrackIds: Object.fromEntries(trackIds.map((id) => [id, 18])),
        coursesRequiredByTrackIds: Object.fromEntries(trackIds.map((id) => [id, 4])),
        ruleText: 'Complete all four 4.5-unit Studio Project parts assigned to the declared Concentration. Studio Project I must be completed before Studio Project II.'
      })
    ]
  };
}

function buildSupplements() {
  return [
    {
      filename: 'hkbu-cinematic-arts-2026.json',
      value: {
        schemaVersion: 1,
        schoolCode: 'HKBU',
        academicYear: '2026-27',
        verifiedAt: VERIFIED_AT,
        programmes: [buildMfa()]
      }
    },
    {
      filename: 'hkbu-creative-arts-2025.json',
      value: {
        schemaVersion: 1,
        schoolCode: 'HKBU',
        academicYear: '2025-26',
        verifiedAt: VERIFIED_AT,
        programmes: [buildProducing(), buildMusic(), buildVisualArts()]
      }
    }
  ];
}

const supplements = buildSupplements();
const expectedCounts = new Map([
  ['HKBU-TPG-045', 50],
  ['HKBU-TPG-046', 36],
  ['HKBU-TPG-047', 45],
  ['HKBU-TPG-048', 12]
]);
for (const { value } of supplements) {
  for (const programme of value.programmes) {
    const codes = programme.courseGroups.flatMap((item) => item.courses.map((entry) => entry.code));
    const expected = expectedCounts.get(programme.programmeId);
    if (codes.length !== expected || new Set(codes).size !== expected) {
      throw new Error(`${programme.programmeId} expected ${expected} unique codes, received ${codes.length}/${new Set(codes).size}`);
    }
  }
}

if (require.main === module) {
  supplements.forEach(({ filename, value }) => {
    fs.writeFileSync(path.join(supplementsDir, filename), `${JSON.stringify(value, null, 2)}\n`);
    console.log(`Wrote data/tpg-course-supplements/${filename}`);
  });
}

module.exports = { MFA_TRACKS, VISUAL_ARTS_TRACKS, buildSupplements };
