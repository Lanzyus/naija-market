import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import api from "../../api";
import styles from "./InvoicePage.module.css";
import { generateInvoicePDF } from "./invoiceUtils";

/* ---------- helpers ---------- */

const getOrderItems = (order) => {
  if (!order) return [];

  if (Array.isArray(order.orderitems)) return order.orderitems;
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.order_items)) return order.order_items;

  return [];
};

const getOrderId = (order) =>
  order?.id ?? order?.pk ?? order?.order_id ?? null;

// Invoices show what was actually charged (NGN), never a converted amount.
const money = (value) =>
  `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "—";

  const d = new Date(date);

  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

/* ---------- component ---------- */

const InvoicePage = () => {
  const params = useParams();
  const location = useLocation();

  // Support different React Router parameter names, then fall back to the URL.
  const routeId =
    params.id ||
    params.orderId ||
    params.order_id ||
    params.pk;

  const segments = location.pathname.split("/").filter(Boolean);
  const invoiceIndex = segments.findIndex((segment) =>
    ["invoice", "invoices"].includes(segment.toLowerCase())
  );
  const pathId =
    invoiceIndex >= 0 && invoiceIndex + 1 < segments.length
      ? segments[invoiceIndex + 1]
      : undefined;

  const id = routeId || pathId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- load order ---------- */

  useEffect(() => {
    let cancelled = false;

    const isValidId = id && id !== "undefined" && id !== "null";

    // Full order detail; returns null if the server sent a different order.
    const fetchDetail = async () => {
      const res = await api.get(`/orders/${id}/`);
      const detail = res.data;
      return detail && String(getOrderId(detail)) === String(id)
        ? detail
        : null;
    };

    const load = async () => {
      setOrder(null);
      setError("");

      // 1. Validate the ID before calling the API.
      if (!isValidId) {
        setError(
          "Invalid order ID. Please return to My Orders and select View Invoice again."
        );
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        let found = null;

        // 2. Look in the customer's order list first. A failure here must not
        //    stop us trying the detail endpoint below.
        try {
          const res = await api.get("/my-orders/");
          const list = Array.isArray(res.data?.orders)
            ? res.data.orders
            : Array.isArray(res.data)
            ? res.data
            : [];

          found =
            list.find((o) => String(getOrderId(o)) === String(id)) || null;
        } catch (e) {
          console.error(
            "INVOICE: /my-orders/ failed:",
            e.response?.status,
            e.response?.data || e.message
          );
        }

        if (found && getOrderItems(found).length === 0) {
          // 3. Found, but without its items: enrich from the detail endpoint.
          //    If that fails we still show what we have.
          try {
            const detail = await fetchDetail();
            if (detail) {
              found = {
                ...found,
                ...detail,
                orderitems:
                  getOrderItems(detail).length > 0
                    ? getOrderItems(detail)
                    : getOrderItems(found),
              };
            }
          } catch (e) {
            console.error(
              "INVOICE: detail request failed:",
              e.response?.status,
              e.response?.data || e.message
            );
          }
        } else if (!found) {
          // 4. Not in the list at all: the detail endpoint is the last resort.
          found = await fetchDetail();
        }

        if (cancelled) return;

        if (found) {
          setOrder(found);
        } else {
          setError(
            "We couldn’t find this order. Please return to My Orders and try again."
          );
        }
      } catch (err) {
        console.error(
          "INVOICE: loading error:",
          err.response?.status,
          err.response?.data || err.message
        );

        if (!cancelled) {
          const status = err.response?.status;
          setError(
            status === 401
              ? "Please log in to view this invoice."
              : status === 404
              ? "We couldn’t find this order. Please return to My Orders and try again."
              : err.response?.data?.detail ||
                err.response?.data?.message ||
                "Unable to load this invoice. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ---------- loading ---------- */

  if (loading) {
    return (
      <div className={styles.invoicePage}>
        <p>Loading invoice...</p>
      </div>
    );
  }

  /* ---------- error ---------- */

  if (error || !order) {
    return (
      <div className={styles.invoicePage}>
        <p>{error || "Invoice not found."}</p>

        <Link to="/orders">
          Back to my orders
        </Link>
      </div>
    );
  }

  /* ---------- invoice calculations ---------- */

  const items = getOrderItems(order);

  const subtotal = Number(order.subtotal || 0);
  const vat = Number(order.vat || 0);

  const delivery = Number(
    order.delivery_fee ?? order.shipping_fee ?? 0
  );

  const total = Number(
    order.total_amount ?? subtotal + vat + delivery
  );

  /* ---------- invoice display ---------- */

  return (
    <div className={styles.invoicePage}>

      {/* Invoice header */}

      <div className={styles.invoiceHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Invoice
          </h1>

          <p className={styles.orderNumber}>
            Order #{order.order_number || getOrderId(order)}
          </p>
        </div>

        <div>
          <button
            type="button"
            className={styles.printButton}
            onClick={() => window.print()}
          >
            🖨 Print Invoice
          </button>{" "}

          <button
            type="button"
            className={styles.printButton}
            onClick={() =>
              generateInvoicePDF(order, { items })
            }
          >
            ⬇ Download PDF
          </button>
        </div>
      </div>

      {/* Invoice card */}

      <div className={styles.invoiceCard}>

        {/* Company information */}

        <div className={styles.companyHeader}>
          <div>
            <h2 className={styles.companyName}>
              NaijaMarket
            </h2>

            <p className={styles.companyTagline}>
              A taste of home
            </p>
          </div>

          <div className={styles.invoiceLabel}>
            <h2>INVOICE</h2>

            <p>
              Order #{order.order_number || getOrderId(order)}
            </p>

            <p>
              Date: {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Customer information */}

        <section className={styles.section}>
          <h3>Customer Information</h3>

          <div className={styles.infoGrid}>
            <div>
              <strong>Name</strong>
              <span>
                {order.full_name ||
                  order.customer_name ||
                  "—"}
              </span>
            </div>

            <div>
              <strong>Email</strong>
              <span>{order.email || "—"}</span>
            </div>

            <div>
              <strong>Phone</strong>
              <span>
                {order.phone ||
                  order.phone_number ||
                  "—"}
              </span>
            </div>
          </div>
        </section>

        {/* Shipping information */}

        <section className={styles.section}>
          <h3>Shipping Information</h3>

          <div className={styles.infoGrid}>
            <div>
              <strong>Address</strong>
              <span>
                {order.shipping_address ||
                  order.address ||
                  "—"}
              </span>
            </div>

            <div>
              <strong>City</strong>
              <span>{order.city || "—"}</span>
            </div>

            <div>
              <strong>State</strong>
              <span>{order.state || "—"}</span>
            </div>

            <div>
              <strong>Country</strong>
              <span>{order.country || "—"}</span>
            </div>
          </div>
        </section>

        {/* Payment information */}

        <section className={styles.section}>
          <h3>Payment Information</h3>

          <div className={styles.paymentGrid}>
            <div>
              <strong>Payment Type</strong>
              <span>
                {order.payment_type || "—"}
              </span>
            </div>

            <div>
              <strong>Payment Method</strong>
              <span>
                {order.payment_method || "—"}
              </span>
            </div>

            <div>
              <strong>Payment Status</strong>
              <span className={styles.paid}>
                {order.payment_status || "Paid"}
              </span>
            </div>

            <div>
              <strong>Order Status</strong>
              <span className={styles.processing}>
                {order.status || "Processing"}
              </span>
            </div>
          </div>
        </section>

        {/* Ordered items */}

        <section className={styles.section}>
          <h3>Ordered Items</h3>

          <div className={styles.tableWrapper}>
            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      No products on this order.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const qty = Number(
                      item.quantity || 0
                    );

                    const unit = Number(
                      item.unit_price || 0
                    );

                    const lineTotal = Number(
                      item.total_price ?? unit * qty
                    );

                    return (
                      <tr key={item.id || index}>
                        <td>
                          {item.product_name ||
                            item.product?.name ||
                            "Product"}

                          {item.product_type
                            ? ` (${item.product_type})`
                            : ""}
                        </td>

                        <td>{qty}</td>

                        <td>{money(unit)}</td>

                        <td>{money(lineTotal)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Invoice totals */}

        <div className={styles.totalSection}>
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>

          <div>
            <span>VAT</span>
            <strong>{money(vat)}</strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>{money(delivery)}</strong>
          </div>

          <div className={styles.grandTotal}>
            <span>Order Total</span>
            <strong>{money(total)}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePage;













// import React, { useEffect, useState } from "react";
// import { useParams, useLocation, Link } from "react-router-dom";
// import api from "../../api";
// import styles from "./InvoicePage.module.css";
// import { generateInvoicePDF } from "./invoiceUtils";

// /* ---------- helpers ---------- */

// const getOrderItems = (order) => {
//   if (!order) return [];

//   if (Array.isArray(order.orderitems)) return order.orderitems;
//   if (Array.isArray(order.items)) return order.items;
//   if (Array.isArray(order.order_items)) return order.order_items;

//   return [];
// };

// const getOrderId = (order) =>
//   order?.id ?? order?.pk ?? order?.order_id ?? null;

// const money = (value) =>
//   `₦${Number(value || 0).toLocaleString("en-NG", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// const formatDate = (date) => {
//   if (!date) return "—";

//   const d = new Date(date);

//   return Number.isNaN(d.getTime())
//     ? "—"
//     : d.toLocaleDateString("en-NG", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
// };

// /* ---------- component ---------- */

// const InvoicePage = () => {
//   const params = useParams();
//   const location = useLocation();

//   // Support different React Router parameter names.
//   const routeId =
//     params.id ||
//     params.orderId ||
//     params.order_id ||
//     params.pk;

//   // Fallback to the URL when a route parameter is unavailable.
//   const segments = location.pathname
//     .split("/")
//     .filter(Boolean);

//   const invoiceIndex = segments.findIndex((segment) =>
//     ["invoice", "invoices"].includes(segment.toLowerCase())
//   );

//   const pathId =
//     invoiceIndex >= 0 && invoiceIndex + 1 < segments.length
//       ? segments[invoiceIndex + 1]
//       : undefined;

//   const id = routeId || pathId;

//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   /* ---------- load order ---------- */

//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");
//         setOrder(null);

//         console.log("INVOICE ROUTE PARAMS:", params);
//         console.log("INVOICE URL:", location.pathname);
//         console.log("INVOICE REQUESTED ID:", id);

//         // 1. Validate order ID before making API requests.
//         if (
//           !id ||
//           id === "undefined" ||
//           id === "null"
//         ) {
//           throw new Error(
//             "Invalid order ID. Please return to My Orders and select View Invoice again."
//           );
//         }

//         let found = null;
//         let knownIds = [];

//         // 2. Load the customer's orders first.
//         try {
//           const res = await api.get("/my-orders/");

//           const list = Array.isArray(res.data?.orders)
//             ? res.data.orders
//             : Array.isArray(res.data)
//             ? res.data
//             : [];

//           knownIds = list
//             .map(getOrderId)
//             .filter((value) => value !== null);

//           console.log("INVOICE: Requested ID:", id);
//           console.log("INVOICE: Available IDs:", knownIds);

//           found =
//             list.find(
//               (o) => String(getOrderId(o)) === String(id)
//             ) || null;

//         } catch (e) {
//           console.error(
//             "INVOICE: /my-orders/ failed:",
//             e.response?.status,
//             e.response?.data || e.message
//           );
//         }

//         // 3. Fetch full details if the order exists
//         // but does not contain its items.
//         if (found && getOrderItems(found).length === 0) {
//           try {
//             const res = await api.get(`/orders/${id}/`);
//             const detail = res.data;

//             if (
//               detail &&
//               String(getOrderId(detail)) === String(id)
//             ) {
//               found = {
//                 ...found,
//                 ...detail,
//                 orderitems:
//                   getOrderItems(detail).length > 0
//                     ? getOrderItems(detail)
//                     : getOrderItems(found),
//               };
//             }

//             console.log("INVOICE: Full order details:", detail);

//           } catch (e) {
//             console.error(
//               "INVOICE: Detail request failed:",
//               e.response?.status,
//               e.response?.data || e.message
//             );
//           }
//         }

//         // 4. Try the detail endpoint if the order
//         // was not found in the customer's order list.
//         if (!found) {
//           try {
//             const res = await api.get(`/orders/${id}/`);
//             const detail = res.data;

//             console.log("INVOICE: Detail response:", detail);

//             if (
//               detail &&
//               String(getOrderId(detail)) === String(id)
//             ) {
//               found = detail;
//             }

//           } catch (e) {
//             console.error(
//               "INVOICE: Detail failed:",
//               e.response?.status,
//               e.response?.data || e.message
//             );
//           }
//         }

//         // 5. Update invoice state.
//         if (!cancelled) {
//           if (found) {
//             setOrder(found);
//             setError("");
//           } else {
//             setError(
//               `We could not find order ${id}. Available order IDs: ${
//                 knownIds.length
//                   ? knownIds.join(", ")
//                   : "none loaded"
//               }.`
//             );
//           }
//         }

//       } catch (err) {
//         console.error("INVOICE: Loading error:", err);

//         if (!cancelled) {
//           setError(
//             err.response?.data?.detail ||
//               err.message ||
//               "Unable to load this invoice. Please log in and try again."
//           );
//         }

//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     };

//     load();

//     return () => {
//       cancelled = true;
//     };

//   }, [id]);

//   /* ---------- loading ---------- */

//   if (loading) {
//     return (
//       <div className={styles.invoicePage}>
//         <p>Loading invoice...</p>
//       </div>
//     );
//   }

//   /* ---------- error ---------- */

//   if (error || !order) {
//     return (
//       <div className={styles.invoicePage}>
//         <p>{error || "Invoice not found."}</p>

//         <Link to="/orders">
//           Back to my orders
//         </Link>
//       </div>
//     );
//   }

//   /* ---------- invoice calculations ---------- */

//   const items = getOrderItems(order);

//   const subtotal = Number(order.subtotal || 0);
//   const vat = Number(order.vat || 0);

//   const delivery = Number(
//     order.delivery_fee ?? order.shipping_fee ?? 0
//   );

//   const total = Number(
//     order.total_amount ?? subtotal + vat + delivery
//   );

//   /* ---------- invoice display ---------- */

//   return (
//     <div className={styles.invoicePage}>

//       {/* Invoice header */}

//       <div className={styles.invoiceHeader}>
//         <div>
//           <h1 className={styles.pageTitle}>
//             Invoice
//           </h1>

//           <p className={styles.orderNumber}>
//             Order #{order.order_number || getOrderId(order)}
//           </p>
//         </div>

//         <div>
//           <button
//             type="button"
//             className={styles.printButton}
//             onClick={() => window.print()}
//           >
//             🖨 Print Invoice
//           </button>{" "}

//           <button
//             type="button"
//             className={styles.printButton}
//             onClick={() =>
//               generateInvoicePDF(order, { items })
//             }
//           >
//             ⬇ Download PDF
//           </button>
//         </div>
//       </div>

//       {/* Invoice card */}

//       <div className={styles.invoiceCard}>

//         {/* Company information */}

//         <div className={styles.companyHeader}>
//           <div>
//             <h2 className={styles.companyName}>
//               Naija Market
//             </h2>

//             <p className={styles.companyTagline}>
//               A taste of home
//             </p>
//           </div>

//           <div className={styles.invoiceLabel}>
//             <h2>INVOICE</h2>

//             <p>
//               Order #{order.order_number || getOrderId(order)}
//             </p>

//             <p>
//               Date: {formatDate(order.created_at)}
//             </p>
//           </div>
//         </div>

//         <div className={styles.divider} />

//         {/* Customer information */}

//         <section className={styles.section}>
//           <h3>Customer Information</h3>

//           <div className={styles.infoGrid}>
//             <div>
//               <strong>Name</strong>
//               <span>
//                 {order.full_name ||
//                   order.customer_name ||
//                   "—"}
//               </span>
//             </div>

//             <div>
//               <strong>Email</strong>
//               <span>{order.email || "—"}</span>
//             </div>

//             <div>
//               <strong>Phone</strong>
//               <span>
//                 {order.phone ||
//                   order.phone_number ||
//                   "—"}
//               </span>
//             </div>
//           </div>
//         </section>

//         {/* Shipping information */}

//         <section className={styles.section}>
//           <h3>Shipping Information</h3>

//           <div className={styles.infoGrid}>
//             <div>
//               <strong>Address</strong>
//               <span>
//                 {order.shipping_address ||
//                   order.address ||
//                   "—"}
//               </span>
//             </div>

//             <div>
//               <strong>City</strong>
//               <span>{order.city || "—"}</span>
//             </div>

//             <div>
//               <strong>State</strong>
//               <span>{order.state || "—"}</span>
//             </div>

//             <div>
//               <strong>Country</strong>
//               <span>{order.country || "—"}</span>
//             </div>
//           </div>
//         </section>

//         {/* Payment information */}

//         <section className={styles.section}>
//           <h3>Payment Information</h3>

//           <div className={styles.paymentGrid}>
//             <div>
//               <strong>Payment Type</strong>
//               <span>
//                 {order.payment_type || "—"}
//               </span>
//             </div>

//             <div>
//               <strong>Payment Method</strong>
//               <span>
//                 {order.payment_method || "—"}
//               </span>
//             </div>

//             <div>
//               <strong>Payment Status</strong>
//               <span className={styles.paid}>
//                 {order.payment_status || "Paid"}
//               </span>
//             </div>

//             <div>
//               <strong>Order Status</strong>
//               <span className={styles.processing}>
//                 {order.status || "Processing"}
//               </span>
//             </div>
//           </div>
//         </section>

//         {/* Ordered items */}

//         <section className={styles.section}>
//           <h3>Ordered Items</h3>

//           <div className={styles.tableWrapper}>
//             <table className={styles.invoiceTable}>
//               <thead>
//                 <tr>
//                   <th>Product</th>
//                   <th>Qty</th>
//                   <th>Unit Price</th>
//                   <th>Total</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {items.length === 0 ? (
//                   <tr>
//                     <td colSpan={4}>
//                       No products on this order.
//                     </td>
//                   </tr>
//                 ) : (
//                   items.map((item, index) => {
//                     const qty = Number(
//                       item.quantity || 0
//                     );

//                     const unit = Number(
//                       item.unit_price || 0
//                     );

//                     const lineTotal = Number(
//                       item.total_price ?? unit * qty
//                     );

//                     return (
//                       <tr key={item.id || index}>
//                         <td>
//                           {item.product_name ||
//                             item.product?.name ||
//                             "Product"}

//                           {item.product_type
//                             ? ` (${item.product_type})`
//                             : ""}
//                         </td>

//                         <td>{qty}</td>

//                         <td>{money(unit)}</td>

//                         <td>{money(lineTotal)}</td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         {/* Invoice totals */}

//         <div className={styles.totalSection}>
//           <div>
//             <span>Subtotal</span>
//             <strong>{money(subtotal)}</strong>
//           </div>

//           <div>
//             <span>VAT</span>
//             <strong>{money(vat)}</strong>
//           </div>

//           <div>
//             <span>Delivery</span>
//             <strong>{money(delivery)}</strong>
//           </div>

//           <div className={styles.grandTotal}>
//             <span>Order Total</span>
//             <strong>{money(total)}</strong>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default InvoicePage;











// import React, { useEffect, useState } from "react";
// import { useParams, Link } from "react-router-dom";
// import api from "../../api";
// import styles from "./InvoicePage.module.css";
// import { generateInvoicePDF } from "./invoiceUtils";

// /* ---------- helpers ---------- */

// const getOrderItems = (order) => {
//   if (!order) return [];
//   if (Array.isArray(order.orderitems)) return order.orderitems;
//   if (Array.isArray(order.items)) return order.items;
//   if (Array.isArray(order.order_items)) return order.order_items;
//   return [];
// };

// const money = (value) =>
//   `₦${Number(value || 0).toLocaleString("en-NG", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// const formatDate = (date) => {
//   if (!date) return "—";
//   const d = new Date(date);
//   return Number.isNaN(d.getTime())
//     ? "—"
//     : d.toLocaleDateString("en-NG", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       });
// };

// /* ---------- component ---------- */

// const InvoicePage = () => {
//   // Route must be:  <Route path="/invoice/:id" element={<InvoicePage />} />
//   const { id } = useParams();

//   const [order, setOrder] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         let found = null;

//         // 1) order detail endpoint (same one OrdersPage uses)
//         try {
//           const res = await api.get(`/orders/${id}/`);
//           if (res.data && getOrderItems(res.data).length > 0) {
//             found = res.data;
//           }
//         } catch (e) {
//           /* fall through to /my-orders/ */
//         }

//         // 2) fallback: find it in the user's own orders list
//         if (!found) {
//           const res = await api.get("/my-orders/");
//           const list = Array.isArray(res.data?.orders)
//             ? res.data.orders
//             : Array.isArray(res.data)
//             ? res.data
//             : [];
//           found = list.find((o) => String(o.id) === String(id)) || null;
//         }

//         if (!cancelled) {
//           if (found) setOrder(found);
//           else setError("We could not find this order.");
//         }
//       } catch (err) {
//         if (!cancelled) {
//           setError(
//             err.response?.data?.detail ||
//               "Unable to load this invoice. Please log in and try again."
//           );
//         }
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [id]);

//   if (loading) {
//     return (
//       <div className={styles.invoicePage}>
//         <p>Loading invoice...</p>
//       </div>
//     );
//   }

//   if (error || !order) {
//     return (
//       <div className={styles.invoicePage}>
//         <p>{error || "Invoice not found."}</p>
//         <Link to="/orders">Back to my orders</Link>
//       </div>
//     );
//   }

//   const items = getOrderItems(order);

//   const subtotal = Number(order.subtotal || 0);
//   const vat = Number(order.vat || 0);
//   const delivery = Number(order.delivery_fee ?? order.shipping_fee ?? 0);
//   const total = Number(order.total_amount ?? subtotal + vat + delivery);

//   return (
//     <div className={styles.invoicePage}>
//       <div className={styles.invoiceHeader}>
//         <div>
//           <h1 className={styles.pageTitle}>Invoice</h1>
//           <p className={styles.orderNumber}>Order #{order.order_number}</p>
//         </div>

//         <div>
//           <button
//             className={styles.printButton}
//             onClick={() => window.print()}
//           >
//             🖨 Print Invoice
//           </button>{" "}
//           <button
//             className={styles.printButton}
//             onClick={() => generateInvoicePDF(order, { items })}
//           >
//             ⬇ Download PDF
//           </button>
//         </div>
//       </div>

//       <div className={styles.invoiceCard}>
//         <div className={styles.companyHeader}>
//           <div>
//             <h2 className={styles.companyName}>Naija Market</h2>
//             <p className={styles.companyTagline}>A taste of home</p>
//           </div>

//           <div className={styles.invoiceLabel}>
//             <h2>INVOICE</h2>
//             <p>Order #{order.order_number}</p>
//             <p>Date: {formatDate(order.created_at)}</p>
//           </div>
//         </div>

//         <div className={styles.divider} />

//         <section className={styles.section}>
//           <h3>Customer Information</h3>
//           <div className={styles.infoGrid}>
//             <div>
//               <strong>Name</strong>
//               <span>{order.full_name || order.customer_name || "—"}</span>
//             </div>
//             <div>
//               <strong>Email</strong>
//               <span>{order.email || "—"}</span>
//             </div>
//             <div>
//               <strong>Phone</strong>
//               <span>{order.phone || order.phone_number || "—"}</span>
//             </div>
//           </div>
//         </section>

//         <section className={styles.section}>
//           <h3>Shipping Information</h3>
//           <div className={styles.infoGrid}>
//             <div>
//               <strong>Address</strong>
//               <span>{order.shipping_address || order.address || "—"}</span>
//             </div>
//             <div>
//               <strong>City</strong>
//               <span>{order.city || "—"}</span>
//             </div>
//             <div>
//               <strong>State</strong>
//               <span>{order.state || "—"}</span>
//             </div>
//             <div>
//               <strong>Country</strong>
//               <span>{order.country || "—"}</span>
//             </div>
//           </div>
//         </section>

//         <section className={styles.section}>
//           <h3>Payment Information</h3>
//           <div className={styles.paymentGrid}>
//             <div>
//               <strong>Payment Type</strong>
//               <span>{order.payment_type || "—"}</span>
//             </div>
//             <div>
//               <strong>Payment Method</strong>
//               <span>{order.payment_method || "—"}</span>
//             </div>
//             <div>
//               <strong>Payment Status</strong>
//               <span className={styles.paid}>
//                 {order.payment_status || "Paid"}
//               </span>
//             </div>
//             <div>
//               <strong>Order Status</strong>
//               <span className={styles.processing}>
//                 {order.status || "Processing"}
//               </span>
//             </div>
//           </div>
//         </section>

//         <section className={styles.section}>
//           <h3>Ordered Items</h3>
//           <div className={styles.tableWrapper}>
//             <table className={styles.invoiceTable}>
//               <thead>
//                 <tr>
//                   <th>Product</th>
//                   <th>Qty</th>
//                   <th>Unit Price</th>
//                   <th>Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.length === 0 ? (
//                   <tr>
//                     <td colSpan={4}>No products on this order.</td>
//                   </tr>
//                 ) : (
//                   items.map((item, index) => {
//                     const qty = Number(item.quantity || 0);
//                     const unit = Number(item.unit_price || 0);
//                     const lineTotal = Number(item.total_price ?? unit * qty);
//                     return (
//                       <tr key={item.id || index}>
//                         <td>
//                           {item.product_name || item.product?.name || "Product"}
//                           {item.product_type ? ` (${item.product_type})` : ""}
//                         </td>
//                         <td>{qty}</td>
//                         <td>{money(unit)}</td>
//                         <td>{money(lineTotal)}</td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </section>

//         <div className={styles.totalSection}>
//           <div>
//             <span>Subtotal</span>
//             <strong>{money(subtotal)}</strong>
//           </div>
//           <div>
//             <span>VAT</span>
//             <strong>{money(vat)}</strong>
//           </div>
//           <div>
//             <span>Delivery</span>
//             <strong>{money(delivery)}</strong>
//           </div>
//           <div className={styles.grandTotal}>
//             <span>Order Total</span>
//             <strong>{money(total)}</strong>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InvoicePage;










// import React from "react";
// import styles from "./InvoicePage.module.css";

// const InvoicePage = () => {
//     return (
//         <div className={styles.invoicePage}>

//             <div className={styles.invoiceHeader}>
//                 <div>
//                     <h1 className={styles.pageTitle}>Invoice</h1>
//                     <p className={styles.orderNumber}>
//                         Order #ORD-20260831150605
//                     </p>
//                 </div>

//                 <button
//                     className={styles.printButton}
//                     onClick={() => window.print()}
//                 >
//                     🖨 Print Invoice
//                 </button>
//             </div>

//             <div className={styles.invoiceCard}>

//                 <div className={styles.companyHeader}>
//                     <div>
//                         <h2 className={styles.companyName}>
//                             Naija Market 
//                         </h2>

//                         <p className={styles.companyTagline}>
//                             A taste of home
//                         </p>
//                     </div>

//                     <div className={styles.invoiceLabel}>
//                         <h2>INVOICE</h2>
//                         <p>
//                             Order #ORD-20260831150605
//                         </p>
//                         <p>
//                             Date: 31/08/2026
//                         </p>
//                     </div>
//                 </div>

//                 <div className={styles.divider} />

//                 <section className={styles.section}>
//                     <h3>Customer Information</h3>

//                     <div className={styles.infoGrid}>
//                         <div>
//                             <strong>Name</strong>
//                             <span>Funmi Onipede</span>
//                         </div>

//                         <div>
//                             <strong>Email</strong>
//                             <span>funmilolaonipede@gmail.com</span>
//                         </div>
//                     </div>
//                 </section>

//                 <section className={styles.section}>
//                     <h3>Shipping Information</h3>

//                     <div className={styles.infoGrid}>
//                         <div>
//                             <strong>Address</strong>
//                             <span>
//                                 3 Unity Close, Off Oremeji
//                             </span>
//                         </div>

//                         <div>
//                             <strong>City</strong>
//                             <span>Alagbado</span>
//                         </div>
//                     </div>
//                 </section>

//                 <section className={styles.section}>
//                     <h3>Payment Information</h3>

//                     <div className={styles.paymentGrid}>
//                         <div>
//                             <strong>Payment Type</strong>
//                             <span>online</span>
//                         </div>

//                         <div>
//                             <strong>Payment Method</strong>
//                             <span>paystack</span>
//                         </div>

//                         <div>
//                             <strong>Payment Status</strong>
//                             <span className={styles.paid}>
//                                 Paid
//                             </span>
//                         </div>

//                         <div>
//                             <strong>Order Status</strong>
//                             <span className={styles.processing}>
//                                 Processing
//                             </span>
//                         </div>
//                     </div>
//                 </section>

//                 <section className={styles.section}>
//                     <h3>Ordered Items</h3>

//                     <div className={styles.tableWrapper}>
//                         <table className={styles.invoiceTable}>
//                             <thead>
//                                 <tr>
//                                     <th>Product</th>
//                                     <th>Qty</th>
//                                     <th>Unit Price</th>
//                                     <th>Total</th>
//                                 </tr>
//                             </thead>

//                             <tbody>
//                                 <tr>
//                                     <td>
//                                         Modern Comfort
//                                         Rectangular Coffee Table
//                                     </td>

//                                     <td>1</td>

//                                     <td>
//                                         ₦347,890.00
//                                     </td>

//                                     <td>
//                                         ₦347,890.00
//                                     </td>
//                                 </tr>

//                                 <tr>
//                                     <td>
//                                         Modern Comfort Single Bed
//                                     </td>

//                                     <td>1</td>

//                                     <td>
//                                         ₦160,000.00
//                                     </td>

//                                     <td>
//                                         ₦160,000.00
//                                     </td>
//                                 </tr>
//                             </tbody>
//                         </table>
//                     </div>
//                 </section>

//                 <div className={styles.totalSection}>
//                     <div>
//                         <span>Subtotal</span>
//                         <strong>₦507,890.00</strong>
//                     </div>

//                     <div className={styles.grandTotal}>
//                         <span>Order Total</span>
//                         <strong>₦545,981.75</strong>
//                     </div>
//                 </div>

//             </div>
//         </div>
//     );
// };

// export default InvoicePage;