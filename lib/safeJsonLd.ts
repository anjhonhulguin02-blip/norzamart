const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * Serializes a value for embedding inside a `<script type="application/ld+json">`
 * tag via dangerouslySetInnerHTML.
 *
 * Plain JSON.stringify() is not safe here: the browser's HTML parser reads
 * the contents of a <script> element looking for a literal "</script>"
 * sequence *before* any JavaScript/JSON parsing happens. If a seller- or
 * buyer-controlled field (product name, description, store name, etc.) ever
 * contains "</script>", it closes the tag early and whatever HTML follows
 * — including a second, attacker-authored <script> — gets parsed and
 * executed as real markup on the page.
 *
 * Escaping `<`, `>`, and `&` as \u-sequences prevents the HTML parser from
 * ever recognizing a tag inside the JSON payload, while leaving the decoded
 * value byte-for-byte identical once a JSON-LD consumer (a crawler, a rich
 * results tool, JSON.parse) parses the script's text content — < is a
 * standard JSON escape that decodes back to "<". U+2028/U+2029 (line/
 * paragraph separator) are escaped too: they're valid inside JSON strings
 * but were, for a long time, illegal in raw JS source text, which has
 * bitten script tags that embed JSON without going through this kind of
 * escaping.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .split(LINE_SEPARATOR).join("\\u2028")
    .split(PARAGRAPH_SEPARATOR).join("\\u2029");
}
