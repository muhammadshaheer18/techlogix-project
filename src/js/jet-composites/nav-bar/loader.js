define([
  "ojs/ojcomposite",
  "text!./nav-bar-view.html",
  "./nav-bar-viewModel",
  "text!./component.json",
  "css!./nav-bar-styles.css"
], function (Composite, view, viewModel, metadata) {


  Composite.register("nav-bar", {
  view,
  viewModel,
  metadata: {
    "properties": {
      "data": { "type": "any" },
      "selection": { "type": "string" },
      "showNavigation": { "type": "boolean" },
      "toggleDrawer": { "type": "function" }
    }
  }
});


});
