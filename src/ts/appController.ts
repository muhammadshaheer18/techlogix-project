/**
 * @license
 * Copyright (c) 2014, 2025
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 */
import * as ko from "knockout";
import * as ResponsiveUtils from "ojs/ojresponsiveutils";
import * as ResponsiveKnockoutUtils from "ojs/ojresponsiveknockoututils";
import CoreRouter = require("ojs/ojcorerouter");
import ModuleRouterAdapter = require("ojs/ojmodulerouter-adapter");
import KnockoutRouterAdapter = require("ojs/ojknockoutrouteradapter");
import UrlParamAdapter = require("ojs/ojurlparamadapter");
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojknockout";
import "ojs/ojmodule-element";
import { ojNavigationList } from "ojs/ojnavigationlist";
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
  navDataProvider: ojNavigationList<
    string,
    CoreRouter.CoreRouterState<CoreRouterDetail>
  >["data"];
  appName = ko.observable("Meezan Bank Limited");
  userLogin = ko.observable("");
  footerLinks: Array<object> = [];
  showNavigation: ko.Computed<boolean>;
  selection: KnockoutRouterAdapter<any>;
  currentAccountId = ko.observable<number | null>(null);
  completedSteps = ko.observableArray<string>([]);
  currentStep = ko.observable<string>("accountTypePage");
  private navOrder = [
    "landingPage",
    "accountTypePage",
    "accountDetailsPage",
    "verificationPage",
    "loginDetailsPage",
    "termsPage",
    "successPage",
  ];

  // Centralized onboarding storage key
  private STORAGE_KEY = "onboarding_flow_data";

  constructor() {
    const globalBodyElement = document.getElementById(
      "globalBody"
    ) as HTMLElement;
    globalBodyElement.addEventListener(
      "announce",
      this.announcementHandler,
      false
    );

    // Responsive breakpoints
    const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

    const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery) this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

    // Router + nav items
    const navData = [
      { path: "", redirect: "landingPage" },
      { path: "landingPage", detail: { label: "Welcome", iconClass: "none", value: "0" } },
      { path: "accountTypePage", detail: { label: "Account Type", iconClass: "circle", value: "1" } },
      { path: "accountDetailsPage", detail: { label: "Account Detail", iconClass: "circle", value: "2" } },
      { path: "verificationPage", detail: { label: "Verification", iconClass: "circle", value: "3" } },
      { path: "loginDetailsPage", detail: { label: "Login Details", iconClass: "circle", value: "4" } },
      { path: "termsPage", detail: { label: "Terms & Conditions", iconClass: "circle", value: "5" } },
      { path: "successPage", detail: { label: "Success Page", iconClass: "circle", value: "6" } },
    ];

    this.router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
    this.router.sync();

    window.appRouter = this.router;
    window.appViewModel = this;

    this.moduleAdapter = new ModuleRouterAdapter(this.router);
    this.selection = new KnockoutRouterAdapter(this.router);

    // Only show navigation on main flow
    const hiddenPages = ["termsPage", "successPage", "", "landingPage"];
    const navItemsForNavigation = navData.filter(item => !hiddenPages.includes(item.path));
    this.navDataProvider = new ArrayDataProvider(navItemsForNavigation, { keyAttributes: "path" });

    this.showNavigation = ko.pureComputed(() => {
      const hiddenPages = ["landingPage", "successPage"]; // or add more if needed
      return !hiddenPages.includes(this.selection.path());
    });


    // Keep currentStep in sync with router
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

  setAccountId(id: number) {
    this.currentAccountId(id);
  }

  // -------------------------------
  // Centralized onboarding state
  // -------------------------------
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
    } catch { }
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

  // -------------------------------
  // UI & navigation helpers
  // -------------------------------
  announcementHandler = (event: any): void => {
    this.message(event.detail.message);
    this.manner(event.detail.manner);
  };

  toggleDrawer = (): void => {
    this.sideDrawerOn(!this.sideDrawerOn());
  };

  openedChangedHandler = (event: CustomEvent): void => {
    if (event.detail.value === false) {
      const drawerToggleButtonElement = document.querySelector(
        "#drawerToggleButton"
      ) as HTMLElement;
      drawerToggleButtonElement.focus();
    }
  };

  goToNextStep(currentPath: string, nextPath: string): void {
    this.router.go({ path: nextPath });
  }
}

export default new RootViewModel();
