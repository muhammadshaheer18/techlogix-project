import * as ko from "knockout";
import appViewModel from "../appController";

class Terms {
  accepted: ko.Observable<boolean>;

  constructor() {
    this.accepted = ko.observable(true);
  }

  handleBack = (): void => {
    if (appViewModel.router) {
      appViewModel.router.go({ path: "loginDetailsPage" });
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

  connected = (): void => {
    document.title = "MBL | Terms";
  };
}

export = Terms;
