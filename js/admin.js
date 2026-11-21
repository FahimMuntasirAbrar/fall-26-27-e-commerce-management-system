/* =====================================================================
   admin.js  -  Everything the Admin can do (admin.html)
   ---------------------------------------------------------------------
   CRUD + Search : Manage users (users array)
   Unique 1      : Statistics report
   Unique 2      : Seller approvals
   Unique 3      : Platform rules with live preview
   Unique 4      : Category manager
   Unique 5      : Coupon manager
   Unique 6      : Disputes and refunds
   Unique 7      : Announcements
   Unique 8      : Activity log (every function above writes into it)

   The forms on this page never go to another page: each onsubmit
   handler does its work with JavaScript and returns false.
   ===================================================================== */

// -1 means "adding a new user"; any other number is the index being edited
let editUserIndex = -1;

// The first admin account can never be deleted, blocked or changed to another role
const mainAdminId = "U1";

// A copy of the starting rules, used by "Restore defaults"
const defaultRules = { commission: 10, tax: 5, deliveryFee: 60, outsideDeliveryFee: 120 };

// Approve / reject decisions made since the page was opened
let decisions = [];

const roleNames = ["admin", "seller", "customer", "delivery"];

// Writes one entry into the activity log (Unique feature 8 shows them)
function addLog(type, message) {
  activityLog.push({ time: nowString(), type: type, message: message });
}

// Text shown for each role (switch statement)
function roleLabel(role) {
  let label;
  switch (role) {
    case "admin": label = "Admin"; break;
    case "seller": label = "Seller"; break;
    case "customer": label = "Customer"; break;
    case "delivery": label = "Delivery operator"; break;
    default: label = role;
  }
  return label;
}


/* =====================================================================
   MANAGE USERS: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// READ + SEARCH: draw the table rows with a loop and innerHTML
function renderUsers() {
  const keyword = document.getElementById("userSearch").value.trim();
  const roleFilter = document.getElementById("userRoleFilter").value;
  const statusFilter = document.getElementById("userStatusFilter").value;
  let rows = "";
  let shown = 0;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    // SEARCH: skip users that do not match the keyword or the filters
    const matchesKeyword = containsText(u.name, keyword) || containsText(u.username, keyword) ||
                           containsText(u.email, keyword) || containsText(u.id, keyword);
    const matchesRole = (roleFilter === "all" || u.role === roleFilter);
    const matchesStatus = (statusFilter === "all" || u.status === statusFilter);
    if (!(matchesKeyword && matchesRole && matchesStatus)) { continue; }

    // A colour and an extra button for each status
    let statusColor;
    let statusButton;
    switch (u.status) {
      case "active":
        statusColor = "green";
        statusButton = "<button type='button' onclick='setUserStatus(" + i + ", \"blocked\")'>Block</button> ";
        break;
      case "pending":
        statusColor = "orange";
        statusButton = "<button type='button' class='approve' onclick='setUserStatus(" + i + ", \"active\")'>Approve</button> ";
        break;
      default:
        statusColor = "red";
        statusButton = "<button type='button' onclick='setUserStatus(" + i + ", \"active\")'>Unblock</button> ";
    }

    rows += "<tr>" +
              "<td>" + u.id + "</td>" +
              "<td><strong>" + u.name + "</strong><br><small>" + u.email + "</small></td>" +
              "<td>" + u.username + "</td>" +
              "<td><span class='badge role-" + u.role + "'>" + roleLabel(u.role) + "</span></td>" +
              "<td><span class='badge " + statusColor + "'>" + u.status + "</span></td>" +
              "<td>" + statusButton +
                "<button type='button' onclick='editUser(" + i + ")'>Edit</button> " +
                "<button type='button' class='danger' onclick='deleteUser(" + i + ")'>Delete</button></td>" +
            "</tr>";
    shown++;
  }

  if (shown === 0) {
    rows = "<tr><td colspan='6' class='empty-row'>No users match your search.</td></tr>";
  }
  document.getElementById("userRows").innerHTML = rows;
  document.getElementById("userCount").innerHTML = "Showing " + shown + " of " + users.length + " users";
  updatePendingBadge();
}


// CREATE or UPDATE: runs when the user form is submitted
function saveUser() {
  clearErrors();
  const name = document.getElementById("uName").value.trim();
  const username = document.getElementById("uUsername").value.trim();
  const email = document.getElementById("uEmail").value.trim();
  const password = document.getElementById("uPassword").value;
  const role = document.getElementById("uRole").value;
  const status = getRadioValue("uStatus");
  let ok = true;

  // ----- Validation -----
  if (name.length < 3) { showError("uNameError", "Name needs at least 3 characters."); ok = false; }

  if (username.length < 4 || username.indexOf(" ") !== -1) {
    showError("uUsernameError", "Username: 4+ characters, no spaces."); ok = false;
  } else if (usedByOther("username", username)) {
    showError("uUsernameError", "This username is already taken."); ok = false;
  }

  if (!isValidEmail(email)) {
    showError("uEmailError", "Enter a valid email address."); ok = false;
  } else if (usedByOther("email", email)) {
    showError("uEmailError", "Another account already uses this email."); ok = false;
  }

  if (password.length < 8) { showError("uPasswordError", "Password needs at least 8 characters."); ok = false; }
  if (role === "") { showError("uRoleError", "Choose a role."); ok = false; }

  // Only sellers go through approval, so only a seller can be "pending"
  if (status === "pending" && role !== "" && role !== "seller") {
    showError("uStatusError", "Only seller accounts can be pending."); ok = false;
  }

  // The main admin must always stay an active admin
  if (editUserIndex !== -1 && users[editUserIndex].id === mainAdminId) {
    if (role !== "admin" && role !== "") { showError("uRoleError", "The main admin must keep the admin role."); ok = false; }
    if (status !== "active") { showError("uStatusError", "The main admin must stay active."); ok = false; }
  }

  if (!ok) {
    showMessage("userMessage", "Please fix the fields marked in red.", "error");
    return false;
  }

  // ----- Save -----
  if (editUserIndex === -1) {
    // CREATE: build a new object and push() it to the end of the array
    const newUser = { id: newId("U"), name: name, username: username, email: email,
                      password: password, role: role, status: status };
    if (role === "seller") {
      newUser.category = "Not set";
      newUser.tradeLicense = "Not given";
      newUser.appliedOn = todayString();
    }
    users.push(newUser);
    addLog("User", "Created " + roleLabel(role) + " account " + newUser.id + " (" + name + ")");
    showMessage("userMessage", "User <strong>" + name + "</strong> was added with id " + newUser.id + ".", "success");
  } else {
    // UPDATE: change the properties of the object that is being edited
    const u = users[editUserIndex];
    u.name = name;
    u.username = username;
    u.email = email;
    u.password = password;
    u.role = role;
    u.status = status;
    addLog("User", "Updated account " + u.id + " (" + name + ")");
    showMessage("userMessage", "User <strong>" + name + "</strong> (" + u.id + ") was updated.", "success");
  }

  resetUserForm();
  renderUsers();
  return false;   // stop the form from reloading the page
}


// true if another user (not the one being edited) already has this username / email
function usedByOther(property, value) {
  for (let i = 0; i < users.length; i++) {
    if (i !== editUserIndex && users[i][property].toLowerCase() === value.toLowerCase()) {
      return true;
    }
  }
  return false;
}


// UPDATE step 1: copy the user's values into the form
function editUser(i) {
  const u = users[i];
  editUserIndex = i;
  clearErrors();
  document.getElementById("uName").value = u.name;
  document.getElementById("uUsername").value = u.username;
  document.getElementById("uEmail").value = u.email;
  document.getElementById("uPassword").value = u.password;
  document.getElementById("uRole").value = u.role;
  setRadioValue("uStatus", u.status);
  document.getElementById("userFormTitle").innerHTML = "Edit user " + u.id;
  document.getElementById("saveBtn").innerHTML = "Save changes";
  hideMessage("userMessage");
  document.getElementById("uName").focus();
}


// How many products or orders still belong to this user
function countLinkedRecords(userId) {
  let count = 0;
  for (let i = 0; i < products.length; i++) {
    if (products[i].sellerId === userId) { count++; }
  }
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].customerId === userId) { count++; }
  }
  return count;
}


// DELETE: remove the user from the array
function deleteUser(i) {
  const u = users[i];

  if (u.id === mainAdminId) {
    showMessage("userMessage", "The main admin account cannot be deleted.", "error");
    return;
  }
  // Deleting a seller with products (or a customer with orders) would leave
  // records that point to nobody, so those accounts can only be blocked.
  const linked = countLinkedRecords(u.id);
  if (linked > 0) {
    showMessage("userMessage", "<strong>" + u.name + "</strong> still has " + linked +
                " product/order record(s). Block the account instead of deleting it.", "error");
    return;
  }
  if (!confirm("Delete " + u.name + "?")) { return; }

  users = removeAt(users, i);
  addLog("User", "Deleted account " + u.id + " (" + u.name + ")");
  showMessage("userMessage", "User <strong>" + u.name + "</strong> was deleted.", "info");
  resetUserForm();      // the indexes changed, so leave edit mode
  renderUsers();
}


// Block, Unblock and Approve buttons in the table
function setUserStatus(i, newStatus) {
  const u = users[i];
  if (u.id === mainAdminId) {
    showMessage("userMessage", "The main admin account cannot be blocked.", "error");
    return;
  }
  const wasPending = (u.status === "pending");
  u.status = newStatus;

  if (newStatus === "blocked") {
    addLog("User", "Blocked " + u.name);
    showMessage("userMessage", "<strong>" + u.name + "</strong> is blocked and can no longer log in.", "info");
  } else if (wasPending) {
    recordDecision(u.name, "Approved", "Approved from Manage users");
    showMessage("userMessage", "<strong>" + u.name + "</strong> was approved and can now log in.", "success");
  } else {
    addLog("User", "Unblocked " + u.name);
    showMessage("userMessage", "<strong>" + u.name + "</strong> is active again.", "success");
  }
  renderUsers();
}


// Clears the form and goes back to "Add" mode
function resetUserForm() {
  editUserIndex = -1;
  document.getElementById("userForm").reset();
  clearErrors();
  document.getElementById("userFormTitle").innerHTML = "Add new user";
  document.getElementById("saveBtn").innerHTML = "Add user";
}


/* =====================================================================
   UNIQUE FEATURE 1: STATISTICS REPORT
   Step 1: count things with loops.
   Step 2: show the numbers in cards.
   Step 3: draw a bar chart and a pie chart from the numbers.
   ===================================================================== */
function showStats() {

  // ----- Step 1a: total revenue = price x quantity of every order -----
  let revenue = 0;
  for (let i = 0; i < orders.length; i++) {
    const product = findById(products, orders[i].productId);
    if (product) {
      revenue = revenue + product.price * orders[i].qty;
    }
  }
  const commission = Math.round(revenue * rules.commission / 100);

  // ----- Step 2: show the numbers in the four cards -----
  document.getElementById("statUsers").innerHTML = users.length;
  document.getElementById("statProducts").innerHTML = products.length;
  document.getElementById("statOrders").innerHTML = orders.length;
  document.getElementById("statRevenue").innerHTML = revenue + " BDT";
  document.getElementById("statCommission").innerHTML = commission + " BDT";
  document.getElementById("reportTime").innerHTML = "Generated at " + nowString() + ".";

  // ----- Step 3a: BAR CHART - how many users have each role -----
  let bars = "";
  for (const role of roleNames) {
    let count = 0;
    for (let i = 0; i < users.length; i++) {
      if (users[i].role === role) { count++; }
    }
    const percent = Math.round(count / users.length * 100);

    // the width of the orange bar is the percentage, e.g. width:43%
    bars += "<div class='bar-row'>" + roleLabel(role) + ": " + count + " (" + percent + "%)" +
            "<div class='bar-track'><div class='bar' style='width:" + percent + "%'></div></div></div>";
  }
  document.getElementById("roleBars").innerHTML = bars;

  // ----- Step 1b + 3b: PIE CHART - orders by status -----
  let placed = 0;
  let packed = 0;
  let delivered = 0;
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].status === "Placed") { placed++; }
    else if (orders[i].status === "Packed") { packed++; }
    else if (orders[i].status === "Delivered") { delivered++; }
  }

  // Turn each count into a percentage of all orders
  const placedPct = Math.round(placed / orders.length * 100);
  const packedPct = Math.round(packed / orders.length * 100);
  const deliveredPct = 100 - placedPct - packedPct;     // the rest, so the circle adds up to 100%

  // CSS conic-gradient colours a circle in slices: colour start% end%
  // e.g. orange 0% 50%, blue 50% 75%, green 75% 100%
  const end1 = placedPct;
  const end2 = placedPct + packedPct;
  document.getElementById("orderPie").style.background =
    "conic-gradient(#f59e0b 0% " + end1 + "%, #2563eb " + end1 + "% " + end2 + "%, #16a34a " + end2 + "% 100%)";

  document.getElementById("orderLegend").innerHTML =
    "<div class='legend-item'><span class='swatch' style='background:#f59e0b'></span>Placed: " + placed + " (" + placedPct + "%)</div>" +
    "<div class='legend-item'><span class='swatch' style='background:#2563eb'></span>Packed: " + packed + " (" + packedPct + "%)</div>" +
    "<div class='legend-item'><span class='swatch' style='background:#16a34a'></span>Delivered: " + delivered + " (" + deliveredPct + "%)</div>";
}


/* =====================================================================
   UNIQUE FEATURE 2: SELLER APPROVALS
   ===================================================================== */
function countPending() {
  let count = 0;
  for (let i = 0; i < users.length; i++) {
    if (users[i].role === "seller" && users[i].status === "pending") { count++; }
  }
  return count;
}

// The small number on the "Seller approvals" menu button
function updatePendingBadge() {
  const count = countPending();
  const badge = document.getElementById("pendingBadge");
  badge.innerHTML = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}

function renderPending() {
  let rows = "";
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (u.role === "seller" && u.status === "pending") {
      rows += "<tr>" +
                "<td><strong>" + u.name + "</strong><br><small>" + u.username + " &middot; " + u.email + "</small></td>" +
                "<td>" + u.category + "</td>" +
                "<td>" + u.tradeLicense + "</td>" +
                "<td>" + u.appliedOn + "</td>" +
                "<td><input type='text' id='reason" + i + "' placeholder='e.g. Licence not valid'>" +
                    "<span class='error' id='reason" + i + "Error'></span></td>" +
                "<td><button type='button' class='approve' onclick='decideSeller(" + i + ", true)'>Approve</button> " +
                    "<button type='button' class='danger' onclick='decideSeller(" + i + ", false)'>Reject</button></td>" +
              "</tr>";
    }
  }
  if (rows === "") { rows = "<tr><td colspan='6' class='empty-row'>No sellers are waiting.</td></tr>"; }
  document.getElementById("pendingRows").innerHTML = rows;

  // Summary line: count the decisions with a loop
  let approved = 0;
  let rejected = 0;
  for (const d of decisions) {
    if (d.decision === "Approved") { approved++; } else { rejected++; }
  }
  document.getElementById("approveSummary").innerHTML = countPending() + " shop(s) waiting, " +
    approved + " approved and " + rejected + " rejected in this session.";

  updatePendingBadge();
  renderDecisions();
}

function decideSeller(i, approved) {
  const u = users[i];
  const reason = document.getElementById("reason" + i).value.trim();
  clearErrors();

  if (approved) {
    u.status = "active";
    recordDecision(u.name, "Approved", reason === "" ? "Documents accepted" : reason);
    showMessage("approveMessage", "<strong>" + u.name + "</strong> was approved and can now log in and sell.", "success");
  } else {
    // A rejection must say why, so the seller can be told
    if (reason.length < 5) {
      showError("reason" + i + "Error", "Write a reason (at least 5 characters).");
      return;
    }
    // Remove the shop and anything it listed while waiting
    let kept = [];
    for (let j = 0; j < products.length; j++) {
      if (products[j].sellerId !== u.id) { kept.push(products[j]); }
    }
    products = kept;
    users = removeAt(users, i);
    if (editUserIndex !== -1) { resetUserForm(); }   // the indexes changed
    recordDecision(u.name, "Rejected", reason);
    showMessage("approveMessage", "The application of <strong>" + u.name + "</strong> was rejected and removed.", "info");
  }
  renderPending();
  renderUsers();
}

function recordDecision(shop, decision, reason) {
  decisions.push({ time: nowString(), shop: shop, decision: decision, reason: reason });
  addLog("Seller", decision + " seller " + shop + " (" + reason + ")");
}

// The history board is built with createElement + appendChild, newest first
function renderDecisions() {
  const board = document.getElementById("decisionBoard");
  board.innerHTML = "";

  for (let i = decisions.length - 1; i >= 0; i--) {
    const d = decisions[i];
    const item = document.createElement("div");
    item.className = "log-item";
    item.style.borderLeftColor = (d.decision === "Approved") ? "#2a8a3e" : "#c00";
    item.innerHTML = "<small>" + d.time + "</small><br><strong>" + d.shop + "</strong> &mdash; " +
                     d.decision + ". <em>" + d.reason + "</em>";
    board.appendChild(item);
  }
  if (decisions.length === 0) {
    board.innerHTML = "<p class='empty-row'>No decisions yet.</p>";
  }
}


/* =====================================================================
   UNIQUE FEATURE 3: PLATFORM RULES
   The admin sets 4 numbers in the "rules" object (data.js).
   A live preview shows what they mean for a 1000 BDT product.
   ===================================================================== */

// Put the saved rules into the form and into the "Rules in use now" table
function loadRules() {
  document.getElementById("commission").value = rules.commission;
  document.getElementById("tax").value = rules.tax;
  document.getElementById("deliveryFee").value = rules.deliveryFee;
  document.getElementById("outsideDeliveryFee").value = rules.outsideDeliveryFee;

  document.getElementById("currentRulesBody").innerHTML =
    "<tr><td>Seller commission</td><td><strong>" + rules.commission + "%</strong></td></tr>" +
    "<tr><td>Tax</td><td><strong>" + rules.tax + "%</strong></td></tr>" +
    "<tr><td>Inside-Dhaka delivery fee</td><td><strong>" + rules.deliveryFee + " BDT</strong></td></tr>" +
    "<tr><td>Outside-Dhaka delivery fee</td><td><strong>" + rules.outsideDeliveryFee + " BDT</strong></td></tr>";

  previewRules();
}

// Runs on every key press (onkeyup), so the admin sees the result while typing
function previewRules() {
  const commission = Number(document.getElementById("commission").value);
  const tax = Number(document.getElementById("tax").value);
  const insideFee = Number(document.getElementById("deliveryFee").value);
  const outsideFee = Number(document.getElementById("outsideDeliveryFee").value);

  const price = 1000;
  const platformGets = price * commission / 100;
  const taxAmount = price * tax / 100;

  document.getElementById("rulesPreview").innerHTML =
    "<p>The platform earns <strong>" + platformGets + " BDT</strong>; the seller keeps <strong>" + (price - platformGets) + " BDT</strong>.</p>" +
    "<p>A customer inside Dhaka pays <strong>" + (price + taxAmount + insideFee) + " BDT</strong>.</p>" +
    "<p>A customer outside Dhaka pays <strong>" + (price + taxAmount + outsideFee) + " BDT</strong>.</p>";
}

// Checks one number field is between min and max; shows an error if not
function checkRange(fieldId, min, max) {
  const text = document.getElementById(fieldId).value;
  const number = Number(text);
  if (text === "" || number < min || number > max) {
    showError(fieldId + "Error", "Enter a number from " + min + " to " + max + ".");
    return false;
  }
  return true;
}

function saveRules() {
  clearErrors();

  // Check every field first, so every error is shown at once
  const ok1 = checkRange("commission", 0, 50);
  const ok2 = checkRange("tax", 0, 30);
  const ok3 = checkRange("deliveryFee", 0, 500);
  const ok4 = checkRange("outsideDeliveryFee", 0, 1000);
  let ok = ok1 && ok2 && ok3 && ok4;

  // One rule that compares two fields: outside Dhaka can't be cheaper than inside
  const insideFee = Number(document.getElementById("deliveryFee").value);
  const outsideFee = Number(document.getElementById("outsideDeliveryFee").value);
  if (ok3 && ok4 && outsideFee < insideFee) {
    showError("outsideDeliveryFeeError", "Must not be lower than the inside-Dhaka fee.");
    ok = false;
  }

  if (!ok) {
    showMessage("rulesMessage", "Some values are not valid. Nothing was saved.", "error");
    return false;
  }

  // Save the four numbers into the rules object
  rules.commission = Number(document.getElementById("commission").value);
  rules.tax = Number(document.getElementById("tax").value);
  rules.deliveryFee = insideFee;
  rules.outsideDeliveryFee = outsideFee;

  addLog("Rules", "Saved platform rules (commission " + rules.commission + "%, tax " + rules.tax + "%)");
  showMessage("rulesMessage", "Platform rules saved.", "success");
  loadRules();
  return false;
}

function restoreDefaultRules() {
  rules.commission = defaultRules.commission;
  rules.tax = defaultRules.tax;
  rules.deliveryFee = defaultRules.deliveryFee;
  rules.outsideDeliveryFee = defaultRules.outsideDeliveryFee;

  clearErrors();
  addLog("Rules", "Restored default platform rules");
  showMessage("rulesMessage", "Default rules restored.", "info");
  loadRules();
}


/* =====================================================================
   UNIQUE FEATURE 4: CATEGORY MANAGER
   categories is a simple array of texts, e.g. ["Electronics", "Grocery"]
   ===================================================================== */
let editCategoryIndex = -1;   // -1 means "adding a new category"

// How many products are in a category
function countProductsIn(categoryName) {
  let count = 0;
  for (let i = 0; i < products.length; i++) {
    if (products[i].category === categoryName) { count++; }
  }
  return count;
}

function renderCategories() {
  let rows = "";
  for (let i = 0; i < categories.length; i++) {
    rows += "<tr><td>" + (i + 1) + "</td><td>" + categories[i] + "</td><td>" + countProductsIn(categories[i]) + "</td>" +
            "<td><button type='button' onclick='editCategory(" + i + ")'>Rename</button> " +
            "<button type='button' class='danger' onclick='deleteCategory(" + i + ")'>Delete</button></td></tr>";
  }
  if (rows === "") { rows = "<tr><td colspan='4' class='empty-row'>No categories yet.</td></tr>"; }
  document.getElementById("categoryRows").innerHTML = rows;
}

function saveCategory() {
  clearErrors();
  const name = document.getElementById("catName").value.trim();

  if (name.length < 3 || name.length > 20) {
    showError("catNameError", "Name must be 3 to 20 characters.");
    return false;
  }
  for (let i = 0; i < categories.length; i++) {
    if (i !== editCategoryIndex && categories[i].toLowerCase() === name.toLowerCase()) {
      showError("catNameError", "This category already exists.");
      return false;
    }
  }

  if (editCategoryIndex === -1) {
    categories.push(name);
    addLog("Category", "Added category " + name);
    showMessage("categoryMessage", "Category <strong>" + name + "</strong> was added.", "success");
  } else {
    // RENAME: products in the old category must move to the new name too
    const oldName = categories[editCategoryIndex];
    for (let i = 0; i < products.length; i++) {
      if (products[i].category === oldName) { products[i].category = name; }
    }
    categories[editCategoryIndex] = name;
    addLog("Category", "Renamed category " + oldName + " to " + name);
    showMessage("categoryMessage", "<strong>" + oldName + "</strong> was renamed to <strong>" + name + "</strong>.", "success");
  }
  resetCategoryForm();
  renderCategories();
  return false;
}

function editCategory(i) {
  editCategoryIndex = i;
  document.getElementById("catName").value = categories[i];
  document.getElementById("catSaveBtn").innerHTML = "Save new name";
  document.getElementById("catName").focus();
}

function deleteCategory(i) {
  const name = categories[i];
  const used = countProductsIn(name);
  if (used > 0) {
    showMessage("categoryMessage", "<strong>" + name + "</strong> still has " + used + " product(s), so it cannot be deleted.", "error");
    return;
  }
  categories = removeAt(categories, i);
  addLog("Category", "Deleted category " + name);
  showMessage("categoryMessage", "Category <strong>" + name + "</strong> was deleted.", "info");
  resetCategoryForm();
  renderCategories();
}

function resetCategoryForm() {
  editCategoryIndex = -1;
  document.getElementById("catName").value = "";
  document.getElementById("catSaveBtn").innerHTML = "Add category";
  clearErrors();
}


/* =====================================================================
   UNIQUE FEATURE 5: COUPON MANAGER
   ===================================================================== */

// "Active", "Inactive" (switched off by the admin) or "Expired" (date has passed).
// Dates are "YYYY-MM-DD" texts, so < compares them correctly.
function couponStatus(coupon) {
  if (coupon.active === false) { return "Inactive"; }
  if (coupon.expiry < todayString()) { return "Expired"; }
  return "Active";
}

// What a coupon takes off an order of "amount" BDT
function couponDiscount(type, value, amount) {
  let discount;
  if (type === "percent") {
    discount = Math.round(amount * value / 100);
  } else {
    discount = value;
  }
  if (discount > amount) { discount = amount; }   // never more than the order itself
  return discount;
}

function renderCoupons() {
  let rows = "";
  for (let i = 0; i < coupons.length; i++) {
    const c = coupons[i];
    const status = couponStatus(c);
    let color;
    switch (status) {
      case "Active": color = "green"; break;
      case "Expired": color = "red"; break;
      default: color = "orange";
    }
    const valueText = (c.type === "percent") ? c.value + "% off" : c.value + " BDT off";
    const toggleText = c.active ? "Deactivate" : "Activate";
    rows += "<tr><td><strong>" + c.code + "</strong></td><td>" + valueText + "</td><td>" + c.expiry + "</td>" +
            "<td><span class='badge " + color + "'>" + status + "</span></td>" +
            "<td><button type='button' onclick='toggleCoupon(" + i + ")'>" + toggleText + "</button> " +
            "<button type='button' class='danger' onclick='deleteCoupon(" + i + ")'>Delete</button></td></tr>";
  }
  if (rows === "") { rows = "<tr><td colspan='5' class='empty-row'>No coupons yet.</td></tr>"; }
  document.getElementById("couponRows").innerHTML = rows;
}

// true when every character is a capital letter or a digit
function isCodeText(text) {
  const allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < text.length; i++) {
    if (allowed.indexOf(text[i]) === -1) { return false; }
  }
  return true;
}

function saveCoupon() {
  clearErrors();
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  const type = document.getElementById("couponType").value;
  const valueText = document.getElementById("couponValue").value;
  const value = Number(valueText);
  const expiry = document.getElementById("couponExpiry").value;
  let ok = true;

  if (code.length < 4 || code.length > 12 || !isCodeText(code)) {
    showError("couponCodeError", "Code: 4 to 12 letters or digits, no spaces."); ok = false;
  } else {
    for (let i = 0; i < coupons.length; i++) {
      if (coupons[i].code === code) { showError("couponCodeError", "This code already exists."); ok = false; }
    }
  }
  // The allowed value depends on the type: a percentage or an amount in BDT
  if (type === "percent" && (valueText === "" || value < 1 || value > 90)) {
    showError("couponValueError", "Percent must be from 1 to 90."); ok = false;
  }
  if (type === "fixed" && (valueText === "" || value < 10 || value > 5000)) {
    showError("couponValueError", "Amount must be from 10 to 5000 BDT."); ok = false;
  }
  if (expiry === "") {
    showError("couponExpiryError", "Choose an expiry date."); ok = false;
  } else if (expiry < todayString()) {
    showError("couponExpiryError", "The expiry date cannot be in the past."); ok = false;
  }
  if (!ok) { return false; }

  coupons.push({ code: code, type: type, value: value, expiry: expiry, active: true });
  addLog("Coupon", "Created coupon " + code);
  showMessage("couponMessage", "Coupon <strong>" + code + "</strong> was created.", "success");
  document.getElementById("couponForm").reset();
  previewCoupon();
  renderCoupons();
  return false;
}

// Deactivate / Activate button: flip true <-> false with !
function toggleCoupon(i) {
  coupons[i].active = !coupons[i].active;
  addLog("Coupon", (coupons[i].active ? "Activated" : "Deactivated") + " coupon " + coupons[i].code);
  renderCoupons();
}

function deleteCoupon(i) {
  const code = coupons[i].code;
  coupons = removeAt(coupons, i);
  addLog("Coupon", "Deleted coupon " + code);
  showMessage("couponMessage", "Coupon <strong>" + code + "</strong> was deleted.", "info");
  renderCoupons();
}

// Live preview while the admin types
function previewCoupon() {
  const type = document.getElementById("couponType").value;
  const value = Number(document.getElementById("couponValue").value);
  const discount = couponDiscount(type, value, 1000);
  document.getElementById("couponPreview").innerHTML = "On a 1000 BDT order this coupon takes off <strong>" +
    discount + " BDT</strong>, so the customer pays <strong>" + (1000 - discount) + " BDT</strong>.";
}


/* =====================================================================
   UNIQUE FEATURE 6: DISPUTES AND REFUNDS
   ===================================================================== */
function renderDisputes() {
  const filter = document.getElementById("disputeFilter").value;
  let rows = "";
  let openCount = 0;
  let refundedTotal = 0;

  for (let i = 0; i < disputes.length; i++) {
    const d = disputes[i];
    if (d.status === "Open") { openCount++; }
    if (d.status === "Refunded") { refundedTotal += d.amount; }
    if (filter !== "all" && d.status !== filter) { continue; }

    const customer = findById(users, d.customerId);
    const customerName = customer ? customer.name : "Deleted user";

    let color;
    let decisionCell;
    switch (d.status) {
      case "Open":
        color = "orange";
        // An open case gets a note box and two buttons
        decisionCell = "<input type='text' id='note" + i + "' placeholder='Note for the customer'>" +
                       "<span class='error' id='note" + i + "Error'></span>" +
                       "<button type='button' class='approve' onclick='decideDispute(" + i + ", true)'>Refund</button> " +
                       "<button type='button' class='danger' onclick='decideDispute(" + i + ", false)'>Reject</button>";
        break;
      case "Refunded":
        color = "green";
        decisionCell = "<em>" + d.note + "</em>";
        break;
      default:
        color = "red";
        decisionCell = "<em>" + d.note + "</em>";
    }

    rows += "<tr><td>" + d.id + "</td><td>" + d.orderId + "</td><td>" + customerName + "</td><td>" + d.reason + "</td>" +
            "<td>" + d.amount + " BDT</td><td><span class='badge " + color + "'>" + d.status + "</span></td>" +
            "<td>" + decisionCell + "</td></tr>";
  }
  if (rows === "") { rows = "<tr><td colspan='7' class='empty-row'>No disputes to show.</td></tr>"; }
  document.getElementById("disputeRows").innerHTML = rows;
  document.getElementById("disputeSummary").innerHTML = openCount + " open case(s). Total refunded so far: " + refundedTotal + " BDT.";
}

function decideDispute(i, refund) {
  const d = disputes[i];
  const note = document.getElementById("note" + i).value.trim();
  clearErrors();

  if (refund) {
    d.status = "Refunded";
    d.note = (note === "") ? "Refund approved" : note;
    addLog("Dispute", "Refunded " + d.amount + " BDT for dispute " + d.id);
    showMessage("disputeMessage", d.amount + " BDT will be refunded for case " + d.id + ".", "success");
  } else {
    // The customer must be told why the claim was rejected
    if (note.length < 5) {
      showError("note" + i + "Error", "Write why it is rejected (5+ characters).");
      return;
    }
    d.status = "Rejected";
    d.note = note;
    addLog("Dispute", "Rejected dispute " + d.id);
    showMessage("disputeMessage", "Case " + d.id + " was rejected.", "info");
  }
  renderDisputes();
}


/* =====================================================================
   UNIQUE FEATURE 7: ANNOUNCEMENTS
   Other dashboards show them with showAnnouncements() from common.js
   ===================================================================== */
const maxNoticeLength = 200;

// Counts the characters while the admin types (onkeyup)
function countNoticeChars() {
  const length = document.getElementById("noticeMessage").value.length;
  const counter = document.getElementById("noticeCounter");
  counter.innerHTML = length + " / " + maxNoticeLength + " characters";
  counter.style.color = (length > maxNoticeLength) ? "#c00" : "";
}

function saveAnnouncement() {
  clearErrors();
  const title = document.getElementById("noticeTitle").value.trim();
  const message = document.getElementById("noticeMessage").value.trim();
  const audience = document.getElementById("noticeAudience").value;
  let ok = true;

  if (title.length < 5) { showError("noticeTitleError", "Title needs at least 5 characters."); ok = false; }
  if (message.length < 10) { showError("noticeMessageError", "Message needs at least 10 characters."); ok = false; }
  else if (message.length > maxNoticeLength) { showError("noticeMessageError", "Message is longer than " + maxNoticeLength + " characters."); ok = false; }
  if (audience === "") { showError("noticeAudienceError", "Choose who should see it."); ok = false; }
  if (!ok) { return false; }

  announcements.push({ id: newId("A"), title: title, message: message, audience: audience, date: todayString() });
  addLog("Notice", "Posted announcement: " + title);
  showMessage("noticeMessageBox", "Announcement posted.", "success");
  document.getElementById("noticeForm").reset();
  countNoticeChars();
  renderAnnouncements();
  return false;
}

// Each announcement is a <div> built with createElement + appendChild, newest first
function renderAnnouncements() {
  const board = document.getElementById("noticeBoard");
  board.innerHTML = "";

  for (let i = announcements.length - 1; i >= 0; i--) {
    const a = announcements[i];
    const audienceText = (a.audience === "all") ? "Everyone" : roleLabel(a.audience) + "s";

    const item = document.createElement("div");
    item.className = "log-item";
    item.innerHTML = "<small>" + a.date + " &middot; for " + audienceText + "</small><br>" +
                     "<strong>" + a.title + "</strong><br>" + a.message + "<br>" +
                     "<button type='button' class='secondary small' onclick='deleteAnnouncement(" + i + ")'>Remove</button>";
    board.appendChild(item);
  }
  if (announcements.length === 0) {
    board.innerHTML = "<p class='empty-row'>No announcements yet.</p>";
  }
}

function deleteAnnouncement(i) {
  addLog("Notice", "Removed announcement: " + announcements[i].title);
  announcements = removeAt(announcements, i);
  renderAnnouncements();
}


/* =====================================================================
   UNIQUE FEATURE 8: ACTIVITY LOG
   ===================================================================== */

// Picks a colour for each type of activity with a switch statement
function getLogColor(type) {
  let color;
  switch (type) {
    case "User": color = "#2563eb"; break;
    case "Seller": color = "#9333ea"; break;
    case "Rules": color = "#0f766e"; break;
    case "Category": color = "#d97706"; break;
    case "Coupon": color = "#be185d"; break;
    case "Dispute": color = "#c00"; break;
    case "Notice": color = "#2a8a3e"; break;
    default: color = "#6b7280";
  }
  return color;
}

function renderLog() {
  const typeFilter = document.getElementById("logTypeFilter").value;
  const board = document.getElementById("logBoard");
  board.innerHTML = "";
  let shown = 0;

  // Loop backwards so the newest entry is at the top
  for (let i = activityLog.length - 1; i >= 0; i--) {
    const entry = activityLog[i];
    if (typeFilter === "all" || entry.type === typeFilter) {
      const item = document.createElement("div");
      item.className = "log-item";
      item.style.borderLeftColor = getLogColor(entry.type);
      item.innerHTML = "<small>" + entry.time + "</small><br>" +
                       "<span class='badge' style='background:" + getLogColor(entry.type) + "'>" + entry.type + "</span> " +
                       entry.message;
      board.appendChild(item);
      shown++;
    }
  }
  if (shown === 0) {
    board.innerHTML = "<p class='empty-row'>No activity to show.</p>";
  }
  document.getElementById("logCount").innerHTML = shown + " of " + activityLog.length + " entries";
}

function clearLog() {
  activityLog = [];
  addLog("User", "Activity log was cleared");
  renderLog();
}


/* =====================================================================
   START: runs once when the page has loaded (scripts are at the end of <body>)
   ===================================================================== */
showLoggedInUser("admin");
renderUsers();
showStats();
renderPending();
loadRules();
renderCategories();
renderCoupons();
previewCoupon();
renderDisputes();
renderAnnouncements();
countNoticeChars();
renderLog();
showSection("usersSection");

// Each time the admin opens these sections, show fresh data
document.getElementById("nav-statsSection").addEventListener("click", showStats);
document.getElementById("nav-approveSection").addEventListener("click", renderPending);
document.getElementById("nav-categorySection").addEventListener("click", renderCategories);
document.getElementById("nav-logSection").addEventListener("click", renderLog);
