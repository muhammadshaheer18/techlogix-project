import * as ko from "knockout";
import appViewModel from "../appController";
const SLICE_KEY = "termsPage";
//classCreation
interface Section {
  heading: string;
  paragraphs: string[];
}

interface TermsData {
  title: string;
  intro: string;
  sections: Section[];
}

class termsPage {
  accepted: ko.Observable<boolean>;
  title = ko.observable<string>("");
  intro = ko.observable<string>("");
  sections = ko.observableArray<Section>([]);

  constructor() {
    this.accepted = ko.observable(false);
    this.handlePageReload();
    this.checkForInvalidReload();
    this.loadTerms();


    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }
  //Session and Refresh Handling
  private handlePageReload() {
    try {
      const reloaded = sessionStorage.getItem("pageReloaded");
      if (!reloaded) {
        sessionStorage.clear();
        sessionStorage.setItem("pageReloaded", "true");
      }
    } catch (e) {
      console.warn("Failed to handle session reload:", e);
    }
  }

  private clearLocalSlice() {
    try {
      const full = appViewModel?.getOnboardingData();
      if (full && full[SLICE_KEY]) {
        delete full[SLICE_KEY];
        appViewModel?.setOnboardingData(full);
      }
    } catch { }
  }

  private checkForInvalidReload() {
    try {
      const navigatedFromAccountType = sessionStorage.getItem("navigatedFromAccountType");
      if (navigatedFromAccountType !== "true") {
        console.warn("Invalid access/hard reload detected on Account Details page. Redirecting to Account Type page.");
        this.clearLocalSlice();
        appViewModel?.goToNextStep("termsPage", "cnicPage");
      }
    } catch (e) {
      console.error("Error during reload check:", e);
    }
  }
  //goBack & goNext Handlers
  goBack = (): void => {
    if (appViewModel.router) {
      appViewModel.router.go({ path: "passwordPage" });
    }
  };

  goNext = (): void => {
    if (this.accepted()) {
      if (appViewModel.router) {
        appViewModel.router.go({ path: "summaryPage" });
      }
    } else {
      console.log("Terms not Accepted");
    }
  };
  //Page Specific Functions
  private loadTerms(): void {
    fetch("ts/views/termsData.json")
      .then(res => res.json())
      .then((data: TermsData) => {
        this.title(data.title);
        this.intro(data.intro);
        this.sections(data.sections);
      })
      .catch(err => {
        console.error("Failed to load terms:", err);
      });
  }
  //Page Connected & Disconnected
  connected = (): void => {
    document.title = "MBL | Terms & Conditions";
  };

  disconnected = (): void => { }
}
export = termsPage;
