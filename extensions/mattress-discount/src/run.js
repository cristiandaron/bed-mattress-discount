// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * Per-product discount amount (NOK off each item), keyed by product GID.
 * Only products listed here are discounted, and only when a bed is in the cart.
 * Source: the old "Madrassrabatt – 500 kr" / "– 1000 kr" amount-off-product discounts.
 */
const PRODUCT_DISCOUNTS = {
  // 1000 kr off
  "gid://shopify/Product/9322220618013": 1000, // Madrass Sweet Dream GOLD - 120x200 - 14CM
  "gid://shopify/Product/10332628189469": 1000, // HULDA Memoryskummadrass 120x200x16 (replaces the above, which is out of stock)
  "gid://shopify/Product/9322222715165": 1000, // Madrass Sweet Dream GOLD - 90x190 - 14CM
  "gid://shopify/Product/9322245095709": 1000, // Owly Madrass 90x200 Sweet Dream GOLD - 14 cm
  "gid://shopify/Product/10068829929757": 1000, // Royal 120x200 - 15cm skum-kokos madrass
  "gid://shopify/Product/10068858536221": 1000, // Royal 140x200 - 15cm skum-kokos madrass
  "gid://shopify/Product/10148975378717": 1000, // Madrass Sweet Dream GOLD - 140x200 - 14CM
  // 500 kr off
  "gid://shopify/Product/9167856402717": 500, // Madrass Siesta 90x190x11 cm
  "gid://shopify/Product/9167862235421": 500, // Madrass Sweet Dream 70x160
  "gid://shopify/Product/9322240377117": 500, // Madrass sweet dream - 80x180x11 cm
  "gid://shopify/Product/9322245816605": 500, // Madrass sweet dream - 80x160
  "gid://shopify/Product/9322247946525": 500, // Madrass Sweet Dream 70x140
  "gid://shopify/Product/9614564163869": 500, // Madrass Bacic - 90x190x8 cm
  "gid://shopify/Product/9614564393245": 500, // Madrass Bacic - 80x170x8 cm
  "gid://shopify/Product/9713954816285": 500, // Madrass Bacic - 80x150x8 cm
  "gid://shopify/Product/9872531194141": 500, // Madrass Bacic - 80x180x8 cm
  "gid://shopify/Product/9167742992669": 500, // Owly Babymadrass 60x120
  // 500 kr off — sovesofa add-ons for the two Gamer ULTIMATE loftsenger. Not mattresses, but
  // they bundle the same way, so they use the same mechanism.
  "gid://shopify/Product/9167776219421": 500, // Sovesofa til Gamer ULTIMATE loftseng 90x200
  "gid://shopify/Product/9322220028189": 500, // Sovesofa til Gamer ULTIMATE loftseng 120x200
};

/** @type {FunctionRunResult} */
const NO_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.All,
  discounts: [],
};

/**
 * Bed + Mattress discount.
 *
 *   Trigger: at least one bed (any product in the Bed Collection,
 *            smart-collection rule Vendor != "Madrass") is in the cart.
 *   Target:  each cart line whose product is listed in PRODUCT_DISCOUNTS,
 *            discounted by its mapped amount (500 or 1000 kr) per item.
 *
 * No bed in cart -> nothing is discounted.
 *
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  const lines = input.cart.lines;
  const isVariant = (line) => line.merchandise.__typename === "ProductVariant";

  // Trigger check. A discountable product can never count as the bed that unlocks it.
  //
  // Bed Collection is a smart collection on Vendor != "Madrass", so it holds everything that
  // isn't vendor-tagged as a mattress. That used to be a safe stand-in for "is a bed" because
  // every discounted product had vendor "Madrass" and so was outside the collection. That no
  // longer holds: HULDA is vendor "Drømmerom" and the two sovesofa add-ons are vendor "Trasman",
  // so all three are IN Bed Collection. Without this guard a cart containing only a HULDA would
  // satisfy the trigger by itself and hand out 1000 kr off with no bed bought at all.
  const hasBed = lines.some(
    (line) =>
      isVariant(line) &&
      line.merchandise.product.inBedCollection &&
      !PRODUCT_DISCOUNTS[line.merchandise.product.id]
  );
  if (!hasBed) {
    return NO_DISCOUNT;
  }

  // Group eligible mattress lines by their discount amount so each amount
  // becomes a single discount with the matching cart-line targets.
  /** @type {Map<number, Array<{cartLine: {id: string}}>>} */
  const targetsByAmount = new Map();
  for (const line of lines) {
    if (!isVariant(line)) continue;
    const amount = PRODUCT_DISCOUNTS[line.merchandise.product.id];
    if (!amount) continue;
    const targets = targetsByAmount.get(amount) ?? [];
    targets.push({ cartLine: { id: line.id } });
    targetsByAmount.set(amount, targets);
  }

  if (targetsByAmount.size === 0) {
    return NO_DISCOUNT;
  }

  const discounts = [...targetsByAmount.entries()].map(([amount, targets]) => ({
    targets,
    message: `Madrassrabatt – ${amount} kr`,
    value: {
      fixedAmount: {
        amount: amount.toFixed(2),
        appliesToEachItem: true,
      },
    },
  }));

  return {
    discountApplicationStrategy: DiscountApplicationStrategy.All,
    discounts,
  };
}
