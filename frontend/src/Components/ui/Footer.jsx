import React from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiInstagram } from "react-icons/fi";

export default function Footer() {
  return (
    <footer style={{ background: "#103526", color: "#f7f4eb" }}>
      <div style={{ width: "min(1190px,calc(100% - 40px))", margin: "auto", padding: "58px 0 35px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 42 }}>
        <div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 28, letterSpacing: ".04em", fontWeight: 600 }}>NAIJA MARKET</div>
          <div style={{ fontSize: 9, letterSpacing: ".25em", marginTop: 7, color: "#efbd6c" }}>A TASTE OF HOME, WHEREVER YOU ARE</div>
          <p style={{ maxWidth: 410, color: "#c7d0c8", lineHeight: 1.8, marginTop: 20, fontSize: 13 }}>Your online destination for Nigerian groceries, pantry staples and familiar favourites. Bringing a little taste of home closer to the diaspora.</p>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#efbd6c", marginBottom: 18 }}>Explore</div>
          <div style={{ display: "grid", gap: 11, fontSize: 13 }}>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/search">Shop groceries</Link>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/about">Our story</Link>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/orders">My orders</Link>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/contact">Contact & support</Link>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".15em", textTransform: "uppercase", color: "#efbd6c", marginBottom: 18 }}>Customer care</div>
          <div style={{ display: "grid", gap: 11, fontSize: 13 }}>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/delivery">Delivery information</Link>
            <Link style={{ color: "inherit", textDecoration: "none" }} to="/contact">FAQs & help</Link>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>Instagram <FiInstagram /></a>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #315441", padding: "18px 20px", textAlign: "center", fontSize: 10, color: "#b2c0b5", letterSpacing: ".04em" }}>© {new Date().getFullYear()} Naija Market. All rights reserved. Product availability and delivery destinations are confirmed at checkout.</div>
    </footer>
  );
}
