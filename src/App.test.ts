import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  default as App,
  STORAGE_KEY,
  clearSavedInputs,
  createDefaultInputs,
  loadInputs,
  saveInputs,
} from "./App";
import SimpleCalculator, { formatAmountInput } from "./SimpleCalculator";

describe("simple calculator page", () => {
  it("formats whole-baht input with thousands separators", () => {
    expect(formatAmountInput("050000")).toBe("50,000");
    expect(formatAmountInput("1,000,000")).toBe("1,000,000");
    expect(formatAmountInput("")).toBe("");
  });

  it("opens with only the three simple inputs and four loan terms", () => {
    const html = renderToStaticMarkup(createElement(SimpleCalculator));

    expect(html).toContain("รายได้ต่อเดือน");
    expect(html).toContain("ราคารถใหม่");
    expect(html).toContain("อัตราดอกเบี้ย Flat Rate");
    expect(html).toContain("48 เดือน");
    expect(html).toContain("60 เดือน");
    expect(html).toContain("72 เดือน");
    expect(html).toContain("84 เดือน");
    expect(html).toMatch(/id="simple-income"[^>]*value=""/);
    expect(html).toMatch(/id="simple-car-price"[^>]*value=""/);
    expect(html).toMatch(/id="simple-interest"[^>]*value="0"/);
  });

  it("makes Simple the default top-level tab", () => {
    const html = renderToStaticMarkup(createElement(App));

    expect(html).toMatch(/aria-selected="true"[^>]*>Simple<\/button>/);
    expect(html).toMatch(/aria-selected="false"[^>]*>Advanced<\/button>/);
    expect(html).toContain("simple-calculator");
    expect(html).not.toContain("guided-studio");
  });
});

function validInputs() {
  const inputs = createDefaultInputs();
  inputs.global.grossIncomeMonthly = 50_000;
  inputs.current.marketValue = 300_000;
  inputs.current.operating.efficiencyKmPerUnit = 15;
  inputs.next.cashPrice = 600_000;
  inputs.next.operating.efficiencyKmPerUnit = 6;
  return inputs;
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("persisted calculator inputs", () => {
  it("rejects a null custom cost entry", () => {
    const stored = { version: 1, inputs: validInputs() };
    stored.inputs.current.operating.custom = [null] as never;
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
    vi.stubGlobal("localStorage", storage);

    expect(loadInputs()).toEqual(createDefaultInputs());
  });

  it("rejects numeric strings before calculation", () => {
    const stored = { version: 1, inputs: validInputs() };
    stored.inputs.current.operating.insuranceAnnual = "12000" as never;
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(stored));
    vi.stubGlobal("localStorage", storage);

    expect(loadInputs()).toEqual(createDefaultInputs());
  });

  it("keeps an unknown version until a valid input change", () => {
    const storage = memoryStorage();
    const unknown = JSON.stringify({ version: 2, inputs: validInputs() });
    storage.setItem(STORAGE_KEY, unknown);
    vi.stubGlobal("localStorage", storage);

    const fallback = loadInputs();
    saveInputs(fallback);
    expect(storage.getItem(STORAGE_KEY)).toBe(unknown);

    const inputs = validInputs();
    saveInputs(inputs);
    expect(storage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify({ version: 1, inputs }),
    );
  });

  it("removes a valid snapshot when inputs are reset", () => {
    const storage = memoryStorage();
    const inputs = validInputs();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, inputs }));
    vi.stubGlobal("localStorage", storage);

    clearSavedInputs();

    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(loadInputs()).toEqual(createDefaultInputs());
  });
});
