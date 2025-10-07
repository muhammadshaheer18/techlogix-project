import * as AccUtils from "../accUtils";
import appViewModel from "../appController";
import * as ko from "knockout";

class VerificationPage {
  public username = ko.observable("");

  constructor() {}

  connected(): void {
    document.title = "MBL | Verification";
  }

  public usernameStatus = ko.computed(() => {
    const value = this.username();
    if (!value) return "idle";
    if (value.length >= 8 && value.length <= 16) return "valid";
    return "invalid";
  });

  // Save username to localStorage and go to login details page
  public goNext = (): void => {
    const usernameValue = this.username();

    if (this.usernameStatus() === "valid") {
      // ✅ Store in localStorage
      localStorage.setItem("username", usernameValue);
      console.log("Username saved:", usernameValue);

      // Navigate to next page
      if (appViewModel) {
        appViewModel.goToNextStep("verificationPage", "loginDetailsPage");
      }
    } else {
      alert("Please enter a valid username (8–16 characters).");
    }
  };

  public goBack = (): void => {
    if (appViewModel.router) {
      appViewModel.router.go({ path: "accountDetailsPage" });
    }
  };
}

export = VerificationPage;
