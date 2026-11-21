# Online Marketplace (E-Commerce Management System)

CSC 3215 Web Technologies, Fall 2026-27, Project Prototype 1. Frontend only: HTML pages and forms,
CSS in the `css` folder, JavaScript in the `js` folder, JavaScript form validation and DOM manipulation.

## How to run

Open `index.html` (the Home page) in a browser and choose a role.

| Role | Member | Pages |
|---|---|---|
| Admin | Fahim Muntasir Abrar (24-59952-3) | `login.html`, `admin.html` |
| Seller | Dipta | `seller-login.html`, `seller-signup.html`, `items.html`, `price.html`, `flash.html`, `combo.html`, `reply.html`, `goal.html` |
| Customer | Mehedi Hasan Robel | `customer-login.html`, `customer-signup.html`, `customer.html` |
| Delivery operator | Md. Tanver Ahmed | `delivery-login.html`, `delivery-register.html`, `delivery.html` |

Admin demo login: `admin` / `admin1234`.

## Folder structure

```
index.html, login.html, admin.html, seller-*.html, customer-*.html, delivery-*.html ...   all pages
image/   favicon and screenshots
css/     style.css (home, login, admin), seller.css, customer.css, delivery.css
js/      data.js, common.js, login.js, admin.js            (home, login, admin)
         seller-data.js, seller-app.js                     (seller)
         customer-auth.js, customer.js                     (customer)
         delivery-data.js, delivery-common.js, delivery-*.js (delivery)
doc/     each member's CO3 Project Evaluation Sheet
```

## Rules for the group

- Put your files in the right folder, and start every file name with your role (`seller-`, `customer-`, `delivery-`) so nobody overwrites anyone else.
- Never upload a file with the same name as an existing one unless it is your own file.
- Work on your own branch and open a Pull Request. Never commit straight to `main`.
- Your CO3 form goes in `doc/`, named with your ID, e.g. `CO3_Project_Evaluation_Sheet_<your-id>.docx`.
