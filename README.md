# Landlord

For a landlord: one dashboard to control every house under management. Sibling app: [pwa-tenant](https://github.com/Gekyzo/pwa-tenant).

**App:** <https://gekyzo.github.io/pwa-landlord/>. Open it in Chrome on Android to install it.

Made from `pwa-template`.

An offline Android PWA. Plain HTML, CSS and ES modules: no build step and no dependencies.
From the template it has:

- an offline service worker, an update check with an update toast, and an install button;
- an adaptive layout: a bottom bar on a phone, a rail on a tablet, list and detail side by side
  on a wide screen;
- a design system with a live catalogue at `/designs/`;
- English and Spanish text, light and dark themes, a left-hand mode;
- a release script and a GitHub Pages deploy on a version tag;
- structural tests that keep the layers, the text, the design system and the specification in step.

The first domain is the Properties section: the houses under management, each with a name and an
address. It replaced the notes demo of the template.

## Develop

```sh
npm run serve   # http://localhost:8080
npm test
npm run ds      # copy the design system again from ../pwa-design-system
```

## Install on Android

Open the deployed URL in Chrome. Use the **Install** button of Settings, or Chrome menu →
**Install app**.

## Release and deploy

Go through [docs/deploy-checklist.md](docs/deploy-checklist.md) first.

1. Write the user-visible changes under `## Unreleased` in `CHANGELOG.md`.
2. `npm run release` (or `npm run release -- minor|major`). It commits `Bump version to X.Y.Z`
   and creates the tag `vX.Y.Z`.
3. `git push --follow-tags`. The workflow `.github/workflows/pages.yml` deploys the tag.

Set the repository's Pages source to "GitHub Actions" once.

## Design system

The shared tokens, components and layouts come from `pwa-design-system`, copied into
`vendor/design-system/` by `npm run ds`; `SOURCE.json` there names the version and the commit.
`index.html` loads `vendor/design-system/design-system.css`, then `styles.css`, which holds the
parts of the app only. Change a shared part in `pwa-design-system`, then run `npm run ds`; never
edit `vendor/` by hand. Open `/designs/` on the dev server for the catalogue.
`docs/spec/04-design-system.md` has the rules of the app and points to the shared ones.
