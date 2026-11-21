/* =====================================================================
   data.js  -  Sample data for the whole system
   ---------------------------------------------------------------------
   Every list is an ARRAY OF OBJECTS (Lecture 05: "Arrays of objects").
   Each object groups related values as  name: value  pairs.

   IMPORTANT (frontend only):
   This data lives in the browser's memory. When you reload a page or
   move to another page, it starts again from these values.
   When the backend (PHP + MySQL) is built later, these arrays will be
   replaced by data that comes from the database.
   ===================================================================== */


// ---------- Users of the system (used by Login, Register and Admin) ----------
// role: "Admin", "Buyer", "Seller" or "Delivery"
// status: "Active"  = can log in
//         "Pending" = registered, waiting for an admin to approve (sellers)
//         "Blocked" = stopped by an admin
let users = [
  { id: "U-001", name: "Rifat Hasan",   username: "admin",    password: "admin1234",    email: "admin@mail.com",   phone: "01711000001", role: "Admin",    status: "Active" },

  { id: "U-002", name: "Sadia Akter",   username: "seller",   password: "seller123",    email: "sadia@mail.com",   phone: "01711000002", role: "Seller",   status: "Active",
    shopName: "Sadia Gadgets", tradeLicense: "TL-100234", category: "Electronics" },
  { id: "U-009", name: "Nasima Begum",  username: "nasima",   password: "nasima123",    email: "nasima@mail.com",      phone: "01711000009", role: "Seller",   status: "Pending",
    shopName: "Nasima Fashion", tradeLicense: "TL-100877", category: "Fashion" },

  { id: "U-003", name: "Rahim Uddin",   username: "buyer",    password: "buyer1234",    email: "rahim@mail.com",       phone: "01711000003", role: "Buyer",    status: "Active",
    address: "House 12, Road 5, Dhanmondi, Dhaka", area: "Dhanmondi" },
  { id: "U-004", name: "Karim Hasan",   username: "karim",    password: "karim1234",    email: "karim@mail.com",       phone: "01711000004", role: "Buyer",    status: "Active",
    address: "Flat 4B, Mirpur 10, Dhaka", area: "Mirpur" },

  { id: "U-005", name: "Kamal Hossain", username: "delivery", password: "delivery123",  email: "kamal@mail.com",   phone: "01711000005", role: "Delivery", status: "Active",
    nid: "1990123456789", vehicle: "Bike", area: "Dhanmondi", shift: "Day" },
  { id: "U-006", name: "Rubel Mia",     username: "rubel",    password: "rubel1234",    email: "rubel@mail.com",   phone: "01711000006", role: "Delivery", status: "Active",
    nid: "1234567890", vehicle: "Cycle", area: "Mirpur", shift: "Day" },
  { id: "U-007", name: "Tanvir Ahmed",  username: "tanvir",   password: "tanvir1234",   email: "tanvir@mail.com",      phone: "01711000007", role: "Buyer",    status: "Blocked",
    address: "Road 3, Uttara, Dhaka", area: "Uttara" }
];


// ---------- Products for sale (used by Home, Seller, Buyer) ----------
let products = [
  { id: "P-101", name: "Wireless Mouse",          category: "Electronics", price: 850,  stock: 25, sellerId: "U-002", shop: "Sadia Gadgets" },
  { id: "P-102", name: "Bluetooth Headphones",    category: "Electronics", price: 2450, stock: 12, sellerId: "U-002", shop: "Sadia Gadgets" },
  { id: "P-103", name: "USB-C Charger 30W",       category: "Electronics", price: 1200, stock: 40, sellerId: "U-002", shop: "Sadia Gadgets" },
  { id: "P-104", name: "Cotton Panjabi",          category: "Fashion",     price: 1500, stock: 18, sellerId: "U-009", shop: "Nasima Fashion" },
  { id: "P-105", name: "Women's Handbag",         category: "Fashion",     price: 1850, stock: 9,  sellerId: "U-009", shop: "Nasima Fashion" },
  { id: "P-106", name: "Non-stick Frying Pan",    category: "Home",        price: 890,  stock: 30, sellerId: "U-002", shop: "Sadia Gadgets" },
  { id: "P-107", name: "Table Lamp",              category: "Home",        price: 720,  stock: 0,  sellerId: "U-002", shop: "Sadia Gadgets" },
  { id: "P-108", name: "Programming Book Bundle", category: "Books",       price: 1650, stock: 14, sellerId: "U-002", shop: "Sadia Gadgets" }
];


// ---------- Orders (used by Buyer, Seller, Delivery, Admin) ----------
// status: "Placed" -> "Assigned" -> "Picked Up" -> "Out for Delivery" -> "Delivered" or "Failed"
// payment: "COD" (cash on delivery) or "Paid" (paid online already)
// deliveryId: the delivery man who took the order ("" = nobody yet)
// distanceKm is the distance from the warehouse hub
// cashDeposited: true after the delivery man gives the COD cash to the company
let orders = [
  { id: "O-1001", buyerId: "U-003", customer: "Rahim Uddin",  phone: "01711000003", address: "House 12, Road 5, Dhanmondi",   area: "Dhanmondi",   item: "Bluetooth Headphones",    qty: 1, total: 2450, payment: "COD",  status: "Assigned",         deliveryId: "U-005", date: "2026-11-13", note: "",                      cashDeposited: false },
  { id: "O-1002", buyerId: "U-004", customer: "Karim Hasan",  phone: "01711000004", address: "Road 27, Dhanmondi",            area: "Dhanmondi",   item: "USB-C Charger 30W",       qty: 1, total: 1200, payment: "Paid", status: "Picked Up",        deliveryId: "U-005", date: "2026-11-13", note: "",                      cashDeposited: false },
  { id: "O-1003", buyerId: "U-003", customer: "Rahim Uddin",  phone: "01711000003", address: "Block C, Mohammadpur",          area: "Mohammadpur", item: "Non-stick Frying Pan",    qty: 1, total: 890,  payment: "COD",  status: "Out for Delivery", deliveryId: "U-005", date: "2026-11-12", note: "",                      cashDeposited: false },
  { id: "O-1004", buyerId: "U-004", customer: "Karim Hasan",  phone: "01711000004", address: "Road 8, Dhanmondi",             area: "Dhanmondi",   item: "Cotton Panjabi",          qty: 1, total: 1500, payment: "COD",  status: "Delivered",        deliveryId: "U-005", date: "2026-11-12", note: "Delivered to customer", cashDeposited: false },
  { id: "O-1005", buyerId: "U-003", customer: "Rahim Uddin",  phone: "01711000003", address: "Section 10, Mirpur",            area: "Mirpur",      item: "Programming Book Bundle", qty: 1, total: 1650, payment: "Paid", status: "Delivered",        deliveryId: "U-005", date: "2026-11-11", note: "Delivered to customer", cashDeposited: true },
  { id: "O-1006", buyerId: "U-004", customer: "Karim Hasan",  phone: "01711000004", address: "Sector 4, Uttara",              area: "Uttara",      item: "Women's Handbag",         qty: 1, total: 1850, payment: "COD",  status: "Failed",           deliveryId: "U-005", date: "2026-11-10", note: "Customer not at home",  cashDeposited: false },
  { id: "O-1007", buyerId: "U-003", customer: "Rahim Uddin",  phone: "01711000003", address: "Mirpur 1, near the bus stop",   area: "Mirpur",      item: "Wireless Mouse",          qty: 2, total: 1700, payment: "COD",  status: "Assigned",         deliveryId: "U-005", date: "2026-11-13", note: "",                      cashDeposited: false },
  { id: "O-1008", buyerId: "U-004", customer: "Karim Hasan",  phone: "01711000004", address: "Gulshan 2, Road 90",            area: "Gulshan",     item: "Table Lamp",              qty: 1, total: 720,  payment: "Paid", status: "Placed",           deliveryId: "",      date: "2026-11-14", note: "",                      cashDeposited: false },
  { id: "O-1009", buyerId: "U-003", customer: "Rahim Uddin",  phone: "01711000003", address: "Block B, Mohammadpur",          area: "Mohammadpur", item: "Cotton Panjabi",          qty: 1, total: 1500, payment: "COD",  status: "Placed",           deliveryId: "",      date: "2026-11-14", note: "",                      cashDeposited: false },
  { id: "O-1010", buyerId: "U-004", customer: "Karim Hasan",  phone: "01711000004", address: "Mirpur 12, Road 3",             area: "Mirpur",      item: "Wireless Mouse",          qty: 1, total: 850,  payment: "COD",  status: "Assigned",         deliveryId: "U-006", date: "2026-11-13", note: "",                      cashDeposited: false }
];


// ---------- Delivery rules (set by Admin, used by Delivery) ----------
// A single object: its properties are read with dot notation, e.g. deliveryRules.feePerOrder
let deliveryRules = {
  feePerOrder: 50,      // Taka paid for every delivered order
  perKm: 8,             // Taka paid for every km travelled
  bonusTarget: 5,       // deliver 5 or more orders in a day to get the bonus
  bonusAmount: 100,     // the daily bonus
  rainBonus: 30,        // extra Taka on a rainy day
  nightBonus: 40,       // extra Taka for night deliveries (after 8 PM)
  maxActive: 5          // a delivery man can carry at most 5 orders at once
};


// ---------- Delivery notes written by delivery men (used by Delivery) ----------
// type: "Delivered", "Failed Attempt", "Customer Note" or "Damage Report"
let deliveryNotes = [
  { id: "N-001", deliveryId: "U-005", orderId: "O-1004", type: "Delivered",      note: "Handed over to the customer. Cash 1500 Tk collected.", date: "2026-11-12" },
  { id: "N-002", deliveryId: "U-005", orderId: "O-1006", type: "Failed Attempt", note: "Customer phone was switched off and nobody was home.",    date: "2026-11-10" },
  { id: "N-003", deliveryId: "U-005", orderId: "O-1003", type: "Customer Note",  note: "Customer asked me to call before reaching the gate.",     date: "2026-11-13" },
  { id: "N-004", deliveryId: "U-006", orderId: "O-1010", type: "Customer Note",  note: "Leave the parcel with the guard if nobody opens.",        date: "2026-11-13" }
];


// ---------- Activity log (used by Admin) ----------
let activityLog = [
  { time: "2026-11-12 09:12", user: "admin",    type: "User",     message: "Created delivery account for Kamal Hossain" },
  { time: "2026-11-12 11:40", user: "seller",   type: "Product",  message: "Added product: Wireless Mouse (P-101)" },
  { time: "2026-11-13 14:05", user: "delivery", type: "Delivery", message: "Picked up order O-1002" },
  { time: "2026-11-13 16:22", user: "admin",    type: "Security", message: "Blocked account of Tanvir Ahmed" },
  { time: "2026-11-13 18:30", user: "nasima",   type: "User",     message: "New seller registration waiting for approval: Nasima Begum" }
];
