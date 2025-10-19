import * as ko from "knockout";
import appViewModel from "../appController";

class LandingPage {
  constructor() {
    document.title = "Meezan Bank | Welcome";
    this.applyLandingStyles();
  }

  // ✅ Load Landing Page–specific CSS dynamically
  applyLandingStyles() {
    if (!document.getElementById("landing-style")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "css/landing-page.css"; // Make sure this file exists
      link.id = "landing-style";
      document.head.appendChild(link);
    }
  }

  // ✅ Remove the styles when navigating away
  disconnected() {
    const link = document.getElementById("landing-style");
    if (link) link.remove();
  }

  start = () => {
    appViewModel.router.go({ path: "accountTypePage" });
  };
}

export = LandingPage;
