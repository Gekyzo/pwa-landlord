# Design system

The shared tokens, base rules, components, layouts and icons rules come from `pwa-design-system`.
Its rules DS-1 to DS-8 are in its `docs/spec/01-design-system.md`, and LAY-1 to LAY-4 in its
`docs/spec/02-layout.md`. `vendor/design-system/SOURCE.json` names the version and the commit that
this app uses. `tests/design.test.js` runs each rule of `vendor/design-system/rules.js` over the
files of the app. It skips DS-8 only, to run it again without the breakpoint of DSV-5. `designs/index.html` shows each part, shared and own.

This document holds the rules of the app only.

## The copy

- **DSV-1** `vendor/design-system/` holds `design-system.css`, `catalog.js`, `rules.js`,
  `sheet.js`, the font `geist.woff2` and `SOURCE.json`: the version, the commit and the sha256 of
  each file, and no other file. Only
  `npm run ds` writes it, from `../pwa-design-system` with no uncommitted change of those files. A
  file that differs from its hash fails `tests/vendor.test.js`. The tests read the copy only, so
  they pass with no `../pwa-design-system`.
- **DSV-2** `index.html` and `designs/index.html` link `vendor/design-system/design-system.css`
  before `styles.css`, and `SHELL` of `sw.js` has both, `sheet.js` and `geist.woff2` (SW-2). The
  page loads `sheet.js` through the alias `#ds/sheet` (ENG-6). A layer of the two sheets is one
  layer: a rule of `styles.css` comes after the shared rules of its layer.
- **DSV-3** `styles.css` starts with the same layer statement and holds the parts of the app only:
  its tokens, the `body` rule and the font of the controls, the screen parts, and the components of the app.
  A version of a shared component starts with the block `/* @extends <name> */`, in the same
  layer, so that it wins; the block documents the parts, variants and states that the app adds.
  A version holds only the rules that differ from the shared ones, so that a change of the shared
  sheet reaches the app. No other rule of `components` or `layouts` repeats a selector of the
  shared sheet. The versions of shared components are `list-group` in `settings` (the select of a
  row of Preferences lies over the row, SET-1), and `nav-bar`, `app-header` and `sheet` for the
  width classes of DSV-5.
- **DSV-4** A change of a shared part is made in `pwa-design-system`, then `npm run ds` here.
  Nothing edits `vendor/` by hand, and `npm run init` copies it as it is (ENG-17).

## Layout

- **DSV-5** The app has four width classes: phone (below 600px), foldable (600px), tablet (840px)
  and desktop (1024px). It follows LAY-1 to LAY-4 with this exception. From 600px it breaks
  LAY-2: the rail stands at the start with either hand (NAV-4). From 1024px it also breaks LAY-1:
  it stands in a frame of at most `--frame-max` (1280px), centred, and the rail is a sidebar of
  `--sidebar-width` (232px). `--rail-width` is the frame's side margin plus the rail, and
  `--frame-side` the end margin (0 below 1024px), so the toast and the sheets clear both.
  `styles.css` changes `nav-bar` only inside its 600px and 1024px queries, and 1024px is the one
  width query outside DS-8. The same layout comes from `pwa-shopping-list`.
- **DSV-6** From 840px a sheet with a head is a card of `--panel-width` at the end of the
  content, with either hand: from 16px below the header, as high as its content, with the radius
  of a group, over the veil, with a short slide and a fade. The content keeps its width: the list
  and the detail of the `pane` (LAY-3) stay under the veil. A sheet with no head keeps the bottom
  sheet.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| tokens | `--primary` and `--on-primary` take `--done` and `--on-done`: one green for the main action, the walkthrough art and the checked state; the frame and column widths of DSV-5 and DSV-6 |
| components | versions of `nav-bar` (`nav-brand`, `nav-count`, `nav-foot`), `app-header` (`header-add`) and `sheet` (DSV-5, DSV-6) |
| screens | settings: `settings` (version of `list-group`), `about`, `version-status` · nav: `dust` · onboarding: `onboarding`, `onboarding-art` |
