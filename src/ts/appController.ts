import * as ko from "knockout";
import CoreRouter = require("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import Context = require("ojs/ojcontext");

// Extend Window interface
declare global {
  interface Window {
    appRouter: CoreRouter<any>;
    appViewModel: RootViewModel;
  }
}

interface CoreRouterDetail {
  label: string;
  iconClass: string;
  value: string;
}

class RootViewModel {
  manner = ko.observable("polite");
  message = ko.observable<string | undefined>();
  smScreen: ko.Observable<boolean> | undefined;
  mdScreen: ko.Observable<boolean> | undefined;
  router: CoreRouter<CoreRouterDetail>;
  moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
  sideDrawerOn = ko.observable(false);
  navDataProvider: any;
  appName = ko.observable("Meezan Bank Limited");
  userLogin = ko.observable("");
  showNavigation: ko.Computed<boolean>;
  selection: KnockoutRouterAdapter<any>;
  currentAccountId = ko.observable<number | null>(null);
  completedSteps = ko.observableArray<string>([]);
  currentStep = ko.observable<string>("cnicPage");

  private STORAGE_KEY = "onboarding_flow_data";
  private navOrder = [
    "landingPage",
    "cnicPage",
    "accountIbanPage",
    "usernamePage",
    "passwordPage",
    "termsPage",
    "summaryPage",
  ];

  constructor() {
    // Router setup
    const navData = [
      { path: "", redirect: "landingPage" },
      { path: "landingPage", detail: { label: "Welcome", iconClass: "none", value: "0" } },
      { path: "cnicPage", detail: { label: "Account Type", iconClass: "circle", value: "1" } },
      { path: "accountIbanPage", detail: { label: "Account Details", iconClass: "circle", value: "2" } },
      { path: "usernamePage", detail: { label: "Verification", iconClass: "circle", value: "3" } },
      { path: "passwordPage", detail: { label: "Login Details", iconClass: "circle", value: "4" } },
      { path: "termsPage", detail: { label: "Terms & Conditions", iconClass: "circle", value: "5" } },
      { path: "summaryPage", detail: { label: "Onboarding Page", iconClass: "circle", value: "6" } },
    ];

    this.router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
    this.router.sync();

    window.appRouter = this.router;
    window.appViewModel = this;

    this.moduleAdapter = new ModuleRouterAdapter(this.router);
    this.selection = new KnockoutRouterAdapter(this.router);

    // Visible navigation items
    const hiddenPages = ["summaryPage", "termsPage", "landingPage", ""];
    const visibleNavItems = navData.filter(item => !hiddenPages.includes(item.path));
    this.navDataProvider = new ArrayDataProvider(visibleNavItems, { keyAttributes: "path" });

    // Control navigation visibility
    this.showNavigation = ko.pureComputed(() => {
      const hiddenPages = ["landingPage", "summaryPage"];
      return !hiddenPages.includes(this.selection.path());
    });

    // Sync current step
    this.selection.path.subscribe((newPath: string) => {
      if (newPath) {
        this.currentStep(newPath);
        const idx = this.navOrder.indexOf(newPath);
        this.completedSteps(idx > 0 ? this.navOrder.slice(0, idx) : []);
      }
    });

    this.mdScreen?.subscribe(() => this.sideDrawerOn(false));
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  }

  // Account ID setter
  setAccountId(id: number) {
    this.currentAccountId(id);
  }

  getOnboardingData(): any {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  setOnboardingData(data: any): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  getOnboardingSlice(sliceKey: string): any {
    return this.getOnboardingData()[sliceKey] || null;
  }

  setOnboardingSlice(sliceKey: string, sliceData: any): void {
    const full = this.getOnboardingData();
    full[sliceKey] = sliceData;
    this.setOnboardingData(full);
  }

  clearOnboarding(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  goToNextStep(currentPath: string, nextPath: string): void {
    this.router.go({ path: nextPath });
  }
}

export default new RootViewModel();
