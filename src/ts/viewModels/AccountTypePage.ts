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

  // ----- UI actions -----
  selectAccountType = (type: string) => {
    this.selectedAccountType(type);
  };

  goBack = () => {
    if (appViewModel?.router) {
      appViewModel.router.go({ path: "accountTypePage" });
    } else {
      window.history.back();
    }
  };

  goNext = async () => {
    if (!this.validateCNIC()) return;

    this.isLoading(true);
    this.cnicError(""); // clear previous error

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

      // If backend returned an error (like CNIC not found)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to initialize account.");
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      const accountId = data.accountId || data.id;
      // if (!accountId) {
      //   throw new Error("Account ID missing from response.");
      // }

      // Save ID for next screen
      localStorage.setItem("accountId", String(accountId));
      if (appViewModel) {
        appViewModel.currentAccountId = accountId;
      }

      // Navigate only on successful API response
      if (appViewModel?.router) {
        appViewModel.goToNextStep("accountTypePage", "accountDetailsPage");
      } else {
        alert(`✅ Account initialized!\nAccount ID: ${accountId}`);
      }
    } catch (err: unknown) {
      console.error("❌ Error calling /init API:", err);

      if (err instanceof Error) {
        this.cnicError(err.message);
        // Optionally show alert for major errors
        // alert(err.message);
      } else {
        this.cnicError("Unexpected error occurred.");
      }
    } finally {
      this.isLoading(false);
    }
  };

  // ----- Formatting & Validation -----
  private formatCNIC = (value: string) => {
    if (!value) return;

    let digits = value.replace(/\D/g, "");
    if (digits.length > 13) digits = digits.slice(0, 13);

    let formatted = digits;
    if (digits.length > 5) {
      formatted = digits.slice(0, 5) + "-" + digits.slice(5);
    }
    if (digits.length > 12) {
      formatted =
        digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
    }

    if (formatted !== this.cnicNumber()) {
      this.cnicNumber(formatted);
    }

    if (this.cnicError()) {
      this.cnicError("");
    }
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
      this.cnicError("CNIC number is required");
      return false;
    }

    if (!this.isCnicStructurallyValid()) {
      this.cnicError("Invalid CNIC. Use format 12345-1234567-1 (13 digits).");
      return false;
    }

    this.cnicError("");
    return true;
  };

  // Computed observable for form validation
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
