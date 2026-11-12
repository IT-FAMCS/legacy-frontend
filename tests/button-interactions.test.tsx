import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import Button from "../src/components/Button";

const link = renderToStaticMarkup(<Button href="/equipment" label="Equipment" />);
assert.match(link, /href="\/equipment"/, "button links retain their destination");
const disabled = renderToStaticMarkup(<Button href="/equipment" label="Equipment" disabled />);
assert.doesNotMatch(disabled, /href=/, "disabled links cannot navigate");
assert.match(disabled, /tabindex="-1"/, "disabled links leave the tab order");
const hidden = renderToStaticMarkup(<Button label="Close" isLabelHidden ariaLabel="Close dialog" />);
assert.match(hidden, /aria-label="Close dialog"/, "explicit accessible names take precedence");
console.log("button navigation and accessible names: passed");
