import * as ko from "knockout";
import "ojs/ojknockout";
import * as Router from "ojs/ojrouter";
import appViewModel from "../appController";
import "ojs/ojdialog";
import "ojs/ojinputtext";
import "ojs/ojbutton";

const SLICE_KEY = "passwordPage";
const OTP_TIMER_SECONDS = 90; // The timer duration in seconds

interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasSpecial: boolean;
}

class passwordPage {
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

  private timerHandle: any = null;
  private isTimerActive: boolean = false;

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
      const validCount = Object.values(requirements).filter((r) => r).length;

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
      return this.isPasswordValid() && this.isConfirmPasswordValid() && !this.apiLoading();
    });

    this.password.subscribe(() => this.validateConfirmPassword());
    this.confirmPassword.subscribe(() => this.validateConfirmPassword());

    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
      if (this.timerHandle) clearInterval(this.timerHandle);
    });
  }

  // ============== SESSION/NAVIGATION HELPERS ==============

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
        this.clearLocalSlice();
        appViewModel?.goToNextStep("passwordPage", "cnicPage");
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

  goBack = (): void => {
    appViewModel?.router
      ? appViewModel.router.go({ path: "usernamePage" })
      : window.history.back();
  };

  // MAIN NEXT HANDLER (API CALLS) 

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
      // STEP 1: Save password-check
      const credentialsResponse = await fetch(
        `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/password-set`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username || null, password }),
        }
      );

      const credentialsData = await credentialsResponse.json();
      if (!credentialsResponse.ok) {
        this.apiError(credentialsData.message || "Error saving Credentials.");
        this.apiLoading(false);
        return;
      }

      // STEP 2: Send OTP
      const otpLoader = document.getElementById("otpLoader") as HTMLElement;
      if (otpLoader) otpLoader.style.display = "flex";

      const otpResponse = await fetch(
        `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/send-otp`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );

      if (otpLoader) otpLoader.style.display = "none";

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        // Show the actual error message from backend
        let errorMsg = "Failed to send OTP. Please check your email address.";

        // Try to extract the actual error message from various response formats
        if (otpData.message) {
          errorMsg = otpData.message;
        } else if (otpData.error) {
          errorMsg = otpData.error;
        } else if (otpData.data && otpData.data.message) {
          errorMsg = otpData.data.message;
        }

        this.apiError(errorMsg);
        this.apiLoading(false);
        return;
      }

      // Open OTP dialog only on success
      const otpDialog = document.getElementById("otpDialog") as any;
      const otpMessage = document.getElementById("otpMessage") as HTMLElement;
      const otpMobile = document.querySelector(".otp-mobile") as HTMLElement;

      if (otpDialog) {
        // Reset OTP input fields
        (document.querySelectorAll(".otp-box") as NodeListOf<HTMLInputElement>).forEach(
          (input) => (input.value = "")
        );

        // Update dialog message and masked email
        if (otpMobile) {
          otpMobile.textContent = otpData?.data?.maskedEmail || 'registered email address';
        }
        otpMessage.textContent = otpData?.data?.maskedEmail
          ? `OTP sent successfully to ${otpData.data.maskedEmail}`
          : "OTP sent successfully!";
        otpMessage.className = "otp-message success";

        otpDialog.open();

        // Start the timer
        this.startOtpTimer();
      }
    } catch (err) {
      console.error("Error in goNext:", err);
      this.apiError("Network or server error occurred. Please check your connection.");
    } finally {
      this.apiLoading(false);
    }
  };

  // Also update the resendOtp method with better error handling:

  private resendOtp = async () => { //2
    const cnicNo = localStorage.getItem("cnicNo");
    if (!cnicNo) return;

    const otpMessage = document.getElementById("otpMessage") as HTMLElement;
    const resendLink = document.getElementById("resendOtpLink") as HTMLElement;

    otpMessage.textContent = "Requesting new OTP...";
    otpMessage.className = "otp-message info";

    try {
      const otpResponse = await fetch(
        `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/send-otp`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const otpData = await otpResponse.json();

      if (otpResponse.ok) {
        otpMessage.textContent = otpData?.data?.maskedEmail
          ? `New OTP sent successfully to ${otpData.data.maskedEmail}`
          : "New OTP sent successfully!";
        otpMessage.className = "otp-message success";
        this.startOtpTimer();
      } else {
        // FIXED: Show actual backend error
        const errorMsg = otpData.message || otpData.error || "Failed to resend OTP.";
        otpMessage.textContent = errorMsg;
        otpMessage.className = "otp-message error";
        // Keep resend link visible so user can try again
        if (resendLink) resendLink.style.display = 'inline';
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      otpMessage.textContent = "Network error occurred. Please try again.";
      otpMessage.className = "otp-message error";
      // Keep resend link visible
      if (resendLink) resendLink.style.display = 'inline';
    }
  }
  // ============== VALIDATION GETTERS (Ko Bindings) ==============

  getBarColor = (i: number): string => {
    const s = this.passwordStrength();
    if (s === "Strong") return i <= 4 ? "#00c855" : "#e0e0e0";
    if (s === "Medium") return i <= 2 ? "#ffb400" : "#e0e0e0";
    return i === 1 ? "#e53e3e" : "#e0e0e0";
  };

  validateConfirmPassword = (): void => {
    const p = this.password(),
      c = this.confirmPassword(),
      valid = this.isPasswordValid();

    if (!c) {
      this.confirmPasswordStatus("");
      this.confirmPasswordStatusClass("");
      this.isConfirmPasswordValid(false);
      return;
    }

    if (p === c && valid) {
      this.confirmPasswordStatus("Passwords Match!");
      this.confirmPasswordStatusClass("success");
      this.isConfirmPasswordValid(true);
    } else if (p !== c) {
      this.confirmPasswordStatus("Passwords do not match");
      this.confirmPasswordStatusClass("error");
      this.isConfirmPasswordValid(false);
    } else {
      this.confirmPasswordStatus("Please meet all password requirements");
      this.confirmPasswordStatusClass("error");
      this.isConfirmPasswordValid(false);
    }
  };

  togglePasswordVisibility = (): void => this.showPassword(!this.showPassword());
  toggleConfirmPasswordVisibility = (): void =>
    this.showConfirmPassword(!this.showConfirmPassword());

  getPasswordInputType = (): string => (this.showPassword() ? "text" : "password");
  getConfirmPasswordInputType = (): string =>
    this.showConfirmPassword() ? "text" : "password";

  getPasswordToggleText = (): string => (this.showPassword() ? "HIDE" : "SHOW");
  getConfirmPasswordToggleText = (): string =>
    this.showConfirmPassword() ? "HIDE" : "SHOW";

  getPasswordInputClass = (): string =>
    this.password() === ""
      ? "form-input"
      : this.isPasswordValid()
        ? "form-input valid"
        : "form-input invalid";

  getConfirmPasswordInputClass = (): string =>
    this.confirmPassword() === ""
      ? "form-input"
      : this.isConfirmPasswordValid()
        ? "form-input valid"
        : "form-input invalid";

  getRequirementClass = (r: keyof PasswordRequirements): string =>
    this.requirements()[r] ? "requirement-item valid" : "requirement-item invalid";

  validateForm = (): boolean => this.isNextButtonEnabled();

  // ============== OTP HANDLER & TIMER LOGIC ==============

  private startOtpTimer = (initialTime: number = OTP_TIMER_SECONDS) => {
    if (this.timerHandle) clearInterval(this.timerHandle);

    const otpTimerDisplay = document.getElementById("otpTimer") as HTMLElement;
    const resendLink = document.getElementById("resendOtpLink") as HTMLElement;
    const verifyBtn = document.getElementById("verifyOtpBtn") as HTMLButtonElement;

    if (!otpTimerDisplay || !verifyBtn) return;

    let timeLeft = initialTime;
    this.isTimerActive = true;
    if (resendLink) resendLink.style.display = 'none';
    verifyBtn.disabled = false;

    const updateDisplay = () => {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      otpTimerDisplay.textContent = `${m}:${s < 10 ? "0" : ""}${s}`;

      if (timeLeft > 0 && this.isTimerActive) {
        timeLeft--;
      } else {
        clearInterval(this.timerHandle);
        this.isTimerActive = false;
        // Timer expired state
        otpTimerDisplay.textContent = "0:00";
        const otpMessage = document.getElementById("otpMessage") as HTMLElement;
        otpMessage.textContent = "OTP expired. Please request a new one.";
        otpMessage.className = "otp-message error";
        if (resendLink) resendLink.style.display = 'inline';
        verifyBtn.disabled = true;
      }
    };

    updateDisplay();
    this.timerHandle = setInterval(updateDisplay, 1000);
  };

  connected = (): void => {
    document.title = "MBL | Password Set";

    const otpInputs = Array.from(document.querySelectorAll<HTMLInputElement>(".otp-box"));
    const otpDialog = document.getElementById("otpDialog") as any;
    const otpMessage = document.getElementById("otpMessage") as HTMLElement;
    const resendLink = document.getElementById("resendOtpLink") as HTMLElement;

    // Get button references
    const verifyBtn = document.getElementById("verifyOtpBtn") as HTMLButtonElement;
    const cancelBtn = document.getElementById("cancelOtpBtn") as HTMLButtonElement;

    // Remove existing event listeners by cloning
    if (verifyBtn) {
      const newVerifyBtn = verifyBtn.cloneNode(true) as HTMLButtonElement;
      verifyBtn.parentNode?.replaceChild(newVerifyBtn, verifyBtn);
    }
    if (cancelBtn) {
      const newCancelBtn = cancelBtn.cloneNode(true) as HTMLButtonElement;
      cancelBtn.parentNode?.replaceChild(newCancelBtn, cancelBtn);
    }
    if (resendLink) {
      const newResendLink = resendLink.cloneNode(true) as HTMLElement;
      resendLink.parentNode?.replaceChild(newResendLink, resendLink);
    }

    // Get fresh references after cloning
    const newVerifyBtn = document.getElementById("verifyOtpBtn") as HTMLButtonElement;
    const newCancelBtn = document.getElementById("cancelOtpBtn") as HTMLButtonElement;
    const newResendLink = document.getElementById("resendOtpLink") as HTMLElement;

    // OTP input behavior (numeric + auto-focus)
    otpInputs.forEach((input, i) => {
      input.addEventListener("input", (e) => {
        const val = (e.target as HTMLInputElement).value;
        if (!/^[0-9]$/.test(val)) {
          (e.target as HTMLInputElement).value = "";
          return;
        }
        if (i < otpInputs.length - 1) otpInputs[i + 1].focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && i > 0) otpInputs[i - 1].focus();
      });
    });

    // Cancel Button Handler
    if (newCancelBtn) {
      newCancelBtn.addEventListener("click", () => {
        if (this.timerHandle) clearInterval(this.timerHandle);
        this.isTimerActive = false;
        otpInputs.forEach((input) => (input.value = ""));
        if (otpDialog) otpDialog.close();
      });
    }

    // Resend OTP
    if (newResendLink) {
      newResendLink.addEventListener("click", (e) => {
        e.preventDefault();
        this.resendOtp();
      });
    }

    // Verify OTP Handler
    if (newVerifyBtn) {
      newVerifyBtn.addEventListener("click", async () => {
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
          const res = await fetch(
            `http://localhost:8080/api/accounts/${encodeURIComponent(cnicNo)}/verify-otp`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ otp: otpValue }),
            }
          );

          const responseData = await res.json();
          const isVerified = responseData?.data?.verified === true;

          if (res.ok && isVerified) {
            otpMessage.textContent = "OTP verified successfully! Redirecting...";
            otpMessage.className = "otp-message success";

            if (this.timerHandle) clearInterval(this.timerHandle);
            this.isTimerActive = false;

            setTimeout(() => {
              if (otpDialog) otpDialog.close();

              if (appViewModel && appViewModel.router) {
                appViewModel.router.go({ path: "termsPage" });
              } else if (Router.rootInstance) {
                Router.rootInstance.go("termsPage");
              } else {
                window.location.hash = "termsPage";
              }
            }, 1200);

          } else {
            otpMessage.textContent =
              responseData?.data?.message ||
              responseData?.message ||
              "Invalid OTP. Please try again.";
            otpMessage.className = "otp-message error";
          }
        } catch (error) {
          console.error("OTP verification error:", error);
          otpMessage.textContent = "Network or server error occurred.";
          otpMessage.className = "otp-message error";
        }
      });
    }
  };

  disconnected = (): void => {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.isTimerActive = false;
  };
}

export = passwordPage;