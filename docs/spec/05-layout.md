# Layout and navigation

Rules of `src/sections.js`, `src/modules.js`, `src/onboarding.js`, the views `nav`, `dust` and
`onboarding` of `src/ui/`, and the layout of Settings.

## Size classes

The size classes, the navigation element, the `pane` layout and the safe areas are the rules
LAY-1 to LAY-4 of the design system (04-design-system), with the four width classes of DSV-5. In
this app the Properties section uses the `pane` layout (LAY-3). From 840px, with no property open, the detail says `properties.pick`.

## Navigation

- **NAV-1** The sections are `properties` and `settings`, in the order of `SECTIONS`. The navigation
  shows one item for each section that is on (MOD-1). The current one has
  `aria-current="page"`, and its title is the title of the header.
- **NAV-2** A horizontal slide of at least 60 px that starts in the header or the content, out of
  a row and of a field, goes to the next section (slide left) or the previous one (slide right).
  It stops at the first and the last section. The content comes in from its side.
- **NAV-3** Below 600px the add of Properties is the floating **+**. From 600px it is **Add
  property**, a button with a plus at the end of the header, and the **+** does not show. Both
  show only in Properties, with no sheet open.
- **NAV-4** From 600px the rail stands at the start with either hand (DSV-5). With no session
  (ACC-10) its foot shows the offline icon, with the title **No account**. From 1024px the rail
  is a sidebar: the icon and the name of the app on top, then one row for each section with its
  icon and its name, the current one on a pill; **Properties** shows the count of the properties
  at its end, and the foot shows **No account** as text.

## Modules

- **MOD-1** `MODULES` lists the parts that Settings turns off: `properties`, which shows the
  Properties section. With a module off, its sections leave the navigation, and a view of one of them goes
  to the first section that is on.
- **MOD-2** The modules that are off are a preference of the device under `pwa-landlord.modules`,
  not part of the doc. No module off removes the key.
- **MOD-3** A switch of Modules animates the item of its section: it breaks into dust and its
  place closes, or its place opens and the dust settles (`src/ui/dust.js`). With reduced motion
  the item goes or comes at once.

## Settings

- **SET-1** Settings is a column of groups, each a `list-group-head` above a `list-group` of
  settings rows, as in pwa-shopping-list: **Backup** (**Export**, **Import**), **Preferences**
  (**Language**, **Hand**, **Theme**), **Modules** (MOD-1), **App** (INS-2) and **Help** (ONB-3),
  then the version lines (VER-4). Below **Backup** a line says that the export holds the data of
  the files, not the files (DOC-7). A row of Preferences shows its current value and a chevron, and
  a tap on it opens the native picker of its select. A row that opens something ends with a
  chevron. Modules keeps its switches. From 840px Settings is a column of at most 960px, and each
  group is a row: its head at the left, its rows at the right, the groups split by a line.

## Walkthrough

- **ONB-1** The walkthrough shows at the start of a new install only: no `pwa-landlord.onboarded`
  flag and no stored doc. A storage that cannot be read counts as seen.
- **ONB-2** It has the pages of `PAGES`, each with a drawing, a title and a text. **Next** goes
  forward, **Skip** and Escape close it, a slide or the arrow keys turn a page. The last page has
  **Start** in place of **Next**, and no **Skip**.
- **ONB-3** A close stores the flag. **Show the introduction** in Settings opens it again.
