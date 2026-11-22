let currentUser = null;
let data = null;
let selectedIds = [];
const page = document.body.dataset.page || "";

function get(id) { return document.getElementById(id); }
function money(n) { return "Tk " + Math.round(n * 100) / 100; }
function safe(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function number(id) {
  const el = get(id);
  if (!el) return 0;
  const v = parseFloat(el.value);
  return isNaN(v) || v < 0 ? 0 : v;
}
function thisMonth() { return new Date().toISOString().slice(0, 7); }
function itemById(id) {
  if (!data) return null;
  for (let i = 0; i < data.items.length; i++) {
    if (data.items[i].id === id) return data.items[i];
  }
  return null;
}

function getUsers() {
  const text = localStorage.getItem("dokanUsers");
  return text ? JSON.parse(text) : [];
}
function newData() {
  const list = [];
  for (let i = 0; i < items.length; i++) {
    list.push({
      id: i + 1,
      name: items[i].name,
      category: items[i].category,
      price: items[i].price,
      unit: items[i].unit
    });
  }
  return {
    items: list,
    sales: [],
    combos: [],
    replies: [],
    goal: { month: thisMonth(), target: 0, entries: [] }
  };
}
function saveData() {
  if (!currentUser || !data) return;
  localStorage.setItem("dokanData_" + currentUser.email, JSON.stringify(data));
}
function loadData() {
  if (!currentUser) return;
  const text = localStorage.getItem("dokanData_" + currentUser.email);
  data = text ? JSON.parse(text) : newData();
  if (!data.goal || data.goal.month !== thisMonth()) {
    data.goal = { month: thisMonth(), target: 0, entries: [] };
  }
}
function getSessionUser() {
  const savedEmail = localStorage.getItem("dokanSession");
  if (!savedEmail) return null;
  const users = getUsers();
  for (let i = 0; i < users.length; i++) {
    if (users[i].email === savedEmail) return users[i];
  }
  return null;
}
function openApp(user) {
  currentUser = user;
  localStorage.setItem("dokanSession", user.email);
  loadData();
  if (get("who")) get("who").innerHTML = safe(user.shop);
}

if (get("signupForm")) {
  get("signupForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const name = get("sName").value.trim();
    const shop = get("sShop").value.trim();
    const email = get("sEmail").value.trim().toLowerCase();
    const phone = get("sPhone").value.trim();
    const pass = get("sPass").value;
    const msg = get("sMsg");

    msg.classList.remove("success");

    if (name === "" || shop === "" || email === "" || phone === "" || pass === "") {
      msg.innerHTML = "Fill in every field.";
      return;
    }
    if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
      msg.innerHTML = "Enter a valid email";
      return;
    }
    if (phone.length !== 11 || isNaN(phone) || !phone.startsWith("01")) {
      msg.innerHTML = "Phone must be 11 digits starting with 01";
      return;
    }
    if (pass.length < 6) {
      msg.innerHTML = "Password needs at least 6 characters";
      return;
    }
    const users = getUsers();
    for (let i = 0; i < users.length; i++) {
      if (users[i].email === email) {
        msg.innerHTML = "This email already has an account. Log in instead.";
        return;
      }
    }
    const user = { name: name, shop: shop, email: email, phone: phone, pass: pass };
    users.push(user);
    localStorage.setItem("dokanUsers", JSON.stringify(users));
    this.reset();
    msg.classList.add("success");
    msg.innerHTML = "Successful!";
  });
}

if (get("loginForm")) {
  get("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = get("lEmail").value.trim().toLowerCase();
    const pass = get("lPass").value;
    const users = getUsers();
    for (let i = 0; i < users.length; i++) {
      if (users[i].email === email && users[i].pass === pass) {
        get("lMsg").innerHTML = "";
        localStorage.setItem("dokanSession", users[i].email);
        this.reset();
        window.location.href = "items.html";
        return;
      }
    }
    get("lMsg").innerHTML = "Email or password is wrong. Check and try again.";
  });
}

if (get("logout")) {
  get("logout").addEventListener("click", function () {
    localStorage.removeItem("dokanSession");
    currentUser = null;
    data = null;
    window.location.href = "index.html";
  });
}

function fillCategories() {
  if (!get("iaCat") && !get("iCat")) return;
  let own = "";
  let all = '<option value="">All categories</option>';
  for (let i = 0; i < categories.length; i++) {
    own += "<option>" + categories[i] + "</option>";
    all += "<option>" + categories[i] + "</option>";
  }
  if (get("iaCat")) get("iaCat").innerHTML = own;
  if (get("iCat")) get("iCat").innerHTML = all;
}
function showItems() {
  if (!get("iBody") || !data) return;
  const text = get("iSearch").value.trim().toLowerCase();
  const cat = get("iCat").value;
  const body = get("iBody");
  body.innerHTML = "";
  let shown = 0;
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (cat !== "" && item.category !== cat) continue;
    if (item.name.toLowerCase().indexOf(text) === -1) continue;
    shown++;
    const tr = document.createElement("tr");
    tr.innerHTML = "<td>" + safe(item.name) + "</td><td>" + safe(item.category) +
      "</td><td>" + safe(item.unit) + "</td><td>" + money(item.price) + "</td>";
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.className = "btn danger sm";
    btn.innerHTML = "Delete";
    btn.addEventListener("click", function () {
      data.items.splice(i, 1);
      saveData();
      showItems();
    });
    td.appendChild(btn);
    tr.appendChild(td);
    body.appendChild(tr);
  }
  if (shown === 0) body.innerHTML = "<tr><td colspan='5'>No item found.</td></tr>";
  if (get("iCount")) get("iCount").innerHTML = "Showing " + shown + " of " + data.items.length + " items";
}

function calcPrice() {
  if (!get("oPrice")) return;
  const cost = number("cCost") + number("cPack") + number("cShip");
  const fee = number("cFee") / 100;
  const profit = number("cProf") / 100;
  const room = 1 - fee - profit;
  if (room <= 0) {
    get("oMsg").innerHTML = "Fee + profit must stay under 100%.";
    return;
  }
  get("oMsg").innerHTML = "";
  const price = cost / room;
  get("oPrice").innerHTML = money(Math.ceil(price));
  get("oProfit").innerHTML = money(price * profit);
  get("oBreak").innerHTML = money(cost / (1 - fee));
  get("oFee").innerHTML = money(price * fee);
  if (get("cTry").value === "") {
    get("oTry").innerHTML = "-";
  } else {
    const own = number("cTry");
    get("oTry").innerHTML = money(own - cost - own * fee);
  }
}

function updateFlashPriceBox() {
  if (!get("fProd") || !get("fPrice")) return;
  const prod = itemById(Number(get("fProd").value));
  if (!prod) {
    get("fPrice").value = "";
    if (get("fSalePrice")) get("fSalePrice").value = "";
    return;
  }
  get("fPrice").value = money(prod.price);
  if (get("fSalePrice")) {
    let disc = Number(get("fDisc").value);
    if (isNaN(disc) || disc < 0) disc = 0;
    if (disc > 90) disc = 90;
    get("fSalePrice").value = money(prod.price * (1 - disc / 100));
  }
}

function fillFlashItems() {
  if (!get("fProd") || !data) return;
  let html = "";
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    html += '<option value="' + item.id + '">' + safe(item.name) + " (" + safe(item.unit) +
      ")</option>";
  }
  get("fProd").innerHTML = html;
  updateFlashPriceBox();
}

function showSales() {
  if (!get("fList") || !data) return;
  const now = Date.now();
  for (let i = data.sales.length - 1; i >= 0; i--) {
    if (data.sales[i].end <= now) data.sales.splice(i, 1);
  }
  const list = get("fList");
  list.innerHTML = "";
  if (data.sales.length === 0) {
    list.innerHTML = '<p class="note">No sale running. Start one above.</p>';
    return;
  }
  for (let i = 0; i < data.sales.length; i++) {
    const sale = data.sales[i];
    const item = itemById(sale.itemId);
    if (item === null) continue;
    const left = Math.max(0, Math.floor((sale.end - now) / 1000));
    const sec = document.createElement("section");
    sec.className = "sale";
    sec.innerHTML = "<section><strong>" + safe(item.name) + '</strong> <span class="tag">' +
      sale.discount + '% off</span><br><p class="old">' + money(item.price) +
      "</p> <b>" + money(item.price * (1 - sale.discount / 100)) + "</b></section>" +
      '<p class="clock">' + pad(Math.floor(left / 3600)) + ":" +
      pad(Math.floor((left % 3600) / 60)) + ":" + pad(left % 60) + "</p>";
    const btn = document.createElement("button");
    btn.className = "btn danger sm";
    btn.innerHTML = "End now";
    btn.addEventListener("click", function () {
      data.sales.splice(i, 1);
      saveData();
      showSales();
    });
    sec.appendChild(btn);
    list.appendChild(sec);
  }
}

function showComboItems() {
  if (!get("cItems") || !data) return;
  const text = get("cSearch").value.trim().toLowerCase();
  const box = get("cItems");
  box.innerHTML = "";
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (item.name.toLowerCase().indexOf(text) === -1) continue;
    const row = document.createElement("label");
    row.className = "checkrow";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = selectedIds.indexOf(item.id) !== -1;
    check.addEventListener("change", function () {
      if (check.checked) selectedIds.push(item.id);
      else selectedIds.splice(selectedIds.indexOf(item.id), 1);
      updateCombo();
    });
    row.appendChild(check);
    row.appendChild(document.createTextNode(item.name + " (" + item.unit + ") " + money(item.price)));
    box.appendChild(row);
  }
}
function comboDiscount() {
  let d = get("cbDisc") ? Number(get("cbDisc").value) : 0;
  if (d < 0) d = 0;
  if (d > 60) d = 60;
  return d;
}
function updateCombo() {
  if (!get("cbOld") || !data) return;
  let total = 0;
  let count = 0;
  for (let i = 0; i < selectedIds.length; i++) {
    const item = itemById(selectedIds[i]);
    if (item !== null) { total += item.price; count++; }
  }
  const d = comboDiscount();
  get("cbOld").innerHTML = money(total) + " (" + count + " items)";
  get("cbSave").innerHTML = money(total * d / 100);
  get("cbNew").innerHTML = money(Math.round(total * (1 - d / 100)));
}
function showCombos() {
  if (!get("cbList") || !data) return;
  const list = get("cbList");
  list.innerHTML = "";
  if (data.combos.length === 0) {
    list.innerHTML = '<p class="note">No combo yet. Tick items and save one.</p>';
    return;
  }
  for (let i = 0; i < data.combos.length; i++) {
    const c = data.combos[i];
    const sec = document.createElement("section");
    sec.className = "sale";
    sec.innerHTML = "<section><strong>" + safe(c.name) + '</strong> <span class="tag">' + c.discount +
      '% off</span><br><p class="note">' + safe(c.names.join(" + ")) + "</p></section>" +
      '<section><p class="old">' + money(c.oldTotal) + "</p> <b>" + money(c.price) + "</b></section>";
    const btn = document.createElement("button");
    btn.className = "btn danger sm";
    btn.innerHTML = "Delete";
    btn.addEventListener("click", function () {
      data.combos.splice(i, 1);
      saveData();
      showCombos();
    });
    sec.appendChild(btn);
    list.appendChild(sec);
  }
}

function fillText(text) {
  const name = (get("qName") ? get("qName").value.trim() : "") || "{name}";
  const order = (get("qOrder") ? get("qOrder").value.trim() : "") || "{order}";
  return text.split("{name}").join(name).split("{order}").join(order);
}
function showReplies() {
  if (!get("qList") || !data) return;
  const list = get("qList");
  list.innerHTML = "";
  const all = [];
  for (let i = 0; i < replyTemplates.length; i++) {
    all.push({ title: replyTemplates[i].title, text: replyTemplates[i].text, own: false, index: -1 });
  }
  for (let i = 0; i < data.replies.length; i++) {
    all.push({ title: "My message", text: data.replies[i], own: true, index: i });
  }
  for (let i = 0; i < all.length; i++) {
    const r = all[i];
    const sec = document.createElement("section");
    sec.className = "review";
    sec.innerHTML = "<strong>" + r.title + '</strong><p class="reply">' + safe(fillText(r.text)) + "</p>";
    const copy = document.createElement("button");
    copy.className = "btn sm";
    copy.innerHTML = "Copy";
    copy.addEventListener("click", function () {
      navigator.clipboard.writeText(fillText(r.text));
      copy.innerHTML = "Copied";
      setTimeout(function () { copy.innerHTML = "Copy"; }, 1200);
    });
    sec.appendChild(copy);
    if (r.own) {
      const del = document.createElement("button");
      del.className = "btn danger sm";
      del.innerHTML = "Delete";
      del.addEventListener("click", function () {
        data.replies.splice(r.index, 1);
        saveData();
        showReplies();
      });
      sec.appendChild(del);
    }
    list.appendChild(sec);
  }
}

function showGoal() {
  if (!get("gTarget") || !data) return;
  get("gTarget").value = data.goal.target ? data.goal.target : "";
  updateGoal();
}
function updateGoal() {
  if (!get("gTitle") || !data) return;
  const g = data.goal;
  g.target = number("gTarget");
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = lastDay - now.getDate() + 1;
  let sold = 0;
  for (let i = 0; i < g.entries.length; i++) sold += g.entries[i].amount;
  const left = g.target > sold ? g.target - sold : 0;
  let percent = 0;
  if (g.target > 0) percent = Math.min(100, Math.round(sold / g.target * 100));
  get("gTitle").innerHTML = now.toLocaleString("en", { month: "long", year: "numeric" }) +
    " target: " + percent + "%";
  get("gBar").style.width = percent + "%";
  get("gProg").classList.toggle("done", g.target > 0 && sold >= g.target);
  get("gSold").innerHTML = money(sold);
  get("gLeft").innerHTML = money(left);
  get("gDays").innerHTML = daysLeft;
  get("gPer").innerHTML = money(Math.ceil(left / daysLeft));
  if (g.target === 0) get("gHint").innerHTML = "Enter a target to start tracking.";
  else if (sold >= g.target) get("gHint").innerHTML = "Target reached. Great month!";
  else get("gHint").innerHTML = "This includes today.";

  const list = get("gList");
  list.innerHTML = "";
  if (g.entries.length === 0) list.innerHTML = '<p class="note">No sales added yet.</p>';
  for (let i = g.entries.length - 1; i >= 0; i--) {
    const e = g.entries[i];
    const sec = document.createElement("section");
    sec.className = "sale";
    sec.innerHTML = "<p><strong>" + money(e.amount) + '</strong> <span class="note">' + e.date +
      (e.note ? " - " + safe(e.note) : "") + "</span></p>";
    const btn = document.createElement("button");
    btn.className = "btn danger sm";
    btn.innerHTML = "Delete";
    btn.addEventListener("click", function () {
      g.entries.splice(i, 1);
      updateGoal();
    });
    sec.appendChild(btn);
    list.appendChild(sec);
  }
  saveData();
}

const sessionUser = getSessionUser();
if (page) {
  if (!sessionUser) {
    window.location.href = "index.html";
  } else {
    openApp(sessionUser);
  }
}

if (page === "items") {
  fillCategories();
  showItems();
  if (get("iSearch")) get("iSearch").addEventListener("keyup", showItems);
  if (get("iCat")) get("iCat").addEventListener("change", showItems);
  if (get("iForm")) {
    get("iForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const name = get("iaName").value.trim();
      const price = Number(get("iaPrice").value);
      const unit = get("iaUnit").value.trim();
      if (name === "" || unit === "" || price < 1) return;
      data.items.unshift({
        id: Date.now(),
        name: name,
        category: get("iaCat").value,
        price: price,
        unit: unit
      });
      saveData();
      this.reset();
      showItems();
    });
  }
}

if (page === "price") {
  calcPrice();
  const priceBoxes = ["cCost", "cPack", "cShip", "cFee", "cProf", "cTry"];
  for (let i = 0; i < priceBoxes.length; i++) {
    if (get(priceBoxes[i])) get(priceBoxes[i]).addEventListener("input", calcPrice);
  }
}

if (page === "flash") {
  fillFlashItems();
  showSales();
  if (get("fProd")) get("fProd").addEventListener("change", updateFlashPriceBox);
  if (get("fDisc")) get("fDisc").addEventListener("input", updateFlashPriceBox);
  if (get("fForm")) {
    get("fForm").addEventListener("submit", function (event) {
      event.preventDefault();
      const id = Number(get("fProd").value);
      let discount = Number(get("fDisc").value);
      let minutes = Number(get("fMin").value);
      if (itemById(id) === null) return;
      if (discount < 1) discount = 1;
      if (discount > 90) discount = 90;
      if (minutes < 1) minutes = 1;
      data.sales.push({ itemId: id, discount: discount, end: Date.now() + minutes * 60000 });
      saveData();
      showSales();
    });
  }
  setInterval(function () {
    if (data !== null) showSales();
  }, 1000);
}

if (page === "combo") {
  showComboItems();
  updateCombo();
  showCombos();
  if (get("cSearch")) get("cSearch").addEventListener("keyup", showComboItems);
  if (get("cbDisc")) get("cbDisc").addEventListener("input", updateCombo);
  if (get("cbSaveBtn")) {
    get("cbSaveBtn").addEventListener("click", function () {
      const name = get("cbName").value.trim();
      const d = comboDiscount();
      const names = [];
      let total = 0;
      for (let i = 0; i < selectedIds.length; i++) {
        const item = itemById(selectedIds[i]);
        if (item !== null) { names.push(item.name); total += item.price; }
      }
      if (names.length < 2) { get("cbMsg").innerHTML = "Tick at least 2 items."; return; }
      if (name === "") { get("cbMsg").innerHTML = "Give the combo a name."; return; }
      get("cbMsg").innerHTML = "";
      data.combos.push({
        name: name,
        discount: d,
        oldTotal: total,
        price: Math.round(total * (1 - d / 100)),
        names: names
      });
      saveData();
      get("cbName").value = "";
      selectedIds = [];
      showComboItems();
      updateCombo();
      showCombos();
    });
  }
}

if (page === "reply") {
  showReplies();
  if (get("qName")) get("qName").addEventListener("keyup", showReplies);
  if (get("qOrder")) get("qOrder").addEventListener("keyup", showReplies);
  if (get("qAdd")) {
    get("qAdd").addEventListener("click", function () {
      const text = get("qNew").value.trim();
      if (text === "") return;
      data.replies.push(text);
      saveData();
      get("qNew").value = "";
      showReplies();
    });
  }
}

if (page === "goal") {
  showGoal();
  if (get("gTarget")) get("gTarget").addEventListener("keyup", updateGoal);
  if (get("gAdd")) {
    get("gAdd").addEventListener("click", function () {
      const amount = Number(get("gAmt").value);
      if (amount <= 0) { get("gMsg").innerHTML = "Enter the sales amount."; return; }
      get("gMsg").innerHTML = "";
      data.goal.entries.push({
        amount: amount,
        note: get("gNote").value.trim(),
        date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      });
      get("gAmt").value = "";
      get("gNote").value = "";
      updateGoal();
    });
  }
}