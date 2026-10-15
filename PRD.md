# Product Requirements Document: Imposter Game

**Document status:** MVP specification  
**Market:** United States  
**Language:** US English  
**Primary keyword:** imposter game  
**Platform:** Responsive browser-based static website  
**Last updated:** October 15, 2026

## 1. Product Summary

Imposter Game is a free, fast, pass-the-phone social deduction word game for 3–12 people in the same location. Most players privately receive the same secret word; one randomly selected player is the imposter and must blend in without knowing it. Players give clues, discuss who seems suspicious, vote, and reveal the winner.

The MVP must work immediately in a modern mobile or desktop browser, require no account or installation, use no paid APIs, and retain non-sensitive preferences locally. Its design, writing, interaction patterns, visual identity, and source code must be original.

### Product promise

“Start a free imposter game in seconds—add your players, pass the phone, find the imposter.”

### Primary objective

Deliver the quickest trustworthy path from landing on the page to beginning an in-person round, while also providing enough indexable instructions and FAQs to compete for the US search term “imposter game.”

### MVP boundaries

The MVP is a local, single-device experience. It does not include remote multiplayer, room codes, accounts, public lobbies, chat, cloud saves, user-generated word submissions, native apps, ads, payments, or backend services.

## 2. Goals and Success Metrics

### Product goals

- Let a first-time visitor configure and start a valid game in under 60 seconds.
- Make private role viewing safe and obvious while passing one device.
- Support a complete round: setup, reveal, discussion, voting, result, replay.
- Feel polished on common US mobile screen sizes and remain fully usable on desktop.
- Create an accessible, crawlable, high-performance foundation for organic search.

### Launch metrics

Analytics are not required to operate the game. If privacy-friendly analytics are added later, measure:

- **Setup completion:** at least 70% of sessions that interact with setup reach the first role reveal.
- **Round completion:** at least 65% of started rounds reach a winner screen.
- **Replay rate:** at least 30% of completed rounds select “Play Again.”
- **Speed:** Core Web Vitals at the 75th percentile should meet “good” thresholds: LCP ≤ 2.5 seconds, INP ≤ 200 ms, and CLS ≤ 0.1.
- **Quality:** no known critical or high-severity defects at release.
- **Accessibility:** automated checks report no critical WCAG violations; key flows pass manual keyboard and screen-reader checks.

The percentages above are initial targets, not validated benchmarks. Establish baselines after launch before changing product behavior.

## 3. Audience and Use Cases

### Primary audience

US-based friends, families, students, coworkers, and party guests who are physically together and want a quick group game without preparation, registration, or downloads.

### Representative needs

- **Party host:** wants to begin quickly and explain rules without reading a long guide.
- **First-time player:** needs clear privacy prompts and simple round instructions.
- **Returning group:** wants saved names/settings and rapid replay with a new word and imposter.
- **Desktop visitor:** may discover the site through search, learn the rules, then play on the same device or switch to a phone.
- **Accessibility user:** needs scalable text, visible focus, sufficient contrast, reduced motion support, and controls that do not depend on color or gestures alone.

### Jobs to be done

- “When my group needs an activity, help us start a fun deduction game immediately.”
- “When the phone reaches me, let me see my role without exposing it to others.”
- “When discussion ends, help us record a vote and clearly understand who won.”

## 4. Core Game Rules

1. A group adds 3–12 player names and chooses one or more word categories.
2. The game randomly selects one player as the imposter and one secret word from the selected category pool.
3. The device is passed in the displayed player order.
4. Each player confirms they are holding the device, deliberately reveals their private card, hides it, and passes the device onward.
5. Non-imposters see the same secret word. The imposter sees only that they are the imposter; no hint is included in the MVP.
6. After all roles are viewed, players take turns giving a clue without saying the secret word.
7. Players discuss and then vote once for the suspected imposter.
8. The app determines the outcome:
   - If the player with the most votes is the imposter, the group wins.
   - If an innocent player has the most votes, the imposter wins.
   - If the top vote is tied, no player is eliminated and the imposter wins. This rule must be stated before voting and on tied results.
9. The result reveals the imposter, secret word, vote totals, and winning side.

The MVP does not give the caught imposter a final secret-word guess. This avoids an ambiguous second win condition and keeps voting deterministic.

## 5. End-to-End User Flow

### 5.1 Landing and setup

The game setup is the primary above-the-fold interface, with a compact value proposition and a visible “How to Play” jump link.

Default state:

- Three players named “Player 1,” “Player 2,” and “Player 3.”
- A beginner-friendly category preselected (for example, “Everyday Things”).
- Timer off.
- A prominent “Start Game” button.

Setup actions:

- Edit every player name.
- Add a player until 12 total.
- Remove a player while at least three remain.
- Select one or more categories; “All Categories” is mutually exclusive with individual selections.
- Enable a timer and select a duration.
- Start the round after validation.

Validation:

- Require 3–12 non-empty, unique player names after trimming whitespace.
- Limit names to 20 visible characters.
- Reject names containing only whitespace; allow ordinary letters, numbers, spaces, apostrophes, and hyphens.
- Require at least one category.
- Show an inline, programmatically associated error and move focus to the first invalid field.

### 5.2 Private role reveal

For each player:

1. Show a privacy gate: “[Name], take the phone” and “Make sure no one else can see the screen.”
2. Player activates “I’m Ready.”
3. Show a face-down role card with “Press and hold to reveal.”
4. Reveal only while the control is actively pressed; releasing hides the card. Provide an accessible tap-based alternative that requires explicit “Hide Card” confirmation for keyboard and assistive technology users.
5. Once hidden, enable “Pass to Next Player.”
6. Repeat until all players have viewed their role.

Security and privacy behavior:

- Never place the secret word in the page title, URL, visible history, toast, or notification.
- Prevent accidental forward navigation before a role is viewed and hidden.
- If the page reloads during an active round, show a neutral interruption screen offering “Resume Round” or “Restart Round”; do not immediately expose a role.
- Treat client-side secrecy as shoulder-surfing protection, not tamper-proof security. A technically knowledgeable user can inspect browser memory/source.

### 5.3 Discussion and optional timer

- Announce that all roles are ready and display the first speaker, chosen randomly from all players.
- Display concise rules: give one clue each, do not say the word, then discuss.
- With timer off, show “Start Voting” as the primary action.
- With timer on, show selected duration, start/pause/resume controls, and “Start Voting.”
- Timer options for MVP: 1, 2, 3, or 5 minutes; default to 3 minutes when first enabled.
- At zero, use visible text and an optional short sound if permitted by the browser. Never rely on audio alone. The group can still continue to voting.
- Preserve timer accuracy using elapsed timestamps rather than assuming every JavaScript interval fires on time.

### 5.4 Voting

- Show every player as a large selectable vote target.
- Record one vote per player using the same pass-the-phone privacy pattern.
- A player may vote for any player, including themselves; this keeps the interface simple and supports bluffing.
- Before submission, show “Vote for [Name]?” with Confirm and Change choices.
- After confirmation, hide the selection and prompt the next voter.
- Do not show interim totals.
- After the final vote, calculate the plurality result using the tie rule in Section 4.

### 5.5 Results and replay

Result screen must show:

- “Crew Wins” or “Imposter Wins.”
- The imposter’s name.
- The secret word and category.
- Each player’s vote total.
- A short explanation of why that side won, including tie handling where relevant.
- “Play Again” as the primary action.
- “New Setup” and “Restart” as secondary actions.

Action definitions:

- **Play Again:** retain player names, category selection, and timer preference; randomly choose a new eligible word and imposter; clear votes and round state.
- **New Setup:** return to setup with retained local preferences, allowing edits.
- **Restart:** request confirmation, abandon the active round, and return to the setup defaults or saved preferences. The confirmation prevents accidental loss.

Avoid selecting the same word in two consecutive rounds when the chosen pool contains another word. Avoid selecting the same imposter twice in a row when there is another eligible player. These are fairness-oriented rerolls, not guarantees of long-term equal distribution.

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Support 3–12 locally named players with add, edit, and remove controls. | Must |
| FR-02 | Randomly select exactly one imposter per round using `crypto.getRandomValues()` where supported, with a documented fallback. | Must |
| FR-03 | Select one secret word from a locally bundled category dataset. | Must |
| FR-04 | Provide at least 8 launch categories and at least 25 distinct words per category. | Must |
| FR-05 | Prevent duplicate words within the dataset and exclude trademarks, slurs, sexual content, culturally insensitive terms, and unusually obscure US references. | Must |
| FR-06 | Use a privacy-gated, pass-the-phone reveal sequence for every player. | Must |
| FR-07 | Provide optional 1/2/3/5-minute discussion timer with pause/resume. | Must |
| FR-08 | Collect one concealed vote from every player and resolve plurality and ties consistently. | Must |
| FR-09 | Announce winner, imposter, secret word, category, and vote totals. | Must |
| FR-10 | Support Play Again, New Setup, and confirmed Restart behavior. | Must |
| FR-11 | Persist only setup preferences in local storage; do not persist votes or exposed roles after a completed/abandoned round. | Must |
| FR-12 | Make all gameplay possible without network access after the static assets have loaded. | Should |
| FR-13 | Respect reduced-motion preferences and provide non-motion state feedback. | Must |
| FR-14 | Prevent double submission from rapid taps and keep navigation/state transitions idempotent. | Must |

Suggested launch categories: Everyday Things, Food & Drinks, Animals, Places, Movies & TV, Sports, Jobs, and Nature. Word lists require editorial review for US familiarity and difficulty balance.

## 7. Local Data and State

### Local storage

Store only:

- Player names.
- Selected categories.
- Timer enabled state and duration.
- Optional reduced-sound preference.
- Schema/version number for safe migrations.

Do not store analytics identifiers, sensitive personal data, vote history, or role history. Provide a “Clear Saved Settings” control near setup/help. If storage is unavailable or corrupted, fail safely to defaults without blocking play.

### Game state model

Use an explicit finite state flow:

`SETUP → HANDOFF → ROLE_REVEAL → HANDOFF (repeat) → DISCUSSION → VOTE_HANDOFF → VOTE_SELECT (repeat) → RESULT`

Restart may return to `SETUP` from any active state after confirmation. Page restoration must validate the stored state before resuming. Invalid or incomplete state returns to a neutral recovery screen.

## 8. Information Architecture and Page Structure

Use a single canonical URL for the MVP with semantic landmarks and crawlable supporting content:

1. `<header>`: wordmark, “How to Play” anchor, “FAQ” anchor.
2. `<main>`:
   - Hero and H1.
   - Game setup/application region.
   - Trust/value strip: free, no download, no account.
   - How to Play.
   - What Is the Imposter Game?
   - Tips for Better Rounds.
   - FAQ.
3. `<footer>`: brief product statement, privacy note, contact/legal placeholders as applicable.

Game state changes should remain on the canonical page and should not create indexable parameter URLs. Supporting copy must be available in the initial HTML, not injected only after JavaScript runs.

## 9. UX and Visual Design Requirements

### Design direction

Create an original “secret dossier” party aesthetic: warm off-white surfaces, deep ink text, one electric accent color, rounded cards, restrained shadows, and playful but readable role illustrations or CSS shapes. Do not copy either reference site’s layout, copy, icons, card treatments, color palette, branding, or animations.

### Responsive behavior

- Mobile-first from 320 CSS pixels wide.
- Single-column game flow on phones; wider centered panel with supporting content on desktop.
- Minimum interactive target: 44 × 44 CSS pixels.
- No required hover interactions or horizontal scrolling at 320 px.
- Account for safe-area insets on notched mobile devices.
- Keep the primary action reachable without obscuring content; if sticky, it must not cover focused controls or browser UI.

### Interaction and motion

- Use 150–250 ms transitions for routine feedback and up to 400 ms for major card/state changes.
- Animate opacity/transform rather than layout-triggering properties where possible.
- Role reveal must never flash protected content during transition.
- Under `prefers-reduced-motion: reduce`, remove nonessential movement and replace it with immediate state changes.
- Use clear loading/error/disabled/pressed/focus states even though the core game has no network dependency.

### Content style

- Friendly, concise US English.
- Use “imposter” consistently to match the target keyword, while acknowledging “impostor” once in explanatory copy if editorially useful.
- Prefer direct controls: “Start Game,” “I’m Ready,” “Hide Card,” “Pass to Jordan,” “Start Voting.”
- Never shame a player for mistakes or reveal private information in error messages.

## 10. Accessibility Requirements

Target WCAG 2.2 Level AA.

- Use semantic HTML before ARIA; maintain one logical H1 and ordered heading hierarchy.
- Ensure full keyboard operation with visible focus and logical focus movement after state changes.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI components.
- Associate inputs, instructions, errors, and descriptions programmatically.
- Announce relevant game-state and timer changes through appropriately restrained live regions.
- Do not announce the secret word unexpectedly to a screen reader. The player must explicitly activate the private reveal.
- Do not use color, motion, position, or sound as the only means of conveying meaning.
- Support 200% text zoom and browser zoom without loss of content or function.
- Use accessible confirmation dialogs with focus trapping, Escape behavior, and focus return.
- Decorative graphics must have empty alt text; meaningful graphics need concise alternatives.
- Provide captions/transcripts for any future instructional media.

## 11. SEO Requirements

### Search intent

Serve mixed intent around “imposter game”: users want to play immediately, understand the rules, discover word-game mechanics, and confirm that the experience is free and needs no download.

### Required metadata

- **Title:** `Imposter Game – Play the Free Word Game Online`
- **Meta description:** `Play a free imposter game with 3–12 friends. Add names, pass the phone, reveal the secret word, discuss, and vote—no download or account needed.`
- **H1:** `Play the Imposter Game Online`
- **Canonical:** absolute production homepage URL once the domain is selected.
- **Robots:** `index,follow` in production; non-production environments must be blocked from indexing.
- **Open Graph/Twitter:** original title, description, URL, and a purpose-built 1200 × 630 image that does not expose a game word.
- **Language:** `<html lang="en-US">`.

Metadata lengths should be checked against live search-result rendering before launch; search engines may rewrite titles and descriptions.

### On-page content requirements

- Include the primary keyword naturally in the title, H1, introductory paragraph, How to Play heading/copy, and at least one FAQ response.
- Use related phrases naturally: “imposter word game,” “find the imposter,” “party word game,” “pass the phone game,” and “social deduction game.”
- Avoid keyword stuffing, hidden text, duplicated sections, doorway pages, and claims that are not true.
- Publish at least 500–800 words of genuinely helpful indexable content without pushing the playable setup far below the fold.
- Answer rules, player count, cost, download/account needs, voting, timer, replay, privacy, and device compatibility.
- Add descriptive internal anchors and, if future guides exist, descriptive internal links.

### Recommended structured data

- `WebApplication` or `Game` JSON-LD with accurate name, URL, application category, browser requirements, operating system (`Any`), and `offers.price: 0`.
- `FAQPage` only when every marked-up question and answer is visibly present and the markup remains compliant with current Google eligibility rules.
- Do not add aggregate ratings, reviews, or popularity claims without verifiable first-party evidence.

### Technical SEO

- Return a clean 200 response for the canonical page and a useful static 404 page at deployment level.
- Generate `robots.txt` and `sitemap.xml` only during implementation/deployment, using the final domain.
- Use semantic anchor links, crawlable HTML content, descriptive image filenames/alt text, and stable URLs.
- Minimize render-blocking assets; self-host only necessary fonts or prefer a system font stack.
- Avoid intrusive interstitials and layout shifts from late-loading assets.

### Required FAQ topics

1. What is the imposter game?
2. How do you play the imposter word game?
3. How many players do you need?
4. Is the game free, and does it require a download or account?
5. What does the imposter see?
6. How do voting and ties work?
7. Can children or families play?
8. Does the game work on iPhone, Android, tablets, and computers?
9. Are names or votes sent to a server?
10. Can friends play remotely? (Answer honestly: not in the local-only MVP.)

## 12. Technical Requirements

- Use standards-based HTML5, CSS, and vanilla JavaScript only.
- Deploy as static files on a CDN-backed static host.
- Use no paid APIs and require no backend for core play.
- Bundle the curated word dataset locally and keep it separable from game logic for editorial maintenance.
- Use progressive enhancement: supporting SEO content remains readable if JavaScript fails; clearly explain that gameplay requires JavaScript.
- Avoid third-party runtime dependencies for the MVP unless a documented accessibility/security need outweighs the performance and privacy cost.
- Apply a strict Content Security Policy compatible with static hosting; avoid inline script where practical.
- Do not use `innerHTML` with player-provided names. Render user input as text to prevent DOM injection.
- Version local-storage keys and wrap reads/writes in error handling.
- Use `crypto.getRandomValues()` for fair selection where available. A `Math.random()` fallback is acceptable for this non-wagering party game and must not be described as cryptographically secure.
- Favor ES modules, small composable functions, and centralized state transitions.
- Keep initial compressed transfer size small; target ≤ 150 KB for first-party HTML/CSS/JS excluding the social image, subject to validation during implementation.
- Target the latest two major versions of Chrome, Safari, Firefox, and Edge, plus current iOS Safari and Chrome on Android.

## 13. Performance, Privacy, and Security

### Performance budget

- LCP ≤ 2.5 seconds, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile after real-user data is available.
- Lighthouse mobile targets in a representative throttled test: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95.
- No autoplay video, large animation framework, remote gameplay API, or unnecessary web font in the MVP.
- Reserve dimensions for all images and preload only the single most important above-the-fold asset, if any.

### Privacy

- Core play requires no account, cookies, or server submission.
- Explain that names/settings are stored only in the current browser when local storage is used.
- If analytics are introduced, update the privacy disclosure, minimize collection, honor applicable consent requirements, and ensure gameplay works when tracking is blocked.

### Security

- Treat all player names and restored local data as untrusted input.
- Validate state transitions and ranges in code, not only in the interface.
- Do not load executable content from word data or URL parameters.
- Configure CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` through host headers where supported.
- Do not claim that local role data is secure against developer tools or device access.

## 14. Reference Review

Reviewed October 15, 2026:

- [Imposter.app](https://imposter.app/) presents pass-the-phone and remote-play choices. Its accessible page content shows player/imposter/category/time settings, editable player names, custom words, tap-to-reveal, a timer, discussion, imposter reveal, instructions, and extensive supporting SEO copy.
- [Find the Imposter](https://findtheimposter.com/game) presents online and pass-and-play modes. Its accessible page content describes 3–15 players, one-word clues, discussion and voting, 50+ categories, multiple languages, random/multiple imposters, private/public rooms, Undercover/Mr. White variants, and FAQ/editorial content.

### Reference-derived principles, not copied features

- Put the playable experience and value proposition early on the page.
- Explain the game with short sequential steps.
- Reduce friction through no-sign-up browser play.
- Support discovery with useful rules and FAQs below the game.

### Unverified reference features and limitations

The review was limited to publicly crawlable page content; no accounts were created, rooms joined, app installed, source code inspected, payments attempted, or full rounds completed. Therefore, the following claims are **unverified** and must not be treated as implementation evidence or copied requirements:

- Exact randomness, fairness, tie-breaking, persistence, word-repeat prevention, or timer behavior.
- Real-time room reliability, moderation, privacy, security, offline behavior, or cross-device synchronization.
- Accessibility conformance, keyboard/screen-reader behavior, browser coverage, Core Web Vitals, or asset sizes.
- Exact category/word counts, editorial quality, language completeness, or whether all advertised content is simultaneously available.
- Ratings, usage/popularity claims, app-store availability, subscription status, or installability beyond visible marketing copy.
- Winner logic and final-guess rules except where explicitly described in page text.
- Any feature visible only after interactive state changes that the crawl did not reproduce.

Reference-only features explicitly excluded from this MVP include remote multiplayer, public/private rooms, codes, multiple imposters, random imposter counts, imposter hints, custom words, multilingual play, Undercover/Mr. White, and native/PWA installation prompts.

## 15. Development Phases

### Phase 0: Content and rule lock

- Finalize core rules, tie behavior, timer options, navigation labels, category taxonomy, and word-selection editorial policy.
- Produce and review at least 200 launch words across at least 8 categories.
- Approve information architecture, metadata, supporting copy outline, and original visual direction.

**Exit criteria:** no unresolved rule ambiguity; word list passes duplication, sensitivity, spelling, and US-familiarity review.

### Phase 1: Foundation and setup

- Build semantic page shell, responsive design tokens/components, setup form, validation, local preference storage, and static SEO sections.
- Establish the finite state model and testable random-selection utilities.

**Exit criteria:** valid 3–12-player configurations start; invalid states cannot start; supporting content works without JavaScript.

### Phase 2: Complete game loop

- Implement private reveals, discussion/timer, concealed voting, result calculation, Play Again, New Setup, Restart, and recovery behavior.
- Add reduced-motion behavior and resilient timer calculation.

**Exit criteria:** every specified state transition and outcome works on mobile and desktop with no secret leaks in ordinary use.

### Phase 3: Polish, accessibility, and SEO

- Add original visual assets/micro-animations, focus management, live-region behavior, FAQs, structured data, social metadata, and deployment SEO files.
- Conduct copy editing and word-data audit.

**Exit criteria:** accessibility, metadata, structured data, and responsive reviews pass; no copied reference assets/copy/patterns remain.

### Phase 4: QA and release

- Execute functional, device/browser, performance, accessibility, privacy, and SEO testing.
- Deploy to staging with indexing disabled, fix release blockers, then deploy production and submit the sitemap.

**Exit criteria:** all Must requirements and acceptance criteria pass; no critical/high defects; production canonical/robots/sitemap resolve correctly.

## 16. Acceptance Criteria

### Setup

- Given fewer than 3 or more than 12 valid names, Start Game is unavailable and the reason is clear.
- Given duplicate, blank, or over-limit names, the first invalid field receives an associated inline error.
- Given a valid setup and category, Start Game creates exactly one imposter and one shared word for all other players.
- Reloading later restores valid preferences without exposing a prior role or vote.

### Reveal

- Each configured player receives exactly one private reveal in the displayed order.
- The word is never visible on a handoff screen or during a role-card transition.
- A player cannot proceed until they have deliberately revealed and hidden their card.
- Keyboard and screen-reader users can complete the reveal without a press-and-hold gesture.

### Discussion and timer

- With timer disabled, the game proceeds directly to an untimed discussion screen.
- With timer enabled, selected duration persists, pause/resume remains accurate, and reaching zero does not block voting.
- Backgrounding and returning to the browser does not materially extend a running timer.

### Voting and results

- Every player submits one concealed vote; interim choices/totals are not exposed.
- A unique top-voted imposter produces a crew win.
- A unique top-voted innocent or tied top vote produces an imposter win.
- Result content accurately identifies the imposter, word, category, totals, and rule that decided the result.

### Replay and reset

- Play Again preserves setup preferences, clears prior votes/state, and rerolls word/imposter subject to anti-repeat rules.
- New Setup returns to editable setup with saved preferences.
- Restart requires confirmation and cannot accidentally reveal the secret.

### Quality

- All controls work at 320 px width and at 200% zoom without lost content or horizontal page scrolling.
- All essential flows work by keyboard alone with visible focus.
- Reduced-motion mode removes nonessential motion.
- Production HTML contains the approved title, description, H1, canonical, `en-US`, and indexable instructions/FAQ content.
- No account, installation, payment, paid API, or backend request is required for a round.

## 17. Practical Testing Checklist

### Functional

- [ ] Start valid games with 3, 4, 11, and 12 players.
- [ ] Attempt 2 and 13 players; confirm clear limits.
- [ ] Test blank, whitespace-only, duplicate, apostrophe, hyphen, emoji, very long, and pasted player names.
- [ ] Test one category, multiple categories, All Categories, and no category.
- [ ] Run enough controlled rounds to cover every player as imposter and verify exactly one imposter per round.
- [ ] Confirm every non-imposter receives the identical word and the imposter never does.
- [ ] Check reload/back/forward/refresh at every game state for safe recovery.
- [ ] Rapidly tap primary actions; confirm no skipped player, duplicate vote, or double transition.
- [ ] Test timer off and every duration; pause, resume, background, restore, and zero.
- [ ] Test votes producing crew win, innocent plurality, two-way tie, and multi-way tie.
- [ ] Verify Play Again, New Setup, Restart cancel, and Restart confirm.
- [ ] Corrupt/disable local storage and confirm graceful defaults.
- [ ] Exhaust a small test word pool and verify repeat handling does not hang.

### Privacy and security

- [ ] Inspect title, URL, handoff screens, console, errors, storage, and visible DOM for unintended secret exposure.
- [ ] Enter HTML/script-like player names and confirm they render only as text.
- [ ] Confirm votes and completed/abandoned role data are not retained.
- [ ] Check production security headers with a header-inspection tool.
- [ ] Confirm core play makes no unexpected third-party requests.

### Accessibility

- [ ] Complete setup, reveal, timer, voting, results, and restart with keyboard only.
- [ ] Test with at least NVDA + Chrome/Firefox and VoiceOver + Safari.
- [ ] Confirm secret content is announced only after deliberate reveal.
- [ ] Verify focus order, focus restoration, dialog trapping, labels, errors, and live-region announcements.
- [ ] Test 200% zoom, large mobile text, high contrast/forced colors, and reduced motion.
- [ ] Check contrast and 44 × 44 px target sizes.
- [ ] Run automated accessibility scans and manually review all flagged issues.

### Responsive and browser

- [ ] Test at 320, 360, 390, 768, 1024, and 1440 CSS pixels.
- [ ] Test portrait/landscape and notched-device safe areas.
- [ ] Test current Chrome, Safari, Firefox, Edge, iOS Safari, and Android Chrome, plus the prior major version where available.
- [ ] Verify touch, mouse, trackpad, and keyboard input.
- [ ] Confirm no content is hidden behind sticky controls or mobile browser chrome.

### Performance

- [ ] Run Lighthouse mobile/desktop from a production-like build.
- [ ] Measure LCP, INP, and CLS under throttled conditions and on a mid-range physical phone.
- [ ] Verify transfer budget, caching, compression, image dimensions, and no unused large assets.
- [ ] Confirm animations remain smooth without revealing protected content.

### SEO and content

- [ ] Verify unique title, meta description, H1, canonical, `en-US`, robots directive, and social tags.
- [ ] Validate structured data and ensure it exactly matches visible content.
- [ ] Confirm How to Play and FAQs are present in initial HTML and readable without JavaScript.
- [ ] Check heading order, anchor labels, alt text, sitemap, robots.txt, 404 behavior, and production 200 status.
- [ ] Proofread US English, rules, category names, and all words for accuracy, sensitivity, and duplication.
- [ ] Search the final copy for unsupported “best,” rating, popularity, security, and availability claims.
- [ ] Ensure staging is blocked and production is indexable only after release approval.

## 18. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Secret is exposed while passing the phone | Neutral handoff screen, deliberate reveal, release-to-hide, explicit Hide/Pass step, no secret in URL/title. |
| Rule ambiguity causes arguments | State tie and winner rules before voting and repeat the deciding rule on results. |
| Word quality makes rounds too easy or obscure | Editorial rubric, US-familiarity review, minimum category depth, and post-launch feedback channel. |
| Browser refresh corrupts a round | Versioned state, validation, neutral recovery screen, and safe restart path. |
| Animation harms accessibility or leaks a role | Reduced-motion mode, composited transitions, and tests for first/last-frame exposure. |
| SEO copy overwhelms the game | Keep setup above the fold; place concise, useful supporting content below it with jump links. |
| Reference similarity creates brand/IP risk | Use references only for market understanding; create original name treatment, copy, UI, illustrations, data, and code. |
| Local storage creates privacy confusion | Store only preferences, clearly disclose local behavior, and provide Clear Saved Settings. |

## 19. Out of Scope and Future Considerations

Not part of MVP:

- Remote multiplayer, room codes, matchmaking, or public rooms.
- Accounts, profiles, leaderboards, achievements, or cloud synchronization.
- Multiple imposters, random imposter counts, hints, Undercover/Mr. White, final word guesses, or house-rule customization.
- User-created words/categories, moderation, multilingual content, native apps, or install prompts.
- Monetization, ads, subscriptions, purchases, or paid APIs.
- Server-side analytics, A/B testing, social sharing of player data, or push notifications.

Future features must be prioritized using observed demand and must not compromise the zero-friction local game. Remote multiplayer would require a separate technical and privacy specification rather than an incremental toggle.

## 20. Launch Definition of Done

The MVP is ready when all Must requirements and acceptance criteria pass; the full 3–12-player loop works across supported browsers; no critical/high defects remain; accessibility and performance targets are met in representative tests; word content is editorially approved; metadata, canonical, structured data, robots, sitemap, and static error behavior are correct in production; privacy statements match actual behavior; and the released design, copy, assets, data, and implementation are demonstrably original.
