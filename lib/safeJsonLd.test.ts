import { describe, it, expect } from "vitest";
import { JSDOM } from "jsdom";
import { safeJsonLdStringify } from "@/lib/safeJsonLd";

describe("safeJsonLdStringify", () => {
  it("prevents a </script> in a field from breaking out of the script tag", () => {
    const malicious = { name: '</script><script>alert(document.cookie)</script>' };
    const output = safeJsonLdStringify(malicious);

    expect(output).not.toContain("</script>");
    expect(output).not.toContain("<script>");
    // The escaped form must still be present so the payload round-trips.
    expect(output).toContain("\\u003c/script\\u003e");
  });

  it("prevents breaking out via an uppercase or mixed-case closing tag", () => {
    const output = safeJsonLdStringify({ name: "</SCRIPT><img src=x onerror=alert(1)>" });
    expect(output.toLowerCase()).not.toContain("</script>");
    expect(output).not.toContain("<img");
  });

  it("escapes a bare < or > even without a full tag", () => {
    const output = safeJsonLdStringify({ name: "5 < 10 and 10 > 5" });
    expect(output).not.toContain("<");
    expect(output).not.toContain(">");
  });

  it("escapes an ampersand", () => {
    const output = safeJsonLdStringify({ name: "Fish & Chips" });
    expect(output).not.toMatch(/&(?!amp;|#|\\u)/);
    expect(output).toContain("\\u0026");
  });

  it("escapes U+2028 and U+2029 so the payload can't break a raw <script> JS context", () => {
    const output = safeJsonLdStringify({ name: `line${String.fromCharCode(0x2028)}sep${String.fromCharCode(0x2029)}para` });
    expect(output).not.toContain(String.fromCharCode(0x2028));
    expect(output).not.toContain(String.fromCharCode(0x2029));
    expect(output).toContain("\\u2028");
    expect(output).toContain("\\u2029");
  });

  it("round-trips to the original value once parsed as JSON, so JSON-LD consumers still read the real content", () => {
    const original = { name: '</script>Tomato & <b>Basil</b>', price: 60 };
    const escaped = safeJsonLdStringify(original);
    const parsed = JSON.parse(escaped);
    expect(parsed).toEqual(original);
  });

  it("leaves ordinary product-shaped data readable and unaffected", () => {
    const clean = { name: "Coco Pandan", price: 60, unit: "kilo" };
    const output = safeJsonLdStringify(clean);
    expect(JSON.parse(output)).toEqual(clean);
  });

  describe("against a real HTML document parser (jsdom), not just string matching", () => {
    // This is the actual attack: the browser's HTML tokenizer scans <script>
    // contents for a literal "</script>" before any JS/JSON parsing runs, so
    // a string-only assertion isn't proof by itself — parsing the produced
    // markup through a real HTML parser is the stronger check.
    //
    // Must go through a full `new JSDOM(fullHtmlDocument)` parse rather than
    // an `element.innerHTML =` fragment assignment: jsdom's innerHTML
    // fragment-parsing path does not reproduce the browser's raw-text
    // <script> tokenization here (verified directly — it left the injected
    // markup inertly stuck inside the script's text instead of breaking out),
    // so it would silently fail to exercise the real vulnerability.
    //
    // The payload's injected tag uses only unquoted HTML attributes (no `"`
    // characters), so JSON.stringify's automatic escaping of `"` to `\"`
    // can't corrupt attribute parsing and mask the result.
    const malicious = { storeName: "</script><img id=injected src=x onerror=alert(1)>" };

    const parse = (serialize: (data: unknown) => string) => {
      const bodyHtml = `<script type="application/ld+json">${serialize(malicious)}</script><div id="after-marker">still here</div>`;
      return new JSDOM(`<!DOCTYPE html><html><body>${bodyHtml}</body></html>`).window.document;
    };

    it("confirms raw JSON.stringify actually is exploitable (negative control)", () => {
      const document = parse((d) => JSON.stringify(d));

      // The </script> in the payload closed the JSON-LD tag early, so the
      // attacker's <img onerror> is now a real, separately-parsed element —
      // proving this test harness genuinely exercises the browser parser.
      expect(document.getElementById("injected")).not.toBeNull();
      expect(document.querySelectorAll("script").length).toBe(1);
    });

    it("prevents the breakout when using safeJsonLdStringify", () => {
      const document = parse(safeJsonLdStringify);

      // No second element was parsed out of the payload, and the JSON-LD
      // script tag's content still parses back to the original value.
      expect(document.getElementById("injected")).toBeNull();
      expect(document.querySelectorAll("script").length).toBe(1);
      expect(document.getElementById("after-marker")).not.toBeNull();
      expect(JSON.parse(document.querySelectorAll("script")[0].textContent || "")).toEqual(malicious);
    });
  });
});
