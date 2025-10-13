import * as ko from "knockout";
import appViewModel from "../appController";

const SLICE_KEY = "accountDetailsPage";

class AccountDetailsPage {
  public accountNumber: ko.Observable<string>;
  public ibanNumber: ko.Observable<string>;
  public activeTab: ko.Observable<string>;
  public isLoading: ko.Observable<boolean>;
  public hasError: ko.Observable<boolean>;
  public errorMessage: ko.Observable<string>;

  public isAccountNumberValid: ko.Computed<boolean>;
  public isIbanValid: ko.Computed<boolean>;
  public canProceed: ko.Computed<boolean>;

  constructor() {
    this.accountNumber = ko.observable("");
    this.ibanNumber = ko.observable("");
    this.activeTab = ko.observable("account");
    this.isLoading = ko.observable(false);
    this.hasError = ko.observable(false);
    this.errorMessage = ko.observable("");

    this.handlePageReload(); // ✅ Clear all data only when page is reloaded
    this.restoreFromSharedSession();

    // Computed observables
    this.isAccountNumberValid = ko.computed(() => {
      const clean = this.accountNumber().replace(/\s+/g, "");
      return /^\d{14}$/.test(clean);
    });

    this.isIbanValid = ko.computed(() => {
      const iban = this.ibanNumber().replace(/\s+/g, "").toUpperCase();
      return iban.length >= 15 && iban.length <= 34 && /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban);
    });

    this.canProceed = ko.computed(() => {
      const valid =
        this.activeTab() === "account"
          ? this.isAccountNumberValid()
          : this.isIbanValid();
      return valid && !this.isLoading();
    });

    // Format account number (XXXXX XXXXXXXXX)
    this.accountNumber.subscribe((val) => {
      if (!val) return;
      let clean = val.replace(/\D/g, "").substring(0, 14);
      if (clean.length > 5) clean = clean.slice(0, 5) + " " + clean.slice(5);
      if (clean !== val) this.accountNumber(clean);
      this.saveToSharedSession();
    });

    // Format IBAN with spaces every 4 characters
    this.ibanNumber.subscribe((val) => {
      if (!val) return;
      let clean = val.replace(/[^A-Z0-9]/gi, "").toUpperCase().substring(0, 34);
      clean = clean.replace(/(.{4})/g, "$1 ").trim();
      if (clean !== val) this.ibanNumber(clean);
      this.saveToSharedSession();
    });

    // ✅ Ensure session clears when the user reloads or closes the browser
    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }

  // -------------------------------
  // ✅ Clears all session data only on actual reload
  // -------------------------------
  private handlePageReload() {
    try {
      const reloaded = sessionStorage.getItem("pageReloaded");
      if (!reloaded) {
        sessionStorage.clear(); // clear on first page load
        sessionStorage.setItem("pageReloaded", "true");
      }
    } catch (e) {
      console.warn("Failed to handle session reload:", e);
    }
  }

  // -------------------------------
  // Shared session helpers
  // -------------------------------
  private saveToSharedSession() {
    try {
      const slice = {
        accountNumber: this.accountNumber(),
        ibanNumber: this.ibanNumber(),
        activeTab: this.activeTab(),
      };
      appViewModel?.setOnboardingSlice(SLICE_KEY, slice);
    } catch (e) {
      console.warn("Failed to save account details slice", e);
    }
  }

  private restoreFromSharedSession() {
    try {
      const slice = appViewModel?.getOnboardingSlice(SLICE_KEY);
      if (slice) {
        if (slice.accountNumber) this.accountNumber(slice.accountNumber);
        if (slice.ibanNumber) this.ibanNumber(slice.ibanNumber);
        if (slice.activeTab) this.activeTab(slice.activeTab);
      }
    } catch (e) {
      console.warn("Failed to restore account details slice", e);
    }
  }

  private clearLocalSlice() {
    try {
      const full = appViewModel?.getOnboardingData();
      if (full && full[SLICE_KEY]) {
        delete full[SLICE_KEY];
        appViewModel?.setOnboardingData(full);
      }
    } catch {}
  }

  // -------------------------------
  // Navigation
  // -------------------------------
  public switchTab = (tabName: string): void => {
    this.activeTab(tabName);
    this.hasError(false);
    this.errorMessage("");
    this.saveToSharedSession(); // ✅ persist active tab
  };

  public goBack = (): void => {
    this.saveToSharedSession(); // ✅ preserve data before going back
    if (appViewModel) appViewModel.goToNextStep("accountDetailsPage", "accountTypePage");
  };

  public goNext = async (): Promise<void> => {
    this.hasError(false);
    this.errorMessage("");

    if (!this.canProceed()) {
      const msg =
        this.activeTab() === "account"
          ? "Please enter a valid 14-digit account number"
          : "Please enter a valid IBAN";
      this.showError(msg);
      return;
    }

    this.isLoading(true);

    try {
      const accountId = localStorage.getItem("accountId");
      if (!accountId) {
        this.showError("Account ID not found. Please restart the process.");
        return;
      }

      const requestBody =
        this.activeTab() === "account"
          ? { accountNumber: this.accountNumber().replace(/\s+/g, "") }
          : { iban: this.ibanNumber().replace(/\s+/g, "").toUpperCase() };

      const response = await fetch(
        `http://localhost:8080/api/accounts/${accountId}/details`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        let errMsg = await response.text();
        try {
          const data = JSON.parse(errMsg);
          errMsg = data.message || errMsg;
        } catch {}
        throw new Error(errMsg || "Validation failed");
      }

      this.saveToSharedSession(); // ✅ keep data before moving forward

      // Navigate to verification page
      if (appViewModel?.router)
        appViewModel.goToNextStep("accountDetailsPage", "verificationPage");

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error occurred";
      this.showError(msg);
    } finally {
      this.isLoading(false);
    }
  };

  // -------------------------------
  // Helper methods
  // -------------------------------
  private showError(message: string): void {
    this.errorMessage(message);
    this.hasError(true);

    setTimeout(() => {
      this.hasError(false);
    }, 5000);
  }

  public clearForm = (): void => {
    this.accountNumber("");
    this.ibanNumber("");
    this.hasError(false);
    this.errorMessage("");
  };

  public onInputFocus = (): void => {
    this.hasError(false);
  };

  public connected = (): void => {
    document.title = "MBL | Account Details";
  };
}

export = AccountDetailsPage;
