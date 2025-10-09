import * as ko from "knockout";
import appViewModel from "../appController";

class VerificationPage {
  public username = ko.observable<string>("");
  public apiError = ko.observable<string | null>(null);
  public apiLoading = ko.observable<boolean>(false);
  private fallbackPhone: string | null = null;
  private usernameExists = ko.observable<boolean>(false);
  private usernameTimer: number | null = null;

  constructor() {}

  connected(): void {
    document.title = "MBL | Verification";
    this.fetchUserData();
  }

  // Computed status (idle / invalid / checking / valid / exists)
  public usernameStatus = ko.computed(() => {
    const value = this.username();
    if (!value) return "idle";
    if (this.apiLoading()) return "checking";
    if (this.usernameExists()) return "exists";
    if (value.length < 8 || value.length > 16) return "invalid";
    return "valid";
  });

  // Fetch user phone/email by accountId (for prefill)
  fetchUserData = async (): Promise<void> => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      this.apiError("Account ID not found in localStorage.");
      return;
    }

    this.apiLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/accounts/${accountId}/user`);
      const data = await response.json();

      if (data && data.phone) {
        this.fallbackPhone = String(data.phone);
        if (!this.username()) this.username(this.fallbackPhone);
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      this.apiError("Unable to fetch user data.");
    } finally {
      this.apiLoading(false);
    }
  };

  // 🔍 Check username availability (debounced)
  checkUsernameAvailability = async (): Promise<void> => {
    const usernameValue = this.username()?.trim();
    if (!usernameValue || usernameValue.length < 8 || usernameValue.length > 16) {
      this.usernameExists(false);
      return;
    }

    this.apiLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/accounts/check-username?username=${usernameValue}`);
      const data = await res.json();
      this.usernameExists(data.exists);
    } catch (err) {
      console.error("Username check failed:", err);
      this.usernameExists(false);
    } finally {
      this.apiLoading(false);
    }
  };

  // Debounce to avoid excessive API calls
  onUsernameChange = (): void => {
    if (this.usernameTimer) clearTimeout(this.usernameTimer);
    this.usernameTimer = window.setTimeout(() => this.checkUsernameAvailability(), 400);
  };

  // Navigate forward (with username validation)
  public goNext = async (): Promise<void> => {
    const usernameValue = this.username()?.trim();

    // Ensure fallback phone is available — if not, fetch it
    if (!this.fallbackPhone) {
      await this.fetchUserData();
    }

    // Use fallback phone if empty
    if (!usernameValue) {
      if (this.fallbackPhone) {
        localStorage.setItem("username", this.fallbackPhone);
        console.log("Username left empty. Using fallback phone:", this.fallbackPhone);
      } else {
        console.warn("No username or fallback phone found — cannot proceed.");
        return;
      }
    } else if (this.usernameExists()) {
      alert("Username already exists. Please choose another.");
      return;
    } else if (this.usernameStatus() === "invalid") {
      alert("Username must be between 8 and 16 characters.");
      return;
    } else {
      localStorage.setItem("username", usernameValue);
      console.log("Username saved:", usernameValue);
    }

    if (appViewModel) {
      appViewModel.goToNextStep("verificationPage", "loginDetailsPage");
    }
  };

  public goBack = (): void => {
    if (appViewModel.router) {
      appViewModel.router.go({ path: "accountDetailsPage" });
    }
  };
}

export = VerificationPage;
