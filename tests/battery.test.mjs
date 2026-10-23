import assert from "node:assert/strict";
import test from "node:test";
import { batteryTone } from "../src/lib/battery.ts";

test("battery capacity uses the exact visual thresholds", () => {
  assert.equal(batteryTone(81), "healthy");
  assert.equal(batteryTone(80), "moderate");
  assert.equal(batteryTone(70), "moderate");
  assert.equal(batteryTone(69), "low");
});

test("missing capacity stays neutral", () => {
  assert.equal(batteryTone(0), "unknown");
  assert.equal(batteryTone(null), "unknown");
  assert.equal(batteryTone(Number.NaN), "unknown");
});
