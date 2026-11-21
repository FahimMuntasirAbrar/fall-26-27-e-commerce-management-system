# E-Commerce — Delivery Man part (CSC 3215 Project Prototype 1)

Open `delivery-login.html` in Chrome to start. No installation needed.

Demo logins: `delivery` / `delivery123` or `rubel` / `rubel1234`.

## Your four requirements and where they are

| # | Requirement | Where |
|---|---|---|
| 1 | Sign up page and login page | `delivery-register.html` + `js/delivery-register.js`, `delivery-login.html` + `js/delivery-login.js` |
| 2 | Create, Read, Update, Delete and Search on the dashboard | **Delivery Notes** tab of `delivery.html`, code in `js/delivery.js` (`saveNote`, `renderNotes`, `editNote`, `deleteNote`, search box and type filter) |
| 3 | 3 unique features | **My Orders** (accept orders, status flow, max 5 at once), **Route Planner**, **Earnings & Cash** |
| 4 | Pages & Forms, CSS, HTML/CSS/JS separation, JS validation, DOM manipulation | See the table in `CO3_Delivery_Module_Notes.md` |

## Files

```
delivery-login.html      Login (only Delivery accounts can enter)
delivery-register.html   Sign up (personal info, NID, vehicle, area, shift, username, password)
delivery.html            Dashboard: My Orders / Delivery Notes / Route Planner / Earnings & Cash
css/style.css            ONE style sheet for every page
js/data.js               Sample data (shared with the team's other pages)
js/common.js             Helper functions (shared with the team's other pages)
js/delivery-login.js     Login validation
js/delivery-register.js  Sign-up validation
js/delivery.js           Dashboard features
screenshots/             Pictures for the CO3 form
CO3_Delivery_Module_Notes.md   CO3 description draft and viva notes
```

`data.js`, `common.js` and `style.css` are shared with the rest of the group, so keep them the same as in the group repo.

## Good to know

- **Frontend only:** data lives in arrays and resets when a page reloads or you open another page. A new sign-up is kept only until the page reloads.
- The dashboard always shows **Kamal Hossain** (`currentDeliveryId = "U-005"` in `js/delivery.js`) whoever logs in. With the PHP backend this will come from the session.
- In the group project, the home page and the all-role login and sign-up pages come from the shared repo. This package only has the delivery man's own pages.
