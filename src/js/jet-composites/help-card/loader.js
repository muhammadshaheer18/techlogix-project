define([
  "ojs/ojcomposite",
  "text!./help-card-view.html",
  "./help-card-viewModel",
  "text!./component.json",
  "css!./help-card-styles.css"
], function (Composite, view, viewModel, metadata) {


  Composite.register("help-card", {
  view,
  viewModel,
  metadata: {
    "properties": {
    }
  }
});


});
