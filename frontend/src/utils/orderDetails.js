/**
 * Resolve customer + shipping details for an order, whatever shape the API uses.
 *
 * 1. Use what the ORDER itself carries (flat fields or nested objects).
 * 2. If the order carries none, fall back to the signed-in customer's PROFILE
 *    (only when the order belongs to them – never another user's order).
 *
 * `flat` is shaped like the fields the Orders page, invoice and PDF already read
 * (full_name, email, phone, shipping_address, city, state, country).
 */

const text = (v) =>
  typeof v === "string" || typeof v === "number" ? String(v).trim() : "";

const firstFilled = (...values) => values.map(text).find(Boolean) || "";

const asObjects = (order) =>
  [
    order.customer,
    order.user,
    order.shipping,
    order.shipping_info,
    order.shipping_details,
    order.delivery,
    order.shipment,
    order.billing,
    order.shipping_address,
    order.address,
  ].filter((o) => o && typeof o === "object" && !Array.isArray(o));

const pickFrom = (sources, keys) =>
  firstFilled(...sources.flatMap((s) => keys.map((k) => s[k])));

const joinName = (o) => [text(o.first_name), text(o.last_name)].filter(Boolean).join(" ");

/** Does this order belong to the current user? Unknown ownership => assume yes (my-orders is per-user). */
export const isOwnOrder = (order = {}, currentUser = {}) => {
  const ownerId = firstFilled(
    order.user_id,
    order.customer_id,
    typeof order.user === "object" ? order.user?.id : order.user,
    order.customer?.id
  );
  const ownerName = firstFilled(
    order.customer_username,
    order.username,
    order.user?.username,
    order.customer?.username
  );

  if (ownerId && text(currentUser.id) && ownerId !== text(currentUser.id)) return false;
  if (ownerName && text(currentUser.username) && ownerName.toLowerCase() !== text(currentUser.username).toLowerCase()) return false;
  return true;
};

export function resolveOrderDetails(order = {}, profile = null, currentUser = {}) {
  const sources = [order, ...asObjects(order)];

  // ---- from the order ----
  const fromOrder = {
    name: firstFilled(
      pickFrom(sources, ["full_name", "customer_name", "recipient_name", "recipient", "name"]),
      ...sources.map(joinName)
    ),
    email: pickFrom(sources, ["email", "customer_email", "user_email"]),
    phone: pickFrom(sources, ["phone", "phone_number", "customer_phone", "mobile", "telephone"]),
    address: firstFilled(
      text(order.shipping_address),
      pickFrom(sources, [
        "address",
        "address_line1",
        "address_line_1",
        "street",
        "street_address",
        "shipping_address_line",
        "line1",
      ])
    ),
    city: pickFrom(sources, ["city", "town"]),
    state: pickFrom(sources, ["state", "region", "province", "county"]),
    country: pickFrom(sources, ["country", "country_name"]),
    postcode: pickFrom(sources, ["postal_code", "postcode", "zip", "zip_code"]),
  };

  // ---- from the profile (own orders only) ----
  const usable = profile && isOwnOrder(order, currentUser);
  const fromProfile = usable
    ? {
        name: joinName(profile),
        email: text(profile.email),
        phone: firstFilled(profile.phone, profile.phone_number),
        address: firstFilled(profile.address, profile.address_line1),
        city: text(profile.city),
        state: text(profile.state),
        country: text(profile.country),
        postcode: firstFilled(profile.postal_code, profile.postcode, profile.zip),
      }
    : {};

  // Group-level fallback so we never mix half an order address with half a profile address.
  const orderHasCustomer = !!(fromOrder.name || fromOrder.email || fromOrder.phone);
  const orderHasShipping = !!(fromOrder.address || fromOrder.city);

  const customer = orderHasCustomer
    ? { name: fromOrder.name, email: fromOrder.email, phone: fromOrder.phone }
    : { name: fromProfile.name || "", email: fromProfile.email || "", phone: fromProfile.phone || "" };

  // The order has its own address but not every part (e.g. no state/country). Fill the gaps from the
  // profile ONLY when it is clearly the same place, so we never mix two different addresses.
  const same = (a, b) => !!a && !!b && a.toLowerCase().replace(/\s+/g, " ") === b.toLowerCase().replace(/\s+/g, " ");
  const sameLocation =
    orderHasShipping &&
    usable &&
    (same(fromOrder.address, fromProfile.address) ||
      (!fromOrder.address && same(fromOrder.city, fromProfile.city)) ||
      (same(fromOrder.city, fromProfile.city) && (!fromOrder.address || !fromProfile.address)));
  const fill = (key) => fromOrder[key] || (sameLocation ? fromProfile[key] || "" : "");

  const shipping = orderHasShipping
    ? { address: fromOrder.address, city: fromOrder.city, state: fill("state"), country: fill("country"), postcode: fill("postcode") }
    : {
        address: fromProfile.address || "",
        city: fromProfile.city || "",
        state: fromProfile.state || "",
        country: fromProfile.country || "",
        postcode: fromProfile.postcode || "",
      };

  const source = {
    customer: orderHasCustomer ? "order" : customer.name || customer.email || customer.phone ? "profile" : "none",
    shipping: orderHasShipping ? "order" : shipping.address || shipping.city ? "profile" : "none",
  };

  return {
    customer,
    shipping,
    source,
    flat: {
      full_name: customer.name,
      email: customer.email,
      phone: customer.phone,
      shipping_address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      country: shipping.country,
      postal_code: shipping.postcode,
    },
  };
}

/** Merge resolved details onto an order object (only filling non-empty values). */
export function withOrderDetails(order, profile, currentUser) {
  const { flat } = resolveOrderDetails(order, profile, currentUser);
  const merged = { ...order };
  Object.entries(flat).forEach(([k, v]) => {
    if (v) merged[k] = v;
  });
  return merged;
}

/** What a delivery needs before we let someone pay. */
export function checkDeliveryDetails(profile) {
  if (!profile) return { complete: false, missing: ["name", "phone", "address", "city", "country"] };
  const missing = [];
  if (!(text(profile.first_name) || text(profile.last_name))) missing.push("full name");
  if (!text(profile.phone)) missing.push("phone number");
  if (!text(profile.address)) missing.push("delivery address");
  if (!text(profile.city)) missing.push("city");
  if (!text(profile.country)) missing.push("country");
  return { complete: missing.length === 0, missing };
}
