# Online Marketplace — Admin part (Project Prototype 1)

Frontend only: HTML pages and forms, one external CSS file, external JavaScript files,
JavaScript form validation and DOM manipulation. Data lives in arrays of objects in
`js/data.js` and resets when the page reloads (the PHP + MySQL backend comes later).

## How to run

Open `login.html` in Chrome or Firefox and log in as **admin / admin1234**
(the "Use" buttons fill the form). `admin.html` also opens directly.

| Account | Username | Password | What happens |
|---|---|---|---|
| Admin | `admin` | `admin1234` | Opens the admin dashboard |
| Seller | `seller` | `seller123` | Goes to `seller.html` (teammate's part, not in this zip) |
| Pending seller | `tea` | `tea12345` | Refused until the admin approves the shop |
| Blocked customer | `tanvir` | `tanvir1234` | Refused until the admin unblocks the account |

## Files

```
login.html        One login page for every role
admin.html        Admin dashboard (9 sections, one shown at a time)
css/style.css     One external style sheet for every page
js/data.js        Sample data: users, products, orders, rules, categories, coupons, disputes, announcements, activityLog
js/common.js      Shared helpers: showSection, errors, messages, validation, search
js/login.js       validateLogin() + switch on role
js/admin.js       All admin features
```

Scripts load at the end of `<body>` in this order: `data.js` → `common.js` → the page's own script.

## Admin features

The admin has one CRUD + Search section and eight admin-only features. No other role has any of them.

| Part | What it does | Main functions |
|---|---|---|
| **CRUD + Search: Manage users** | Add, list, edit, delete and search accounts of all four roles; filter by role and status; block / unblock / approve | `renderUsers`, `saveUser`, `editUser`, `deleteUser`, `setUserStatus` |
| **1. Statistics report** | Counts users, products, orders, revenue and commission with loops; a bar chart of users by role and a pie chart of orders by status | `showStats` |
| **2. Seller approvals** | Shops waiting as *pending*; approve, or reject with a required reason; decision history | `renderPending`, `decideSeller`, `renderDecisions` |
| **3. Platform rules** | Commission, tax and inside / outside Dhaka delivery fees, with a live preview and "Restore defaults" | `loadRules`, `previewRules`, `saveRules` |
| **4. Category manager** | Add, rename and delete product categories; renaming also updates the products | `renderCategories`, `saveCategory`, `editCategory`, `deleteCategory` |
| **5. Coupon manager** | Create discount codes (percent or fixed), activate / deactivate, delete; live preview | `renderCoupons`, `saveCoupon`, `toggleCoupon`, `couponStatus`, `previewCoupon` |
| **6. Disputes and refunds** | Review customer complaints; refund, or reject with a required note; filter by status | `renderDisputes`, `decideDispute` |
| **7. Announcements** | Post a notice for everyone or one role, with a character counter; remove notices | `saveAnnouncement`, `renderAnnouncements`, `countNoticeChars` |
| **8. Activity log** | Every admin action is recorded by `addLog()`; filter by type, colour per type, clear log | `addLog`, `renderLog`, `getLogColor`, `clearLog` |

Other dashboards can show the admin's notices with `showAnnouncements("boxId", "seller")` from `common.js`.

## How to explain each feature in the viva

Every feature follows the same three steps, so one explanation fits all of them:

1. **Data** is an array in `js/data.js` (`users`, `categories`, `coupons`, `disputes`, `announcements`, `activityLog`).
2. A **render function** loops over the array and writes the rows into the page with `innerHTML` (or `createElement` + `appendChild`).
3. A **save / decide function** runs on `onsubmit` or `onclick`: it validates, shows errors beside the fields, changes the array, then calls the render function again.

| Feature | One-sentence explanation | Concept to point at |
|---|---|---|
| Manage users | "The form pushes a new object into `users`, or changes the object at `editUserIndex`; the table is redrawn from the array." | `push`, `editIndex`, `removeAt` (slice + concat) |
| Statistics | "I loop over the arrays and count. The bar width is the percentage. The pie uses CSS `conic-gradient` with percentages: each slice starts where the last one ended." | `for` loops, counters, `element.style` |
| Seller approvals | "A pending seller becomes `active` on approve; reject needs a reason and removes the account." | `if / else`, validation before an action |
| Platform rules | "`rules` is one object with four numbers. The preview recalculates on every `onkeyup`. Saving checks each number is in range, and that the outside fee is not lower than the inside fee." | objects, `onkeyup`, validation |
| Category manager | "`categories` is an array of texts; rename also loops over products to change their category; delete is refused if products still use it." | array of strings, duplicate check |
| Coupon manager | "`couponStatus()` returns Active, Inactive or Expired by checking `active` and comparing the expiry date with today." | `switch`, date text comparison, `!` to flip true/false |
| Disputes | "An open case shows a note box and two buttons; the decision changes `status`, and the summary adds up refunded amounts." | `switch` on status, running total |
| Announcements | "Each notice is a `<div>` made with `createElement`; the counter reads `value.length` while typing." | `createElement`, `appendChild`, `onkeyup` |
| Activity log | "Every save function calls `addLog(type, message)`, which pushes into `activityLog`; the board loops backwards so the newest is first." | reusable function, backwards `for` loop |

### JavaScript form validation
- **User form:** name 3+ characters; username 4+ characters, no spaces, not already taken; valid and unique email;
  password 8+ characters; role chosen; only sellers can be *pending*; the main admin must stay an active admin.
- **Delete user:** the main admin cannot be deleted; a seller with products or a customer with orders can only be blocked.
- **Reject seller / reject dispute:** a reason of at least 5 characters is required.
- **Rules form:** every number checked against a range; the outside-Dhaka fee cannot be lower than the inside-Dhaka fee.
- **Category:** 3 to 20 characters, no duplicates (ignoring capital letters); cannot delete a category that has products.
- **Coupon:** code 4 to 12 letters or digits and unique; percent 1 to 90 or amount 10 to 5000 BDT depending on type; expiry not in the past.
- **Announcement:** title 5+ characters; message 10 to 200 characters; audience chosen.

### DOM manipulation
- `innerHTML` to redraw tables, cards, charts and messages; `element.style` for sections, pie charts, log colours and the menu badge.
- `createElement` + `appendChild` for the decision history, announcements and activity log.
- `className` / `classList` for the active menu button and dark mode.
- Events: `onclick`, `onchange`, `onkeyup`, `onsubmit`, `addEventListener`.
