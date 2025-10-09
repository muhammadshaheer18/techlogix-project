import * as ko from "knockout";
import appViewModel from "../appController";

class AccountTypePage {
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
    this.cnicNumber.subscribe((val) => this.formatCNIC(val));
  }

  selectAccountType = (type: string) => {
    this.selectedAccountType(type);
  };

  goBack = () => {
    if (!this.isLoading()) window.location.href = "WelcomePage.html";
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
      const response = await fetch("http://localhost:8080/api/accounts/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || "Account initialization failed.";
        if (message.includes("already exists")) {
          this.cnicError("A digital account with this CNIC already exists.");
        } else if (message.includes("No registered user")) {
          this.cnicError("No registered user found with this CNIC.");
        } else if (message.includes("account status")) {
          this.cnicError("This CNIC already has an active account.");
        } else {
          this.cnicError(message);
        }
        return;
      }

      const accountId = data?.accountId || data?.id;
      if (accountId) {
        localStorage.setItem("accountId", String(accountId));
        if (appViewModel) appViewModel.currentAccountId = accountId;
      }

      if (appViewModel?.router) {
        appViewModel.goToNextStep("accountTypePage", "accountDetailsPage");
      } else {
        alert(`Account initialized successfully.\nAccount ID: ${accountId || "N/A"}`);
        window.location.href = "AccountDetailsPage.html";
      }
    } catch (err) {
      console.error("API Error:", err);
      this.cnicError("Unexpected error occurred. Please try again.");
    } finally {
      this.isLoading(false);
    }
  };

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

  connected = (): void => {
    document.title = "MBL | Account Type";
  };

  disconnected = (): void => {};
}

export = AccountTypePage;
