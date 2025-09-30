define(["knockout"], function(ko) {
  function ViewModel(context) {
    var self = this;

    // ✅ Always define properties like this:
    self.properties = context.properties || {};

    // ❌ Wrong: self.properties['help-card'] (if 'help-card' isn't passed)
    // ✅ Safe access:
    self.helpCard = self.properties.helpCard || self.properties['help-card'] || null;

    console.log("Help Card Value:", self.helpCard);
  }
  return ViewModel;
});
