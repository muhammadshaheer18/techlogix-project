import * as ko from "knockout";
import appViewModel from "../appController";
const SLICE_KEY = "successPage";
//classCreation
class SuccessOnboardPage {
  accountTitle: ko.Observable<string>;
  username: ko.Observable<string>;
  accountNumber: ko.Observable<string>;
  isLoading: ko.Observable<boolean>;
  errorMessage: ko.Observable<string>;

  constructor() {
    this.accountTitle = ko.observable("");
    this.username = ko.observable("");
    this.accountNumber = ko.observable("");
    this.isLoading = ko.observable(true);
    this.errorMessage = ko.observable("");
    this.handlePageReload();
    this.checkForInvalidReload();

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
        appViewModel?.goToNextStep("sucessPage", "accountTypePage");
      }
    } catch (e) {
      console.error("Error during reload check:", e);
    }
  }

  fetchAccountSummary(cnicNo: string): void {
    const baseUrl = "http://localhost:8080/api/accounts"; // backend base path

    fetch(`${baseUrl}/${encodeURIComponent(cnicNo)}/summary`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to fetch account summary");
        }
        return response.json();
      })
      .then((data) => {
        const account = data.data;
        if (!account) throw new Error("No account data returned from API.");

        this.accountTitle(account.accountTitle);
        this.username(account.username);
        this.accountNumber(account.accountNumber);
      })
      .catch((err) => {
        console.error("Error fetching account summary:", err);
        this.errorMessage("Failed to load account details. Please try again later.");
      })
      .finally(() => this.isLoading(false));
  }
  //Page Specific Functions
  handleContinue = (): void => { 
        appViewModel.router.go({ path: "landingPage" });
  };

  //Page Connected & Disconnected
  connected(): void {
    document.title = "MBL | Onboarding Success";
    const cnicNo = localStorage.getItem("cnicNo");

    if (!cnicNo) {
      this.isLoading(false);
      this.errorMessage("CNIC not found in localStorage. Please restart the process.");
      return;
    }
    this.fetchAccountSummary(cnicNo);
  }

  disconnected = (): void => { }
}
export = SuccessOnboardPage;
