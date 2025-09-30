/**
 * @license
 * Copyright (c) 2014, 2025
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 */
define(["knockout"], function (ko) {
  function ViewModel(context) {
    console.log("✅ NAV-BAR VIEWMODEL LOADED");

    var self = this;
    self.properties = context.properties || {};

    // Unwrap steps safely (ArrayDataProvider exposes .data array)
    self.steps = ko.unwrap(self.properties.data?.data) || [];

    // ✅ SOLUTION: Get observables from global appViewModel
    if (window.appViewModel) {
      self.currentStep = window.appViewModel.currentStep;
      self.completedSteps = window.appViewModel.completedSteps;
      console.log("✅ Using global appViewModel observables");
    } else {
      // Fallback if window.appViewModel isn't ready yet
      self.currentStep = ko.observable("");
      self.completedSteps = ko.observableArray([]);
      console.log("⚠️ Using fallback observables");
    }

    // Debug: Log initial values
    console.log("🔍 nav-bar initialized with:");
    console.log("  - currentStep:", ko.unwrap(self.currentStep));
    console.log("  - completedSteps:", ko.unwrap(self.completedSteps));

    // ✅ Subscribe to changes for debugging
    if (ko.isObservable(self.currentStep)) {
      self.currentStep.subscribe(function (newPath) {
        console.log("📍 nav-bar sees currentStep change:", newPath);
      });
    }

    if (ko.isObservable(self.completedSteps)) {
      self.completedSteps.subscribe(function (completed) {
        console.log("✅ nav-bar sees completedSteps change:", completed);
      });
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
      
      console.log("🔍 Step:", stepPath, "Current:", isCurrent, "Completed:", isCompleted);
      
      if (isCurrent) {
        return "active";
      }
      if (isCompleted) {
        return "completed";
      }
      return "incomplete";
    };

    // ✅ Connector should be green if the step BEFORE it is completed OR current
    self.getConnectorStatus = function (stepPath) {
      if (self.isStepCompleted(stepPath) || self.isStepCurrent(stepPath)) {
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