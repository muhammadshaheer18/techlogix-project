import * as ko from "knockout";
import "ojs/ojknockout";
import { ojButton } from "ojs/ojbutton";
import * as Router from "ojs/ojrouter";
import appViewModel from "../appController";
import "ojs/ojdialog";
import "ojs/ojinputtext";
import "ojs/ojbutton";


const SLICE_KEY = "loginDetailsPage";
//classCreation
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
  //goBack & goNext Handlers
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
  const username = localStorage.getItem("username");
  const password = this.password();

  if (!cnicNo) {
    this.apiError("Missing CNIC. Please restart the process.");
    this.apiLoading(false);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username || null, password }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      const otpDialog = document.getElementById("otpDialog") as any;
      if (otpDialog) otpDialog.open();
    } else {
      this.apiError(data.message || "Server error occurred.");
    }
  } catch (err: any) {
    this.apiError("Network or server error occurred.");
  } finally {
    this.apiLoading(false);
  }
};

  //Page Specific Functions
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

  validateForm = (): boolean => {
    return this.isNextButtonEnabled();
  };
  //Page Connected & Disconnected
 connected = (): void => {
  document.title = "MBL | Login Details";

  const otpInputs = Array.from(document.querySelectorAll<HTMLInputElement>(".otp-box"));
  const otpMessage = document.getElementById("otpMessage") as HTMLElement;
  const otpDialog = document.getElementById("otpDialog") as any;
  const otpTimerDisplay = document.getElementById("otpTimer") as HTMLElement;
  const verifyBtn = document.getElementById("verifyOtpBtn");
  const cancelBtn = document.getElementById("cancelOtpBtn");

  // OTP input behavior: numeric-only and auto-focus
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (!/^[0-9]$/.test(value)) {
        (e.target as HTMLInputElement).value = "";
        return;
      }
      if (index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // OTP timer (5 min)
  let timeLeft = 300;
  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    otpTimerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    if (timeLeft > 0) {
      timeLeft--;
      setTimeout(updateTimer, 1000);
    } else {
      otpMessage.textContent = "OTP expired. Please request a new one.";
      otpMessage.className = "otp-message error";
    }
  };
  updateTimer();

  // 🔐 Verify OTP using API
  verifyBtn?.addEventListener("click", async () => {
    const otpValue = otpInputs.map((i) => i.value).join("");
    const cnicNo = localStorage.getItem("cnicNo");

    if (otpValue.length !== 6) {
      otpMessage.textContent = "Please enter the complete 6-digit OTP.";
      otpMessage.className = "otp-message error";
      return;
    }

    if (!cnicNo) {
      otpMessage.textContent = "Session expired. Please restart the process.";
      otpMessage.className = "otp-message error";
      return;
    }

    otpMessage.textContent = "Verifying OTP...";
    otpMessage.className = "otp-message info";

    try {
      const response = await fetch(
        `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp: otpValue }),
        }
      );

      const data = await response.json();

      if (response.ok && data.verified === true) {
        otpMessage.textContent = "OTP verified successfully!";
        otpMessage.className = "otp-message success";

        setTimeout(() => {
          otpDialog.close();
          appViewModel?.goToNextStep("loginDetailsPage", "termsPage");
        }, 1000);
      } else {
        otpMessage.textContent = data.message || "Invalid OTP. Please try again.";
        otpMessage.className = "otp-message error";
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      otpMessage.textContent = "Network or server error occurred.";
      otpMessage.className = "otp-message error";
    }
  });

  cancelBtn?.addEventListener("click", () => {
    otpDialog.close();
  });
};

  disconnected = (): void => {

  }
}
export = LoginDetailsPage;