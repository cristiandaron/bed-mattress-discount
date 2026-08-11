# Bed + Mattress discount function — setup

Gives **1000 kr off each mattress** (vendor "Madrass") **only when a bed**
(any product in the Bed Collection, `gid://shopify/Collection/659195199773`,
rule: Vendor != "Madrass") **is in the cart**.

## 1. Create the app (interactive — run yourself)

```bash
shopify app init
# -> "Build an extension-only app"
cd <the-app-folder-it-created>
```

## 2. Generate the product discount function

```bash
shopify app generate extension
# Type:     Function
# Category: Discounts
# Template: Product discount
# Language: JavaScript
# Name:     bed-mattress-discount
```

This creates `extensions/bed-mattress-discount/` with boilerplate.

## 3. Drop in our logic

Replace the two generated files with the ones in this folder:

- `src/run.graphql`  <-  run.graphql   (input query — selects cart lines + Bed Collection membership)
- `src/run.js`       <-  run.js        (the discount logic)

> If the generated function uses `index.js`/`index.graphql` instead of
> `run.js`/`run.graphql`, just keep the generated filenames and paste the
> contents in. Match whatever `input_query` / `export` are set to in
> `shopify.extension.toml`.

## 4. Build (generates the typed `../generated/api` module)

```bash
shopify app function build
# or, from the app root:  npm run build
```

## 5. Deploy

```bash
shopify app deploy
```

## 6. Activate the discount in Admin

After deploy, the function is available but not yet applied. Create the discount:

Admin → Discounts → Create discount → **(your function: "bed-mattress-discount")**
→ set it Automatic, give it a title (e.g. "Madrassrabatt – 1000 kr"), Save & activate.

Then **deactivate the old "Madrassrabatt" Buy X Get Y discounts** so they don't overlap.

## 7. Test in cart

- 1 bed + 2 mattresses  -> both mattresses show -1000 kr   ✅
- mattress only (no bed) -> no discount                     ✅
- 1 bed + 3 mattresses  -> all three show -1000 kr          ✅

## Notes / things to tune

- **Amount:** change `MATTRESS_DISCOUNT` in `run.js`.
- **Per-unit vs per-line:** `appliesToEachItem: true` applies 1000 kr to each
  entitled mattress item. Verify behavior if a customer buys qty 2 of one mattress.
- **Trigger breadth:** Bed Collection = "Vendor != Madrass", so ANY non-mattress
  item triggers it. To restrict to real bed frames, point `inAnyCollection` at a
  tighter collection ID in `run.graphql`.
- **Tiers (500/1000):** to mirror the old 500 kr tier, either add a second
  discount/function targeting a different bed/mattress group, or branch inside
  `run.js` on collection membership.
