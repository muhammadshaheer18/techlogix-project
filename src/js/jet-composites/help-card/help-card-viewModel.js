define(['knockout'], function (ko) {
  function HelpViewModel(context) {

    var self = this;

    self.helpPages = ko.observableArray([
      {
        image: "/css/images/Icons/nic.svg",
        title: "Find your CNIC Identity Number",
        text: "Permanent citizens of Pakistan can find their CNIC number on their identity card issued by NADRA."
      },
      {
        image: "/css/images/Icons/cheque.png",
        title: "How to find your Account Number",
        text: "The Simplest way of finding your Account Number is to look for it on your cheque book."
      },
    ]);

    self.currentIndex = ko.observable(0);

    self.currentPage = ko.computed(() => {
      return self.helpPages()[self.currentIndex()];
    });

    self.nextPage = function () {
      if (self.currentIndex() < self.helpPages().length - 1) {
        self.currentIndex(self.currentIndex() + 1);
      }
    };

    self.prevPage = function () {
      if (self.currentIndex() > 0) {
        self.currentIndex(self.currentIndex() - 1);
      }
    };
  }

  return HelpViewModel;
});
