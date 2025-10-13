import * as ko from "knockout";
import appViewModel from "../appController";

const SLICE_KEY = "verificationPage";

class VerificationPage {
  // Observables
  public username = ko.observable<string>("");
  public apiError = ko.observable<string | null>(null);
  public apiLoading = ko.observable<boolean>(false);

  private fallbackPhone: string | null = null;
  private usernameExists = ko.observable<boolean>(false);
  private usernameTimer: number | null = null;
  private hasUserStoppedTyping = ko.observable<boolean>(false);

  constructor() {
    this.clearSessionOnReload();
    this.restoreFromSharedSession();

    // Detect user typing with debounce
    this.username.subscribe(() => {
      this.hasUserStoppedTyping(false);
      this.saveToSharedSession();

      if (this.usernameTimer) clearTimeout(this.usernameTimer);

      // Wait 1.5 seconds after last keystroke before checking availability
      this.usernameTimer = window.setTimeout(() => {
        this.hasUserStoppedTyping(true);
        this.checkUsernameAvailability();
      }, 3000);
    });

    // Clear session on full page reload
    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }

  // ✅ Clear session only once when truly reloaded
  private clearSessionOnReload() {
    try {
      const reloaded = sessionStorage.getItem("pageReloaded");
      if (reloaded) return;
      sessionStorage.clear();
      sessionStorage.setItem("pageReloaded", "true");
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

  connected(): void {
    document.title = "MBL | Verification";
    this.fetchUserData();
  }

  // ---------------- Fetch User Data ----------------
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
      if (data) {
        this.fallbackPhone = data.phone ?? null;
      }
    } catch {
      this.apiError("Unable to fetch user data.");
    } finally {
      this.apiLoading(false);
    }
  };

  // ---------------- Username Validation ----------------
  public usernameStatus = ko.computed(() => {
    const value = this.username()?.trim();

    if (!value) return "idle";
    if (this.apiLoading()) return "checking";
    if (value.length < 8 || value.length > 16) return "invalid";
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
        return "⚠️ Username must be between 8 and 16 characters";
      case "exists":
        return "❌ Username already exists";
      case "valid":
        return "✅ Username available";
      default:
        return "";
    }
  });

  // Debounced API check
  public checkUsernameAvailability = async (): Promise<void> => {
    const usernameValue = this.username()?.trim();

    if (!this.hasUserStoppedTyping()) return; // don't check if still typing
    if (!usernameValue || usernameValue.length < 8 || usernameValue.length > 16) {
      this.usernameExists(false);
      return;
    }

    this.apiLoading(true);
    this.apiError(null);

    try {
      const res = await fetch(
        `http://localhost:8080/api/accounts/check-username?username=${encodeURIComponent(usernameValue)}`
      );
      const data = res.ok ? await res.json() : { exists: false };
      this.usernameExists(Boolean(data.exists));
    } catch {
      this.usernameExists(false);
      this.apiError("Network error while checking username.");
    } finally {
      this.apiLoading(false);
    }
  };

  // Manual check when focus leaves field
  public onUsernameBlur = (): void => {
    if (this.hasUserStoppedTyping()) {
      this.checkUsernameAvailability();
    }
  };

  // ---------------- Navigation ----------------
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

  goBack = () => {
    this.saveToSharedSession();
    appViewModel?.router?.go({ path: "accountDetailsPage" });
  };
}

export = VerificationPage;
