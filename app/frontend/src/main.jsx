import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";

// !nternal imports
import "./i18n.js"; // init i18next before app mounts
import AppRouter from "./app";
import "./index.css";

const Router =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? HashRouter
    : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router>
      <AppRouter />
    </Router>
  </StrictMode>,
);
