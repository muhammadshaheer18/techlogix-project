import * as ko from "knockout";
import appViewModel from "../appController";
const SLICE_KEY = "verificationPage";
//classCreation
class VerificationPage {
  public username = ko.observable<string>("");
  public apiError = ko.observable<string | null>(null);
  public apiLoading = ko.observable<boolean>(false);
  private fallbackPhone: string | null = null;
  private usernameExists = ko.observable<boolean>(false);
  private usernameTimer: number | null = null;
  private hasUserStoppedTyping = ko.observable<boolean>(false);
  private hasCheckedOnce = ko.observable<boolean>(false);

  constructor() {
    this.handlePageReload();
    this.restoreFromSharedSession();
    this.checkForInvalidReload();
    this.username.subscribe(() => {
      this.hasUserStoppedTyping(false);
      this.hasCheckedOnce(false);
      this.saveToSharedSession();

      if (this.usernameTimer) clearTimeout(this.usernameTimer);
      this.usernameTimer = window.setTimeout(() => {
        this.hasUserStoppedTyping(true);
        this.checkUsernameAvailability();
      }, 1000);
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

  private saveToSharedSession() {
    try {
      const slice = { username: this.username() };
      appViewModel?.setOnboardingSlice(SLICE_KEY, slice);
    } catch (e) {
      console.warn("Failed to save onboarding slice", e);
    }
  }

  private restoreFromSharedSession() {
    try {
      const slice = appViewModel?.getOnboardingSlice(SLICE_KEY);
      if (slice?.username) this.username(slice.username);
    } catch (e) {
      console.warn("Failed to restore onboarding slice", e);
    }
  }

  private checkForInvalidReload() {
    try {
      const navigatedFromAccountType = sessionStorage.getItem("navigatedFromAccountType");
      if (navigatedFromAccountType !== "true") {
        console.warn("Invalid access/hard reload detected on Account Details page. Redirecting to Account Type page.");
        this.clearLocalSlice();
        appViewModel?.goToNextStep("verificationPage", "accountTypePage");
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
  goBack = () => {
    this.saveToSharedSession();
    appViewModel?.router?.go({ path: "accountDetailsPage" });
  };

  goNext = () => {
    const usernameValue = this.username()?.trim();

    if (usernameValue && !this.usernameExists() && this.usernameStatus() !== "invalid") {
      localStorage.setItem("username", usernameValue);
    } else {
      localStorage.removeItem("username");
    }

    this.saveToSharedSession();
    appViewModel?.goToNextStep("verificationPage", "loginDetailsPage");
  };
  //Page Specific Functions
  fetchUserData = async (): Promise<void> => {
    const cnicNo = localStorage.getItem("cnicNo");
    if (!cnicNo) {
      this.apiError("CNIC not found.");
      this.apiLoading(false);
      return;
    }

    this.apiLoading(true);
    this.apiError(null);

    const url = `http://localhost:8080/api/accounts/user/${encodeURIComponent(cnicNo)}`;

    try {
      const response = await fetch(url);
      const text = await response.text();

      if (!response.ok) {
        this.apiError("Failed to load user data.");
        return;
      }

      const data = text ? JSON.parse(text) : null;
      if (data?.data) {
        this.fallbackPhone = data.data.phone ?? null;
      }
    } catch {
      this.apiError("Unable to fetch user data.");
    } finally {
      this.apiLoading(false);
    }
  };

  public usernameStatus = ko.computed(() => {
    const value = this.username()?.trim();

    if (!value) return "idle";
    if (this.apiLoading()) return "checking";
    if (value.length < 8 || value.length > 16) return "invalid";
    if (!this.hasCheckedOnce()) return "pending";
    if (this.usernameExists()) return "exists";
    return "valid";
  });

  public usernameMessage = ko.computed(() => {
    const status = this.usernameStatus();

    switch (status) {
      case "idle":
        return "Your default username is your mobile number";
      case "checking":
        return "Checking availability...";
      case "invalid":
        return "Username must be between 8 and 16 characters";
      case "exists":
        return "Username already exists";
      case "valid":
        return "Username available";
      case "pending":
        return "";
      default:
        return "";
    }
  });

  public checkUsernameAvailability = async (): Promise<void> => {
    const usernameValue = this.username()?.trim();

    if (!this.hasUserStoppedTyping()) return;
    if (!usernameValue || usernameValue.length < 8 || usernameValue.length > 16) {
      this.usernameExists(false);
      this.hasCheckedOnce(false);
      return;
    }

    this.apiLoading(true);
    this.apiError(null);

    try {
      const res = await fetch(
        `http://localhost:8080/api/accounts/check-username?username=${encodeURIComponent(usernameValue)}`
      );
      const json = await res.json().catch(() => null);
      // Correct extraction for wrapped API response
      const exists = json?.data?.exists ?? false;

      this.usernameExists(exists);
      this.hasCheckedOnce(true);

      if (exists) {
        this.apiError("Username already exists. Please choose another.");
      } else {
        this.apiError(null);
      }
    } catch {
      this.usernameExists(false);
      this.apiError("Network error while checking username.");
    } finally {
      this.apiLoading(false);
    }
  };

  public onUsernameBlur = (): void => {
    if (this.hasUserStoppedTyping()) {
      this.checkUsernameAvailability();
    }
  };
  //Page Connected & Disconnected
  connected(): void {
    document.title = "MBL | Verification";
    this.fetchUserData();
  }

  disconnected(): void { }
}

export = VerificationPage;
