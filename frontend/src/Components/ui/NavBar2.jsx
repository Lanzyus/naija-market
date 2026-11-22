import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiShoppingBag,
  FiInstagram,
} from "react-icons/fi";

import { CartContext } from "../../Context/CartContext";
import AuthContext from "../../Context/AuthContext";
import NavBarLink from "./NavBarLink";
import styles from "./NavBar.module.css";

export default function NavBar() {
  const cart = useContext(CartContext) || {};
  const auth = useContext(AuthContext) || {};
  const { numCartItems = 0 } = cart;
  const { isAuthenticated } = auth;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <div className={styles.topbar}>
        BESPOKE INTERIORS • CUSTOM FURNITURE • LAGOS, NIGERIA
      </div>

      <header className={styles.header}>
        <div className={styles.inner}>
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
            {open ? <FiX /> : <FiMenu />}
          </button>

          <Link to="/" className={styles.brand} onClick={close}>
            <span className={styles.brandMark}>
              <img
                src="/src/assets/image/Sensation.PNG"
                alt="Sensational Interiors"
              />
            </span>
            <span className={styles.brandText}>
              <strong className={styles.brandName}>SENSATIONAL</strong>
              <small className={styles.brandSubtitle}>INTERIORS_07</small>
            </span>
          </Link>

          <nav
            className={`${styles.nav} ${open ? styles.navOpen : ""}`}
            aria-label="Main navigation"
          >
            <Link to="/" onClick={close}>Home</Link>
            <Link to="/about" onClick={close}>About</Link>
            <Link to="/#services" onClick={close}>Services</Link>
            <Link to="/#projects" onClick={close}>Projects</Link>
            <Link to="/#journal" onClick={close}>Blog</Link>
            <Link to="/contact" onClick={close}>Contact</Link>

            <div className={styles.accountNavigation}>
              <NavBarLink close={close} />
            </div>
          </nav>

          <div className={styles.actions}>
            <a
              href="https://www.instagram.com/sensational_interiors07/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className={styles.instagram}
            >
              <FiInstagram />
            </a>

            <Link
              to="/contact"
              className={styles.consultation}
              onClick={close}
            >
              Book a Consultation
            </Link>

            <Link
              to="/cart"
              className={styles.cart}
              aria-label="Shopping bag"
              onClick={close}
            >
              <FiShoppingBag />
              <span>{Number(numCartItems) || 0}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
