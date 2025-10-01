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

  // ✅ Corrected typings here
  strengthBarWidth: ko.Computed<string>;
  strengthBarColor: ko.Computed<string>;

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

    this.strengthBarWidth = ko.computed<string>(() => {
      switch (this.passwordStrength()) {
        case "Strong":
          return "100%" as string;
        case "Medium":
          return "60%" as string;
        default:
          return "30%" as string;
      }
    });

    this.strengthBarColor = ko.computed<string>(() => {
      switch (this.passwordStrength()) {
        case "Strong":
          return "#00c855" as string;
        case "Medium":
          return "#ffb400" as string;
        default:
          return "#e53e3e" as string;
      }
    });

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

  goNext = (): void => {
    if (this.isNextButtonEnabled()) {
      if (appViewModel) {
        appViewModel.goToNextStep("loginDetailsPage", "termsPage");
      }
    }
  };

  validateForm = (): boolean => {
    return this.isNextButtonEnabled();
  };
}

export = LoginDetailsPage;
