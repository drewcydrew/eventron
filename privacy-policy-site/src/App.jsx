import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", lineHeight: "1.6" }}>
      <h1 style={{ color: "#333", borderBottom: "2px solid #ddd", paddingBottom: "10px" }}>Eventron Privacy Policy</h1>
      
      <p style={{ fontSize: "12px", color: "#666", fontStyle: "italic", marginBottom: "20px" }}>
        Last Updated: June 9, 2025
      </p>

      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>Introduction</h2>
      <p style={{ marginBottom: "16px" }}>
        Thank you for using Eventron. This Privacy Policy explains how we handle your information when you use our application.
      </p>

      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>No Data Collection</h2>
      <p style={{ marginBottom: "16px" }}>
        Double Bill does not collect any personal information or usage data from you. All your interactions with the app remain private.
      </p>

      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>Third-Party Services</h2>
      <p style={{ marginBottom: "16px" }}>
        Our application uses The Movie Database (TMDb) API to provide film and actor information. When you search for content within our app, these queries are sent to TMDb's servers according to their API terms. Please refer to TMDb's privacy policy for information on how they handle this data.
      </p>

      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>Local Storage</h2>
      <p style={{ marginBottom: "16px" }}>
        Any search history or preferences are stored locally on your device to improve your experience. This data stays on your device and is not transmitted to our servers or any third parties (except for the actual search queries to TMDb as mentioned above).
      </p>


      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>Changes to This Privacy Policy</h2>
      <p style={{ marginBottom: "16px" }}>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
      </p>

      <h2 style={{ color: "#333", marginTop: "24px", marginBottom: "12px" }}>Contact Us</h2>
      <p style={{ marginBottom: "8px" }}>
        If you have any questions about this Privacy Policy, please contact us at:
      </p>
      <p style={{ textAlign: "center", color: "#007bff", fontSize: "16px", marginBottom: "24px" }}>
        andrewjovaras@gmail.com
      </p>
    </div>
  );
}

export default App;

