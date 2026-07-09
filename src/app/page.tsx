import { Analyzer } from "@/components/analyzer/Analyzer";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MethodGrid } from "@/components/site/MethodGrid";

export default function Home() {
  return (
    <main>
      <SiteHeader />

      <section
        className="vk-shell"
        style={{ paddingTop: "clamp(48px, 9vw, 96px)", paddingBottom: 40 }}
      >
        <div className="vk-eyebrow">Is your backtest lying to you?</div>
        <h1 className="vk-h1" style={{ marginTop: 18, maxWidth: "16ch" }}>
          Get an <em>honest verdict</em> on your trading edge.
        </h1>
        <p className="vk-lede" style={{ marginTop: 22 }}>
          Drop in a trade log. Verdkt runs the checks most backtests skip: out-of-sample stability,
          sample-size significance, and whether the result is separable from noise. It tells you
          plainly whether the edge is real, fragile, or fictional.
        </p>
      </section>

      <section className="vk-shell" style={{ paddingBottom: 64 }}>
        <Analyzer />
      </section>

      <MethodGrid />
      <SiteFooter />
    </main>
  );
}
