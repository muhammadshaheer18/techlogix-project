define([
    "knockout",
    "ojs/ojcontext",
    "ojs/ojcomposite",
    "ojs/ojknockout"
], function (ko, Context, Composite) {
    "use strict";

    function ViewModel(context) {
        console.log("NAV-BAR VIEWMODEL LOADED!");

        // ✅ Remove BusyContext to avoid hanging composite initialization
        this.composite = context.element;
        this.messageText = ko.observable("Hello from nav-bar");
        this.properties = context.properties;
        this.onSelectionChanged = function (event) {
            if (event.detail.value) {
                // Trigger CoreRouter navigation
                window.r.go(event.detail.value);
            }
        };
    }

    // Lifecycle hooks (optional to use)
    ViewModel.prototype.activated = function (context) { };
    ViewModel.prototype.connected = function (context) { };
    ViewModel.prototype.bindingsApplied = function (context) { };
    ViewModel.prototype.propertyChanged = function (context) { };
    ViewModel.prototype.disconnected = function (element) { };

    return ViewModel;
});
