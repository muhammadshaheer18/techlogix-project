import * as ko from "knockout";
import appViewModel from "../appController";

interface Section {
  heading: string;
  paragraphs: string[];
}

interface TermsData {
  title: string;
  intro: string;
  sections: Section[];
}

class Terms {
  accepted: ko.Observable<boolean>;
  title = ko.observable<string>("");
  intro = ko.observable<string>("");
  sections = ko.observableArray<Section>([]);

  constructor() {
    this.accepted = ko.observable(false); // User must tick checkbox

    this.loadTerms();
  }

  // Fetch terms content from JSON
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
