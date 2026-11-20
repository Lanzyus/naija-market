import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import logo from "../../assets/image/NaijaOpenMarket.png";

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const generateInvoicePDF = async (order, details) => {
  const doc = new jsPDF();

  const items = details?.items || order?.orderitems || order?.items || [];

  const invoiceUrl = `${window.location.origin}/invoice/${order.id}`;
  const qrCode = await QRCode.toDataURL(invoiceUrl);

  try {
    doc.addImage(logo, "PNG", 14, 10, 25, 25);
  } catch (e) {
    /* logo is optional */
  }

  doc.setFontSize(22);
  doc.setTextColor(96, 88, 220);
  doc.text("Naija Market", 45, 20);

  doc.setFontSize(10);
  doc.text("A taste of home", 45, 28);

  doc.addImage(qrCode, "PNG", 160, 15, 35, 35);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text("INVOICE", 160, 60);

  doc.setFontSize(11);
  doc.text(`Invoice No: ${order.order_number || ""}`, 14, 50);
  doc.text(
    `Date: ${new Date(order.created_at).toLocaleDateString("en-NG")}`,
    14,
    57
  );
  doc.text(`Status: ${order.status || "Processing"}`, 14, 64);
  doc.text(`Payment Status: ${order.payment_status || "Paid"}`, 14, 71);

  doc.text(`Customer: ${order.full_name || order.customer_name || ""}`, 14, 85);
  doc.text(`Email: ${order.email || ""}`, 14, 92);
  doc.text(`Phone: ${order.phone || order.phone_number || ""}`, 14, 99);
  doc.text(
    `Address: ${order.shipping_address || order.address || ""}`,
    14,
    106
  );

  const rows = items.map((item) => {
    const qty = Number(item.quantity || 0);
    const unit = Number(item.unit_price || 0);
    const total = Number(item.total_price ?? unit * qty);
    const name = item.product_name || item.product?.name || "Product";
    return [
      item.product_type ? `${name} (${item.product_type})` : name,
      qty,
      `NGN ${formatCurrency(unit)}`,
      `NGN ${formatCurrency(total)}`,
    ];
  });

  autoTable(doc, {
    startY: 115,
    head: [["Product", "Qty", "Price", "Total"]],
    body: rows.length ? rows : [["No products", "", "", ""]],
    headStyles: { fillColor: [96, 88, 220] },
  });

  const finalY = doc.lastAutoTable.finalY + 15;

  const subtotal = Number(order.subtotal || 0);
  const vat = Number(order.vat || 0);
  const delivery = Number(order.delivery_fee ?? order.shipping_fee ?? 0);
  const grandTotal = Number(order.total_amount ?? subtotal + vat + delivery);

  doc.setFontSize(11);
  doc.text(`Subtotal: NGN ${formatCurrency(subtotal)}`, 130, finalY);
  doc.text(`VAT: NGN ${formatCurrency(vat)}`, 130, finalY + 8);
  doc.text(`Delivery: NGN ${formatCurrency(delivery)}`, 130, finalY + 16);

  doc.setFontSize(13);
  doc.text(`Grand Total: NGN ${formatCurrency(grandTotal)}`, 130, finalY + 28);

  doc.setFontSize(10);
  doc.text("Thank you for shopping with Naija Market.", 14, finalY + 45);

  doc.save(`${order.order_number || "order"}-Invoice.pdf`);
};