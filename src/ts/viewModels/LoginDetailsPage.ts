import * as ko from "knockout";
import "ojs/ojknockout";
import { ojButton } from "ojs/ojbutton";
import * as Router from "ojs/ojrouter";
import appViewModel from "../appController";
const SLICE_KEY = "loginDetailsPage";

interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
}

class LoginDetailsPage {
  password: ko.Observable<string>;
  confirmPassword: ko.Observable<string>;
  showPassword: ko.Observable<boolean>;
  showConfirmPassword: ko.Observable<boolean>;
  // Changed to Computed to manage validation logic
  isPasswordValid: ko.Computed<boolean>;
  isConfirmPasswordValid: ko.Observable<boolean>;
  passwordStrength: ko.Observable<string>;
  confirmPasswordStatus: ko.Observable<string>;
  confirmPasswordStatusClass: ko.Observable<string>;
  requirements: ko.Observable<PasswordRequirements>;
  isNextButtonEnabled: ko.Computed<boolean>;

  apiLoading: ko.Observable<boolean>;
  apiError: ko.Observable<string | null>;

  constructor() {
    this.password = ko.observable("").extend({ rateLimit: 200 });
    this.confirmPassword = ko.observable("");
    this.showPassword = ko.observable(false);
    this.showConfirmPassword = ko.observable(false);

    this.isConfirmPasswordValid = ko.observable(false);
    this.passwordStrength = ko.observable("Weak");
    this.confirmPasswordStatus = ko.observable("");
    this.confirmPasswordStatusClass = ko.observable("");
    this.requirements = ko.observable<PasswordRequirements>({
      minLength: false,
      hasUpper: false,
      hasSpecial: false,
    });

    this.handlePageReload();
    this.checkForInvalidReload();

    this.apiLoading = ko.observable(false);
    this.apiError = ko.observable(null);

    this.isPasswordValid = ko.pureComputed(() => {
      const password = this.password();
      const requirements: PasswordRequirements = {
        minLength: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      };

      this.requirements(requirements);

      const validCount = Object.values(requirements).filter((req) => req).length;
      if (validCount === 3) {
        this.passwordStrength("Strong");
        return true;
      } else if (validCount === 2) {
        this.passwordStrength("Medium");
        return false;
      } else {
        this.passwordStrength("Weak");
        return false;
      }
    });

    this.isNextButtonEnabled = ko.computed(() => {
      return this.isPasswordValid() && this.isConfirmPasswordValid();
    });

    this.password.subscribe(() => {
      this.validateConfirmPassword();
    });

    this.confirmPassword.subscribe(() => {
      this.validateConfirmPassword();
    });

    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }

  getBarColor = (index: number): string => {
    const strength = this.passwordStrength();
    if (strength === "Strong") {
      return index <= 4 ? "#00c855" : "#e0e0e0";
    } else if (strength === "Medium") {
      return index <= 2 ? "#ffb400" : "#e0e0e0";
    } else if (strength === "Weak") {
      return index === 1 ? "#e53e3e" : "#e0e0e0";
    } else {
      return "#e0e0e0";
    }
  };

  validateConfirmPassword = (): void => {
    const password = this.password();
    const confirmPassword = this.confirmPassword();
    // Read the computed to establish dependency and ensure correct state check
    const isMainPasswordValid = this.isPasswordValid();

    if (confirmPassword === "") {
      this.confirmPasswordStatus("");
      this.confirmPasswordStatusClass("");
      this.isConfirmPasswordValid(false);
      return;
    }

    if (password === confirmPassword && isMainPasswordValid) {
      this.confirmPasswordStatus("Passwords Match!");
      this.confirmPasswordStatusClass("success");
      this.isConfirmPasswordValid(true);
    } else if (password !== confirmPassword) {
      this.confirmPasswordStatus("Passwords do not match");
      this.confirmPasswordStatusClass("error");
      this.isConfirmPasswordValid(false);
    } else {
      this.confirmPasswordStatus(
        "Please ensure password meets all requirements"
      );
      this.confirmPasswordStatusClass("error");
      this.isConfirmPasswordValid(false);
    }
  };

  togglePasswordVisibility = (): void => {
    this.showPassword(!this.showPassword());
  };

  toggleConfirmPasswordVisibility = (): void => {
    this.showConfirmPassword(!this.showConfirmPassword());
  };

  getPasswordInputType = (): string => {
    return this.showPassword() ? "text" : "password";
  };

  getConfirmPasswordInputType = (): string => {
    return this.showConfirmPassword() ? "text" : "password";
  };

  getPasswordToggleText = (): string => {
    return this.showPassword() ? "HIDE" : "SHOW";
  };

  getConfirmPasswordToggleText = (): string => {
    return this.showConfirmPassword() ? "HIDE" : "SHOW";
  };

  getPasswordInputClass = (): string => {
    if (this.password() === "") return "form-input";
    return this.isPasswordValid() ? "form-input valid" : "form-input invalid";
  };

  getConfirmPasswordInputClass = (): string => {
    if (this.confirmPassword() === "") return "form-input";
    return this.isConfirmPasswordValid()
      ? "form-input valid"
      : "form-input invalid";
  };

  getRequirementClass = (requirement: keyof PasswordRequirements): string => {
    const reqs = this.requirements();
    return reqs[requirement]
      ? "requirement-item valid"
      : "requirement-item invalid";
  };
  private checkForInvalidReload() {
    try {
      const navigatedFromAccountType = sessionStorage.getItem("navigatedFromAccountType");
      if (navigatedFromAccountType !== "true") {
        console.warn("Invalid access/hard reload detected on Login Details page. Redirecting to Account Type page.");
        this.clearLocalSlice();
        appViewModel?.goToNextStep("loginDetailsPage", "accountTypePage");
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

  // Clear session only once on actual reload
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


  goBack = (): void => {
    if (appViewModel?.router) {
      appViewModel.router.go({ path: "verificationPage" });
    } else {
      window.history.back();
    }
  };

  goNext = async (): Promise<void> => {
    if (!this.isNextButtonEnabled()) return;

    this.apiLoading(true);
    this.apiError(null);

    const cnicNo = localStorage.getItem("cnicNo");
    const username = localStorage.getItem("username"); // optional
    const password = this.password();

    if (!cnicNo) {
      this.apiError("Missing CNIC. Please restart the process.");
      this.apiLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/accounts/credentials/${encodeURIComponent(
          cnicNo
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username || null, password }),
        }
      );

      const data = await response.json();
    } catch (err: any) {
      this.apiError("Network or server error occurred.");
    } finally {
      this.apiLoading(false);
      if (appViewModel) {
        appViewModel.goToNextStep("loginDetailsPage", "termsPage");
      }
    }
  };

  connected = (): void => {
    document.title = "MBL | Login Details";
  };

  validateForm = (): boolean => {
    return this.isNextButtonEnabled();
  };
}

export = LoginDetailsPage;