# KLEOS — Condensed Product & Business Spec

*v0.9 · July 2026 · This condensed spec is the design source for the prototype in this repository. Roadmap and regulatory sections flag everything that needs legal sign-off before real money is involved.*

---

## The pitch

Kleos is a licensed exchange for public attention. Fans buy and sell a persistent, continuously priced **VIP Index Share** tied to a real public figure's name, image, and likeness — musicians, actors, athletes, creators, and reality TV personalities, the same roster Cameo built its business on. Every listed VIP has signed an NIL license and earns a share of the trading fees their own market generates, which turns the platform from an unauthorized speculation venue into a new revenue line for talent. Prices come from a transparent bonding curve backed by a per-VIP reserve, so there is always a market — no order book, no counterparty, no expiration. The prototype runs on virtual USD with no withdrawals, deliberately staying on the safe side of securities and money-transmission law until counsel clears a real-money path.

## Problem and opportunity

Fandom is a market without an exchange. Fans already "invest" in public figures — streaming their catalogs, buying merch drops, betting on award outcomes — but every existing product captures only a slice of that behavior. Cameo monetizes a one-off transaction and then the relationship ends. Kalshi and Polymarket's pop-culture markets let you bet on a single expiring question, not hold a position in a person's trajectory. Creator-coin platforms let you hold exactly that position but stole the likeness to do it. Nothing offers a persistent, liquid instrument that tracks a person's cultural momentum *and* pays that person for the privilege.

Meanwhile the supply side has been trained to expect exactly this deal. College NIL turned name-image-likeness licensing into a normalized, billion-dollar-a-year category with standard contracts and agent infrastructure. The creator economy made mid-tier fame directly monetizable. The missing piece is the exchange layer: a place where attention is priced continuously and the subject of that attention is an economic participant rather than a victim of it.

## How the VIP Index Share works

Each VIP has one instrument. Its price is set by a **bonding curve**: a published formula where price is a deterministic function of how many shares have been bought. The prototype uses a linear curve — `price = base + slope × shares outstanding` — chosen for being trivially auditable. Buys pay into a per-VIP **reserve pool** and push the price up the curve; sells draw from the reserve and push it down. Because every trade executes against the reserve rather than a counterparty, the market is always liquid and never needs order matching. The reserve always equals the exact integral of the curve over shares outstanding, so every position is fully backed at curve prices.

Because a trade of any size moves along the curve as it fills, the blended price you actually pay differs from the quoted spot price. Kleos shows this **price impact** before every confirmation — spot price, blended average, impact percentage, and the new spot after your trade — the same way decentralized exchanges surface slippage. Fees are a flat 2% of trade value on both buys and sells (no maker/taker split, since there is no book), divided between the platform and the VIP.

Alongside the traded price sits the **Interest Index**: a 0–100 reference score built only from named, public, professional signals — search trends and streaming data for musicians, box office and ratings for actors, on-field statistics and transaction news for athletes, subscriber and engagement growth for creators, audience ratings for reality TV. The index informs a VIP's listing parameters and gives traders a fundamentals anchor, but the curve is what executes trades. The methodology is published per category; the platform never has discretion over what moves a price, and personal-life signals (health, relationships, tragedy) are structurally excluded.

One honest structural caveat, surfaced in the product rather than buried: bonding curves favor early buyers. Whoever buys low on the curve profits from everyone who arrives later. Kleos displays how much of each VIP's curve has already been bought on every market page and in the trade flow itself.

## NIL partner economics — why a VIP joins

No market exists without an executed NIL license; this is the entire difference between Kleos and a creator-coin site. In exchange, the VIP receives a recurring revenue share of trading fees on their own index — at launch, half of the 2% fee, i.e. 1% of all volume. A VIP whose market clears $500K in monthly volume earns $5,000 a month for zero marginal effort, against Cameo economics that require recording videos indefinitely. Their attention is already generating this activity; Kleos is the first product that routes some of it back to them. Beyond cash, VIPs get a dashboard showing what's driving their index, a verified-update channel to their most invested fans, contractual control over their listing (including exit terms), and index inputs limited to their professional life. The license binds them too: insider-trading rules prohibit anyone with advance non-public knowledge of a VIP's plans — including the VIP and their team — from trading on it.

## Competitive landscape

**Cameo** is the closest behavioral analog: same five talent categories, same fan willingness to spend real money on a parasocial relationship. But Cameo sells a one-off transaction; Kleos sells a persistent, tradeable relationship with resale value. Cameo's roster is effectively Kleos's addressable supply list.

**Royaltiz** is the closest structural analog: a live bonding-curve market for athletes and public figures, reporting 220,000+ users and roughly $250M in cumulative volume in Europe before its 2026 U.S./blockchain expansion. It validates that licensed person-markets clear at real scale. Kleos differs in roster breadth (entertainment-wide, not athlete-led), a published cross-category index methodology, and a virtual-currency-first U.S. entry rather than a token-first one.

**Hollywood Stock Exchange** has proven for nearly three decades that people will trade celebrity-linked instruments even for play money — but it never paid the talent. **Fantex** matters as regulatory precedent: it SEC-registered tracking stocks tied to athlete brand income (Arian Foster, Vernon Davis), proving a registration path exists, and then died of thin liquidity and a capital-heavy deal model — precisely the failure a bonding curve's guaranteed liquidity and no-upfront-advance model avoids. **Fandex** attempted celebrity markets without solving rights or liquidity. **Kalshi/Polymarket** pop-culture markets are expiring binaries — a different instrument, but their 18+/geofencing compliance posture is the operational playbook Kleos copies. **Socios fan tokens** show fans buying affiliation instruments at scale, but at club level with utility framing, not individual people with revenue rights.

The cautionary precedents are **BitClout/DeSo** and **Friend.tech**. BitClout auto-listed 15,000 Twitter profiles without consent; the listed threatened litigation, the tokens collapsed, and the founder ultimately faced federal fraud charges. Friend.tech had nominal opt-in but no underlying economics: a steep curve with no cash-flow tie made it a pure early-buyer extraction game, and volume collapsed more than 95% within months before the team walked away. The licensing-first model addresses the fatal flaw in both — consent plus a real fee stream to the subject gives the instrument a reason to exist beyond greater-fool dynamics, and gives the VIP a reason to sustain the market. It does **not** eliminate the early-buyer advantage inherent to bonding curves; Kleos's answer is disclosure and curve design (gentler slopes, visible curve-depth stats), not pretending the asymmetry away.

## Regulatory path

Treat as regulated-adjacent from day one. **Phase 0 (this build):** closed-loop virtual USD, no deposits' withdrawal, no cash-out — designed to stay outside securities and money-transmission frameworks, but even this needs counsel review (virtual-value and sweepstakes edge cases). **Before any real money:** a securities analysis under Howey — a continuously priced share whose value tracks a person's career, with profits expected from that person's efforts, plausibly *is* a security; the Fantex precedent suggests registration or an exemption regime rather than wishful classification. Add to that potential broker-dealer/ATS questions, state money-transmitter licensing or a custodial partner, KYC/AML, right-of-publicity compliance state by state, 18+ age-gating and jurisdiction geofencing (Kalshi/Polymarket model), and enforceable insider-trading policies. Every one of these is flagged in-product wherever the prototype's design assumes future sign-off.

## Go-to-market

Launch with 12–15 VIPs chosen for conversion, not headline fame: mid-tier figures with high engagement-to-following ratios, an existing direct-to-fan monetization habit, and no conflicting exclusivities. Illustrative of the profile (pre-outreach, implying nothing about their interest): reality TV personalities who are proven top Cameo earners (Vanderpump Rules and Love Island alumni types); creators in the Kai Cenat / iShowSpeed tier or just below, where fan intensity is extreme and NIL-style deals are familiar; NIL-native athletes such as high-profile college gymnasts and quarterbacks who already run their likeness as a business; two or three rising musicians with organized fandoms (the K-pop soloist / breakout indie act profile); and cult-following character actors — the Brian Baumgartner lesson being that the biggest Cameo earner was not the biggest star. A-listers come later as pull, once volume data makes the pitch for us.

## Monetization

Three lines: the flat 2% trading fee (launch split 50/50 platform/VIP, negotiable toward the VIP for anchor talent), a **Kleos Pro** subscription for serious traders (index analytics, movement alerts, API access), and eventually licensing the Interest Index itself as a data product. Unit economics scale with volume, not headcount; the VIP revenue share is the moat, not a cost to minimize.

## Roadmap

**Now:** virtual-currency index-share core loop (this prototype). **Next:** automated index data feeds, VIP self-serve dashboard and verified updates, mobile. **v2 (not in this build):** event contracts — binary, settlement-based markets on verifiable outcomes — reintroduced only under a proper regulatory framework, likely alongside the real-money transition, which is gated entirely on the legal work above.
