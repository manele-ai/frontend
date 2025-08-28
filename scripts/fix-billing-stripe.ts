#!/usr/bin/env node
/**
 * Fix Stripe customers missing name/address by backfilling from their latest Charge.billing_details.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node fix-customer-billing.js [--dry-run] [--limit=500]
 *
 * Notes:
 * - Only updates customers that are actually missing name and/or a meaningful address.
 * - Won't overwrite existing non-empty customer fields unless you pass --force (optional).
 * - Uses charges.list({ customer }) to find the most recent charge (which includes billing_details).
 * - Includes a dry-run mode to preview changes.
 */

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import Stripe from "stripe";

// ---------- Config & CLI flags ----------
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error("Missing STRIPE_SECRET_KEY env var.");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIST_PAGE_SIZE = Math.min(
  Number.parseInt(limitArg?.split("=")[1] ?? "1000", 10) || 1000,
  1000
);

// Pin API version for stability; adjust as needed
const stripe = new Stripe(STRIPE_KEY, {
  maxNetworkRetries: 3,
});

// ---------- Helpers ----------
function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

type AddrParam = Stripe.AddressParam | null | undefined;
type Addr = Stripe.Address | null | undefined;

function hasMeaningfulAddress(addr: Addr | AddrParam): addr is Stripe.AddressParam {
  if (!addr) return false;
  const a = addr as Stripe.AddressParam;
  return !isBlank(a.line1) && (!!a.postal_code || !!a.city || !!a.state || !!a.country);
}

function formatAddress(a?: Stripe.Address | Stripe.AddressParam | null): string {
  if (!a) return "(none)";
  const any = a as any;
  const parts = [any.line1, any.line2, any.city, any.state, any.postal_code, any.country].filter(
    Boolean
  );
  return parts.length ? parts.join(", ") : "(none)";
}

function computeUpdatePayload(
  customer: Stripe.Customer,
  sourceName?: string | null,
  sourceAddress?: Stripe.Address | Stripe.AddressParam | null
): Stripe.CustomerUpdateParams {
  const update: Stripe.CustomerUpdateParams = {};

  if (FORCE) {
    if (!isBlank(sourceName)) update.name = sourceName!;
    if (hasMeaningfulAddress(sourceAddress as AddrParam)) {
      update.address = sourceAddress as Stripe.AddressParam;
    }
    return update;
  }

  // Only fill missing pieces
  if (isBlank(customer.name) && !isBlank(sourceName)) {
    update.name = sourceName!;
  }

  const custAddr = (customer.address ?? undefined) as Addr;
  const customerHasAddress = hasMeaningfulAddress(custAddr);
  if (!customerHasAddress && hasMeaningfulAddress(sourceAddress as AddrParam)) {
    update.address = sourceAddress as Stripe.AddressParam;
  }

  return update;
}

// ---------- Main ----------
(async function main(): Promise<void> {
  console.log(
    `Starting customer backfill (dryRun=${DRY_RUN}, force=${FORCE}, listPageSize=${LIST_PAGE_SIZE})`
  );

  let updatedCount = 0;
  let examined = 0;

  // customers.list() yields only non-deleted customers
  const customerIter = stripe.customers.list({
    limit: LIST_PAGE_SIZE,
    expand: ["data.address"],
  });

  for await (const customer of customerIter) {
    examined += 1;

    const needsName = isBlank(customer.name);
    const needsAddress = !hasMeaningfulAddress((customer.address ?? undefined) as Addr);

    if (!needsName && !needsAddress) continue;

    // Get most recent charge (if any)
    let charge: Stripe.Charge | null = null;
    try {
      const charges = await stripe.charges.list({
        customer: customer.id,
        limit: 1,
        expand: ["data.billing_details.address"],
      });
      charge = charges.data[0] ?? null;
    } catch (err: any) {
      console.warn(`Could not list charges for ${customer.id}: ${err?.message ?? String(err)}`);
      continue;
    }

    if (!charge?.billing_details) continue;

    const sourceName = charge.billing_details.name ?? null;
    const sourceAddress = (charge.billing_details.address ?? null) as Stripe.Address | null;

    const updatePayload = computeUpdatePayload(customer, sourceName, sourceAddress);

    if (!updatePayload.name && !updatePayload.address) continue;

    console.log(
      `\nCustomer ${customer.id} ${customer.email ? `<${customer.email}>` : ""}\n` +
        `  Current: name="${customer.name ?? ""}", address=${formatAddress(customer.address)}\n` +
        `  From charge ${charge.id}: name="${sourceName ?? ""}", address=${formatAddress(
          sourceAddress
        )}\n` +
        `  Update -> ${JSON.stringify(updatePayload)}`
    );

    if (DRY_RUN) continue;

    try {
      const idempotencyKey = `cust-billing-backfill-${customer.id}`;
      await stripe.customers.update(customer.id, updatePayload, { idempotencyKey });
      updatedCount += 1;
    } catch (err: any) {
      console.error(
        `Update failed for ${customer.id}: ${(err?.type ?? "Error")} ${err?.message ?? String(err)}`
      );
      continue;
    }
  }

  console.log(
    `\nDone. Examined ${examined} customers. ${
      DRY_RUN ? "Would update" : "Updated"
    } ${updatedCount} customer(s).`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});