# Verdkt — Business Map

_Working strategy doc. Written 2026-07-10 off the first LinkedIn post's real engagement. Honest, not hype. Revisit and edit as reality talks back._

## 1. Thesis (one line)

Trading is a low-trust market. Independent, honest proof of edge is the scarcest thing in it. Verdkt sells that proof.

## 2. Why this, why now

- Retail algo and quant trading is large and growing, and AI is now flooding it with auto-generated strategies, bots, and signals.
- Trust is broken. Everyone shows a pretty backtest; most are overfit or cherry-picked; buyers get burned; honest sellers can't credibly stand out; lawyers see disputes.
- The timing hook: AI is collapsing the cost of _making_ a strategy, which raises the value of _validating_ one. (This is literally what Ifiok said: "your second can become an AI trading bot tester.")

The free tool already proved it can pull the right crowd. The first post drew experienced traders (Chris Tubby, 5 decades; Neil Prior, FX/consultant), an AI-automation builder (Ifiok), a crypto compliance lawyer, and a founder looking at the profile. That is the market telling us who cares.

## 3. Who actually pays (ranked)

Rank by "has money AND has the pain," not by who is loudest.

**Primary — seller-side (need credibility to sell):**
- Signal / bot / EA sellers (MQL5, Telegram, Whop, Fiverr, Gumroad).
- Trading educators and course creators who want proof for an audience (the Chris Tubby persona).
- Funded / prop-firm traders and aspiring fund managers who need to show a defensible track record.

**Secondary — builder-side:**
- AI-automation builders and indie quant devs auto-generating strategies (the Ifiok persona). Sold as an API.

**Tertiary — later, higher price per deal:**
- Prop firms (screen applicants), small funds, and compliance/legal (the lawyer): independent statistical evidence and risk disclosure. Slow sales, needs credibility we do not have yet.

**Who does NOT pay:** casual hobbyists. Do not build for them. They are audience, not customers.

## 4. The core product: Verdkt Verified

- **Free tool stays free.** It is the top of the funnel and the audience magnet. Private, in-browser, nothing uploaded.
- **Paid layer turns a verdict into a credibility artifact:** a saved, shareable **report at a public URL**, an embeddable **"Verdkt Verified" badge**, and a downloadable PDF.
- **What they actually buy is external credibility,** not the analysis. The badge sits on a sales page or profile and says "an independent, honesty-first tester looked at this," in a market where everyone else just posts screenshots.
- **Two use directions, same engine:**
  - _Seller side:_ "I want to prove my edge to buyers." (Marketing asset.)
  - _Buyer side:_ "Before I pay for this bot/signal, let me run their track record through Verdkt." (Vetting.)

**Positioning / the moat is neutrality:** we never sell strategies, never take a cut of trades, never run a fund. We only tell the truth. The founder's public negative-result story ("I proved my own bot can't beat the market") is credibility that a competitor cannot fake.

## 5. The one hard problem: data authenticity

This is the make-or-break, so name it now. If anyone can upload a fake CSV and get a badge, the badge is worthless and buyers will not trust it.

Phased answer:
- **v1 (fast): "method-verified on submitted data,"** stated plainly on the badge and report. Honest about the limit. Still useful as a differentiator and a marketing asset, and it fully powers the _buyer-side_ vetting case (the buyer controls the input, so authenticity is their problem, not ours).
- **v2 (premium): "broker-verified."** Read-only broker/exchange connection (the Myfxbook model) or exchange API import, so the trades are authenticated, not just the math. This is the version worth real money on the seller side.
- Sell the tiers explicitly: _Submitted_ vs _Broker-Verified_. Never blur them.

## 6. Pricing (hypotheses to test, not gospel)

Price on the customer's upside, not our cost. If a badge helps a seller close one extra $200 subscriber, $29/mo is nothing.

- Verified report: one-time **$19–$49**, or
- **Pro subscription $9–$29/mo:** unlimited reports, hosted public pages, badge, PDF, re-verify on new data.
- Buyer-vet: cheap one-off, or bundled into Pro.
- API (later): usage-based (per 1k validations) or **$49–$199/mo** tiers for builders.
- Compliance / audit (later): **$500–$5k** bespoke engagements.

## 7. Competition (honest)

- **Myfxbook / FX Blue:** established, verify _that trades happened_ via broker connection. They do not tell you _whether there is a real, robust edge_. Verdkt's angle is statistical honesty and a verdict, not just authenticity. Risk: their badge is the incumbent trust signal, so Verdkt must be clearly better or clearly different, not a worse copy.
- **QuantConnect and backtest platforms:** for building, not for an independent verdict.
- **Prop-firm eval tools:** internal, not a product.
- **The gap nobody fills:** an independent, buyer-trusted, honesty-first _verdict plus badge_. That is the wedge.

## 8. Go-to-market

- **Content engine (already working):** keep the honest-journey posts. Each one routes to the free tool, which upsells Verified.
- **Warm outreach first:** the commenters are lead list #1. Offer free early Verified reports for feedback, a testimonial, and permission to feature.
- **Go where sellers live:** MQL5 forums, r/algotrading, FX X/Twitter, Telegram groups, Whop creators.
- **Partnerships:** educators (Chris Tubby type) telling their audience to "get Verdkt Verified," with an affiliate cut.

## 9. Risks and kill-criteria (be disciplined)

- **Willingness to pay is unproven.** A handful of comments is encouragement, not revenue. Validate with real pre-orders or deposits from the warm leads in the first 30 days. If fewer than a small handful will pay, pivot the offer before building more.
- **Authenticity (see section 5).** Ship v1 transparent; do not let the badge overclaim.
- **Privacy promise vs hosted reports.** "Nothing uploaded" is a free-tier promise. The paid tier explicitly opts in to publish. Keep the free tier client-only so the promise stays true.
- **Regulatory.** It is analysis, never advice, and never implies returns. The disclaimer stays.
- **Trader cynicism about tools.** Countered only by the honesty brand and the real founder story. Do not become another hype vendor.

## 10. 30 / 60 / 90

- **0–30 (validate):** outreach to warm leads, a waitlist / pre-order CTA on the live tool, 5 to 10 real customer conversations, one pricing test. Decide go / no-go on paid.
- **30–60 (build v1):** if validated, ship Verdkt Verified: light auth, saved public report page, badge, PDF, Stripe. Get it into the warm leads' hands. First revenue.
- **60–90 (deepen):** iterate on real usage, add broker/exchange import for authenticity, seed the validation API for builders, publish case studies of Verified sellers.

## 11. Metrics

- **Leading:** free-tool runs, report-page views, waitlist signups, outreach reply rate.
- **Real:** paying customers, MRR, live badge embeds, re-verify rate (retention).

---

**Immediate call to make:** how much authenticity v1 needs (submitted-only vs broker-connect from day one) shapes the whole build. Recommendation: ship submitted-only + transparent first, because it is fast, it fully serves the buyer-side vetting case, and it lets us learn who pays before investing in broker integrations.

**Sequence agreed:** map (this doc) → build Verdkt Verified → build the validation API.
