import "@shopify/ui-extensions/preact";
import { render } from "preact";

export default async () => {
  render(<App />, document.body);
};

/**
 * Settings panel for the "Bed + Mattress" discount function.
 *
 * The function logic is fixed (1000 kr off every mattress when a bed is in the
 * cart), so there is nothing for the merchant to configure here. This panel only
 * exists so Shopify renders the discount's create/details page (title, dates,
 * combinations, Save) for this extension-only app.
 */
function App() {
  const { i18n } = shopify;

  return (
    <s-function-settings>
      <s-section>
        <s-banner tone="info" heading={i18n.translate("title")}>
          <s-text>{i18n.translate("description")}</s-text>
        </s-banner>
      </s-section>
    </s-function-settings>
  );
}
