import * as AccUtils from "../accUtils";
import appViewModel from "../appController";
import * as ko from "knockout";
class VerificationPage {
  public username = ko.observable("");

  constructor() {}

  connected(): void {
    document.title = "MBL | Login Details";
  }

  public usernameStatus = ko.computed(() => {
    const value = this.username();
    if (!value) return "idle";
    if (value.length >= 8 && value.length <= 16) return "valid";
    return "invalid";
  });

  public goNext = (): void => {
    if (appViewModel) {
      appViewModel.goToNextStep("verificationPage", "loginDetailsPage");
    }
  };

  public goBack = (): void => {
    if (appViewModel.router) {
      appViewModel.router.go({ path: "accountDetailsPage" });
    }
  };
}

export = VerificationPage;
