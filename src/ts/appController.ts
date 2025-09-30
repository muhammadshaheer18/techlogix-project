/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import * as ko from "knockout";
import * as ModuleUtils from "ojs/ojmodule-element-utils";
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
import { ojModule } from "ojs/ojmodule-element";
import Context = require("ojs/ojcontext");
import "ojs/ojdrawerpopup";
import * as Router from "ojs/ojrouter";

interface CoreRouterDetail {
  label: string;
  iconClass: string;
  value: string;
}

class RootViewModel {
  manner: ko.Observable<string>;
  message: ko.Observable<string | undefined>;
  smScreen?: ko.Observable<boolean>;
  mdScreen?: ko.Observable<boolean>;
  router?: CoreRouter<CoreRouterDetail>;
  moduleAdapter!: ModuleRouterAdapter<CoreRouterDetail>;
  sideDrawerOn: ko.Observable<boolean>;
  navDataProvider!: ArrayDataProvider<any, any>;
  appName: ko.Observable<string>;
  userLogin: ko.Observable<string>;
  footerLinks: Array<object>;
  showNavigation!: ko.Computed<boolean>;
  selection!: KnockoutRouterAdapter<any>;

  constructor() {
    // Accessibility announcements
    this.manner = ko.observable("polite");
    this.message = ko.observable();

    const globalBodyElement = document.getElementById("globalBody") as HTMLElement;
    if (globalBodyElement) {
      globalBodyElement.addEventListener("announce", this.announcementHandler, false);
    }

    // responsive
    const smQuery = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }
    const mdQuery = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery) {
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
    }

    // navigation definitions
    const navData = [
      { path: "", redirect: "AccountTypePage" },
      { path: "AccountTypePage", detail: { label: "Account Type", iconClass: "circle", value: "1" } },
      { path: "AccountDetailsPage", detail: { label: "Account Detail", iconClass: "circle", value: "2" } },
      { path: "VerificationPage", detail: { label: "Verification", iconClass: "circle", value: "3" } },
      { path: "LoginDetailsPage", detail: { label: "Login Details", iconClass: "circle", value: "4" } },
      { path: "terms", detail: { label: "Terms & Conditions", iconClass: "circle", value: "5" } },
      { path: "successPage", detail: { label: "Success Page", iconClass: "circle", value: "6" } }
    ];

    // Router setup
    const router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
    // sync the router state with the URL
    router.sync();
    this.router = router;

    // expose router and view model globally so composites can navigate
    (window as any).appRouter = this.router;
    (window as any).appViewModel = this;

    // module adapter and selection adapter for oj-module
    this.moduleAdapter = new ModuleRouterAdapter(router);
    this.selection = new KnockoutRouterAdapter(router);

    // build navDataProvider excluding hidden pages
    const hiddenPages = ["terms", "successPage", ""];
    const navItemsForNavigation = navData.filter(item => !hiddenPages.includes(item.path));
    this.navDataProvider = new ArrayDataProvider(navItemsForNavigation, { keyAttributes: "path" });

    // showNavigation computed
    this.showNavigation = ko.pureComputed(() => {
      try {
        // selection.path() gives current route path
        return this.selection && this.selection.path && this.selection.path() !== "successPage";
      } catch {
        return true;
      }
    });

    // drawer
    this.sideDrawerOn = ko.observable(false);

    // close drawer on md-up size change
    this.mdScreen?.subscribe(() => {
      this.sideDrawerOn(false);
    });

    // header info
    this.appName = ko.observable("Meezan Bank Limited");
    this.userLogin = ko.observable("");
    this.footerLinks = [];

    // subscribe to route changes — this is the correct observable to monitor
    if (this.selection && this.selection.path && typeof this.selection.path.subscribe === "function") {
      this.selection.path.subscribe((newPath: string) => {
        console.log("Route changed to:", newPath);
        // optional: additional side-effects on route change
      });
    }

    // Try to subscribe to moduleAdapter.koObservableConfig if it is an observable at runtime.
    const koConfigObservable = (this.moduleAdapter as any).koObservableConfig;
    if (koConfigObservable && typeof koConfigObservable.subscribe === "function") {
      koConfigObservable.subscribe((config: any) => {
        // Debug log for module changes
        console.log("Module adapter config changed:", config);
      });
    }

    // release the application bootstrap busy state
    Context.getPageContext().getBusyContext().applicationBootstrapComplete();
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
      const drawerToggleButtonElement = document.querySelector("#drawerToggleButton") as HTMLElement;
      if (drawerToggleButtonElement) drawerToggleButtonElement.focus();
    }
  };

  /**
   * Navigate programmatically using CoreRouter
   * Usage: appViewModel.goTo("AccountDetailsPage")
   */
  goTo(path: string): void {
    if (this.router) {
      // call router.go with path parameter object; returns a Promise in JET
      this.router.go({ path: path }).then((result: any) => {
        console.log("Navigation success:", result);
      }).catch((err: any) => {
        console.error("Navigation error:", err);
      });
    } else {
      console.warn("Router not initialized yet.");
    }
  }
}

export default new RootViewModel();
