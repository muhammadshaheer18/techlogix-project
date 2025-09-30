define([
    "knockout",
    "ojs/ojcontext",
    "ojs/ojcomposite",
    "ojs/ojknockout"
], function (ko, Context, Composite) {
    "use strict";

    function ViewModel(context) {
        console.log("NAV-BAR VIEWMODEL LOADED!");

        var self = this;
        self.composite = context.element;
        self.properties = context.properties;
        
        // Track if we're currently navigating to prevent loops
        self.isNavigating = false;
        
        // ✅ Create the selection handler - must be on self to be accessible in view
        self.onSelectionChanged = function (event) {
            console.log("=== onSelectionChanged called ===");
            console.log("Event:", event);
            console.log("Event detail:", event.detail);
            return true; // Allow the selection to proceed
        };
        
        // ✅ Watch the selection property for changes
        if (self.properties.selection) {
            console.log("Selection property type:", typeof self.properties.selection);
            console.log("Is observable?", ko.isObservable(self.properties.selection));
            console.log("Initial selection value:", ko.unwrap(self.properties.selection));
            
            // Create or wrap as observable
            var selectionObservable;
            if (ko.isObservable(self.properties.selection)) {
                selectionObservable = self.properties.selection;
            } else {
                // If it's a plain string, create an observable and keep it synced
                selectionObservable = ko.observable(self.properties.selection);
                
                // Watch for external changes to the property
                if (context.properties.selection) {
                    Object.defineProperty(context.properties, 'selection', {
                        get: function() { return selectionObservable(); },
                        set: function(val) { selectionObservable(val); },
                        enumerable: true,
                        configurable: true
                    });
                }
            }
            
            // Subscribe to selection changes
            self.selectionSubscription = selectionObservable.subscribe(function(newPath) {
                console.log("=== Selection changed to:", newPath);
                
                // Prevent navigation loops
                if (self.isNavigating) {
                    console.log("Already navigating, skipping...");
                    return;
                }
                
                if (newPath && window.appRouter) {
                    self.isNavigating = true;
                    
                    console.log("Attempting navigation to:", newPath);
                    
                    // Navigate using the global router instance
                    window.appRouter.go({ path: newPath })
                        .then(function() {
                            console.log("✓ Navigation successful to:", newPath);
                            self.isNavigating = false;
                        })
                        .catch(function(error) {
                            console.error("✗ Navigation failed:", error);
                            self.isNavigating = false;
                        });
                } else if (!window.appRouter) {
                    console.error("Router not available on window.appRouter");
                }
            });
            
            // Trigger initial navigation if needed
            var initialPath = selectionObservable();
            if (initialPath) {
                console.log("Initial path:", initialPath);
            }
        } else {
            console.warn("No selection property passed to nav-bar component");
        }
    }

    // Lifecycle hooks
    ViewModel.prototype.activated = function (context) {
        console.log("nav-bar activated");
    };
    
    ViewModel.prototype.connected = function (context) {
        console.log("nav-bar connected");
        console.log("Router available:", !!window.appRouter);
        
        if (window.appRouter) {
            console.log("Router object:", window.appRouter);
            console.log("Router methods:", Object.keys(window.appRouter));
        }
    };
    
    ViewModel.prototype.bindingsApplied = function (context) {
        console.log("nav-bar bindings applied");
    };
    
    ViewModel.prototype.propertyChanged = function (context) {
        console.log("nav-bar property changed:", context.property, "=", context.value);
        
        // Handle selection property changes from parent
        if (context.property === 'selection' && context.value) {
            console.log("Selection property updated from parent to:", context.value);
        }
    };
    
    ViewModel.prototype.disconnected = function (element) {
        console.log("nav-bar disconnected");
        // Clean up subscription
        if (this.selectionSubscription) {
            this.selectionSubscription.dispose();
        }
    };

    return ViewModel;
});