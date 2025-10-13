import * as ko from "knockout";

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

    // ✅ Fetch CNIC from localStorage (set during previous flow)
    const cnicNo = localStorage.getItem("cnicNo");

    if (!cnicNo) {
      this.isLoading(false);
      this.errorMessage("CNIC not found in localStorage. Please restart the process.");
      return;
    }

    // ✅ Fetch data from backend using CNIC
    this.fetchAccountSummary(cnicNo);
  }

  fetchAccountSummary(cnicNo: string): void {
    const baseUrl = "http://localhost:8080/api/accounts"; // backend base path

    fetch(`${baseUrl}/summary/${encodeURIComponent(cnicNo)}`, {
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
        // ✅ unwrap ApiResponse
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


  handleContinue = (): void => {
    // Optionally navigate to login or dashboard
  };
}

export = SuccessOnboardPage;
