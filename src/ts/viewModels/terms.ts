import * as ko from "knockout";
import appViewModel from "../appController";

class Terms {
  accepted: ko.Observable<boolean>;

  constructor() {
    this.accepted = ko.observable(true);
  }

  handleBack = (): void => {
    // Use the router consistently - replace the old router reference
    if (appViewModel.router) {
      appViewModel.router.go({ path: "LoginDetailsPage" });
    }
  };

  handleAccept = (): void => {
    if (this.accepted()) {
      if (appViewModel.router) {
        appViewModel.router.go({ path: "successPage" });
      }
    } else {
      alert("Please accept the terms and conditions to continue.");
    }
  };
}

export = Terms;
