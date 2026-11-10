// Original synthetic fixture. No network, filesystem, provider, or target input.
const invoices = Object.freeze([
  Object.freeze({ id: "invoice-a", tenant: "tenant-a", amount: 10 }),
  Object.freeze({ id: "invoice-b", tenant: "tenant-b", amount: 20 }),
]);

/** Demonstrates an authenticated caller reading another dummy tenant's invoice. */
export function readInvoiceVulnerable(principal, invoiceId) {
  if (principal?.authenticated !== true) return undefined;
  return invoices.find((invoice) => invoice.id === invoiceId);
}

/** Enforces tenant authorization at the same invoice lookup boundary. */
export function readInvoiceScoped(principal, invoiceId) {
  if (principal?.authenticated !== true || typeof principal.tenant !== "string") return undefined;
  return invoices.find((invoice) =>
    invoice.id === invoiceId && invoice.tenant === principal.tenant);
}

if (import.meta.main) {
  if (process.argv.length !== 2) throw new Error("Invoice boundary lab accepts no arguments");
  const principal = { authenticated: true, tenant: "tenant-a" };
  console.log(JSON.stringify({
    principal: principal.tenant,
    requested: "invoice-b",
    vulnerable: readInvoiceVulnerable(principal, "invoice-b")?.tenant ?? "denied",
    scoped: readInvoiceScoped(principal, "invoice-b")?.tenant ?? "denied",
  }));
}
