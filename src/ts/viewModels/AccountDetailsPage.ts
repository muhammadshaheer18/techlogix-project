// account-details.ts
import * as ko from "knockout";
import Context = require("ojs/ojcontext");
import ModuleElementUtils = require("ojs/ojmodule-element-utils");
import appViewModel from "../appController";

class AccountDetailsPage {
  // Observable properties
  public accountNumber: ko.Observable<string>;
  public ibanNumber: ko.Observable<string>;
  public activeTab: ko.Observable<string>;
  public isLoading: ko.Observable<boolean>;
  public hasError: ko.Observable<boolean>;
  public errorMessage: ko.Observable<string>;

  // Computed observables
  public isAccountNumberValid: ko.Computed<boolean>;
  public isIbanValid: ko.Computed<boolean>;
  public canProceed: ko.Computed<boolean>;

  constructor() {
    // Initialize observables
    this.accountNumber = ko.observable("");
    this.ibanNumber = ko.observable("");
    this.activeTab = ko.observable("accountDetailsPage");
    this.isLoading = ko.observable(false);
    this.hasError = ko.observable(false);
    this.errorMessage = ko.observable("");

    // Initialize computed observables
    this.isAccountNumberValid = ko.computed(() => {
      const account = this.accountNumber();
      // Remove spaces and check if it's 14 digits
      const cleanAccount = account.replace(/\s+/g, "");
      return /^\d{14}$/.test(cleanAccount);
    });

    this.isIbanValid = ko.computed(() => {
      const iban = this.ibanNumber();
      if (!iban) return false;

      // Remove spaces and convert to uppercase
      const cleanIban = iban.replace(/\s+/g, "").toUpperCase();

      // Basic IBAN format validation (15-34 characters, starts with 2 letters followed by 2 digits)
      const ibanRegex =
        /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
      return (
        ibanRegex.test(cleanIban) &&
        cleanIban.length >= 15 &&
        cleanIban.length <= 34
      );
    });

    this.canProceed = ko.computed(() => {
      const isValid =
        this.activeTab() === "account"
          ? this.isAccountNumberValid()
          : this.isIbanValid();
      return isValid && !this.isLoading();
    });

    // Format account number with spaces as user types
    this.accountNumber.subscribe((newValue: string) => {
      if (newValue) {
        // Remove all spaces first
        let cleanValue = newValue.replace(/\s+/g, "");
        // Only keep digits
        cleanValue = cleanValue.replace(/\D/g, "");
        // Limit to 14 digits
        if (cleanValue.length > 14) {
          cleanValue = cleanValue.substring(0, 14);
        }
        // Add spaces every 5 digits (XXXXX XXXXXXXXX format)
        if (cleanValue.length > 5) {
          cleanValue =
            cleanValue.substring(0, 5) + " " + cleanValue.substring(5);
        }
        // Update observable only if the formatted value is different
        if (cleanValue !== newValue) {
          this.accountNumber(cleanValue);
        }
      }
    });
    // Format IBAN with spaces as user types
    this.ibanNumber.subscribe((newValue: string) => {
      if (newValue) {
        // Remove all spaces and convert to uppercase
        let cleanValue = newValue.replace(/\s+/g, "").toUpperCase();
        // Only keep alphanumeric characters
        cleanValue = cleanValue.replace(/[^A-Z0-9]/g, "");
        // Limit to 34 characters (max IBAN length)
        if (cleanValue.length > 34) {
          cleanValue = cleanValue.substring(0, 34);
        }
        // Add spaces every 4 characters for better readability
        const formatted = cleanValue.replace(/(.{4})/g, "$1 ").trim();
        // Update observable only if the formatted value is different
        if (formatted !== newValue) {
          this.ibanNumber(formatted);
        }
      }
    });
  }

  public switchTab = (tabName: string): void => {
    this.activeTab(tabName);
    this.hasError(false);
    this.errorMessage("");
  };

  public goBack = (): void => {
    console.log("Going back to previous step");
    if (appViewModel) {
      appViewModel.goToNextStep("accountDetailsPage", "accountTypePage");
    }
  };

  public goNext = (): void => {
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

    setTimeout(() => {
      try {
        if (this.activeTab() === "account") {
          const cleanAcc = this.accountNumber().replace(/\s+/g, "");
          if (!this.validateAccountNumber(cleanAcc)) {
            this.showError(
              "Invalid account number. Please check and try again."
            );
            return;
          }
        } else {
          const cleanIban = this.ibanNumber().replace(/\s+/g, "").toUpperCase();
          if (!this.validateIban(cleanIban)) {
            this.showError("Invalid IBAN. Please check and try again.");
            return;
          }
        }

        // Navigate only if validation passes
        if (appViewModel.router) {
          appViewModel.router.go({ path: "verificationPage" });
        }
      } catch (err) {
        console.error(err);
        this.showError("An unexpected error occurred. Please try again.");
      } finally {
        this.isLoading(false);
      }
    }, 500); // simulate async call
  };

  /**
   * Validate IBAN using MOD-97 algorithm
   */
  private validateIban(iban: string): boolean {
    // Basic format validation
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
      return false;
    }

    // Length validation by country (simplified)
    const countryLengths: { [key: string]: number } = {
      AD: 24,
      AE: 23,
      AL: 28,
      AT: 20,
      AZ: 28,
      BA: 20,
      BE: 16,
      BG: 22,
      BH: 22,
      BR: 29,
      BY: 28,
      CH: 21,
      CR: 22,
      CY: 28,
      CZ: 24,
      DE: 22,
      DK: 18,
      DO: 28,
      EE: 20,
      EG: 29,
      ES: 24,
      FI: 18,
      FO: 18,
      FR: 27,
      GB: 22,
      GE: 22,
      GI: 23,
      GL: 18,
      GR: 27,
      GT: 28,
      HR: 21,
      HU: 28,
      IE: 22,
      IL: 23,
      IS: 26,
      IT: 27,
      JO: 30,
      KW: 30,
      KZ: 20,
      LB: 28,
      LC: 32,
      LI: 21,
      LT: 20,
      LU: 20,
      LV: 21,
      MC: 27,
      MD: 24,
      ME: 22,
      MK: 19,
      MR: 27,
      MT: 31,
      MU: 30,
      NL: 18,
      NO: 15,
      PK: 24,
      PL: 28,
      PS: 29,
      PT: 25,
      QA: 29,
      RO: 24,
      RS: 22,
      SA: 24,
      SE: 24,
      SI: 19,
      SK: 24,
      SM: 27,
      TN: 24,
      TR: 26,
      UA: 29,
      VG: 24,
      XK: 20,
    };

    const countryCode = iban.substring(0, 2);
    const expectedLength = countryLengths[countryCode];

    if (!expectedLength || iban.length !== expectedLength) {
      return false;
    }

    // MOD-97 validation
    const rearranged = iban.substring(4) + iban.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (char) =>
      (char.charCodeAt(0) - 55).toString()
    );

    // Calculate mod 97 for large numbers
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }

    return remainder === 1;
  }

  private validateAccountNumber(accountNumber: string): boolean {
    // Basic validation - 14 digits
    if (!/^\d{14}$/.test(accountNumber)) {
      return false;
    }
    return true;
  }

  private showError(message: string): void {
    this.errorMessage(message);
    this.hasError(true);

    // Auto-hide error after 5 seconds
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
