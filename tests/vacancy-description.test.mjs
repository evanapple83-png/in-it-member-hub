import assert from "node:assert/strict";
import test from "node:test";
import { descriptionBlocks } from "../src/lib/vacancy-description.ts";

test("restores inline headings without dropping or changing the provider's wording", () => {
  const text = "Adviseur Over de functie Je verbetert processen. Wat ga je doen? Je analyseert processen. Eisen Minimaal 3 jaar ervaring. Wensen Kennis van ICT.";
  const blocks = descriptionBlocks(text);
  assert.deepEqual(blocks.filter(b => b.type === "heading").map(b => b.text), ["Over de functie", "Wat ga je doen?", "Eisen", "Wensen"]);
  assert.equal(blocks.map(b => b.text).join(" "), text);
});
test("splits long text at sentence boundaries and preserves existing paragraphs", () => {
  const text = `${"Je werkt samen met de opdrachtgever. ".repeat(25).trim()}\n\nEen nieuwe alinea.`;
  const blocks = descriptionBlocks(text);
  assert.ok(blocks.length > 2);
  assert.ok(blocks.every(b => b.text.endsWith(".")));
  assert.equal(blocks.map(b => b.text).join(" "), text.replace(/\s+/g, " "));
});
test("uses a nonempty summary when the description is blank", () => {
  assert.deepEqual(descriptionBlocks("  ", "Samenvatting."), [{type:"paragraph",text:"Samenvatting."}]);
  assert.deepEqual(descriptionBlocks(null, " "), []);
});
test("does not split heading words inside names or lower-case prose", () => {
  assert.deepEqual(descriptionBlocks("Eisenhower voldoet aan de eisen."), [{type:"paragraph",text:"Eisenhower voldoet aan de eisen."}]);
});
