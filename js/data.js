// Sample data (arrays of objects). Changes reset when the page reloads.
// Later these become MySQL tables: users, products, orders, rules.

// status is "active", "pending" (seller waiting for admin approval) or "blocked"
let users = [
  { id: "U1", name: "Site Admin", username: "admin", email: "admin@market.com", password: "admin1234", role: "admin", status: "active" },
  { id: "U2", name: "Dhaka Tech Hub", username: "seller", email: "hello@dhakatech.com", password: "seller123", role: "seller", status: "active",
    category: "Electronics", tradeLicense: "TRAD-10234", appliedOn: "2026-09-02" },
  { id: "U3", name: "Nadia Rahman", username: "customer", email: "nadia@gmail.com", password: "customer123", role: "customer", status: "active" },
  { id: "U4", name: "Rafiq Ahmed", username: "delivery", email: "rafiq@market.com", password: "delivery123", role: "delivery", status: "active" },
  { id: "U5", name: "Sylhet Tea House", username: "tea", email: "sales@sylhettea.com", password: "tea12345", role: "seller", status: "pending",
    category: "Grocery", tradeLicense: "TRAD-20877", appliedOn: "2026-11-10" },
  { id: "U6", name: "Chittagong Fashion", username: "ctgfashion", email: "info@ctgfashion.com", password: "fashion123", role: "seller", status: "pending",
    category: "Fashion", tradeLicense: "TRAD-31450", appliedOn: "2026-11-14" },
  { id: "U7", name: "Tanvir Hossain", username: "tanvir", email: "tanvir@yahoo.com", password: "tanvir1234", role: "customer", status: "blocked" }
];

let products = [
  { id: "P1", name: "Wireless Earbuds", category: "Electronics", price: 2400, stock: 15, sellerId: "U2" },
  { id: "P2", name: "Power Bank", category: "Electronics", price: 1800, stock: 4, sellerId: "U2" },
  { id: "P3", name: "Smart Watch", category: "Electronics", price: 3500, stock: 9, sellerId: "U2" },
  { id: "P4", name: "Orthodox Tea 500g", category: "Grocery", price: 650, stock: 40, sellerId: "U5" }
];

let orders = [
  { id: "O1", customerId: "U3", productId: "P1", qty: 1, status: "Placed" },
  { id: "O2", customerId: "U3", productId: "P2", qty: 2, status: "Placed" },
  { id: "O3", customerId: "U3", productId: "P3", qty: 1, status: "Packed" },
  { id: "O4", customerId: "U3", productId: "P1", qty: 2, status: "Delivered" }
];

let rules = {
  commission: 10,          // % the platform takes from each sale
  tax: 5,                  // % added to the product price
  deliveryFee: 60,         // BDT, inside Dhaka
  outsideDeliveryFee: 120  // BDT, outside Dhaka
};

// Product categories sellers choose from (managed by the admin)
let categories = ["Electronics", "Grocery", "Fashion", "Home"];

// Discount codes. type is "percent" or "fixed" (BDT). expiry is "YYYY-MM-DD".
let coupons = [
  { code: "WELCOME10", type: "percent", value: 10, expiry: "2027-06-30", active: true },
  { code: "EID200", type: "fixed", value: 200, expiry: "2026-06-30", active: true },
  { code: "TECH15", type: "percent", value: 15, expiry: "2027-01-31", active: false }
];

// Customer complaints about an order. status is "Open", "Refunded" or "Rejected".
let disputes = [
  { id: "D1", orderId: "O4", customerId: "U3", reason: "One earbud does not charge", amount: 2400, status: "Open", note: "" },
  { id: "D2", orderId: "O3", customerId: "U3", reason: "Ordered by mistake, want to cancel", amount: 3500, status: "Open", note: "" },
  { id: "D3", orderId: "O2", customerId: "U3", reason: "Charged twice for delivery", amount: 60, status: "Refunded", note: "Extra fee returned" }
];

// Notices posted by the admin. audience is "all", "seller", "customer" or "delivery".
let announcements = [
  { id: "A1", title: "Eid sale starts Friday", message: "Sellers, please update your stock before the sale begins.", audience: "seller", date: "2026-11-12" },
  { id: "A2", title: "New delivery fee", message: "Inside-Dhaka delivery is now 60 BDT on every order.", audience: "all", date: "2026-11-15" }
];

// Record of admin actions. type is User, Seller, Rules, Category, Coupon, Dispute or Notice.
let activityLog = [
  { time: "2026-11-15 10:05", type: "Notice", message: "Posted announcement: New delivery fee" },
  { time: "2026-11-16 09:30", type: "Dispute", message: "Refunded 60 BDT for dispute D3" }
];
