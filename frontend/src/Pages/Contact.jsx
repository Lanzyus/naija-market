import React, { useState } from "react";
import api from "../api";

const faqs = [
  { q: "How long does it take to receive a response?", a: "We typically reply within 24 hours on business days." },
  { q: "Can I track my order?", a: "Yes. Once your order has shipped, tracking information is provided." },
  { q: "Do you deliver outside Nigeria?", a: "Yes. Naija Market brings Nigerian groceries to customers abroad. Delivery options are shown at checkout." },
  { q: "What if an item arrives damaged or incorrect?", a: "Contact us with your order number and a photo, and we will make it right." },
];

const GREEN = "#0b5d3b";
const GOLD = "#d9a441";

const ContactPage = () => {
  const empty = { name: "", email: "", subject: "", message: "" };
  const [formData, setFormData] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(0);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const response = await api.post("/contact/", formData);
      setSuccess(
        response.data?.message ||
          "Thank you! Your message has been sent. We will get back to you shortly."
      );
      setFormData(empty);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Unable to send your message at this time. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const card = { borderRadius: 16 };

  return (
    <div style={{ background: "#fbf6ea" }}>
      <div
        className="text-center text-white"
        style={{ background: `linear-gradient(135deg, #07402a, ${GREEN})`, padding: "70px 16px" }}
      >
        <p style={{ color: GOLD, letterSpacing: 3, fontSize: 12, fontWeight: 700, margin: 0 }}>
          CONTACT NAIJA MARKET
        </p>
        <h1 className="display-5 fw-bold mt-2">We'd love to hear from you</h1>
        <p className="lead mb-0" style={{ opacity: 0.85 }}>
          Questions about an order, a product or delivery? Send us a message and
          our team will respond as soon as possible.
        </p>
      </div>

      <div className="container py-5">
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm border-0" style={card}>
              <div className="card-body p-4 p-md-5">
                <h3 className="mb-4">Send us a message</h3>

                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Full name</label>
                      <input type="text" className="form-control form-control-lg" name="name"
                        placeholder="Your full name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email address</label>
                      <input type="email" className="form-control form-control-lg" name="email"
                        placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Subject</label>
                    <input type="text" className="form-control form-control-lg" name="subject"
                      placeholder="e.g. Question about my order" value={formData.subject}
                      onChange={handleChange} required />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">Message</label>
                    <textarea className="form-control form-control-lg" rows="6" name="message"
                      placeholder="How can we help?" value={formData.message}
                      onChange={handleChange} required />
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-lg px-5 fw-bold"
                    style={{ background: GREEN, color: "#fff", borderRadius: 999 }}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Sending...
                      </>
                    ) : (
                      "Send message"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm border-0 mb-4" style={card}>
              <div className="card-body p-4">
                <h4 className="mb-3">Contact information</h4>
                <p>📍 <strong>Address:</strong><br />Lagos, Nigeria</p>
                <p>📞 <strong>Phone:</strong><br />+234 0803 518 5273</p>
                <p className="mb-0">✉ <strong>Email:</strong><br />support@naijaopenmarket.com</p>
              </div>
            </div>

            <div className="card shadow-sm border-0 mb-4" style={card}>
              <div className="card-body p-4">
                <h4 className="mb-3">Business hours</h4>
                <p className="mb-1">Monday - Friday: 8:00 AM - 6:00 PM</p>
                <p className="mb-1">Saturday: 9:00 AM - 4:00 PM</p>
                <p className="mb-0">Sunday: Closed</p>
              </div>
            </div>

            <div className="card border-0 text-white" style={{ ...card, background: GREEN }}>
              <div className="card-body p-4">
                <h4 className="mb-2">Follow Naija Market</h4>
                <div className="d-flex gap-3 fs-4 mb-2"><span>📘</span><span>📸</span><span>🐦</span><span>💼</span></div>
                <p className="mb-0" style={{ opacity: 0.85 }}>
                  Stay connected for new arrivals, offers and a little taste of home.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-center mb-4">Frequently asked questions</h2>
          <div className="mx-auto" style={{ maxWidth: 800 }}>
            {faqs.map((f, i) => (
              <div className="card border-0 shadow-sm mb-2" key={f.q} style={{ borderRadius: 12 }}>
                <button type="button" className="btn text-start fw-semibold p-3 d-flex justify-content-between"
                  onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                  <span>{f.q}</span>
                  <span style={{ color: GREEN }}>{open === i ? "−" : "+"}</span>
                </button>
                {open === i && <div className="px-3 pb-3 text-muted">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;









// import React, { useState } from "react";
// import api from "../api";

// const ContactPage = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     subject: "",
//     message: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState("");
//   const [error, setError] = useState("");

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));

//     setSuccess("");
//     setError("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setLoading(true);
//     setSuccess("");
//     setError("");

//     try {
//       const response = await api.post(
//         "/contact/",
//         formData
//       );

//       setSuccess(
//         response.data.message ||
//           "Your message has been sent successfully. We will get back to you shortly."
//       );

//       setFormData({
//         name: "",
//         email: "",
//         subject: "",
//         message: "",
//       });
//     } catch (err) {
//       console.error(err);

//       setError(
//         err.response?.data?.message ||
//           "Unable to send your message at this time. Please try again later."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container py-5">

//       {/* Page Header */}
//       <div className="text-center mb-5">
//         <h1 className="display-5 fw-bold">
//           Contact Us
//         </h1>

//         <p className="lead text-muted">
//           We'd love to hear from you. Send us a message
//           and our team will respond as soon as possible.
//         </p>
//       </div>

//       <div className="row g-4">

//         {/* Contact Form */}
//         <div className="col-lg-7">
//           <div className="card shadow border-0">
//             <div className="card-body p-4">

//               <h3 className="mb-4">
//                 Send Us a Message
//               </h3>

//               {success && (
//                 <div className="alert alert-success">
//                   {success}
//                 </div>
//               )}

//               {error && (
//                 <div className="alert alert-danger">
//                   {error}
//                 </div>
//               )}

//               <form onSubmit={handleSubmit}>

//                 <div className="mb-3">
//                   <label className="form-label">
//                     Full Name
//                   </label>

//                   <input
//                     type="text"
//                     className="form-control"
//                     name="name"
//                     placeholder="Enter your full name"
//                     value={formData.name}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div className="mb-3">
//                   <label className="form-label">
//                     Email Address
//                   </label>

//                   <input
//                     type="email"
//                     className="form-control"
//                     name="email"
//                     placeholder="Enter your email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div className="mb-3">
//                   <label className="form-label">
//                     Subject
//                   </label>

//                   <input
//                     type="text"
//                     className="form-control"
//                     name="subject"
//                     placeholder="Subject"
//                     value={formData.subject}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <div className="mb-4">
//                   <label className="form-label">
//                     Message
//                   </label>

//                   <textarea
//                     className="form-control"
//                     rows="6"
//                     name="message"
//                     placeholder="Write your message here..."
//                     value={formData.message}
//                     onChange={handleChange}
//                     required
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   className="btn btn-primary px-4"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <>
//                       <span
//                         className="spinner-border spinner-border-sm me-2"
//                         role="status"
//                       ></span>
//                       Sending...
//                     </>
//                   ) : (
//                     "Send Message"
//                   )}
//                 </button>

//               </form>
//             </div>
//           </div>
//         </div>

//         {/* Contact Details */}
//         <div className="col-lg-5">

//           <div className="card shadow border-0 mb-4">
//             <div className="card-body">

//               <h4 className="mb-3">
//                 Contact Information
//               </h4>

//               <p>
//                 📍 <strong>Address:</strong><br />
//                 Lagos, Nigeria
//               </p>

//               <p>
//                 📞 <strong>Phone:</strong><br />
//                 +234 0803 518 5273
//               </p>

//               <p>
//                 ✉ <strong>Email:</strong><br />
//                 support@naijaopenmarket.com
//               </p>

//             </div>
//           </div>

//           <div className="card shadow border-0 mb-4">
//             <div className="card-body">

//               <h4 className="mb-3">
//                 Business Hours
//               </h4>

//               <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
//               <p>Saturday: 9:00 AM - 4:00 PM</p>
//               <p>Sunday: Closed</p>

//             </div>
//           </div>

//           <div className="card shadow border-0">
//             <div className="card-body">

//               <h4 className="mb-3">
//                 Follow Us
//               </h4>

//               <div className="d-flex gap-3 fs-4">
//                 <span>📘</span>
//                 <span>📸</span>
//                 <span>🐦</span>
//                 <span>💼</span>
//               </div>

//               <p className="mt-3 text-muted">
//                 Stay connected with us on social media
//                 for the latest products, promotions,
//                 and updates.
//               </p>

//             </div>
//           </div>

//         </div>

//       </div>

//       {/* FAQ Section */}
//       <div className="mt-5">
//         <h2 className="text-center mb-4">
//           Frequently Asked Questions
//         </h2>

//         <div className="accordion" id="contactFAQ">

//           <div className="accordion-item">
//             <h2 className="accordion-header">
//               <button
//                 className="accordion-button"
//                 type="button"
//                 data-bs-toggle="collapse"
//                 data-bs-target="#faq1"
//               >
//                 How long does it take to receive a response?
//               </button>
//             </h2>

//             <div
//               id="faq1"
//               className="accordion-collapse collapse show"
//             >
//               <div className="accordion-body">
//                 We typically respond to inquiries within
//                 24 hours during business days.
//               </div>
//             </div>
//           </div>

//           <div className="accordion-item">
//             <h2 className="accordion-header">
//               <button
//                 className="accordion-button collapsed"
//                 type="button"
//                 data-bs-toggle="collapse"
//                 data-bs-target="#faq2"
//               >
//                 Can I track my order?
//               </button>
//             </h2>

//             <div
//               id="faq2"
//               className="accordion-collapse collapse"
//             >
//               <div className="accordion-body">
//                 Yes. Once your order has been shipped,
//                 tracking information will be provided.
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>

//     </div>
//   );
// };

// export default ContactPage;









// import React, { useState } from "react";
// import api from "../api";

// const ContactPage = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     subject: "",
//     message: "",
//   });

//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     setLoading(true);

//     try {
//       const response = await api.post(
//         "/contact/",
//         formData
//       );

//       alert(
//         response.data.message ||
//           "Message sent successfully!"
//       );

//       setFormData({
//         name: "",
//         email: "",
//         subject: "",
//         message: "",
//       });
//     } catch (error) {
//       console.error(
//         "Contact Error:",
//         error.response?.data || error.message
//       );

//       alert(
//         error.response?.data?.message ||
//           "Failed to send message."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container py-5">
//       <h1 className="mb-4">Contact Us</h1>

//       <div className="row">
//         <div className="col-md-6">
//           <form onSubmit={handleSubmit}>
//             <input
//               type="text"
//               className="form-control mb-3"
//               placeholder="Your Name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="email"
//               className="form-control mb-3"
//               placeholder="Email Address"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />

//             <input
//               type="text"
//               className="form-control mb-3"
//               placeholder="Subject"
//               name="subject"
//               value={formData.subject}
//               onChange={handleChange}
//               required
//             />

//             <textarea
//               className="form-control mb-3"
//               rows="5"
//               placeholder="Message"
//               name="message"
//               value={formData.message}
//               onChange={handleChange}
//               required
//             />

//             <button
//               className="btn btn-dark"
//               type="submit"
//               disabled={loading}
//             >
//               {loading
//                 ? "Sending..."
//                 : "Send Message"}
//             </button>
//           </form>
//         </div>

//         <div className="col-md-6">
//           <div className="card shadow-sm">
//             <div className="card-body">
//               <h4>Contact Information</h4>

//               <p>📍 Lagos, Nigeria</p>
//               <p>📞 +234 xxx xxx xxxx</p>
//               <p>✉ support@shopit.com</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactPage;










// import React, { useState } from "react";

// const ContactPage = () => {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     subject: "",
//     message: "",
//   });

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

// import api from "../api";

// const handleSubmit = async (e) => {
//   e.preventDefault();

//   try {
//     const response = await api.post(
//       "/contact/",
//       formData
//     );

//     alert(response.data.message);

//     setFormData({
//       name: "",
//       email: "",
//       subject: "",
//       message: "",
//     });

//   } catch (error) {
//     console.error(error.response?.data);

//     alert("Failed to send message");
//   }
// };

//   // const handleSubmit = (e) => {
//   //   e.preventDefault();

//   //   console.log(formData);

//   //   alert("Message sent successfully!");
//   // };

//   return (
//     <div className="container py-5">

//       <h1 className="mb-4">Contact Us</h1>

//       <div className="row">

//         <div className="col-md-6">

//           <form onSubmit={handleSubmit}>

//             <input
//               type="text"
//               className="form-control mb-3"
//               placeholder="Your Name"
//               name="name"
//               onChange={handleChange}
//             />

//             <input
//               type="email"
//               className="form-control mb-3"
//               placeholder="Email Address"
//               name="email"
//               onChange={handleChange}
//             />

//             <input
//               type="text"
//               className="form-control mb-3"
//               placeholder="Subject"
//               name="subject"
//               onChange={handleChange}
//             />

//             <textarea
//               className="form-control mb-3"
//               rows="5"
//               placeholder="Message"
//               name="message"
//               onChange={handleChange}
//             />

//             <button
//               className="btn btn-dark"
//               type="submit"
//             >
//               Send Message
//             </button>

//           </form>

//         </div>

//         <div className="col-md-6">

//           <div className="card shadow-sm">
//             <div className="card-body">

//               <h4>Contact Information</h4>

//               <p>📍 Lagos, Nigeria</p>
//               <p>📞 +234 xxx xxx xxxx</p>
//               <p>✉ support@shopit.com</p>

//             </div>
//           </div>

//         </div>

//       </div>

//     </div>
//   );
// };

// export default ContactPage;