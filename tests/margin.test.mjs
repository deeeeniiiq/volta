import assert from "node:assert/strict";
import test from "node:test";
import { profitOnCost } from "../src/lib/margin.ts";

test("dobrar o valor pago gera 100% de lucro sobre custo", () => {
  assert.deepEqual(profitOnCost(240000, 120000), { profitCents: 120000, percent: 100 });
});

test("lucro menor e prejuízo usam a mesma base de custo", () => {
  assert.deepEqual(profitOnCost(150000, 120000), { profitCents: 30000, percent: 25 });
  assert.deepEqual(profitOnCost(90000, 120000), { profitCents: -30000, percent: -25 });
});

test("custo ausente ou zero não produz percentual enganoso", () => {
  assert.equal(profitOnCost(240000, null), null);
  assert.equal(profitOnCost(240000, 0), null);
  assert.equal(profitOnCost(0, 120000), null);
});
