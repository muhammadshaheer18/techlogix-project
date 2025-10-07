import * as ko from "knockout";
import * as AccUtils from "../accUtils";

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
  }

  connected(): void {
    document.title = "MBL | Onboarding Success";

    // Fetch accountId from localStorage (set during previous flow)
    const accountId = localStorage.getItem("accountId");

    if (!accountId) {
      this.isLoading(false);
      this.errorMessage("Account ID not found in localStorage.");
      return;
    }

    // ✅ Fetch data from backend
    this.fetchAccountSummary(accountId);
  }

  fetchAccountSummary(accountId: string): void {
    const baseUrl = "http://localhost:8080/api/accounts"; // Update to match your backend base path

    fetch(`${baseUrl}/${accountId}/summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to fetch account summary");
        }
        return response.json();
      })
      .then((data) => {
        // API returns AccountSummaryResponse(accountTitle, username, accountNumber)
        this.accountTitle(data.accountTitle);
        this.username(data.username);
        this.accountNumber(data.accountNumber);
      })
      .catch((err) => {
        console.error("Error fetching account summary:", err);
        this.errorMessage("Failed to load account details. Please try again later.");
      })
      .finally(() => {
        this.isLoading(false);
      });
  }

  handleContinue = (): void => {
  };
}

export = SuccessOnboardPage;
