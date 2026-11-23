/* =====================================================================
   delivery.js  -  Everything a Delivery man can do (delivery.html)
   ---------------------------------------------------------------------
   Unique 1      : My Orders - accept open orders and move each order
                   through Assigned > Picked Up > Out for Delivery > Delivered / Failed
   CRUD + Search : Delivery Notes (deliveryNotes array)
   Unique 2      : Route Planner - groups active orders by area and gives an ETA
   Unique 3      : Earnings calculator + COD cash to hand in
   ===================================================================== */

const sections = ["ordersSection", "notesSection", "routeSection", "earningsSection"];

// The delivery man who is logged in. With the PHP backend this will come
// from the session ($_SESSION) instead of being written here.
const currentDeliveryId = "U-005";

let editNoteIndex = -1;
let failOrderId = "";          // the order waiting for a failure reason

const noteFields = ["noteOrder", "noteType", "noteDate", "noteText"];


/* =====================================================================
   HELPERS FOR THIS PAGE
   ===================================================================== */

// true when the order is still being delivered (not finished yet)
function isActive(order) {
  return order.status === "Assigned" || order.status === "Picked Up" || order.status === "Out for Delivery";
}

// Returns an array with only this delivery man's orders
function getMyOrders() {
  let mine = [];
  for (const order of orders) {
    if (order.deliveryId === currentDeliveryId) {
      mine.push(order);
    }
  }
  return mine;
}

// Returns an array with this delivery man's orders that are still active
function getMyActiveOrders() {
  let active = [];
  for (const order of getMyOrders()) {
    if (isActive(order)) {
      active.push(order);
    }
  }
  return active;
}

// Badge colour for every status, chosen with switch
function statusColor(status) {
  switch (status) {
    case "Delivered":
      return "green";
    case "Failed":
      return "red";
    case "Out for Delivery":
      return "blue";
    case "Picked Up":
      return "orange";
    default:
      return "grey";
  }
}

// Distance in km from the warehouse hub to every area
function areaDistance(area) {
  switch (area) {
    case "Dhanmondi":
      return 4;
    case "Mohammadpur":
      return 6;
    case "Mirpur":
      return 11;
    case "Gulshan":
      return 14;
    case "Uttara":
      return 18;
    default:
      return 10;
  }
}

// Writes a line into the activity log (the admin reads it)
function addLog(type, message) {
  activityLog.push({ time: nowString(), user: "delivery", type: type, message: message });
}


/* =====================================================================
   UNIQUE FEATURE 1: MY ORDERS AND STATUS UPDATE
   ===================================================================== */

// The four tiles at the top
function renderStats() {
  let delivered = 0;
  let failed = 0;
  for (const order of getMyOrders()) {
    if (order.status === "Delivered") {
      delivered++;
    } else if (order.status === "Failed") {
      failed++;
    }
  }

  document.getElementById("statActive").innerHTML = getMyActiveOrders().length;
  document.getElementById("statDelivered").innerHTML = delivered;
  document.getElementById("statFailed").innerHTML = failed;
  document.getElementById("statCash").innerHTML = cashWithMe() + " Tk";

  document.getElementById("orderSummary").innerHTML =
    "You are carrying " + getMyActiveOrders().length + " of " + deliveryRules.maxActive + " orders you are allowed to carry at once.";
}

// READ + SEARCH (only this delivery man's orders)
function renderOrders() {
  let keyword = document.getElementById("orderSearch").value;
  let statusFilter = document.getElementById("orderStatusFilter").value;

  let rows = "";
  let shown = 0;
  let mine = getMyOrders();

  for (const order of mine) {
    let matchesKeyword = containsText(order.id, keyword) || containsText(order.customer, keyword) ||
                         containsText(order.area, keyword) || containsText(order.item, keyword);
    let matchesStatus = (statusFilter === "All" || order.status === statusFilter);

    if (matchesKeyword && matchesStatus) {
      // The next step depends on the status (switch)
      let action;
      switch (order.status) {
        case "Assigned":
          action = "<button type='button' class='btn btn-small' onclick=\"changeStatus('" + order.id + "', 'Picked Up')\">Pick up</button>";
          break;
        case "Picked Up":
          action = "<button type='button' class='btn btn-small' onclick=\"changeStatus('" + order.id + "', 'Out for Delivery')\">Start delivery</button>";
          break;
        case "Out for Delivery":
          action = "<button type='button' class='btn btn-small btn-success' onclick=\"changeStatus('" + order.id + "', 'Delivered')\">Delivered</button>" +
                   "<button type='button' class='btn btn-small btn-danger' onclick=\"changeStatus('" + order.id + "', 'Failed')\">Failed</button>";
          break;
        default:
          action = "&mdash;";
      }

      let paymentText = (order.payment === "COD")
        ? "<span class='badge orange'>COD</span> " + order.total + " Tk"
        : "<span class='badge green'>Paid</span>";

      rows += "<tr>" +
                "<td>" + order.id + "</td>" +
                "<td><strong>" + order.customer + "</strong><br><span class='hint'>" + order.phone + "</span></td>" +
                "<td>" + order.address + "<br><span class='hint'>" + order.area + "</span></td>" +
                "<td>" + order.item + " &times; " + order.qty + "</td>" +
                "<td>" + paymentText + "</td>" +
                "<td><span class='badge " + statusColor(order.status) + "'>" + order.status + "</span></td>" +
                "<td>" + action + "</td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='7' class='empty-row'>No orders match your search.</td></tr>";
  }

  document.getElementById("orderTableBody").innerHTML = rows;
  document.getElementById("orderCount").innerHTML = "Showing " + shown + " of " + mine.length + " orders";
}


// UPDATE the status of one order
function changeStatus(orderId, newStatus) {
  let order = orders[findIndexById(orders, orderId)];
  hideMessage("orderMessage");

  if (newStatus === "Failed") {
    openFailBox(order);              // ask for the reason first
    return;
  }
  applyStatus(order, newStatus);
}


// Shows the small box where the delivery man writes why the delivery failed
function openFailBox(order) {
  failOrderId = order.id;
  document.getElementById("failTitle").innerHTML = "Why could order " + order.id + " not be delivered?";
  document.getElementById("failReason").value = "";
  clearError("failReason");
  document.getElementById("failBox").style.display = "block";
}

function closeFailBox() {
  failOrderId = "";
  document.getElementById("failBox").style.display = "none";
}

// "Save as Failed" button: check the reason, then save the status
function confirmFailed() {
  let reason = document.getElementById("failReason").value.trim();
  clearError("failReason");

  if (reason.length < 5) {
    showError("failReason", "Please write a reason of at least 5 characters.");
    return;
  }

  let order = orders[findIndexById(orders, failOrderId)];
  order.note = reason;
  closeFailBox();
  applyStatus(order, "Failed");
}


// Saves the new status and shows a message
function applyStatus(order, newStatus) {
  order.status = newStatus;
  addLog("Delivery", "Order " + order.id + " is now " + newStatus);

  // A message that depends on the new status
  let text;
  switch (newStatus) {
    case "Picked Up":
      text = "Order <strong>" + order.id + "</strong> was picked up from the warehouse.";
      break;
    case "Out for Delivery":
      text = "Order <strong>" + order.id + "</strong> is on the way to " + order.area + ".";
      break;
    case "Delivered":
      order.note = "Delivered to customer";
      text = "Order <strong>" + order.id + "</strong> was delivered.";
      if (order.payment === "COD") {
        text += " Remember to collect <strong>" + order.total + " Tk</strong> in cash.";
      }
      break;
    default:
      text = "Order <strong>" + order.id + "</strong> was marked as failed. Reason saved: " + order.note;
  }
  showMessage("orderMessage", text, (newStatus === "Failed") ? "error" : "success");

  refreshAll();
}


// The open orders that nobody has taken yet
function renderOpenOrders() {
  let rows = "";

  for (const order of orders) {
    if (order.status === "Placed" && order.deliveryId === "") {
      let paymentText = (order.payment === "COD")
        ? "<span class='badge orange'>COD</span> " + order.total + " Tk"
        : "<span class='badge green'>Paid</span>";

      rows += "<tr>" +
                "<td>" + order.id + "</td>" +
                "<td>" + order.area + "</td>" +
                "<td>" + order.item + " &times; " + order.qty + "</td>" +
                "<td>" + paymentText + "</td>" +
                "<td><button type='button' class='btn btn-small' onclick=\"acceptOrder('" + order.id + "')\">Accept</button></td>" +
              "</tr>";
    }
  }

  if (rows === "") {
    rows = "<tr><td colspan='5' class='empty-row'>No open orders right now. Check again later.</td></tr>";
  }
  document.getElementById("openTableBody").innerHTML = rows;
  document.getElementById("openRules").innerHTML =
    "You can carry at most " + deliveryRules.maxActive + " active orders at the same time.";
}

// CREATE a delivery job: the order now belongs to this delivery man
function acceptOrder(orderId) {
  hideMessage("orderMessage");

  if (getMyActiveOrders().length >= deliveryRules.maxActive) {
    showMessage("orderMessage", "You already carry " + deliveryRules.maxActive +
                " orders. Finish one before you accept another.", "error");
    return;
  }

  let order = orders[findIndexById(orders, orderId)];
  order.deliveryId = currentDeliveryId;
  order.status = "Assigned";
  addLog("Delivery", "Order " + order.id + " accepted by Kamal Hossain");

  showMessage("orderMessage", "You accepted order <strong>" + order.id + "</strong> for " + order.area + ".", "success");
  refreshAll();
}


/* =====================================================================
   DELIVERY NOTES: CREATE, READ, UPDATE, DELETE, SEARCH
   ===================================================================== */

// The drop-down of orders is built with createElement + appendChild
function fillNoteOrderSelect() {
  let select = document.getElementById("noteOrder");
  let chosen = select.value;                 // keep the choice when the list is rebuilt

  select.innerHTML = "<option value=''>-- Select Order --</option>";
  for (const order of getMyOrders()) {
    let option = document.createElement("option");
    option.value = order.id;
    option.innerHTML = order.id + " - " + order.customer + " (" + order.status + ")";
    select.appendChild(option);
  }
  select.value = chosen;
}

// READ + SEARCH (only this delivery man's notes)
function renderNotes() {
  let keyword = document.getElementById("noteSearch").value;
  let typeFilter = document.getElementById("noteTypeFilter").value;

  let rows = "";
  let shown = 0;
  let mine = 0;

  for (let i = 0; i < deliveryNotes.length; i++) {
    let note = deliveryNotes[i];
    let isMine = (note.deliveryId === currentDeliveryId);
    if (isMine) {
      mine++;
    }

    let matchesKeyword = containsText(note.note, keyword) || containsText(note.orderId, keyword) ||
                         containsText(note.id, keyword);
    let matchesType = (typeFilter === "All" || note.type === typeFilter);

    if (isMine && matchesKeyword && matchesType) {
      let typeColor;
      switch (note.type) {
        case "Delivered":
          typeColor = "green";
          break;
        case "Failed Attempt":
          typeColor = "red";
          break;
        case "Damage Report":
          typeColor = "orange";
          break;
        default:
          typeColor = "blue";
      }

      rows += "<tr>" +
                "<td>" + note.id + "</td>" +
                "<td class='nowrap'>" + note.orderId + "</td>" +
                "<td><span class='badge " + typeColor + "'>" + note.type + "</span></td>" +
                "<td class='nowrap'>" + note.date + "</td>" +
                "<td>" + note.note + "</td>" +
                "<td><button type='button' class='btn btn-small' onclick='editNote(" + i + ")'>Edit</button>" +
                    "<button type='button' class='btn btn-small btn-danger' onclick='deleteNote(" + i + ")'>Delete</button></td>" +
              "</tr>";
      shown++;
    }
  }

  if (shown === 0) {
    rows = "<tr><td colspan='6' class='empty-row'>No notes match your search.</td></tr>";
  }

  document.getElementById("noteTableBody").innerHTML = rows;
  document.getElementById("noteCount").innerHTML = "Showing " + shown + " of " + mine + " notes";
}


// CREATE or UPDATE
function saveNote() {
  let orderId = document.getElementById("noteOrder").value;
  let type = getRadioValue("noteType");
  let date = document.getElementById("noteDate").value;
  let text = document.getElementById("noteText").value.trim();

  let isValid = true;
  clearErrors(noteFields);

  if (orderId === "") {
    showError("noteOrder", "Please choose an order.");
    isValid = false;
  }

  if (type === "") {
    showError("noteType", "Please choose the type of note.");
    isValid = false;
  }

  if (date === "") {
    showError("noteDate", "Please choose a date.");
    isValid = false;
  } else if (daysBetween(todayString(), date) > 0) {
    showError("noteDate", "The date cannot be in the future.");
    isValid = false;
  }

  if (text.length < 10) {
    showError("noteText", "Please write at least 10 characters.");
    isValid = false;
  } else if (text.length > 200) {
    showError("noteText", "Please keep it under 200 characters.");
    isValid = false;
  }

  if (isValid === false) {
    return false;
  }

  if (editNoteIndex === -1) {
    // CREATE
    let newNote = { id: nextId("N", deliveryNotes), deliveryId: currentDeliveryId, orderId: orderId,
                    type: type, note: text, date: date };
    deliveryNotes.push(newNote);
    console.log("Notes:", deliveryNotes);
    showMessage("noteMessage", "Note " + newNote.id + " was saved for order " + orderId + ".", "success");
  } else {
    // UPDATE
    let note = deliveryNotes[editNoteIndex];
    note.orderId = orderId;
    note.type = type;
    note.date = date;
    note.note = text;
    showMessage("noteMessage", "Note " + note.id + " was updated.", "success");
  }

  resetNoteForm(false);
  renderNotes();
  return false;
}


// UPDATE step 1: copy the note into the form
function editNote(index) {
  let note = deliveryNotes[index];
  editNoteIndex = index;

  document.getElementById("noteOrder").value = note.orderId;
  setRadioValue("noteType", note.type);
  document.getElementById("noteDate").value = note.date;
  document.getElementById("noteText").value = note.note;
  countNoteCharacters();
  clearErrors(noteFields);

  document.getElementById("noteFormTitle").innerHTML = "Edit Note " + note.id;
  document.getElementById("noteSaveButton").value = "Update Note";
  hideMessage("noteMessage");
}


// DELETE
function deleteNote(index) {
  let note = deliveryNotes[index];
  deliveryNotes = removeAt(deliveryNotes, index);
  showMessage("noteMessage", "Note " + note.id + " was deleted.", "info");
  resetNoteForm(false);
  renderNotes();
}


// clearMessage is false when a message has just been shown and must stay
function resetNoteForm(clearMessage) {
  editNoteIndex = -1;
  document.getElementById("noteForm").reset();
  document.getElementById("noteDate").value = todayString();
  clearErrors(noteFields);
  countNoteCharacters();
  document.getElementById("noteFormTitle").innerHTML = "New Note";
  document.getElementById("noteSaveButton").value = "Save Note";
  if (clearMessage !== false) {
    hideMessage("noteMessage");
  }
}


// Live character counter for the note box (onkeyup event)
function countNoteCharacters() {
  let length = document.getElementById("noteText").value.length;
  let counter = document.getElementById("noteCounter");
  counter.innerHTML = length + " / 200";
  counter.style.color = length > 200 ? "#C62828" : "";
}


/* =====================================================================
   UNIQUE FEATURE 2: ROUTE PLANNER
   The areas are kept in a list from the nearest to the farthest from the hub.
   "Nearest first" reads the list from the front, "Farthest first" from the back.
   Each stop takes 12 minutes and every km of travel takes 3 minutes.
   ===================================================================== */

// Areas from the nearest to the farthest (same order as areaDistance())
const areaOrder = ["Dhanmondi", "Mohammadpur", "Mirpur", "Gulshan", "Uttara"];

// 630 -> "10:30"   (Math.floor rounds down, % gives the remainder)
function minutesToTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60) % 24;
  let minutes = totalMinutes % 60;
  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  return hours + ":" + minutes;
}

function planRoute() {
  let hourText = document.getElementById("routeHour").value;
  let minuteText = document.getElementById("routeMinute").value;
  let hour = Number(hourText);
  let minute = Number(minuteText);
  let direction = getRadioValue("routeOrder");
  let codOnly = document.getElementById("routeCodOnly").checked;

  let isValid = true;
  clearErrors(["routeHour", "routeMinute", "routeOrder"]);

  if (hourText === "" || hour < 0 || hour > 23 || hour !== Math.floor(hour)) {
    showError("routeHour", "Hour must be a whole number from 0 to 23.");
    isValid = false;
  }
  if (minuteText === "" || minute < 0 || minute > 59 || minute !== Math.floor(minute)) {
    showError("routeMinute", "Minute must be a whole number from 0 to 59.");
    isValid = false;
  }
  if (direction === "") {
    showError("routeOrder", "Please choose an order of areas.");
    isValid = false;
  }
  if (isValid === false) {
    return false;
  }

  let list = document.getElementById("routeList");
  list.innerHTML = "";

  let startMinutes = hour * 60 + minute;     // minutes after midnight
  let clock = startMinutes;
  let previousKm = 0;                        // the hub is at 0 km
  let totalKm = 0;
  let stopNumber = 0;
  let areaCount = 0;

  // Go through the areas in the chosen direction
  for (let i = 0; i < areaOrder.length; i++) {
    let index = i;                           // nearest first: 0, 1, 2 ...
    if (direction === "Farthest") {
      index = areaOrder.length - 1 - i;      // farthest first: 4, 3, 2 ...
    }
    let area = areaOrder[index];

    // Collect my active orders in this area
    let stops = [];
    for (const order of getMyActiveOrders()) {
      if (order.area === area && !(codOnly && order.payment !== "COD")) {
        stops.push(order);
      }
    }
    if (stops.length === 0) {
      continue;                              // nothing to deliver here
    }

    let km = areaDistance(area);
    let leg = Math.abs(km - previousKm);     // km from the last area to this one
    totalKm += leg;
    clock += leg * 3;
    previousKm = km;
    areaCount++;

    // Draw one card for this area with createElement
    let card = document.createElement("div");
    card.className = "reminder";
    card.style.borderLeftColor = (km > 12) ? "#C62828" : (km > 6 ? "#EF6C00" : "#2E7D32");
    card.style.backgroundColor = "#F8FCFB";

    let html = "<h4>" + area + "</h4>" +
               "<p class='hint'>" + km + " km from the hub &middot; " + leg + " km from the previous stop</p><ol>";

    for (const order of stops) {
      stopNumber++;
      clock += 12;
      html += "<li><strong>" + order.customer + "</strong> &mdash; " + order.address +
              " <span class='badge " + statusColor(order.status) + "'>" + order.status + "</span>" +
              " <span class='hint'>arrive about " + minutesToTime(clock) + "</span></li>";
    }
    html += "</ol>";
    card.innerHTML = html;
    list.appendChild(card);
  }

  if (stopNumber === 0) {
    list.innerHTML = "<p class='empty-row'>You have no active orders to plan.</p>";
    document.getElementById("routeSummary").innerHTML = "No stops to plan.";
    return false;
  }

  document.getElementById("routeSummary").innerHTML =
    "<p><span class='big'>" + stopNumber + "</span> stops in <strong>" + areaCount + "</strong> area(s)</p>" +
    "<p>Travel distance: <strong>" + totalKm + " km</strong></p>" +
    "<p>Start " + minutesToTime(startMinutes) + " &rarr; finish about <strong>" + minutesToTime(clock) + "</strong></p>";
  return false;
}


/* =====================================================================
   UNIQUE FEATURE 3: EARNINGS CALCULATOR AND COD CASH
   ===================================================================== */

// Each vehicle changes the pay per km (switch)
function vehicleMultiplier(vehicle) {
  switch (vehicle) {
    case "Van":
      return 1.3;
    case "Cycle":
      return 0.8;
    default:
      return 1;
  }
}

function calculateEarnings() {
  let countText = document.getElementById("earnCount").value;
  let kmText = document.getElementById("earnKm").value;
  let vehicle = getRadioValue("earnVehicle");
  let count = Number(countText);
  let km = Number(kmText);

  let isValid = true;
  clearErrors(["earnCount", "earnKm", "earnVehicle"]);

  if (countText === "" || count < 0 || count > 50 || count !== Math.floor(count)) {
    showError("earnCount", "Enter a whole number from 0 to 50.");
    isValid = false;
  }
  if (kmText === "" || km < 0 || km > 200) {
    showError("earnKm", "Enter a distance from 0 to 200 km.");
    isValid = false;
  }
  if (vehicle === "") {
    showError("earnVehicle", "Please choose your vehicle.");
    isValid = false;
  }
  if (isValid === false) {
    return false;
  }

  // The money, step by step
  let orderPay = count * deliveryRules.feePerOrder;
  let distancePay = Math.round(km * deliveryRules.perKm * vehicleMultiplier(vehicle));
  let bonus = (count >= deliveryRules.bonusTarget) ? deliveryRules.bonusAmount : 0;

  let extras = 0;
  let extraText = "";
  let extraBoxes = document.getElementsByName("earnExtra");
  for (let i = 0; i < extraBoxes.length; i++) {
    if (extraBoxes[i].checked) {
      if (extraBoxes[i].value === "Rain") {
        extras += deliveryRules.rainBonus;
        extraText += "Rain bonus: " + deliveryRules.rainBonus + " Tk<br>";
      } else {
        extras += deliveryRules.nightBonus;
        extraText += "Night bonus: " + deliveryRules.nightBonus + " Tk<br>";
      }
    }
  }

  let total = orderPay + distancePay + bonus + extras;

  let bonusLine;
  if (bonus > 0) {
    bonusLine = "Daily bonus (" + deliveryRules.bonusTarget + "+ orders): " + bonus + " Tk";
  } else {
    let missing = deliveryRules.bonusTarget - count;
    bonusLine = "Daily bonus: 0 Tk <span class='hint'>(deliver " + missing + " more order(s) to get " + deliveryRules.bonusAmount + " Tk)</span>";
  }

  document.getElementById("earningResult").innerHTML =
    "<p>Orders: " + count + " &times; " + deliveryRules.feePerOrder + " = " + orderPay + " Tk</p>" +
    "<p>Distance: " + km + " km &times; " + deliveryRules.perKm + " &times; " + vehicleMultiplier(vehicle) +
      " (" + vehicle + ") = " + distancePay + " Tk</p>" +
    "<p>" + bonusLine + "</p>" +
    (extraText === "" ? "" : "<p>" + extraText + "</p>") +
    "<p>Total earnings: <span class='big'>" + total + " Tk</span></p>";
  return false;
}

// Fills the calculator from the orders this man delivered
function fillFromMyDeliveries() {
  let delivered = 0;
  let km = 0;
  for (const order of getMyOrders()) {
    if (order.status === "Delivered") {
      delivered++;
      km += areaDistance(order.area) * 2;      // going and coming back
    }
  }
  document.getElementById("earnCount").value = delivered;
  document.getElementById("earnKm").value = km;
  setRadioValue("earnVehicle", "Bike");
  clearErrors(["earnCount", "earnKm", "earnVehicle"]);
  calculateEarnings();
}


// Cash collected from COD orders that were delivered but not handed in yet
function cashWithMe() {
  let sum = 0;
  for (const order of getMyOrders()) {
    if (order.status === "Delivered" && order.payment === "COD" && order.cashDeposited === false) {
      sum += order.total;
    }
  }
  return sum;
}

function renderCash() {
  let rows = "";
  for (const order of getMyOrders()) {
    if (order.status === "Delivered" && order.payment === "COD") {
      let deposited = order.cashDeposited
        ? "<span class='badge green'>Yes</span>"
        : "<span class='badge red'>No</span>";
      rows += "<tr><td>" + order.id + "</td><td>" + order.customer + "</td><td>" +
              order.total + " Tk</td><td>" + deposited + "</td></tr>";
    }
  }
  if (rows === "") {
    rows = "<tr><td colspan='4' class='empty-row'>No cash-on-delivery orders delivered yet.</td></tr>";
  }
  document.getElementById("cashTableBody").innerHTML = rows;
  document.getElementById("cashTotal").innerHTML = "Cash you must hand in: <span class='big'>" + cashWithMe() + " Tk</span>";

  document.getElementById("earningRules").innerHTML =
    "Pay: " + deliveryRules.feePerOrder + " Tk per order + " + deliveryRules.perKm + " Tk per km. " +
    "Deliver " + deliveryRules.bonusTarget + " or more orders in a day for a " + deliveryRules.bonusAmount + " Tk bonus.";
}

function depositCash() {
  let amount = cashWithMe();
  if (amount === 0) {
    showMessage("cashMessage", "You have no cash to hand in.", "info");
    return;
  }

  for (const order of getMyOrders()) {
    if (order.status === "Delivered" && order.payment === "COD") {
      order.cashDeposited = true;
    }
  }
  addLog("Cash", "Kamal Hossain handed in " + amount + " Tk");
  showMessage("cashMessage", "<strong>" + amount + " Tk</strong> was marked as handed in. Thank you!", "success");
  refreshAll();
}


/* =====================================================================
   START
   ===================================================================== */

// Redraws every part that depends on the orders
function refreshAll() {
  renderStats();
  renderOrders();
  renderOpenOrders();
  fillNoteOrderSelect();
  renderCash();
  planRoute();
}

refreshAll();
renderNotes();
document.getElementById("noteDate").value = todayString();
countNoteCharacters();
showSection("ordersSection");
