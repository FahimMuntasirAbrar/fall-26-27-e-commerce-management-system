# Online Marketplace - Seller (Dipta)

A vanilla HTML, CSS, and JavaScript seller web application built for managing seller accounts, product listings, smart pricing and profit margins, live flash sale timers, combo offers, customer quick-reply templates, and monthly sales goals using `localStorage`.

## Project Structure

- `index.html` — Seller login page (`#loginForm`)
- `seller-signup.html` — New seller account registration page (`#signupForm`)
- `items.html` — Product catalog management with category filtering, search, item creation, and deletion
- `price.html` — Smart price calculator with cost, packaging, courier, platform fee, profit percentage, break-even price, and custom price profit check
- `flash.html` — Live countdown flash sale timer with discount calculation and manual end controls
- `combo.html` — Multi-item combo offer builder with live discount preview and saved combo list
- `reply.html` — Quick reply templates supporting `{name}` and `{order}` placeholders, custom templates, and clipboard copy
- `goal.html` — Monthly sales target tracker with progress bar, days remaining, required daily sales, and daily sales log
- `css/style.css` — Layout, responsive grid, forms, tables, timers, and progress bar styles
- `js/data.js` — Starter categories (`categories`), product catalog (`items`), and default quick-reply templates (`replyTemplates`)
- `js/app.js` — Session/auth handling, `localStorage` persistence (`dokanUsers`, `dokanSession`, `dokanData_<email>`), and page logic

## How to Run

1. Extract `Online Marketplace-Seller(Dipta).zip`.
2. Open `index.html` in a web browser (or serve the folder via a local server such as VS Code Live Server).
3. Create an account on `seller-signup.html` or log in on `index.html` to open the seller workspace.
