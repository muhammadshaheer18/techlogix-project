# Onboarding Website – README

## Overview

The **Onboarding Website** is a front-end web project built using **Oracle JET**, **Knockout.js**, **HTML**, **CSS**, and supporting JavaScript modules. The platform streamlines multi-step onboarding for users by capturing key details such as CNIC, Account Information, Contact Details, and personal verification data. It uses modular page components and routing to deliver a smooth, guided user experience.

---

## Features

###  Multi-Step Onboarding Flow

* CNIC entry and validation page
* User profile and account type selection
* IBAN entry and validation
* Contact details submission
* Confirmation screens

###  Modular Oracle JET Architecture

* Each page is a standalone module with its own View (HTML), ViewModel (JS), and CSS.
* Routing handled via **appController** using Knockout observables.
* Consistent UI using **Oracle JET components** such as:

  * `oj-input-text`
  * `oj-input-password`
  * `oj-form-layout`
  * `oj-button`
  * `oj-validation` utilities

###  Client-Side Validations

* CNIC format validations
* Required field checks
* Conditional rendering logic
* Real-time input masking

###  Show / Hide Password Functionality

Implemented using Knockout observables and dynamic attribute updates.

###  Responsive Layout

* Custom CSS + Oracle JET layout utilities
* Works on mobile, tablet, and desktop

---

## Folder Structure

```
src/
│
├── js/
│   ├── appController.ts
│   ├── routers/
│   ├── viewModels/
│   │   ├── cnicPage.ts
│   │   ├── accountIbanPage.ts
│   │   ├── contactPage.ts
│   │   ├── confirmationPage.ts
│   │   └── ...
│   └── utils/
│
├── views/
│   ├── cnicPage.html
│   ├── accountIbanPage.html
│   ├── contactPage.html
│   ├── confirmationPage.html
│   └── ...
│
├── css/
│   ├── CnicPage.css
│   ├── AccountIbanPage.css
│   ├── ContactPage.css
│   └── ...
│
└── index.html
```

---

## Technologies Used

| Technology                  | Purpose                                |
| --------------------------- | -------------------------------------- |
| **Oracle JET**              | UI framework and integrated components |
| **Knockout.js**             | MVVM bindings and reactivity           |
| **TypeScript / JavaScript** | Business logic & routing               |
| **HTML5**                   | Page structure                         |
| **CSS3**                    | Styling and responsive layout          |
| **RequireJS**               | Module loading for Oracle JET          |

---

## How Routing Works

The main routing system is configured inside **appController.ts**:

* Maintains the global navigation state
* Stores the current page in a knockout observable: `currentPage = ko.observable()`
* When navigating:

  ```ts
  this.currentPage("accountIbanPage");
  ```
* The UI dynamically loads the corresponding HTML view

If an error occurs (e.g., incorrect route), a fallback "Unexpected Error" message appears.

---

## Key Components

### ### 1. CNIC Page

* Captures user CNIC
* Includes format validator (#####-#######-#)
* Leads to Account IBAN page on success

### ### 2. Account IBAN Page

* Accepts IBAN number
* IBAN format & length validation

### ### 3. Contact Page

* Captures phone number, email address, and other fields
* Includes form validation and error handling

### ### 4. Confirmation Page

* Displays entered user details
* Final submission step

---

## Show / Hide Password Functionality

Example Knockout snippet:

```ts
this.isPasswordVisible = ko.observable(false);
this.togglePassword = () => {
  this.isPasswordVisible(!this.isPasswordVisible());
};
```

Bound in HTML using:

```html
<oj-input-password type="{{ isPasswordVisible() ? 'text' : 'password' }}"></oj-input-password>
```

---

## How to Run the Project

### 1. Install dependencies

```
npm install
```

### 2. Start development server



## Author

**Muhammad Shaheer**

---

## License

This project is for educational and organizational use. Modify as needed.

## Screenshots: 

![Homepage](https://github.com/user-attachments/assets/1c6008b1-d8b5-419c-baa8-d55dd0d6b367)
![AccountTypePage](https://github.com/user-attachments/assets/e7724b72-7829-4a3d-90f9-32e978424793)
![AccountDetailsPage](https://github.com/user-attachments/assets/9ef29725-901d-4bc8-96c8-a52bd7fbf2a3)
![LoginDetailsPage](https://github.com/user-attachments/assets/bd9fdeca-e7a2-4bd8-996b-f14b8d2f6f66)
![PasswordDetailsPage](https://github.com/user-attachments/assets/205330b1-9131-4aef-bfcf-c5a878f0df84)
![otppage](https://github.com/user-attachments/assets/7e679fe3-76bd-43a2-b21e-712a9c38f99d)
![termsPage](https://github.com/user-attachments/assets/8776717f-d012-4a2e-81a1-9a5354aad27d)
![ConfirmationScreen](https://github.com/user-attachments/assets/ad0bc3c3-25d1-4b84-94eb-af3c08339472)









