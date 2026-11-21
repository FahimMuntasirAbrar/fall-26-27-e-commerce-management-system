// login.html: the admin login page.
// Admins open the dashboard; other roles are sent to their own login pages.

function validateLogin() {
  clearErrors();
  hideMessage("loginMessage");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  let ok = true;

  if (username === "") { showError("usernameError", "Enter your username or email."); ok = false; }
  if (password === "") { showError("passwordError", "Enter your password."); ok = false; }
  else if (password.length < 8) { showError("passwordError", "Passwords have at least 8 characters."); ok = false; }
  if (!ok) { return false; }

  for (let i = 0; i < users.length; i++) {
    const sameName = users[i].username.toLowerCase() === username.toLowerCase() ||
                     users[i].email.toLowerCase() === username.toLowerCase();
    if (sameName && users[i].password === password) {
      if (users[i].status === "pending") {
        showMessage("loginMessage", "Your seller account is waiting for admin approval.", "info");
        return false;
      }
      if (users[i].status === "blocked") {
        showMessage("loginMessage", "This account has been blocked by an admin.", "error");
        return false;
      }
      // This page is the admin login; the other roles have their own login pages
      switch (users[i].role) {
        case "admin":
          localStorage.setItem("loggedInUser", JSON.stringify(users[i]));
          location.href = "admin.html";
          break;
        case "seller":
          showMessage("loginMessage", "Sellers log in on the <a href='seller-login.html'>Seller login page</a>.", "info");
          break;
        case "customer":
          showMessage("loginMessage", "Customers log in on the <a href='customer-login.html'>Customer login page</a>.", "info");
          break;
        case "delivery":
          showMessage("loginMessage", "Delivery operators log in on the <a href='delivery-login.html'>Delivery login page</a>.", "info");
          break;
      }
      return false;
    }
  }
  showMessage("loginMessage", "Wrong username or password.", "error");
  return false;
}

// "Use" buttons in the demo accounts table
function fillDemo(username, password) {
  document.getElementById("username").value = username;
  document.getElementById("password").value = password;
  clearErrors();
  hideMessage("loginMessage");
}

// Show / hide the password by changing the input's type
function togglePassword() {
  const field = document.getElementById("password");
  field.type = document.getElementById("showPassword").checked ? "text" : "password";
}
