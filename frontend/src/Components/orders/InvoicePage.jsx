import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import api from "../../api";
import styles from "./InvoicePage.module.css";
import { generateInvoicePDF } from "./invoiceUtils";
import useProfile from "../../hooks/useProfile";
import { resolveOrderDetails } from "../../utils/orderDetails";

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
  const { profile, currentUser } = useProfile();

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

  // Customer + shipping: from the order, else from the owner's profile.
  const details = resolveOrderDetails(order, profile, currentUser);
  const { customer, shipping } = details;
  const missingSome =
    details.source.customer === "none" || details.source.shipping === "none";
  const fromProfile =
    details.source.customer === "profile" || details.source.shipping === "profile";

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
              generateInvoicePDF({ ...order, ...details.flat }, { items })
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
              <span>{customer.name || "—"}</span>
            </div>

            <div>
              <strong>Email</strong>
              <span>{customer.email || "—"}</span>
            </div>

            <div>
              <strong>Phone</strong>
              <span>{customer.phone || "—"}</span>
            </div>
          </div>
        </section>

        {/* Shipping information */}

        <section className={styles.section}>
          <h3>Shipping Information</h3>

          <div className={styles.infoGrid}>
            <div>
              <strong>Address</strong>
              <span>{shipping.address || "—"}</span>
            </div>

            <div>
              <strong>City</strong>
              <span>{shipping.city || "—"}</span>
            </div>

            <div>
              <strong>State / Region</strong>
              <span>{shipping.state || "—"}</span>
            </div>

            <div>
              <strong>Postcode</strong>
              <span>{shipping.postcode || "—"}</span>
            </div>

            <div>
              <strong>Country</strong>
              <span>{shipping.country || "—"}</span>
            </div>
          </div>

          {fromProfile && !missingSome && (
            <p className={styles.note}>
              Details shown are from your current account profile.
            </p>
          )}
          {missingSome && (
            <p className={styles.note}>
              Some details are missing. <Link to="/profile/edit">Update your profile</Link>.
            </p>
          )}
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
