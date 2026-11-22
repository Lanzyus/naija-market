import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import NavBar from "../Components/ui/NavBar";
import Footer from "../Components/ui/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MainLayout = ({ numCartItems = 0 }) => {
  const location = useLocation();

  // Scroll to in-page sections after React Router has navigated.
  // This also handles links such as /#projects when clicked from another page.
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const sectionId = decodeURIComponent(location.hash.slice(1));
    let firstFrame;
    let secondFrame;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const section = document.getElementById(sectionId);
        if (!section) {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
          return;
        }

        const header = document.querySelector("header");
        const headerHeight = header?.getBoundingClientRect().height || 0;
        const top =
          section.getBoundingClientRect().top +
          window.scrollY -
          headerHeight -
          12;

        window.scrollTo({
          top: Math.max(0, top),
          left: 0,
          behavior: "smooth",
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [location.pathname, location.hash]);

  return (
    <>
      <ToastContainer />
      <main>
        <NavBar numCartItems={numCartItems} />
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;
