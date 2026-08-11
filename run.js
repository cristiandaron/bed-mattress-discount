// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/** Amount (in shop currency, NOK) taken off EACH mattress when a bed is in the cart. */
const MATTRESS_DISCOUNT = 1000.0;

/** @type {import("../generated/api").FunctionRunResult} */
const NO_DISCOUNT = {
  discounts: [],
  discountApplicationStrategy: DiscountApplicationStrategy.First,
};

/**
 * Bed + Mattress discount.
 *
 * Logic:
 *   - "Bed"      = any cart line whose product IS in the Bed Collection
 *                  (smart collection rule: Vendor != "Madrass").
 *   - "Mattress" = any cart line whose product is NOT in the Bed Collection
 *                  (i.e. vendor "Madrass").
 *
 * If at least one bed is in the cart, every mattress gets MATTRESS_DISCOUNT off
 * each item. No bed -> mattresses get nothing.
 *
 * @param {import("../generated/api").RunInput} input
 * @returns {import("../generated/api").FunctionRunResult}
 */
export function run(input) {
  const lines = input.cart.lines;

  const isVariant = (line) =>
    line.merchandise.__typename === "ProductVariant";

  // Trigger: at least one "bed" (non-Madrass product) in the cart.
  const hasBed = lines.some(
    (line) => isVariant(line) && line.merchandise.product.inBedCollection
  );
  if (!hasBed) {
    return NO_DISCOUNT;
  }

  // Targets: every mattress line (NOT in Bed Collection == vendor "Madrass").
  const mattressTargets = lines
    .filter(
      (line) => isVariant(line) && !line.merchandise.product.inBedCollection
    )
    .map((line) => ({ cartLine: { id: line.id } }));

  if (mattressTargets.length === 0) {
    return NO_DISCOUNT;
  }

  return {
    discountApplicationStrategy: DiscountApplicationStrategy.First,
    discounts: [
      {
        targets: mattressTargets,
        message: "Madrassrabatt – 1000 kr",
        value: {
          fixedAmount: {
            amount: MATTRESS_DISCOUNT.toFixed(2),
            // Apply the full amount to each entitled mattress, not split across them.
            appliesToEachItem: true,
          },
        },
      },
    ],
  };
}
