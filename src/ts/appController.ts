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
  //steps check
  completedSteps = ko.observableArray<string>([]);
  currentStep = ko.observable<string>("accountTypePage");
  // Define step order
  private navOrder = [
    "accountTypePage",
    "accountDetailsPage",
    "verificationPage",
    "loginDetailsPage",
    "termsPage",
    "successPage",
  ];

  constructor() {
    // Announcements
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
    if (smQuery) {
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }

    const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery) {
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
    }

    // Router + nav items
    const navData = [
      { path: "", redirect: "accountTypePage" },
      {
        path: "accountTypePage",
        detail: { label: "Account Type", iconClass: "circle", value: "1" },
      },
      {
        path: "accountDetailsPage",
        detail: { label: "Account Detail", iconClass: "circle", value: "2" },
      },
      {
        path: "verificationPage",
        detail: { label: "Verification", iconClass: "circle", value: "3" },
      },
      {
        path: "loginDetailsPage",
        detail: { label: "Login Details", iconClass: "circle", value: "4" },
      },
      {
        path: "termsPage",
        detail: { label: "Terms & Conditions", iconClass: "circle", value: "5" },
      },
      {
        path: "successPage",
        detail: { label: "Success Page", iconClass: "circle", value: "6" },
      },
    ];

    this.router = new CoreRouter(navData, {
      urlAdapter: new UrlParamAdapter(),
    });
    this.router.sync();

    // Expose globally
    window.appRouter = this.router;
    window.appViewModel = this;

    this.moduleAdapter = new ModuleRouterAdapter(this.router);
    this.selection = new KnockoutRouterAdapter(this.router);

    // Only show navigation on main flow
    const hiddenPages = ["termsPage", "successPage", ""];
    const navItemsForNavigation = navData.filter(
      (item) => !hiddenPages.includes(item.path)
    );
    this.navDataProvider = new ArrayDataProvider(navItemsForNavigation, {
      keyAttributes: "path",
    });

    this.showNavigation = ko.pureComputed(
      () => this.selection.path() !== "successPage"
    );

    // Keep currentStep in sync with router
    this.selection.path.subscribe((newPath: string) => {
      if (newPath) {
        this.currentStep(newPath);

        const idx = this.navOrder.indexOf(newPath);
        if (idx > 0) {
          // Mark all PREVIOUS steps as completed (not including current)
          const completed = this.navOrder.slice(0, idx);
          this.completedSteps(completed);
        } else if (idx === 0) {
          // First step - no completed steps yet
          this.completedSteps([]);
        }
      }
    });

    // auto-close drawer on md+
    this.mdScreen?.subscribe(() => this.sideDrawerOn(false));

    // release bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
  }

  setAccountId(id: number) {
  this.currentAccountId(id);
}


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

  // Go to next step (mark current as complete and navigate)
  goToNextStep(currentPath: string, nextPath: string): void {
    // Just navigate - the router subscription will handle completion
    this.router.go({ path: nextPath });
  }
}

export default new RootViewModel();