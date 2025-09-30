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

// Extend Window interface to include router
declare global {
  interface Window {
    appRouter: CoreRouter<CoreRouterDetail>;
  }
}

class RootViewModel {
  manner: ko.Observable<string>;
  message: ko.Observable<string | undefined>;
  smScreen: ko.Observable<boolean> | undefined;
  mdScreen: ko.Observable<boolean> | undefined;
  router: CoreRouter<CoreRouterDetail> | undefined;
  moduleAdapter: ModuleRouterAdapter<CoreRouterDetail>;
  sideDrawerOn: ko.Observable<boolean>;
  navDataProvider: ojNavigationList<
    string,
    CoreRouter.CoreRouterState<CoreRouterDetail>
  >["data"];
  appName: ko.Observable<string>;
  userLogin: ko.Observable<string>;
  footerLinks: Array<object>;
  showNavigation: ko.Computed<boolean>;
  selection: KnockoutRouterAdapter<any>;

  constructor() {
    // handle announcements sent when pages change, for Accessibility.
    this.manner = ko.observable("polite");
    this.message = ko.observable();

    let globalBodyElement: HTMLElement = document.getElementById(
      "globalBody"
    ) as HTMLElement;
    globalBodyElement.addEventListener(
      "announce",
      this.announcementHandler,
      false
    );

    // media queries for responsive layouts
    let smQuery: string | null = ResponsiveUtils.getFrameworkQuery("sm-only");
    if (smQuery) {
      this.smScreen =
        ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
    }

    let mdQuery: string | null = ResponsiveUtils.getFrameworkQuery("md-up");
    if (mdQuery) {
      this.mdScreen =
        ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);
    }

    const navData = [
      { path: "", redirect: "AccountTypePage" },
      {
        path: "AccountTypePage",
        detail: { label: "Account Type", iconClass: "circle", value: "1" },
      },
      {
        path: "AccountDetailsPage",
        detail: { label: "Account Detail", iconClass: "circle", value: "2" },
      },
      {
        path: "VerificationPage",
        detail: { label: "Verification", iconClass: "circle", value: "3" },
      },
      {
        path: "LoginDetailsPage",
        detail: { label: "Login Details", iconClass: "circle", value: "4" },
      },
      {
        path: "terms",
        detail: {
          label: "Terms & Conditions",
          iconClass: "circle",
          value: "5",
        },
      },
      {
        path: "successPage",
        detail: {
          label: "Success Page",
          iconClass: "circle",
          value: "6",
        },
      },
    ];
    
    // router setup
    const router = new CoreRouter(navData, {
      urlAdapter: new UrlParamAdapter(),
    });
    router.sync();

    this.router = router;
    
    // ✅ CRITICAL: Expose router globally for composite components
    window.appRouter = router;
    
    this.moduleAdapter = new ModuleRouterAdapter(router);
    this.selection = new KnockoutRouterAdapter(router);

    const hiddenPages = ["terms", "successPage", ""];
    const navItemsForNavigation = navData.filter(
      (item) => !hiddenPages.includes(item.path)
    );

    this.navDataProvider = new ArrayDataProvider(navItemsForNavigation, {
      keyAttributes: "path",
    });

    this.showNavigation = ko.pureComputed(() => {
      return this.selection.path() !== "successPage";
    });

    // drawer
    this.sideDrawerOn = ko.observable(false);

    // close drawer on medium and larger screens
    this.mdScreen?.subscribe(() => {
      this.sideDrawerOn(false);
    });

    // header
    this.appName = ko.observable("Meezan Bank Limited");
    this.userLogin = ko.observable("");
    
    // footer
    this.footerLinks = [];
    
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
      const drawerToggleButtonElement = document.querySelector(
        "#drawerToggleButton"
      ) as HTMLElement;
      drawerToggleButtonElement.focus();
    }
  };
}

export default new RootViewModel();