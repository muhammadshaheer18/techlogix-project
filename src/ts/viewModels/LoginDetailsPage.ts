import * as ko from "knockout";
import "ojs/ojknockout";
import { ojButton } from "ojs/ojbutton";
import * as Router from "ojs/ojrouter";
import appViewModel from "../appController";

//import { ojInputPassword } from "ojs/ojinputpassword";

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

  constructor() {
    // Initialize observables
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

    // Computed for next button state
    this.isNextButtonEnabled = ko.computed(() => {
      return this.isPasswordValid() && this.isConfirmPasswordValid();
    });

    // Subscribe to password changes
    this.password.subscribe((newValue) => {
      this.validatePassword(newValue);
      this.validateConfirmPassword();
    });

    // Subscribe to confirm password changes
    this.confirmPassword.subscribe(() => {
      this.validateConfirmPassword();
    });
  }

  // Password validation method
  validatePassword = (password: string): void => {
    const requirements: PasswordRequirements = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    this.requirements(requirements);

    const validCount = Object.values(requirements).filter((req) => req).length;

    // Update password strength
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

  // Confirm password validation
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

  // Toggle password visibility
  togglePasswordVisibility = (): void => {
    this.showPassword(!this.showPassword());
  };

  // Toggle confirm password visibility
  toggleConfirmPasswordVisibility = (): void => {
    this.showConfirmPassword(!this.showConfirmPassword());
  };

  // Get password input type
  getPasswordInputType = (): string => {
    return this.showPassword() ? "text" : "password";
  };

  // Get confirm password input type
  getConfirmPasswordInputType = (): string => {
    return this.showConfirmPassword() ? "text" : "password";
  };

  // Get password toggle button text
  getPasswordToggleText = (): string => {
    return this.showPassword() ? "HIDE" : "SHOW";
  };

  // Get confirm password toggle button text
  getConfirmPasswordToggleText = (): string => {
    return this.showConfirmPassword() ? "HIDE" : "SHOW";
  };

  // Get CSS class for password input
  getPasswordInputClass = (): string => {
    if (this.password() === "") return "form-input";
    return this.isPasswordValid() ? "form-input valid" : "form-input invalid";
  };

  // Get CSS class for confirm password input
  getConfirmPasswordInputClass = (): string => {
    if (this.confirmPassword() === "") return "form-input";
    return this.isConfirmPasswordValid()
      ? "form-input valid"
      : "form-input invalid";
  };

  // Get CSS class for requirement items
  getRequirementClass = (requirement: keyof PasswordRequirements): string => {
    const reqs = this.requirements();
    return reqs[requirement]
      ? "requirement-item valid"
      : "requirement-item invalid";
  };

  // Handle back button click
 public goBack = (): void => {
  if (appViewModel?.router) {
    appViewModel.router.go({ path: "VerificationPage" });
  } else {
    window.history.back();
  }
};


  // Handle form submission
  public goNext = (): void => {
    if (this.isNextButtonEnabled()) {
     if (appViewModel) {
      appViewModel.goToNextStep("LoginDetailsPage", "terms");
    }
    }
  };

  // Handle form validation on submit
  validateForm = (): boolean => {
    return this.isNextButtonEnabled();
  };
}

export = LoginDetailsPage;
