// navigation.ts - Corrected

import * as ko from "knockout";
import CoreRouter = require("ojs/ojcorerouter");
import { ojNavigationList } from "ojs/ojnavigationlist";
import { DataProvider } from "ojs/ojdataprovider";

// Assuming CoreRouterDetail is defined as in your appController
interface CoreRouterDetail {
  label: string;
  iconClass: string;
  value: string;
}

// Define the interface for the properties your component will accept
interface NavigationProperties {
  // dataProvider: Passed directly as the DataProvider object
  dataProvider: DataProvider<
    string,
    CoreRouter.CoreRouterState<CoreRouterDetail>
  >;

  // selection: Passed directly as the ko.Observable from the parent (KnockoutRouterAdapter)
  selection: ko.Observable<string | undefined>;
}

class NavigationViewModel {
  // Expose properties received from the parent component.
  // DO NOT wrap them in ko.Observable() again.
  // They hold the actual values/observables passed by the caller.
  public dataProvider: NavigationProperties["dataProvider"];
  public selection: NavigationProperties["selection"];

  constructor(context: any) {
    // Get the properties passed from the host view
    const props = context.properties as NavigationProperties;

    // The values are assigned directly. 
    // If 'selection' is passed using two-way binding ({{selection}}), 
    // it will be the actual ko.Observable from the RootViewModel.
    this.dataProvider = props.dataProvider;
    this.selection = props.selection;
  }

  /**
   * Optional handler for selection changes. 
   */
  public handleSelectionChanged = (event: CustomEvent) => {
    // Optional custom logic here
  };
}

export default NavigationViewModel;