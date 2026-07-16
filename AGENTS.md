# Repository development rules

## Product and release boundaries

- This is a local-first native WeChat mini program. Trial and release builds must continue to work entirely from packaged offline data unless the user explicitly authorizes a production HTTPS or cloud migration.
- Do not add login, cloud sync, analytics, location, phone-number, contacts, camera, microphone, or other sensitive capabilities without an explicit product decision and a matching WeChat privacy review.
- Course and graduation information is planning guidance. Never present unverified programme rules as an official graduation decision. A Programme with unreviewed rules may expose its index, sources, and verified course list, but must not show a fabricated completion percentage.
- Do not invent courses, credits, requirements, or official URLs. New academic data must be traceable to an official source or a user-provided trusted source.

## Data and generated files

- Treat `data/seed.json`, `data/tpg-programmes.json`, `data/tpg-directory-supplements.json`, `data/tpg-course-supplements/*.json`, `data/ug-source-reviews.json`, and `data/ug-course-supplements/*.json` as maintained source data. When a TPG Programme is represented by a directory or course supplement, change that supplement or its builder/import script instead of hand-editing the merged Programme entry.
- Do not manually edit generated catalogues or shards when the source can be changed instead. In particular, regenerate `miniprogram/utils/mockData.js`, `miniprogram/utils/tpgCatalog.js`, `miniprogram/utils/tpgCourseShards.js`, `miniprogram/subpackages/tpg-data-*/`, `miniprogram/utils/ugCatalogue.js`, `miniprogram/utils/ugCourseShards.js`, and `miniprogram/subpackages/ug-data-*/` through their scripts.
- After undergraduate source changes, run `npm run sync:ug-catalog` and then `npm run check:ship`. After TPG source changes, run `npm run sync:tpg` and then `npm run check:ship`. After seed changes, run `npm run sync:data` and then `npm run check:ship`.
- After changing TPG supplements, run `npm run import:tpg-courses` before `npm run sync:tpg`; directory supplement changes additionally require `npm run import:tpg-directories`. Use the matching `--check` commands to prove the merged catalogue and generated shards are in sync.
- Keep every WeChat subpackage below 2 MB. Use the generated shard layout instead of merging large university datasets back into the main package or a single oversized subpackage.

## TPG evidence and status

- Mark a Programme `verified` only when official evidence supports the published course codes, titles, credits, grouping and completion paths. A partial coded list is not a complete Programme structure.
- Mark a reviewed Programme `blocked` when public official sources omit or conflict on a required code, credit, group, Track or completion rule. Record the exact gap in `statusNote`; do not fill it from a similar Programme, an older curriculum or arithmetic inference.
- Reserve `unreviewed` for work whose official evidence has not yet been assessed. Source coverage reports must distinguish `blocked` from `unreviewed` so a known public-source limitation is not treated as unfinished collection work.
- Model alternative paths, Tracks, Concentrations, Streams, dissertation/project substitutions and cross-group minimums explicitly. If the rule engine cannot prove a complex constraint, keep `ruleReviewStatus: manual_review_required` and describe the manual check instead of simplifying the official rule.
- TPG course codes are unique only within their Programme context for local user state. Do not merge course records or completion state across Programmes merely because their normalized codes match.

## Local user data

- User selections, favourites, completed courses, notes, plans, and histories remain in WeChat local storage by default.
- Every new local user-data key must be added to `USER_DATA_KEYS` in `miniprogram/utils/courseService.js`, classified correctly during backup import validation, included in clear/export/restore behavior, and covered by tests.
- Keys for Programme-specific TPG course state must include both Programme ID and normalized course code to avoid collisions between programmes.

## Navigation and undergraduate package loading

- Do not preload large UG course shards from the home or onboarding page. Those pages must render from the lightweight Programme/Major index so profile editing cannot be blocked by a temporary shard loader route.
- Keep UG package loading explicit, retryable, and observable. A loader failure must be shown as a load failure, not silently converted to “课程清单待开放”.
- When changing the UG shard generator, regenerate every loader and update `miniprogram/utils/ugService.test.js` plus release-readiness tests. Do not hand-edit only one generated loader.
- Profile-edit navigation must preserve the saved profile and provide a safe fallback if `navigateTo` fails; never default silently to HKU when no school was selected.

## Verification before handoff or release

- Run `npm run check:ship` before declaring a release-ready change. It covers generated UG sync, data validation, the Node test suite, server checks, and package/readiness checks.
- Also run `git diff --check` and inspect `git status`, `git diff`, and recent `git log` before a handoff or commit.
- For release-affecting UI changes, manually verify the relevant path in WeChat Developer Tools and record clearly whether iOS/Android real-device testing was performed. Simulator testing is not a substitute for the real-device acceptance matrix in `docs/RELEASE_CHECKLIST.md`.
- Before a WeChat upload, align or explicitly document the package version, release documents and requested upload version. The Developer Tools update-type selector can rewrite the version field, so re-read the final version and note immediately before clicking Upload and verify the success state afterwards.
- Treat local automation output such as `.playwright-cli/` as user-owned diagnostic artifacts. Preserve it and leave it untracked unless the user explicitly asks to version those files or they are intentionally required as test fixtures.
- Never click Upload, Submit for Review, Publish, clear local user data, or overwrite the user's Git history unless the user explicitly requests that action.
