import assert from "node:assert/strict";
import test from "node:test";
import { readInvoiceScoped, readInvoiceVulnerable } from "./invoice-boundary.mjs";

const alice = Object.freeze({ authenticated: true, tenant: "tenant-a" });

test("vulnerable lookup crosses the dummy tenant boundary", () => {
  assert.equal(readInvoiceVulnerable(alice, "invoice-b")?.tenant, "tenant-b");
});

test("scoped lookup rejects the identical cross-tenant request", () => {
  assert.equal(readInvoiceScoped(alice, "invoice-b"), undefined);
});

test("scoped lookup preserves the authorized read", () => {
  assert.deepEqual(readInvoiceScoped(alice, "invoice-a"),
    { id: "invoice-a", tenant: "tenant-a", amount: 10 });
});

test("authentication alone does not imply authorization", () => {
  const noTenant = { authenticated: true };
  assert.equal(readInvoiceVulnerable(noTenant, "invoice-b")?.tenant, "tenant-b");
  assert.equal(readInvoiceScoped(noTenant, "invoice-b"), undefined);
});

test("both lookups deny anonymous principals", () => {
  for (const principal of [undefined, null,
    { authenticated: false, tenant: "tenant-a" },
    { authenticated: "false", tenant: "tenant-a" }]) {
    assert.equal(readInvoiceVulnerable(principal, "invoice-a"), undefined);
    assert.equal(readInvoiceScoped(principal, "invoice-a"), undefined);
  }
});

test("missing invoice does not fabricate a record", () => {
  assert.equal(readInvoiceVulnerable(alice, "missing"), undefined);
  assert.equal(readInvoiceScoped(alice, "missing"), undefined);
});
