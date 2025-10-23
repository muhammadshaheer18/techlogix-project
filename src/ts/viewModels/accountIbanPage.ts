import * as ko from "knockout";
import appViewModel from "../appController";
const SLICE_KEY = "accountIbanPage";
//classCreation
class accountIbanPage {
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
    this.handlePageReload();
    this.restoreFromSharedSession();
    this.checkForInvalidReload();

    this.isAccountNumberValid = ko.computed(() => {
      const clean = this.accountNumber().replace(/\s+/g, "");
      return /^\d{14}$/.test(clean);
    });

    this.isIbanValid = ko.computed(() => {
      const iban = this.ibanNumber().replace(/\s+/g, "").toUpperCase();
      return (
        iban.length >= 15 &&
        iban.length <= 34 &&
        /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)
      );
    });

    this.canProceed = ko.computed(() => {
      const valid =
        this.activeTab() === "account"
          ? this.isAccountNumberValid()
          : this.isIbanValid();
      return valid && !this.isLoading();
    });

    this.accountNumber.subscribe((val) => {
      // existing formatting
      if (!val) return;
      let clean = val.replace(/\D/g, "").substring(0, 14);
      if (clean.length > 5) clean = clean.slice(0, 5) + " " + clean.slice(5);
      if (clean !== val) this.accountNumber(clean);
      this.saveToSharedSession();

      // live validation
      if (!this.isAccountNumberValid() && val.length > 0) {
        this.showError("Account number must be 14 digits long");
      }
    });


    this.ibanNumber.subscribe((val) => {
      if (!val) return;
      let clean = val.replace(/[^A-Z0-9]/gi, "").toUpperCase().substring(0, 34);
      clean = clean.replace(/(.{4})/g, "$1 ").trim();
      if (clean !== val) this.ibanNumber(clean);
      this.saveToSharedSession();

      if (!this.isIbanValid() && val.length > 0) {
        this.showError("Invalid IBAN format");
      }
    });


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

  private checkForInvalidReload() {
    try {
      const navigatedFromAccountType = sessionStorage.getItem("navigatedFromAccountType");
      if (navigatedFromAccountType !== "true") {
        console.warn("Invalid access/hard reload detected on Account Details page. Redirecting to Account Type page.");
        this.clearLocalSlice();
        appViewModel?.goToNextStep("accountIbanPage", "cnicPage");
      }
    } catch (e) {
      console.error("Error during reload check:", e);
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
  //goBack & goNext Handlers
  public goBack = (): void => {
    this.saveToSharedSession();
    if (appViewModel)
      appViewModel.goToNextStep("accountIbanPage", "cnicPage");
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
      const cnicNo =
        sessionStorage.getItem("cnicNo") || localStorage.getItem("cnicNo");
      if (!cnicNo) {
        this.showError("CNIC not found. Please restart the process.");
        return;
      }
      const requestBody =
        this.activeTab() === "account"
          ? {
            cnicNo,
            accountNumber: this.accountNumber().replace(/\s+/g, ""),
          }
          : {
            cnicNo,
            iban: this.ibanNumber().replace(/\s+/g, "").toUpperCase(),
          };
      const response = await fetch(
        `http://localhost:8080/api/accounts/${cnicNo}/account-iban-check`,
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
        } catch { }
        throw new Error(errMsg || "Account validation failed.");
      }
      localStorage.setItem("cnicNo", cnicNo);
      this.saveToSharedSession();
      if (appViewModel?.router)
        appViewModel.goToNextStep("accountIbanPage", "usernamePage");

    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "";
      this.showError(msg);
    } finally {
      this.isLoading(false);
    }
  };

  //Page Specific Functions
  public switchTab = (tabName: string): void => {
    this.activeTab(tabName);
    this.hasError(false);
    this.errorMessage("");
    this.saveToSharedSession();
  };

  private showError(message: string): void {
    this.errorMessage(message);
    this.hasError(true);
    setTimeout(() => this.hasError(false), 5000);
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
  //Page Connected & Disconnected
  public connected = (): void => {
    document.title = "MBL | Account Details Verification";
  };

  public disconnected = (): void => {

  }
}
export = accountIbanPage;
