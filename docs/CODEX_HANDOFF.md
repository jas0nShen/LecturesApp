# Codex project handoff

Last verified: 2026-07-11 (Asia/Shanghai)

## Current project goal

Ship and maintain version 1.0.2 of a local-first WeChat mini program for Hong Kong university students. The product lets users select an undergraduate or taught-postgraduate Programme, browse verified offline course data, keep local favourites/completion records, and use conservative planning/audit views without pretending that unreviewed rules are official graduation decisions.

The immediate release goal is stability and truthful data boundaries, not adding social, login, cloud, rating, or analytics features. After release stabilization, the planned development direction is systematic undergraduate course-data completion followed by stronger Study Plan capabilities.

## Verified repository snapshot

- Working directory: `/Users/shenjingsong/Documents/develop/lecturesApp`
- Branch: `main`
- Upstream state at handoff start: `main...origin/main [ahead 9]`
- Package version: `1.0.2`
- Last committed revision: `d593750 Add retry for undergraduate course detail loading`
- Repository had 34 modified tracked files before this handoff; no reset, checkout, stash, or discard was performed.
- `AGENTS.md` and this handoff file were absent and are newly created by this handoff.

Recent commits inspected:

```text
d593750 2026-07-11 12:54:43 +0800 Add retry for undergraduate course detail loading
97c1e26 2026-07-11 12:52:13 +0800 Add RC1 device acceptance matrix
b4f0b4b 2026-07-11 12:51:05 +0800 Cover undergraduate package states for all schools
a31391c 2026-07-11 12:27:42 +0800 Guard against cross-package course imports
59305f6 2026-07-11 12:26:38 +0800 Fix runtime undergraduate subpackage activation
d093c55 2026-07-11 12:11:15 +0800 Test undergraduate school switch race
b297d79 2026-07-11 12:03:36 +0800 Harden undergraduate package loading for RC1
02f2189 2026-07-11 10:32:27 +0800 Fix UG major coverage and release sync checks
```

## Completed functionality

### Product flows

- Native WeChat mini-program navigation with Home, Courses, Graduation Audit, and Profile tabs.
- First-run/profile editing for undergraduate and taught-postgraduate modes without silently defaulting a new user to HKU.
- Eight-school TPG Programme index and eight-school undergraduate Programme/Major index.
- TPG Programme catalogue, search, Programme detail, source display, and local profile save.
- Undergraduate school/Programme/Major/year selection with explicit “course list pending” behavior where course data is not verified.
- Course lists and details for opened TPG and UG datasets; missing datasets remain index-only.
- HKU official offering sample, local course search/filtering, favourites, completion records, notes, comparison, and Study Plan where the capability is explicitly supported.
- Local data status, privacy explanation, backup/restore, clear-data confirmation, search history, notes, and recent courses.

### Latest uncommitted release fixes

- Profile edit uses a real navigator plus fallback navigation helpers; repeated page-stack failures no longer make “修改资料” appear inert.
- Home and onboarding no longer preload large UG course shards. This prevents the hidden UG loader page from taking over the navigation stack and leaving onboarding blank.
- Generated UG loader pages delay/retry their return and only mark activation complete after a successful `navigateBack`.
- UG generated catalogue sync and loader behavior have additional release tests.
- TPG course cards now open a course detail page.
- TPG per-course credits are derived as: explicit source credit if present; Dissertation 9; a true Project or name ending in Project 6; otherwise 3. `Software Project Management` remains 3.
- TPG course favourites and completed records are Programme-specific local keys, participate in backup/restore/clear behavior, and are exposed in course detail.
- The favourites page has a TPG section and can reopen a saved TPG course.
- TPG graduation audit lets the user toggle completed courses directly and displays completed credits, remaining credits, and completed-course count.
- Home action numbering is corrected to 01/02/03.

## Not completed

- Undergraduate course coverage is not complete. Current release metrics show 444 UG Programmes, 689 Majors, 8,183 coded course rows, but only 132 Programmes with opened course lists.
- TPG course-group coverage is not complete. Current release metrics show 348 Programmes, 7 with opened course groups, and 293 flattened courses.
- Most undergraduate graduation rules have not been officially reviewed; the app intentionally does not calculate their graduation percentage.
- TPG credit inference is a product fallback, not a substitute for per-course credit data from each official source. Future source data should store explicit credits where available.
- UG subpackage loading remains complex. Home/onboarding are now insulated from it, but UG Courses, Audit, Profile, Study Plan, and UG detail paths still require careful regression testing on real devices.
- Production HTTPS API, login, cloud sync, admin data service, and multi-device synchronization are not implemented by design.
- iOS and Android real-device acceptance has not been recorded in this handoff. Developer Tools simulator checks do not satisfy that release requirement.
- WeChat admin-side privacy declaration, category/filing, review submission, and final publish remain manual external actions.

## Next most concrete actions

1. Review the current uncommitted diff as one release-stabilization unit. Do not drop the generated loader files or their generator/test changes.
2. Run `git status --short --branch`, `git diff --check`, and `npm run check:ship` again immediately before committing.
3. Commit the current release fixes and the two handoff files with an intentional message, then push `main` (it was already nine commits ahead of `origin/main` before this handoff).
4. Import/open `miniprogram/` in WeChat Developer Tools and test both profiles:
   - TPG PolyU Blockchain Technology: course list, COMP5521 detail, favourite, completed toggle, favourites TPG tab, audit credit updates.
   - UG HKU/CityU/PolyU opened samples: profile edit, course shard load, course detail, back navigation, retry behavior.
   - HKBU/EdUHK index-only sample: must show pending state, never a false load error or graduation percentage.
5. Upload an experience build and complete the iOS/Android matrix in `docs/RELEASE_CHECKLIST.md`. Do not submit for review if any required row fails.
6. If release verification passes, use `docs/REVIEW_SUBMISSION.md` for the WeChat review description and reviewer path.
7. After release, resume data work via `npm run status:ug-sources -- --missing-only --priority launch --missing-limit 10 --batch-plan`; add verified supplement JSON, regenerate, test, and commit in small batches.

## Architecture and technical decisions

### Local-first offline release

Trial/release builds read packaged data and local storage. The development build may use the zero-dependency local Node API, but release must not call a user's `localhost`. This keeps version 1.0.2 deployable without cloud infrastructure and matches the current privacy promise.

### Source data vs generated artifacts

- Maintained sources live under `data/`.
- Generator scripts under `scripts/` produce mini-program catalogues and UG shards.
- Generated outputs are checked into the repository because WeChat release builds need offline data, but should not be hand-edited.

This prevents drift between source evidence and shipped data; `npm run check:ug-sync` blocks stale UG generated output.

### Split undergraduate course data

Large UG course datasets are split across eight subpackages, with CityU and PolyU each split into two shards. The main package keeps lightweight Programme/Major metadata. This is required by WeChat's 2 MB per-package limit and is the reason UG course loading has an activation layer.

### Conservative graduation behavior

Only reviewed rules may drive progress. Index-only or course-list-only Programmes expose sources and course availability but not an official-looking graduation percentage. The app repeatedly tells users to confirm against the university system/handbook.

### Local storage compatibility

`miniprogram/utils/courseService.js` owns user-data keys, export/import/clear behavior, and shared local state. TPG favourite/completed keys use `programmeId:COURSECODE` to avoid collisions. Any future key must be included in backup validation and tests.

### TPG credit fallback

`miniprogram/utils/tpgService.js` respects explicit numeric course credits first. Without explicit values, Dissertation is 9, a real Project is 6, and other courses are 3. This was added for the PolyU Blockchain Technology release flow; it must be replaced by explicit official source values when available rather than expanded through loose name matching.

## Important files and responsibilities

- `package.json`: version and all generation, validation, test, release, and status commands.
- `miniprogram/app.js`: app boot, local profile cache, UG subpackage loader/activation state.
- `miniprogram/app.json`: registered pages, tab bar, and UG subpackage declarations.
- `miniprogram/utils/courseService.js`: local user state, API/offline fallback, favourites, completion, Study Plan, backup/restore, onboarding URL/navigation.
- `miniprogram/utils/tpgService.js`: TPG Programme search/status, flattened course rows, course lookup, per-course credit resolution.
- `miniprogram/utils/ugService.js`: UG Programme/Major/course lookup and profile projection.
- `miniprogram/utils/tpgCatalog.js`: generated TPG offline catalogue.
- `miniprogram/utils/ugCatalogue.js`: generated lightweight UG Programme/Major catalogue.
- `miniprogram/utils/ugCourseShards.js`: generated mapping from universities to UG data subpackages.
- `miniprogram/subpackages/ug-data-*/`: generated large UG course shards and temporary loader pages.
- `miniprogram/pages/onboarding/`: undergraduate/TPG profile selection and edit flow.
- `miniprogram/pages/courses/`: mode-aware course list and TPG/UG detail routing.
- `miniprogram/pages/course-detail/`: seed, UG, and TPG course detail; TPG favourite/completed actions.
- `miniprogram/pages/audit/`: conservative audit views; TPG local completion/credit summary.
- `miniprogram/pages/favorites/`: official offering, curriculum, and TPG favourite folders.
- `miniprogram/pages/profile/` and `miniprogram/pages/privacy-data/`: profile status, notes/data entry points, privacy and backup/restore.
- `scripts/generate-ug-catalog.js`: canonical UG catalogue/shard/loader generator.
- `scripts/check-release-readiness.js`: package, page, privacy, data, and release metrics.
- `scripts/report-ug-source-coverage.js`: undergraduate data-gap and source-readiness reporting.
- `server/index.js`: optional local development API; not required by release builds.
- `docs/RELEASE_CHECKLIST.md`: manual release and real-device acceptance matrix.
- `docs/REVIEW_SUBMISSION.md`: WeChat review copy and reviewer path.
- `docs/ROADMAP.md`: post-release data and planning direction.

## Current uncommitted modifications

Before adding this handoff, `git diff --stat` reported 34 modified tracked files, 472 insertions, and 103 deletions. They are one connected stabilization set:

- App/UG activation: `miniprogram/app.js`, eight generated `subpackages/ug-data-*/pages/loader/index.js`, `scripts/generate-ug-catalog.js`, `miniprogram/utils/ugCatalogue.js`.
- Navigation/profile stability: Home, Onboarding, Profile, Audit, Courses, and Study Plan JavaScript/WXML/WXSS changes plus `courseService.openOnboarding()`.
- TPG course feature work: Courses, Course Detail, Audit, Favourites, `courseService.js`, and `tpgService.js`.
- Tests: `courseService.test.js`, `tpgService.test.js`, `ugService.test.js`, `check-release-readiness.test.js`, `course-detail-page-state.test.js`, and `onboarding-page-state.test.js`.
- This handoff additionally creates `AGENTS.md` and `docs/CODEX_HANDOFF.md`; both must be included in the next status review/commit.

Do not commit only generated loader files without `scripts/generate-ug-catalog.js`, and do not commit only TPG UI changes without their storage/service tests.

## Tests and verification run

The following were run against the current code immediately before creating this handoff:

```text
npm run check:ship
  npm run check:ug-sync: PASS (UG generated catalogue is in sync)
  data validation: PASS
  UG supplement validation: PASS (150 supplements; 137 explicit, 13 copied)
  server --check: PASS
  Node tests: PASS, 260/260
  release readiness: ready=true

git diff --check: PASS
```

Release metrics returned by `check:release`:

- Main package: 1,284,772 bytes.
- All eight UG subpackages are below 2 MB; largest is HKU at 1,485,882 bytes.
- Upload file count: 125.
- TPG: 8 schools, 348 Programmes, 7 Programmes with course groups, 293 courses.
- UG: 8 schools, 444 Programmes, 689 Majors, 8,183 coded course rows, 132 Programmes with course lists.
- Sensitive API count: 0.

Developer Tools simulator checks performed during the final work session:

- Home renders saved TPG profile without a hidden UG loader page.
- Profile edit/onboarding rendered after repeated cold starts in the simulator.
- PolyU Blockchain Technology course list displayed 36 courses.
- TPG course detail opened and displayed credits/source plus favourite/completed controls.
- Completion state updated the TPG audit summary (observed 3 completed credits, 28 remaining, 1 completed course in the test state).
- Profile page rendered Programme information and notes entry.
- Upload dialogs were explicitly cancelled; no upload/publish action was performed by Codex.

Not verified here: iOS/Android physical-device matrix, WeChat admin declarations, review submission, or production publication.

## Known issues, risks, and do-not-do list

- The working tree is intentionally dirty. Do not reset, checkout, clean, or overwrite it. Start by reading `git status` and this file.
- `main` is ahead of `origin/main`; do not assume GitHub contains the latest commits or the current uncommitted release fixes.
- UG subpackage activation previously left a hidden loader page active, causing blank Courses/Home/Onboarding pages. Home/onboarding no longer preload shards, but any loader change needs simulator and real-device regression across single- and double-shard schools.
- Do not reintroduce UG preloading in Home or Onboarding for the sake of showing an immediate course count.
- Do not collapse UG data into a single large subpackage; upload previously failed on the 2 MB limit.
- Do not treat a TPG group credit requirement (for example 18 required core credits) as the credit value of each course.
- Do not use loose substring matching for Project credits; `Software Project Management` is a normal 3-credit course.
- Do not use course code alone as a TPG favourite/completed storage key; the Programme ID is required.
- Do not add a new local key without backup/import/clear coverage and tests.
- Do not infer or display graduation completion for programmes whose rules are not verified.
- Do not edit generated catalogues/shards directly or forget the appropriate sync command.
- Do not click WeChat Upload/Submit/Publish or clear the user's local data without explicit authorization.

## Handoff sufficiency assessment

This handoff is sufficient for a new Codex task to continue safely if it first re-runs `git status --short --branch`, reads `AGENTS.md` and this document, and verifies the working tree has not changed since the snapshot. It records the repository state, recent commits, architecture, generated-data workflow, exact unfinished work, dirty-file scope, tests, release metrics, manual checks, and known failure modes. External WeChat admin state and physical-device results remain intentionally outside the repository and must be re-verified separately.
