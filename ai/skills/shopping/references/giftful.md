# Giftful Automation

Use this reference when managing Giftful wish lists through a browser. Keep this file generic and public-safe.

## Inputs Needed

- Product URL, title, and any variant details such as size, color, scent, quantity, or priority.
- Optional note for the list item.
- Target wishlist only when the browser session cannot infer one safely.

Do not require a stored Giftful URL before trying browser-session discovery.

## Browser Workflow

1. Start an authenticated browser profile if needed. Prefer a user-controlled browser profile so the user can complete login interactively.
2. Navigate to Giftful's home/dashboard/profile area, or to a user-provided Giftful URL when one is available in the current session.
3. If not logged in, pause and ask the user to sign in. Do not request or handle passwords directly.
4. Discover visible wishlists from the authenticated UI. Treat the UI as the source of truth for names, defaults, and available lists.
5. Pick the target list only when confidence is high: explicit user instruction, a single available list, or a clearly labeled default/main wishlist. If multiple plausible lists exist, ask the user to choose.
6. Find the UI for adding an item to the selected wishlist.
7. Enter the product URL first when Giftful supports URL import. Use real browser input semantics: focus the field and paste/type the URL as a user would, then trigger Next with a click/Enter. In CDP automation, prefer `Input.insertText` after focusing the field. Do **not** set React-controlled input values by direct JavaScript property assignment; Giftful may reject those as invalid even when the same URL works for a human.
8. Wait for Giftful to import metadata from the URL. Verify title, image, price, and target wishlist before saving. A successful import should populate the Wish Details form (title/price/etc.) before Save Wish.
9. If URL import fails after real paste/type input, stop and report the exact validation/error state. Do not silently switch to manual add unless the user explicitly approves that fallback.
10. Save the item.
11. Confirm by checking the item appears on the wishlist page.

## Product Resolution

Before adding:

- Prefer official brand pages or reputable retailers.
- Make variant assumptions explicit.
- Avoid marketplace or affiliate links unless the user asked for that seller.
- If the product is unavailable, ask whether to add it anyway or choose an alternative.

## Safety Boundaries

- Do not buy, reserve, mark purchased, or claim an item unless explicitly asked.
- Do not expose private wishlist URLs in durable public files.
- Do not store login credentials, addresses, payment details, or account data.

## If Automation Fails

Report:

- The page/action where it failed.
- Whether login, CAPTCHA, a changed UI, or missing product details blocked progress.
- What the user can do next, such as signing in or providing the wishlist URL.
