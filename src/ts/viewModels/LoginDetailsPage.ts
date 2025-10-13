import * as ko from "knockout";
import "ojs/ojknockout";
import { ojButton } from "ojs/ojbutton";
import * as Router from "ojs/ojrouter";
import appViewModel from "../appController";

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
  isPasswordValid: ko.Observable<boolean>;
  isConfirmPasswordValid: ko.Observable<boolean>;
  passwordStrength: ko.Observable<string>;
  confirmPasswordStatus: ko.Observable<string>;
  confirmPasswordStatusClass: ko.Observable<string>;
  requirements: ko.Observable<PasswordRequirements>;
  isNextButtonEnabled: ko.Computed<boolean>;

  apiLoading: ko.Observable<boolean>;
  apiError: ko.Observable<string | null>;

  constructor() {
    this.password = ko.observable("");
    this.confirmPassword = ko.observable("");
    this.showPassword = ko.observable(false);
    this.showConfirmPassword = ko.observable(false);
    this.isPasswordValid = ko.observable(false);
    this.isConfirmPasswordValid = ko.observable(false);
    this.passwordStrength = ko.observable("Weak");
    this.confirmPasswordStatus = ko.observable("");
    this.confirmPasswordStatusClass = ko.observable("");
    this.requirements = ko.observable<PasswordRequirements>({
      minLength: false,
      hasUpper: false,
      hasSpecial: false,
    });

    this.apiLoading = ko.observable(false);
    this.apiError = ko.observable(null);

    this.isNextButtonEnabled = ko.computed(() => {
      return this.isPasswordValid() && this.isConfirmPasswordValid();
    });

    this.password.subscribe((newValue) => {
      this.validatePassword(newValue);
      this.validateConfirmPassword();
    });

    this.confirmPassword.subscribe(() => {
      this.validateConfirmPassword();
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

  validatePassword = (password: string): void => {
    const requirements: PasswordRequirements = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    this.requirements(requirements);

    const validCount = Object.values(requirements).filter((req) => req).length;

    if (validCount === 3) {
      this.passwordStrength("Strong");
      this.isPasswordValid(true);
    } else if (validCount === 2) {
      this.passwordStrength("Medium");
      this.isPasswordValid(false);
    } else {
      this.passwordStrength("Weak");
      this.isPasswordValid(false);
    }
  };

  validateConfirmPassword = (): void => {
    const password = this.password();
    const confirmPassword = this.confirmPassword();

    if (confirmPassword === "") {
      this.confirmPasswordStatus("");
      this.confirmPasswordStatusClass("");
      this.isConfirmPasswordValid(false);
      return;
    }

    if (password === confirmPassword && this.isPasswordValid()) {
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

  goBack = (): void => {
    if (appViewModel?.router) {
      appViewModel.router.go({ path: "verificationPage" });
    } else {
      window.history.back();
    }
  };

  /** ✅ Updated goNext — uses CNIC instead of accountId */
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
      console.log("✅ Credentials API Response:", data);
    } catch (err: any) {
      console.error("❌ API Error:", err);
      this.apiError("Network or server error occurred.");
    } finally {
      this.apiLoading(false);

      // ✅ Always proceed to next step
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
