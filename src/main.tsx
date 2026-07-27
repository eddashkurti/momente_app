import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "./styles/index.css";
import App from "./App";

const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;

if (publicAppUrl && import.meta.env.PROD) {
  const canonicalUrl = new URL(publicAppUrl);
  if (window.location.origin !== canonicalUrl.origin) {
    canonicalUrl.pathname = window.location.pathname;
    canonicalUrl.search = window.location.search;
    canonicalUrl.hash = window.location.hash;
    window.location.replace(canonicalUrl);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
