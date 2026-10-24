# Properties

The houses under management. Its files are `src/properties.js`, `src/ui/properties.js`,
`tests/properties.test.js`, the `properties.*`, `row.delete`, `toast.propertyDeleted`,
`toast.order`, `error.name*`, `error.address*` and `error.propertyMissing` keys of the catalogs,
the `#properties` section and the `#property-sheet` of `index.html`.

## Doc

- **PROP-1** The doc is `{ version: 1, properties: [{ id, name, address }] }`, newest property
  first, stored as JSON under `pwa-landlord.properties`. A stored doc that is not valid is kept
  under `pwa-landlord.properties.corrupt`, and the app starts with no properties. The
  `pwa-landlord.notes` key of 0.1.1 is not read.
- **PROP-2** `normalizeProperties` accepts a doc of version 1 whose properties have a non-empty
  id, a name that is not blank, an address that is a string or absent, and no id two times. It
  trims each name and address, gives an absent address `''`, and drops unknown fields. A new
  version adds its migration here.

## Operations

- **PROP-3** `addProperty` puts a property first. The name and the address are trimmed. A blank
  name is `error.nameRequired`, a name of more than 80 characters is `error.nameTooLong`, and an
  address of more than 200 characters is `error.addressTooLong`. The address can be empty.
- **PROP-4** `editProperty` changes the name and the address of one property, with the checks of
  PROP-3.
- **PROP-5** `deleteProperty` removes one property. The toast `toast.propertyDeleted` offers
  **Undo** for 5 seconds.
- **PROP-6** `moveProperty` puts a property at an index of the list, clamped to its ends. The
  toast `toast.order` offers **Undo**.
- **PROP-7** An id that is not in the doc is `error.propertyMissing`, and nothing changes.

## Screen

- **PROP-8** The Properties section lists the properties by name. With no property it shows
  `properties.empty` and **Add property**. **+** and **Add property** open the sheet of a new
  property; a tap on a row opens its detail (LAY-3): the name, the address when there is one,
  **Edit** and **Delete**. The head of the sheet has the title and **Close**; its body has
  **Name** and **Address**; its foot has **Save**. **Close**, a tap on the veil or a drag down of
  the head closes it with no save.
- **PROP-9** A row slides left to show **Delete**. A hold of a finger, or a vertical drag of the
  mouse, lifts the row and moves it in the list (PROP-6).
