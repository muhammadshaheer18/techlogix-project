import * as ko from "knockout";
import appViewModel from "../appController";
const SLICE_KEY = "cnicPage";
//classCreation
class cnicPage {
  selectedAccountType = ko.observable<string>("Individual");
  cnicNumber = ko.observable<string>("");
  cnicError = ko.observable<string>("");
  isLoading = ko.observable<boolean>(false);

  accountTypes = ko.observableArray([
    "Individual",
    "Sole Proprietor",
    "Credit Card",
    "Smart Wallet",
    "Foreign National",
  ]);

  constructor() {
    this.handlePageReload();
    this.restoreFromSharedSession();

    //Persistance:
    this.cnicNumber.subscribe((val) => {
      this.formatCNIC(val);
      this.saveToSharedSession();

      // Live validation
      const clean = val.replace(/\D/g, "");
      if (clean.length > 0 && clean.length < 13) {
        this.cnicError("CNIC must be 13 digits long.");
      } else if (clean.length === 13 && !this.isCnicStructurallyValid()) {
        this.cnicError("Invalid CNIC format (e.g. 12345-1234567-1).");
      } else {
        this.cnicError("");
      }
    });


    this.selectedAccountType.subscribe(() => this.saveToSharedSession());

    window.addEventListener("beforeunload", () => {
      // Only clear pageReloaded flag, not entire session
      sessionStorage.removeItem("pageReloaded");
    });

  }
  //Session and Refresh Handling
  private handlePageReload() {
    try {
      const navigatedAway = sessionStorage.getItem("navigatedFromAccountType");
      if (navigatedAway === "true") {
        sessionStorage.removeItem("navigatedFromAccountType");
        return;
      }
      sessionStorage.clear();
      sessionStorage.setItem("pageReloaded", "true");
    } catch (e) {
      console.warn("Failed to handle session reload:", e);
    }
  }

  private saveToSharedSession() {
    try {
      const slice = {
        cnicNumber: this.cnicNumber(),
        selectedAccountType: this.selectedAccountType(),
      };
      appViewModel?.setOnboardingSlice(SLICE_KEY, slice);
    } catch (e) {
      console.warn("Failed to save onboarding slice", e);
    }
  }

  private restoreFromSharedSession() {
    try {
      const slice = appViewModel?.getOnboardingSlice(SLICE_KEY);
      if (slice) {
        if (slice.cnicNumber) this.cnicNumber(slice.cnicNumber);
        if (slice.selectedAccountType) this.selectedAccountType(slice.selectedAccountType);
      }
    } catch (e) {
      console.warn("Failed to restore onboarding slice", e);
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

  selectAccountType = (type: string) => {
    this.selectedAccountType(type);
  };
  //goBack & goNext Handlers
  goBack = () => {
    this.saveToSharedSession();
    appViewModel.router.go({ path: "landingPage" });
  };

  goNext = async () => {
    if (!this.validateCNIC()) return;

    this.isLoading(true);
    this.cnicError("");

    const requestBody = {
      cnicNo: this.cnicNumber().replace(/\D/g, ""),
      accountType: this.selectedAccountType(),
    };

    try {
      const response = await fetch("http://localhost:8080/api/accounts/cnic-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || "Account Initialization failed.";
        if (message.includes("already exists")) {
          this.cnicError("You already have an Active Account.");
        } else if (message.includes("No registered user")) {
          this.cnicError("Sorry, No Registered User Exists with this Identity.");
        } else if (message.includes("account status")) {
          this.cnicError("You already have an Active Account.");
        } else {
          this.cnicError(message);
        }
        return;
      }

      sessionStorage.setItem("cnicNo", requestBody.cnicNo);
      const accountId = data?.accountId || data?.id;
      if (accountId) {
        localStorage.setItem("accountId", String(accountId));
        if (appViewModel) appViewModel.currentAccountId(accountId);
      }

      sessionStorage.setItem("navigatedFromAccountType", "true");
      this.saveToSharedSession();
      appViewModel?.goToNextStep("cnicPage", "accountIbanPage");
    } catch (err) {
      console.error("API Error:", err);
      this.cnicError("Unexpected error occurred. Please try again.");
    } finally {
      this.isLoading(false);
    }
  };
  //Page Specific Functions
  private formatCNIC = (value: string) => {
    if (!value) return;
    let digits = value.replace(/\D/g, "");
    if (digits.length > 13) digits = digits.slice(0, 13);

    let formatted = digits;
    if (digits.length > 5) formatted = digits.slice(0, 5) + "-" + digits.slice(5);
    if (digits.length > 12)
      formatted = digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);

    if (formatted !== this.cnicNumber()) this.cnicNumber(formatted);
    if (this.cnicError()) this.cnicError("");
  };

  private isCnicStructurallyValid = (): boolean => {
    const clean = this.cnicNumber().replace(/\D/g, "");
    if (clean.length !== 13) return false;
    if (clean === "0000000000000") return false;
    if (/^(.)\1+$/.test(clean)) return false;
    return /^[0-9]{13}$/.test(clean);
  };

  validateCNIC = (): boolean => {
    const clean = this.cnicNumber().replace(/\D/g, "");
    if (!clean) {
      this.cnicError("CNIC number is required.");
      return false;
    }
    if (!this.isCnicStructurallyValid()) {
      this.cnicError("Invalid CNIC. Use format 12345-1234567-1.");
      return false;
    }
    this.cnicError("");
    return true;
  };

  isFormValid = ko.pureComputed(() => {
    const clean = this.cnicNumber().replace(/\D/g, "");
    return clean.length === 13 && !this.cnicError() && !this.isLoading();
  });

  onCnicFocus = () => {
    this.cnicError("");
  };

  //Page Connected & Disconnected
  connected = (): void => {
    document.title = "MBL | Cnic Verification";
  };

  disconnected = (): void => { };
}

export = cnicPage;
