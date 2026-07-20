---
title: Premium Portfolio System - Plan
type: feat
date: 2026-07-19
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan
execution: code
---

# Premium Portfolio System - Plan

## Goal Capsule

- **Objective:** Raise every public portfolio route to one premium, coherent visual standard while making company, institution, product, and channel recognition more immediate.
- **Authority:** Kevin's July 2026 visual feedback, the approved recruiter-first narrative, the public evidence registry, and existing privacy/IP boundaries.
- **Execution profile:** One isolated `recruiting-portfolio` worktree with independently revertible commits. Land the visual foundation/media system before any separate assistant-runtime hardening. Preserve the live hero composition and improve the evidence system around it.
- **Stop conditions:** Do not use a third-party mark without an owned or permitted source. Do not invent Berkeley, PayPal, BCP, or Trackly evidence. Do not expose private user, employer, recruiting, or production data.
- **Tail ownership:** The implementation owner completes responsive browser proof, build/tests, review gates, merge, deployment verification, and base-repository synchronization.

## Product Contract

### Summary

The portfolio already has a distinctive editorial foundation. The next step is not a redesign. It is a system-level polish pass: controlled brand recognition, stronger media loading, an art-directed Trackly surface rail, denser information converted into scannable proof, and consistent alignment across mobile and desktop.

### Requirements

- **R1. Brand recognition:** Introduce one reusable brand-signature system for the homepage credibility strip, case-study context, and curated channels.
- **R2. Rights-aware assets:** Use full marks only for owned or clearly permitted brands. Berkeley Haas forbids logo use on personal websites and PayPal requires permission, so those surfaces use typographic signatures and restrained brand-color accents. Trackly and public social platforms may use locally hosted, accessible marks.
- **R2a. Permission provenance:** Any full mark must record its local asset source, usage basis, verification date, and reviewer. Missing or ambiguous provenance fails closed to the typographic signature.
- **R3. No logo wall:** Normalize marks by optical height, preserve clear space, use color sparingly, and pair every mark with precise relationship copy.
- **R4. Lab presentation:** Every Lab artifact must show useful visual content immediately at 390px and desktop widths, with a consistent frame, crop, caption, and stable loading state.
- **R5. Trackly proof:** Present Web, iOS, macOS, CLI/MCP, and Chat/Voice as five intentional product surfaces with tailored media rather than uniform `object-fit` behavior.
- **R6. Scannability:** Shorten mobile homepage sections, replace About's institution wall with divided proof rows, and preserve the now-readable mobile resume without changing print/PDF/ATS content.
- **R7. Ask clarity:** Keep one onboarding hierarchy. Preserve truthful retrieval/tool activity, streaming, citations, and Voice behavior while reducing duplicated prompts and fallback chrome.
- **R8. Mobile alignment:** Use shared inset, rhythm, type-scale, and divider tokens for workbench cells, process steps, evidence labels, and nested cards.
- **R9. Evidence integrity:** Keep public claims, corpus, resume artifacts, routes, analytics, and machine-readable outputs synchronized.
- **R10. Accessibility and performance:** Preserve keyboard support, visible focus, reduced motion, high contrast, stable aspect ratios, no horizontal overflow, and no meaningful regression to page performance.
- **R11. Review hygiene:** Audit all open issues and recently merged PRs for late comments. Fix every still-valid finding or record why it is already resolved or not applicable.
- **R12. Visual proof:** Verify Chrome and WebKit at 390, 430, 768, 1024, and 1440 pixels. Compare before/after screenshots and inspect every route, not only automated geometry.
- **R13. Late-review window:** Audit merged portfolio PRs from July 12 onward before implementation, then re-query that range and the new PR after deployment. Record the disposition of every late actionable comment.

### Key Flows

- **F1. Fast credibility scan:** A visitor lands on `/`, recognizes the four core proof domains, reaches selected work, and chooses a case, resume, Ask, or contact without decoding a logo wall.
- **F2. Product-depth scan:** A hiring manager opens a case and sees the thesis, scale, strongest media, product surfaces, and decisions before choosing deeper evidence.
- **F3. Explore Kevin's world:** A visitor reaches Curated Channels and recognizes GitHub, LinkedIn, writing, X, Personal Story, Podcast, and YouTube through restrained, accessible platform identity.
- **F4. Ask Kevin's AI:** A visitor sees one clear prompt, asks by keyboard or Voice, sees honest activity and sources, and does not encounter duplicated onboarding.

### Acceptance Examples

- **AE1:** The homepage credibility strip is visually richer but still reads as editorial proof, not sponsorship or endorsement.
- **AE2:** At 390px, every Lab card displays a real preview or intentional monogram without several screens of blank dark media.
- **AE3:** Trackly's five surfaces are discoverable, legible, and navigable on mobile with a clear count/progress affordance.
- **AE4:** PayPal workbench labels and values share one left inset and consistent vertical rhythm at 390px.
- **AE5:** About presents PayPal, Trackly, Berkeley/MoBagel, and BCP as four readable proof rows instead of one paragraph.
- **AE6:** Mobile resume keeps readable type and chronology, removes the contradictory visible email action, and leaves print/PDF output synchronized.
- **AE7:** Ask shows one primary onboarding path after hydration and a useful no-JavaScript fallback without inert controls.
- **AE8:** No supported route has horizontal overflow, clipped text, misleading dates, empty media panels, or unauthorized institutional marks.

### Scope Boundaries

**In scope**

- Shared brand signatures, platform marks, credibility presentation, Curated Channels visual identity, Lab media, Trackly product rail, About proof rows, mobile resume hygiene, Ask hierarchy, PayPal alignment, mobile spacing, and visual regression coverage.

**Deferred until approved evidence exists**

- Authentic Berkeley Figma exports and a public BCP product artifact. The current labeled reconstruction and typography remain safer than invented visuals.

**Explicitly excluded**

- Employer-internal assets, unauthorized Haas or PayPal logos, decorative brand walls, changes to assistant grounding/privacy, raw chain-of-thought, new production secrets, and new infrastructure.

## Planning Contract

### Key Technical Decisions

- **KTD1. Preserve the hero.** The current portrait, headline, palette, dividers, and CTA hierarchy are the approved baseline.
- **KTD2. Use a registry-driven brand system.** A brand record owns label, relationship, color, optional local asset, permission state, and contrast variant. Missing permission renders a premium typographic fallback.
- **KTD3. Art-direct evidence by content.** Media uses explicit presentation modes such as `window`, `device`, `terminal`, and `conversation`; one global `object-fit` rule cannot serve all evidence.
- **KTD4. Load meaningful pixels first.** The first Lab image is eager/high-priority; later images use real low-cost placeholders and fade in without layout shift.
- **KTD5. Keep long-form evidence available, not dominant.** Recruiter-critical proof remains expanded; deep records use native disclosures and retain anchors.
- **KTD6. Treat visual review as a release gate.** Geometry tests are necessary but screenshots in Chromium and WebKit are the final evidence for polish.

### Implementation Units

#### U1. Brand signature foundation

- **Goal:** Add rights-aware recognition without creating a logo wall.
- **Files:** `src/data/brandSignatures.js`, `src/components/BrandSignature.astro`, `src/components/CuratedChannels.astro`, `src/pages/index.astro`, local assets under `site-public/assets/brands/`.
- **Approach:** Render owned/permitted local SVGs at normalized optical sizes. Render restricted brands as typographic wordmarks with a precise color rule and relationship label.
- **Verification:** Screen-reader labels, light/dark contrast, 390/1440 screenshots, no remote asset requests.

#### U2. Lab media and collection art direction

- **Goal:** Remove empty-looking panels and make seven experiments feel like one collection.
- **Files:** `src/pages/lab/index.astro`, `src/data/site.js`, Lab preview assets, browser tests.
- **Approach:** Add image-ready transitions, purposeful fallback artwork, consistent captions, and responsive featured/archive hierarchy while keeping all artifacts visible and linkable.
- **Verification:** Every preview has non-empty pixels in production-like screenshots; aspect ratios remain stable; hash navigation still works.

#### U3. Trackly cross-platform product rail

- **Goal:** Show the complete product system above the deep-evidence disclosure.
- **Files:** `src/pages/projects/trackly/index.astro`, Trackly assets, browser tests.
- **Approach:** Build five surface cards with tailored crops/layouts, accessible horizontal navigation, surface count, progress dots, and an intentional next-card peek on mobile.
- **Verification:** Web, iOS, macOS, CLI/MCP, and Chat/Voice are all visible and legible at supported widths.

#### U4. Scannability and alignment system

- **Goal:** Fix dense or inconsistent mobile reading across core routes.
- **Files:** `src/pages/about/index.astro`, `src/pages/resume/index.astro`, `src/pages/ask/index.astro`, `src/components/InvestigationWorkbench.astro`, `src/pages/index.astro`, shared styles and tests.
- **Approach:** Add About proof rows, remove the contradictory visible resume email action, simplify Ask onboarding, retain shared workbench insets, and use content-driven homepage card height on mobile.
- **Verification:** No duplicate onboarding, no resume email contradiction, consistent nested-cell insets, and materially shorter mobile scan paths.

#### U5. Repository, browser, and release audit

- **Goal:** Close overlooked issues and prove the full system.
- **Files:** Tests, `.context` review/visual artifacts, and only files implicated by verified findings.
- **Approach:** Audit issues and recent merged PR comments, run build/tests, capture Chromium/WebKit screenshots at required widths, run structured review, and use normal PR/merge/deploy gates.
- **Verification:** Every valid comment is resolved or documented, all tests pass, review gates are green, production routes match approved screenshots, and owned processes are cleaned up.

### Risks and Mitigations

- **Trademark overreach:** A colorful logo can imply endorsement. Mitigate through permission state and fallback signatures.
- **Visual density:** More marks can compete with evidence. Mitigate through one optical system and limited color usage.
- **Media regressions:** Tailored crops can hide information. Mitigate through per-surface mobile/desktop screenshots and accessible full-image links.
- **Performance:** Additional assets can delay rendering. Mitigate through local SVGs, optimized WebP/PNG previews, priority only above the fold, stable dimensions, CLS below 0.1, and a mobile LCP regression budget of no more than 250 ms on modified routes.
- **Scope drift:** A whole-site audit can become an uncontrolled redesign. Mitigate by preserving approved hero/contact/orb decisions and prioritizing verified defects.

## Verification Contract

- `npm run build`
- Targeted Playwright tests during implementation.
- Full `npm test` before commit.
- Chromium and WebKit screenshots at 390, 430, 768, 1024, and 1440 pixels.
- Axe/keyboard/reduced-motion checks on modified interactive surfaces.
- `~/.codex/scripts/codex-pr-review-gate.sh` before merge.
- Production smoke checks for homepage, Lab, Trackly, About, Resume, Ask, and Contact after deployment.

## Execution Record

- Rights-aware brand signatures, curated-channel platform marks, Lab fallbacks, and the five-surface Trackly rail are implemented.
- Chat recovery analytics, delayed-mute handling, data-channel failure handling, Realtime error handling, and Safari-safe page-hide cleanup are covered by browser tests.
- The independent assistant API accepts the safelisted page-hide payload under its existing token validation; its 101-test suite passed.
- Portfolio verification passed: 157 full cross-browser tests, 30 final modified-surface regressions, 2 dedicated Voice teardown regressions, and Chromium/WebKit screenshot inspection.
- GitHub audit found no open portfolio issues or pull requests before this change. Late actionable review findings from the prior assistant PR were incorporated into this implementation.
