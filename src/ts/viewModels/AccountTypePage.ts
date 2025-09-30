import * as ko from 'knockout';
import appViewModel from '../appController';

class AccountTypePage {
  selectedAccountType = ko.observable<string>('Individual');
  cnicNumber = ko.observable<string>('');
  cnicError = ko.observable<string>('');
  isLoading = ko.observable<boolean>(false);

  accountTypes = ko.observableArray([
    'Individual',
    'Sole Proprietor', 
    'Credit Card',
    'Smart Wallet',
    'Foreign National'
  ]);

  constructor() {
    // Auto-format CNIC live as user types
    this.cnicNumber.subscribe((val) => this.formatCNIC(val));
  }

  // ----- UI actions -----
  selectAccountType = (type: string) => {
    this.selectedAccountType(type);
    console.log('Selected account type:', type);
  };

  goBack = () => {
    if (appViewModel?.router) {
      // Navigate to previous page - adjust path as needed
      appViewModel.router.go({ path: 'HomePage' });
    } else {
      window.history.back();
    }
  };

  goNext = () => {
    if (!this.validateCNIC()) return;

    this.isLoading(true);

    // Simulate processing time
    setTimeout(() => {
      this.isLoading(false);
      
      if (appViewModel?.router) {
        // ✅ Mark current step as completed and navigate to next
        appViewModel.goToNextStep('accountTypePage', 'accountDetailsPage');
        
        console.log('Completed steps:', appViewModel.completedSteps());
      } else {
        alert(
          `Navigation successful!\nCNIC: ${this.cnicNumber()}\nAccount Type: ${this.selectedAccountType()}`
        );
      }
    }, 500);
  };

  // ----- Formatting & Validation -----
  private formatCNIC = (value: string) => {
    if (!value) return;

    let digits = value.replace(/\D/g, '');
    if (digits.length > 13) digits = digits.slice(0, 13);

    let formatted = digits;
    if (digits.length > 5) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5);
    }
    if (digits.length > 12) {
      formatted = digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
    }

    // Only update if different to avoid infinite loops
    if (formatted !== this.cnicNumber()) {
      this.cnicNumber(formatted);
    }

    // Clear error when user starts typing
    if (this.cnicError()) {
      this.cnicError('');
    }
  };

  private isCnicStructurallyValid = (): boolean => {
    const clean = this.cnicNumber().replace(/\D/g, '');
    if (clean.length !== 13) return false;
    if (clean === '0000000000000') return false;
    if (/^(.)\1+$/.test(clean)) return false;
    return /^[0-9]{13}$/.test(clean);
  };

  validateCNIC = (): boolean => {
    const clean = this.cnicNumber().replace(/\D/g, '');
    
    if (!clean) {
      this.cnicError('CNIC number is required');
      return false;
    }
    
    if (!this.isCnicStructurallyValid()) {
      this.cnicError('Invalid CNIC. Use format 12345-1234567-1 (13 digits).');
      return false;
    }
    
    this.cnicError('');
    return true;
  };

  // Computed observable for form validation
  isFormValid = ko.pureComputed(() => {
    const clean = this.cnicNumber().replace(/\D/g, '');
    return clean.length === 13 && !this.cnicError() && !this.isLoading();
  });

  // Clear CNIC error on focus
  onCnicFocus = () => {
    this.cnicError('');
  };

  // Component lifecycle methods
  connected = (): void => {
    console.log('accountTypePage connected');
  };

  disconnected = (): void => {
    console.log('accountTypePage disconnected');
  };
}

export = AccountTypePage;