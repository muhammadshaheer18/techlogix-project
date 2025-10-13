import * as ko from "knockout";
import appViewModel from "../appController";

const SLICE_KEY = "verificationPage";

class VerificationPage {
  public username = ko.observable<string>("");
  public apiError = ko.observable<string | null>(null);
  public apiLoading = ko.observable<boolean>(false);

  private fallbackPhone: string | null = null;
  private usernameExists = ko.observable<boolean>(false);
  private usernameTimer: number | null = null;

  constructor() {
    this.clearSessionOnReload(); // ✅ Clears only on actual reload (F5)
    this.restoreFromSharedSession();

    this.username.subscribe(() => {
      this.saveToSharedSession(); // ✅ Save whenever username changes
    });

    // Clear full session only when tab is truly reloaded/closed
    window.addEventListener("beforeunload", () => {
      sessionStorage.clear();
    });
  }

  // ✅ Detects actual reloads (not navigation within SPA)
  private clearSessionOnReload() {
    try {
      const reloaded = sessionStorage.getItem("pageReloaded");
      if (reloaded) {
        // If flag existed, it means we are continuing in same session (no reload)
        return;
      }
      // If flag doesn’t exist, it’s a full reload — clear all data
      sessionStorage.clear();
      sessionStorage.setItem("pageReloaded", "true");
    } catch (e) {
      console.warn("Failed to handle session reload:", e);
    }
  }

  private saveToSharedSession() {
    try {
      const slice = {
        username: this.username(),
      };
      appViewModel?.setOnboardingSlice(SLICE_KEY, slice);
    } catch (e) {
      console.warn("Failed to save onboarding slice", e);
    }
  }

  private restoreFromSharedSession() {
    try {
      const slice = appViewModel?.getOnboardingSlice(SLICE_KEY);
      if (slice?.username) {
        this.username(slice.username);
      }
    } catch (e) {
      console.warn("Failed to restore onboarding slice", e);
    }
  }

  connected(): void {
    document.title = "MBL | Verification";
    this.fetchUserData();
  }

  fetchUserData = async (): Promise<void> => {
    const accountId = localStorage.getItem("accountId");
    if (!accountId) {
      this.apiError("Account ID not found in localStorage.");
      this.apiLoading(false);
      return;
    }

    this.apiLoading(true);
    this.apiError(null);

    const url = `http://localhost:8080/api/accounts/${encodeURIComponent(accountId)}/user`;

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
        this.apiError(null);
      }
    } catch {
      this.apiError("Unable to fetch user data.");
    } finally {
      this.apiLoading(false);
    }
  };

  // ---------------- Username Validation ----------------
  public usernameStatus = ko.computed(() => {
    const value = this.username();
    if (!value) return "idle";
    if (this.apiLoading()) return "checking";
    if (this.usernameExists()) return "exists";
    if (value.length < 8 || value.length > 16) return "invalid";
    return "valid";
  });

  checkUsernameAvailability = async (): Promise<void> => {
    const usernameValue = this.username()?.trim();
    if (!usernameValue || usernameValue.length < 8 || usernameValue.length > 16) {
      this.usernameExists(false);
      return;
    }

    this.apiLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/accounts/check-username?username=${encodeURIComponent(usernameValue)}`);
      const data = res.ok ? await res.json() : { exists: false };
      this.usernameExists(Boolean(data.exists));
    } catch {
      this.usernameExists(false);
    } finally {
      this.apiLoading(false);
    }
  };

  onUsernameChange = () => {
    if (this.usernameTimer) clearTimeout(this.usernameTimer);
    this.usernameTimer = window.setTimeout(() => this.checkUsernameAvailability(), 400);
  };

  // ---------------- Navigation ----------------
  goNext = () => {
    const usernameValue = this.username()?.trim();

    if (usernameValue && !this.usernameExists() && this.usernameStatus() !== "invalid") {
      localStorage.setItem("username", usernameValue);
    } else {
      localStorage.removeItem("username");
    }

    this.saveToSharedSession(); // ✅ Make sure data is preserved before moving
    appViewModel?.goToNextStep("verificationPage", "loginDetailsPage");
  };

  goBack = () => {
    this.saveToSharedSession(); // ✅ Preserve data when going back
    appViewModel?.router?.go({ path: "accountDetailsPage" });
  };
}

export = VerificationPage;
