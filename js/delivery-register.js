/* =====================================================================
   delivery-register.js  -  Sign up page for DELIVERY MEN (delivery-register.html)
   ---------------------------------------------------------------------
   1. validateDeliveryRegister() runs when the form is submitted
      (onsubmit="return validateDeliveryRegister()").
   2. It checks the personal fields, then the delivery fields.
   3. If everything is valid, a new user object is push()ed into the
      users array (data.js). The frontend keeps it until the page reloads.
   ===================================================================== */

// Ids of the fields, so all the red errors can be cleared at once
const personalFields = ["fullName", "email", "phone", "gender", "dob"];
const deliveryFields = ["nid", "vehicle", "deliveryArea", "shift"];
const accountFields = ["newUsername", "newPassword", "confirmPassword"];


function validateDeliveryRegister() {
  clearAllRegisterErrors();

  // Run BOTH checks so that every wrong field is marked in one go
  let personalOk = validatePersonal();
  let deliveryOk = validateDeliveryDetails();
  let accountOk = validateAccount();

  if (!(personalOk && deliveryOk && accountOk)) {
    showMessage("registerMessage", "Please fix the fields marked in red.", "error");
    return false;
  }

  // ----- Everything is valid: build the new user object -----
  let newUser = {
    id: nextId("U", users),
    name: document.getElementById("fullName").value.trim(),
    username: document.getElementById("newUsername").value.trim(),
    password: document.getElementById("newPassword").value,
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    gender: getRadioValue("gender"),
    dob: document.getElementById("dob").value,
    role: "Delivery",
    status: "Active",
    nid: document.getElementById("nid").value.trim(),
    vehicle: getRadioValue("vehicle"),
    area: document.getElementById("deliveryArea").value,
    shift: getRadioValue("shift")
  };

  users.push(newUser);
  console.log("New delivery man:", newUser);

  showMessage("registerMessage",
    "Welcome, <strong>" + newUser.name + "</strong>! Your delivery account was created (user id " + newUser.id +
    "). <a href='delivery-login.html'>Log in now</a>.<br>" +
    "<span class='hint'>Frontend version: the account is kept until this page reloads. " +
    "The PHP backend will save it permanently.</span>", "success");

  document.getElementById("registerForm").reset();
  resetRegisterForm(false);
  return false;     // stay on this page so the message can be read
}


// Step 1: name, email, phone, gender, date of birth
function validatePersonal() {
  let isValid = true;

  let fullName = document.getElementById("fullName").value.trim();
  let email = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  let dob = document.getElementById("dob").value;

  if (fullName.length < 3) {
    showError("fullName", "Full name must be at least 3 characters.");
    isValid = false;
  }

  if (isEmpty(email)) {
    showError("email", "Email is required.");
    isValid = false;
  } else if (isValidEmail(email) === false) {
    showError("email", "Please enter a valid email address.");
    isValid = false;
  } else if (isTaken("email", email)) {
    showError("email", "An account with this email already exists.");
    isValid = false;
  }

  if (isDigitsOnly(phone) === false || phone.length !== 11 || phone.slice(0, 2) !== "01") {
    showError("phone", "Phone must be 11 digits and start with 01.");
    isValid = false;
  }

  if (getRadioValue("gender") === "") {
    showError("gender", "Please select an option.");
    isValid = false;
  }

  // A delivery man must be at least 18 years old
  if (dob === "") {
    showError("dob", "Date of birth is required.");
    isValid = false;
  } else if (daysBetween(dob, todayString()) / 365 < 18) {
    showError("dob", "A delivery man must be at least 18 years old.");
    isValid = false;
  }

  return isValid;
}


// Step 2: NID, vehicle, working area, shift
function validateDeliveryDetails() {
  let isValid = true;
  let nid = document.getElementById("nid").value.trim();

  // A Bangladeshi NID has 10, 13 or 17 digits
  let goodLength = (nid.length === 10 || nid.length === 13 || nid.length === 17);
  if (isDigitsOnly(nid) === false || goodLength === false) {
    showError("nid", "NID must be 10, 13 or 17 digits.");
    isValid = false;
  } else if (isTaken("nid", nid)) {
    showError("nid", "This NID is already registered.");
    isValid = false;
  }

  if (getRadioValue("vehicle") === "") {
    showError("vehicle", "Please choose your vehicle.");
    isValid = false;
  }

  if (document.getElementById("deliveryArea").value === "") {
    showError("deliveryArea", "Please select your working area.");
    isValid = false;
  }

  if (getRadioValue("shift") === "") {
    showError("shift", "Please choose a shift.");
    isValid = false;
  }

  return isValid;
}


// Step 3: username and password
function validateAccount() {
  let isValid = true;

  let username = document.getElementById("newUsername").value.trim();
  let password = document.getElementById("newPassword").value;
  let confirmPassword = document.getElementById("confirmPassword").value;

  if (username.length < 4) {
    showError("newUsername", "Username must be at least 4 characters.");
    isValid = false;
  } else if (username.indexOf(" ") !== -1) {
    showError("newUsername", "Username cannot contain spaces.");
    isValid = false;
  } else if (isTaken("username", username)) {
    showError("newUsername", "This username is already taken.");
    isValid = false;
  }

  if (password.length < 8) {
    showError("newPassword", "Password must be at least 8 characters.");
    isValid = false;
  } else if (hasDigit(password) === false) {
    showError("newPassword", "Password must contain at least one digit.");
    isValid = false;
  }

  if (confirmPassword === "" || confirmPassword !== password) {
    showError("confirmPassword", "Password and Confirm Password must match.");
    isValid = false;
  }

  return isValid;
}


/* ---------------------------------------------------------------------
   SMALL HELPERS
   --------------------------------------------------------------------- */

// true if any user already has this value in this property, e.g. isTaken("email", "a@b.com")
// Bracket notation user[property] reads a property whose name is in a variable.
function isTaken(property, value) {
  for (const user of users) {
    if (user[property] !== undefined && String(user[property]).toLowerCase() === value.toLowerCase()) {
      return true;
    }
  }
  return false;
}

// true if the text contains at least one digit 0-9
function hasDigit(text) {
  let digits = "0123456789";
  for (let i = 0; i < text.length; i++) {
    if (digits.indexOf(text[i]) !== -1) {
      return true;
    }
  }
  return false;
}

// Live password strength (onkeyup): counts how many rules the password meets
function showPasswordStrength() {
  let password = document.getElementById("newPassword").value;
  let text = document.getElementById("strengthText");
  let score = 0;

  if (password.length >= 8) { score++; }
  if (password.length >= 12) { score++; }
  if (hasDigit(password)) { score++; }
  if (password.toLowerCase() !== password) { score++; }   // has a capital letter

  if (password === "") {
    text.innerHTML = "";
  } else if (score <= 1) {
    text.innerHTML = "Strength: weak";
    text.style.color = "#C62828";
  } else if (score <= 2) {
    text.innerHTML = "Strength: fair";
    text.style.color = "#EF6C00";
  } else {
    text.innerHTML = "Strength: strong";
    text.style.color = "#2E7D32";
  }
}

// DHTML: the button is enabled only when the terms box is ticked
function toggleRegisterButton() {
  document.getElementById("registerButton").disabled = !document.getElementById("terms").checked;
}

function clearAllRegisterErrors() {
  clearErrors(personalFields);
  clearErrors(deliveryFields);
  clearErrors(accountFields);
}

// "Start Again" button; clearMessage is false when a message was just shown
function resetRegisterForm(clearMessage) {
  clearAllRegisterErrors();
  document.getElementById("registerButton").disabled = true;
  document.getElementById("strengthText").innerHTML = "";
  if (clearMessage !== false) {
    hideMessage("registerMessage");
  }
}
