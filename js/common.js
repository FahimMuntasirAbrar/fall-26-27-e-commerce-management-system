// Helpers used by every page.
// Loaded after data.js and before the page's own script.

let idCounter = 100;

function newId(prefix) {
  idCounter++;
  return prefix + idCounter;
}

// ---------- Show one section, hide the others ----------
// Every section has class "section". If the page has a menu button with the
// id "nav-" + sectionId, that button is highlighted (className = "active").
function showSection(id) {
  const all = document.getElementsByClassName("section");
  for (let i = 0; i < all.length; i++) {
    all[i].style.display = "none";
    const navButton = document.getElementById("nav-" + all[i].id);
    if (navButton) {
      navButton.className = (all[i].id === id) ? "active" : "";
    }
  }
  document.getElementById(id).style.display = "block";
}

// ---------- Errors next to form fields ----------
// Each field has <span class="error" id="...Error"></span> beside it.
function showError(id, message) {
  document.getElementById(id).innerHTML = message;
}

function clearErrors() {
  const all = document.getElementsByClassName("error");
  for (let i = 0; i < all.length; i++) {
    all[i].innerHTML = "";
  }
}

// ---------- Message boxes ----------
// type is "success", "error" or "info" (CSS classes in style.css)
function showMessage(boxId, text, type) {
  const box = document.getElementById(boxId);
  box.innerHTML = text;
  box.className = "message " + type;
  box.style.display = "block";
}

function hideMessage(boxId) {
  document.getElementById(boxId).style.display = "none";
}

// ---------- Small validation helpers ----------
// A simple e-mail check: something@something.something
function isValidEmail(email) {
  const atPosition = email.indexOf("@");
  const dotPosition = email.indexOf(".", atPosition);
  if (atPosition < 1) { return false; }                      // no @, or @ is first
  if (dotPosition < atPosition + 2) { return false; }        // no dot after the @
  if (dotPosition === email.length - 1) { return false; }    // dot is the last character
  if (email.indexOf(" ") !== -1) { return false; }
  return true;
}

// Value of the ticked radio button in a group, or "" if none is ticked
function getRadioValue(groupName) {
  const radios = document.getElementsByName(groupName);
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) { return radios[i].value; }
  }
  return "";
}

// Ticks the radio button whose value matches (used when editing a record)
function setRadioValue(groupName, value) {
  const radios = document.getElementsByName(groupName);
  for (let i = 0; i < radios.length; i++) {
    radios[i].checked = (radios[i].value === value);
  }
}

// ---------- Search + array helpers ----------
function containsText(text, search) {
  return String(text).toLowerCase().indexOf(search.toLowerCase()) !== -1;
}

// delete = build a new array without item i (slice + concat)
function removeAt(arr, i) {
  return arr.slice(0, i).concat(arr.slice(i + 1));
}

function findById(arr, id) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === id) { return arr[i]; }
  }
  return null;
}

// ---------- Dates ----------
// Today's date as "YYYY-MM-DD" (same format as <input type="date">)
function todayString() {
  const now = new Date();
  let month = now.getMonth() + 1;      // months count from 0
  let day = now.getDate();
  if (month < 10) { month = "0" + month; }
  if (day < 10) { day = "0" + day; }
  return now.getFullYear() + "-" + month + "-" + day;
}

// Date and time as "YYYY-MM-DD HH:MM"
function nowString() {
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  return todayString() + " " + hours + ":" + minutes;
}

// ---------- Logged-in user ----------
// login.js saves the account in localStorage. If a dashboard is opened
// directly (no login), the first account with defaultRole is used instead.
function getLoggedInUser(defaultRole) {
  let user = null;
  const saved = localStorage.getItem("loggedInUser");
  if (saved) {
    try { user = JSON.parse(saved); } catch (e) { user = null; }
  }
  if (user && defaultRole && user.role !== defaultRole) { user = null; }
  if (!user && defaultRole) {
    for (let i = 0; i < users.length; i++) {
      if (users[i].role === defaultRole) { user = users[i]; break; }
    }
  }
  return user;
}

function showLoggedInUser(defaultRole) {
  const el = document.getElementById("loggedInUser");
  if (!el) { return; }
  const user = getLoggedInUser(defaultRole);
  if (user) {
    el.innerHTML = "&#128100; " + user.name + " (" + user.username + ")";
  }
}

function logout() {
  localStorage.removeItem("loggedInUser");
  location.href = "login.html";
}

// ---------- Announcements (posted by the admin) ----------
// Any dashboard can show the notices meant for its role:
//   <div id="noticeBox"></div>   and   showAnnouncements("noticeBox", "seller");
function showAnnouncements(elementId, role) {
  let html = "";
  for (let i = announcements.length - 1; i >= 0; i--) {
    const a = announcements[i];
    if (a.audience === "all" || a.audience === role) {
      html += "<div class='log-item'><small>" + a.date + "</small><br><strong>" + a.title + "</strong><br>" + a.message + "</div>";
    }
  }
  if (html === "") { html = "<p class='empty-row'>No announcements.</p>"; }
  document.getElementById(elementId).innerHTML = html;
}

// ---------- Dark mode ----------
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
  const btn = document.getElementById("themeBtn");
  if (btn) {
    btn.innerHTML = isDark ? "&#9728; Light mode" : "&#9790; Dark mode";
  }
}

function initTheme() {
  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme === "enabled") {
    document.body.classList.add("dark-mode");
  }
  const btn = document.getElementById("themeBtn");
  if (btn) {
    const isDark = document.body.classList.contains("dark-mode");
    btn.innerHTML = isDark ? "&#9728; Light mode" : "&#9790; Dark mode";
  }
}

document.addEventListener("DOMContentLoaded", initTheme);
