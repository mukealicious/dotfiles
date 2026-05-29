---
name: shopping
description: Helps with shopping, gift brainstorming, product research, and browser-based wish list management. Use when asked to find gift ideas, compare products, add items to wish lists, or update Giftful-like services.
references:
  - references/giftful.md
---

# Shopping

Shopping assistant for brainstorming, researching, and maintaining wish lists without storing personal account details in the public dotfiles repo.

## Privacy Rules

- Do not hard-code personal wishlist URLs, profile URLs, recipient names, addresses, emails, budgets, or account details in this skill.
- Treat wish list URLs and shopping preferences supplied in chat or discovered in the browser as session context, not durable public configuration.
- Prefer discovering wish lists from the authenticated browser session before asking for stored URLs or private config.
- If durable private defaults are ever needed, ask the user where their private notes/config live and read them only when authorized.
- Do not purchase items, reserve gifts, or make externally visible commitments without explicit confirmation.
- Avoid exposing checkout, payment, address, or account information in logs or final responses.

## Core Defaults

- Treat shopping as collaborative: clarify taste, budget, constraints, recipient, occasion, and urgency when those details matter.
- Use the user's knowledge base when taste, hobbies, prior preferences, family context, or long-running ideas would help. Prefer `qmd` for semantic markdown search when keyword search is insufficient.
- Use web research for current availability, prices, variants, reviews, sizing, and product URLs.
- Use browser automation for wish list changes; assume there is no public API unless one is discovered during the task.
- For Giftful, prefer the logged-in browser UI as the source of truth for available lists and account state. Do not require a stored wishlist URL up front.

## Reading Order

| Task | Read |
|------|------|
| Add/update Giftful item | [giftful.md](./references/giftful.md) |
| Brainstorm gifts | This file, then knowledge-base search as needed |
| Compare products | This file; use web research for current data |

## Workflows

### Brainstorm shopping ideas

1. Identify the recipient or context: self, family member, event, budget, urgency.
2. Search notes/knowledge base for relevant preferences if useful and authorized.
3. Ask targeted questions only when ambiguity materially changes recommendations.
4. Produce a short ranked list with rationale, price range, and why each fits.
5. Offer to add selected items to a wish list once the user chooses; discover the target list from the authenticated browser session when possible.

### Research a specific product

1. Resolve the exact product, variant, size, scent/color, and seller.
2. Prefer official brand or reputable retailer URLs over SEO/content-farm pages.
3. Check price, availability, shipping/region constraints, and obvious alternatives.
4. Summarize tradeoffs briefly and include the canonical product URL.

### Add something to a wish list

1. Resolve the item to a concrete product URL and title. If variants matter, confirm or choose the obvious one and state the assumption.
2. Determine the target wish list in this order:
   - explicit user instruction in the current chat;
   - authenticated browser session discovery, especially the default/main list;
   - authorized private notes/config, only if the user has opted into that;
   - ask the user when multiple plausible lists remain.
3. Follow [Giftful automation](./references/giftful.md) for Giftful lists, or use equivalent browser automation for other services.
4. Report the final item title, URL, target list label if safe to mention, and whether the add/update was confirmed in the UI.

## Good Final Responses

- For brainstorming: concise ranked bullets, with links and price ranges when researched.
- For wish list changes: “Added/updated X on the requested wish list” plus any caveats.
- If blocked by login/CAPTCHA/UI change: state exactly where automation stopped and what user action is needed.
