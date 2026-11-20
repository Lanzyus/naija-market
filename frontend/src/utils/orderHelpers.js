
/*
=========================================================
ORDER HELPERS
=========================================================
*/

export const getOrderItems = (order) => {
  if (!order) return [];

  const possibleItems = [
    order.orderitems,
    order.items,
    order.order_items,
    order.orderItems,
  ];

  return (
    possibleItems.find(Array.isArray) || []
  );
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

export const normalizeOrder = (order = {}) => {
  const customer =
    order.customer ||
    order.user ||
    order.customer_profile ||
    order.profile ||
    {};

  const shipping =
    order.shipping ||
    order.shipping_details ||
    order.delivery_address ||
    order.address_details ||
    {};

  const items = getOrderItems(order);

  const firstName = firstValue(
    customer.first_name,
    order.first_name
  );

  const lastName = firstValue(
    customer.last_name,
    order.last_name
  );

  const combinedName = [firstName, lastName]
    .filter(Boolean)
    .join(" ");

  const customerName = firstValue(
    order.full_name,
    order.customer_name,
    order.recipient_name,
    customer.full_name,
    customer.name,
    shipping.full_name,
    shipping.recipient_name,
    combinedName
  );

  const email = firstValue(
    order.email,
    order.customer_email,
    customer.email,
    shipping.email
  );

  const phone = firstValue(
    order.phone,
    order.phone_number,
    order.customer_phone,
    order.mobile,
    customer.phone,
    customer.phone_number,
    shipping.phone,
    shipping.phone_number,
    shipping.mobile
  );

  const address = firstValue(
    order.shipping_address,
    order.delivery_address,
    order.address,
    shipping.shipping_address,
    shipping.address,
    shipping.street_address,
    shipping.address_line,
    shipping.address_line_1
  );

  const city = firstValue(
    order.city,
    shipping.city
  );

  const state = firstValue(
    order.state,
    shipping.state,
    shipping.region
  );

  const country = firstValue(
    order.country,
    shipping.country
  );

  return {
    ...order,

    // Normalized customer fields
    full_name: customerName,
    customer_name: customerName,
    email,
    phone,
    phone_number: phone,

    // Normalized shipping fields
    shipping_address: address,
    address,
    city,
    state,
    country,

    // Preserve order items
    orderitems: items,
    items,
  };
};

/*
=========================================================
MERGE LIST AND DETAIL RESPONSES

Detail data takes priority when it contains a value.
List data is retained when detail data is empty.
=========================================================
*/

export const mergeOrders = (
  listOrder = {},
  detailOrder = {}
) => {
  const merged = { ...listOrder };

  Object.entries(detailOrder || {}).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        merged[key] = value;
      }
    }
  );

  const listItems = getOrderItems(listOrder);
  const detailItems = getOrderItems(detailOrder);

  const items =
    detailItems.length > 0
      ? detailItems
      : listItems;

  return normalizeOrder({
    ...merged,
    orderitems: items,
    items,
  });
};
