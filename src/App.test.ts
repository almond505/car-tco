import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  createDefaultInputs,
  loadInputs,
  saveInputs,
} from "./App";

function validInputs() {
  const inputs = createDefaultInputs();
  inputs.global.grossIncomeMonthly = 50_000;
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
});
