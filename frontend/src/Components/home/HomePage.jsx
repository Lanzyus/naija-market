import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiSearch, FiTruck, FiShield, FiGlobe, FiHeart, FiShoppingBag } from "react-icons/fi";
import api from "../../api";
import getProductImage from "../../utils/productImage";
import styles from "./NaijaMarketHome.module.css";

const categoriesFallback = [
  { name: "Pantry staples", slug: "pantry-staples", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=85" },
  { name: "Fresh & frozen", slug: "fresh-frozen", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85" },
  { name: "Snacks & treats", slug: "snacks-treats", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85" },
  { name: "Drinks", slug: "drinks", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=85" },
  { name: "Spices & seasonings", slug: "spices-seasonings", image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&q=85" },
  { name: "Beauty & home", slug: "beauty-home", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&q=85" },
];

const promises = [
  { icon: FiGlobe, title: "Nigeria to your doorstep", text: "Shop familiar Nigerian favourites wherever you live." },
  { icon: FiShield, title: "Carefully sourced", text: "Clear product details and thoughtful quality checks." },
  { icon: FiTruck, title: "Delivery you can track", text: "Know what to expect from checkout to arrival." },
];

const money = (value, currency = "NGN") => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price on request";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
};

export default function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get("/products/"), api.get("/categories/")]).then(([p, c]) => {
      if (!active) return;
      if (p.status === "fulfilled") setProducts(Array.isArray(p.value.data) ? p.value.data : p.value.data?.results || []);
      else setLoadError(true);
      if (c.status === "fulfilled") setCategories(Array.isArray(c.value.data) ? c.value.data : c.value.data?.results || []);
    });
    return () => { active = false; };
  }, []);

  const categoryItems = useMemo(() => categories.length ? categories.slice(0, 6).map((item, i) => ({
    name: item.name, slug: item.slug || "", image: item.image || categoriesFallback[i % categoriesFallback.length].image,
  })) : categoriesFallback, [categories]);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/search?search=${encodeURIComponent(search.trim())}` : "/search");
  };

  return (
    <main className={styles.page}>
      <div className={styles.shippingStrip}>A taste of home, delivered worldwide <span>•</span> Explore Nigerian favourites</div>
      <section className={styles.hero}>
        <div className={styles.heroShade} />
        <div className={styles.wrap}>
          <div className={styles.heroContent}>
            <span className={styles.kicker}>YOUR NIGERIAN FOOD MARKET ABROAD</span>
            <h1>Home tastes<br /><em>like Nigeria.</em></h1>
            <p>From jollof essentials to the snacks you grew up loving, bring the flavours of home closer — wherever life takes you.</p>
            <form className={styles.search} onSubmit={submitSearch}>
              <FiSearch aria-hidden="true" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search garri, egusi, palm oil..." aria-label="Search Nigerian groceries" />
              <button type="submit">Search</button>
            </form>
            <div className={styles.heroLinks}>
              <Link className={styles.primaryBtn} to="/search">Shop groceries <FiArrowRight /></Link>
              <span>Made for Nigerians everywhere</span>
            </div>
          </div>
          <div className={styles.heroNote}><strong>Naija essentials</strong><span>One basket. A little taste of home.</span></div>
        </div>
      </section>

      <section className={styles.promiseBar} aria-label="Our service promises">
        <div className={styles.promiseGrid}>{promises.map(({ icon: Icon, title, text }) => <article className={styles.promise} key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></article>)}</div>
      </section>

      <section className={styles.section} id="categories">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}><div><span className={styles.kickerDark}>SHOP THE WAY YOU COOK</span><h2>Find your taste of home</h2><p>Everyday ingredients, special treats and pantry must-haves.</p></div><Link to="/search" className={styles.viewAll}>All products <FiArrowRight /></Link></div>
          <div className={styles.categoryGrid}>{categoryItems.map((item, index) => <Link to={`/search?category=${encodeURIComponent(item.slug)}`} className={styles.categoryCard} key={`${item.slug}-${item.name}`}><img src={item.image} alt="" loading="lazy" /><span className={styles.categoryShade} /><span className={styles.categoryLabel}><small>0{index + 1}</small><strong>{item.name}</strong><FiArrowRight /></span></Link>)}</div>
        </div>
      </section>

      <section className={styles.featureBand}>
        <div className={styles.featureImage} role="img" aria-label="Colourful Nigerian ingredients and spices" />
        <div className={styles.featureCopy}><span className={styles.kickerDark}>THE FLAVOUR OF HOME</span><h2>Sunday rice.<br /><em>Any day of the week.</em></h2><p>Stock up on the ingredients that turn an ordinary meal into something familiar. Build your pantry with Nigerian staples and discover something new along the way.</p><Link className={styles.darkBtn} to="/search">Explore the pantry <FiArrowRight /></Link></div>
      </section>

      <section className={styles.section} id="shop">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}><div><span className={styles.kickerDark}>FROM OUR MARKETPLACE</span><h2>Popular in the pantry</h2><p>Discover products available in our store.</p></div><Link to="/search" className={styles.viewAll}>Shop everything <FiArrowRight /></Link></div>
          {products.length ? <div className={styles.productGrid}>{products.slice(0, 8).map(product => <Link to={`/products/${product.slug}`} className={styles.productCard} key={product.id || product.slug}><div className={styles.productImage}><img src={getProductImage(product)} alt={product.name} loading="lazy" /><span>View item <FiArrowRight /></span></div><div className={styles.productInfo}><strong>{product.name}</strong><b>{money(product.current_price)}</b></div></Link>)}</div> : <div className={styles.emptyState}>{loadError ? "Our market is taking a short break. Please try again soon." : "Our shelves are being stocked. Browse the full marketplace to discover available products."}<Link to="/search">Browse products <FiArrowRight /></Link></div>}
        </div>
      </section>

      <section className={styles.destination}>
        <div className={`${styles.wrap} ${styles.destinationInner}`}><div><span className={styles.kicker}>WHEREVER YOU CALL HOME</span><h2>Your Nigerian kitchen<br /><em>is closer than you think.</em></h2><p>Start your basket today and make room for the flavours you miss.</p></div><Link className={styles.primaryBtn} to="/search">Start shopping <FiShoppingBag /></Link></div>
      </section>
    </main>
  );
}























// import { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FiArrowRight, FiSearch, FiTruck, FiShield, FiGlobe, FiHeart, FiShoppingBag } from "react-icons/fi";
// import api from "../../api";
// import getProductImage from "../../utils/productImage";
// import styles from "./NaijaMarketHome.module.css";

// const categoriesFallback = [
//   { name: "Pantry staples", slug: "pantry-staples", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=900&q=85" },
//   { name: "Fresh & frozen", slug: "fresh-frozen", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85" },
//   { name: "Snacks & treats", slug: "snacks-treats", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=85" },
//   { name: "Drinks", slug: "drinks", image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=900&q=85" },
//   { name: "Spices & seasonings", slug: "spices-seasonings", image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=900&q=85" },
//   { name: "Beauty & home", slug: "beauty-home", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&q=85" },
// ];

// const promises = [
//   { icon: FiGlobe, title: "Nigeria to your doorstep", text: "Shop familiar Nigerian favourites wherever you live." },
//   { icon: FiShield, title: "Carefully sourced", text: "Clear product details and thoughtful quality checks." },
//   { icon: FiTruck, title: "Delivery you can track", text: "Know what to expect from checkout to arrival." },
// ];

// const money = (value, currency = "NGN") => {
//   const amount = Number(value);
//   if (!Number.isFinite(amount)) return "Price on request";
//   return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
// };

// export default function HomePage() {
//   const navigate = useNavigate();
//   const [products, setProducts] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loadError, setLoadError] = useState(false);

//   useEffect(() => {
//     let active = true;
//     Promise.allSettled([api.get("/products/"), api.get("/categories/")]).then(([p, c]) => {
//       if (!active) return;
//       if (p.status === "fulfilled") setProducts(Array.isArray(p.value.data) ? p.value.data : p.value.data?.results || []);
//       else setLoadError(true);
//       if (c.status === "fulfilled") setCategories(Array.isArray(c.value.data) ? c.value.data : c.value.data?.results || []);
//     });
//     return () => { active = false; };
//   }, []);

//   const categoryItems = useMemo(() => categories.length ? categories.slice(0, 6).map((item, i) => ({
//     name: item.name, slug: item.slug || "", image: item.image || categoriesFallback[i % categoriesFallback.length].image,
//   })) : categoriesFallback, [categories]);

//   const submitSearch = (event) => {
//     event.preventDefault();
//     navigate(search.trim() ? `/search?search=${encodeURIComponent(search.trim())}` : "/search");
//   };

//   return (
//     <main className={styles.page}>
//       <div className={styles.shippingStrip}>A taste of home, delivered worldwide <span>•</span> Explore Nigerian favourites</div>
//       <section className={styles.hero}>
//         <div className={styles.heroShade} />
//         <div className={styles.wrap}>
//           <div className={styles.heroContent}>
//             <span className={styles.kicker}>YOUR NIGERIAN FOOD MARKET ABROAD</span>
//             <h1>Home tastes<br /><em>like Nigeria.</em></h1>
//             <p>From jollof essentials to the snacks you grew up loving, bring the flavours of home closer — wherever life takes you.</p>
//             <form className={styles.search} onSubmit={submitSearch}>
//               <FiSearch aria-hidden="true" />
//               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search garri, egusi, palm oil..." aria-label="Search Nigerian groceries" />
//               <button type="submit">Search</button>
//             </form>
//             <div className={styles.heroLinks}>
//               <Link className={styles.primaryBtn} to="/search">Shop groceries <FiArrowRight /></Link>
//               <span>Made for Nigerians everywhere</span>
//             </div>
//           </div>
//           <div className={styles.heroNote}><strong>Naija essentials</strong><span>One basket. A little taste of home.</span></div>
//         </div>
//       </section>

//       <section className={styles.promiseBar} aria-label="Our service promises">
//         <div className={styles.promiseGrid}>{promises.map(({ icon: Icon, title, text }) => <article className={styles.promise} key={title}><Icon /><div><strong>{title}</strong><span>{text}</span></div></article>)}</div>
//       </section>

//       <section className={styles.section} id="categories">
//         <div className={styles.wrap}>
//           <div className={styles.sectionHead}><div><span className={styles.kickerDark}>SHOP THE WAY YOU COOK</span><h2>Find your taste of home</h2><p>Everyday ingredients, special treats and pantry must-haves.</p></div><Link to="/search" className={styles.viewAll}>All products <FiArrowRight /></Link></div>
//           <div className={styles.categoryGrid}>{categoryItems.map((item, index) => <Link to={`/search?category=${encodeURIComponent(item.slug)}`} className={styles.categoryCard} key={`${item.slug}-${item.name}`}><img src={item.image} alt="" loading="lazy" /><span className={styles.categoryShade} /><span className={styles.categoryLabel}><small>0{index + 1}</small><strong>{item.name}</strong><FiArrowRight /></span></Link>)}</div>
//         </div>
//       </section>

//       <section className={styles.featureBand}>
//         <div className={styles.featureImage} role="img" aria-label="Colourful Nigerian ingredients and spices" />
//         <div className={styles.featureCopy}><span className={styles.kickerDark}>THE FLAVOUR OF HOME</span><h2>Sunday rice.<br /><em>Any day of the week.</em></h2><p>Stock up on the ingredients that turn an ordinary meal into something familiar. Build your pantry with Nigerian staples and discover something new along the way.</p><Link className={styles.darkBtn} to="/search">Explore the pantry <FiArrowRight /></Link></div>
//       </section>

//       <section className={styles.section} id="shop">
//         <div className={styles.wrap}>
//           <div className={styles.sectionHead}><div><span className={styles.kickerDark}>FROM OUR MARKETPLACE</span><h2>Popular in the pantry</h2><p>Discover products available in our store.</p></div><Link to="/search" className={styles.viewAll}>Shop everything <FiArrowRight /></Link></div>
//           {products.length ? <div className={styles.productGrid}>{products.slice(0, 8).map(product => <Link to={`/products/${product.slug}`} className={styles.productCard} key={product.id || product.slug}><div className={styles.productImage}><img src={getProductImage(product)} alt={product.name} loading="lazy" /><span>View item <FiArrowRight /></span></div><div className={styles.productInfo}><strong>{product.name}</strong><b>{money(product.current_price)}</b></div></Link>)}</div> : <div className={styles.emptyState}>{loadError ? "Our market is taking a short break. Please try again soon." : "Our shelves are being stocked. Browse the full marketplace to discover available products."}<Link to="/search">Browse products <FiArrowRight /></Link></div>}
//         </div>
//       </section>

//       <section className={styles.destination}>
//         <div className={styles.wrap destinationInner}><div><span className={styles.kicker}>WHEREVER YOU CALL HOME</span><h2>Your Nigerian kitchen<br /><em>is closer than you think.</em></h2><p>Start your basket today and make room for the flavours you miss.</p></div><Link className={styles.primaryBtn} to="/search">Start shopping <FiShoppingBag /></Link></div>
//       </section>
//     </main>
//   );
// }
