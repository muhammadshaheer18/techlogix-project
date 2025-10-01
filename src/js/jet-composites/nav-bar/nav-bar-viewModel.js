define(["knockout"], function (ko) {
  function ViewModel(context) {
    var self = this;
    self.properties = context.properties || {};

    // Unwrap steps safely (ArrayDataProvider exposes .data array)
    self.steps = ko.unwrap(self.properties.data?.data) || [];

    if (window.appViewModel) {
      self.currentStep = window.appViewModel.currentStep;
      self.completedSteps = window.appViewModel.completedSteps;
    } else {
      self.currentStep = ko.observable("");
      self.completedSteps = ko.observableArray([]);
    }

    if (ko.isObservable(self.currentStep)) {
      self.currentStep.subscribe(function (newPath) {});
    }

    if (ko.isObservable(self.completedSteps)) {
      self.completedSteps.subscribe(function (completed) {});
    }

    // ---- Helpers ----
    self.isStepCompleted = function (stepPath) {
      var completed = ko.unwrap(self.completedSteps) || [];
      return completed.includes(stepPath);
    };

    self.isStepCurrent = function (stepPath) {
      var current = ko.unwrap(self.currentStep);
      return current === stepPath;
    };

    self.getStepStatus = function (stepPath) {
      var isCurrent = self.isStepCurrent(stepPath);
      var isCompleted = self.isStepCompleted(stepPath);

      if (isCurrent) {
        return "active";
      }
      if (isCompleted) {
        return "completed";
      }
      return "incomplete";
    };

    self.getConnectorStatus = function (stepPath) {
      if (self.isStepCurrent(stepPath)) {
        return "active";
      } else if (self.isStepCompleted(stepPath)) {
        return "completed";
      }
      return "incomplete";
    };

    self.isLastStep = function (stepPath) {
      return (
        self.steps.length > 0 &&
        self.steps[self.steps.length - 1].path === stepPath
      );
    };
  }

  return ViewModel;
});
