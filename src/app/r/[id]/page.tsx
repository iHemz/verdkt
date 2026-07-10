import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getStore, isValidId, type StoredReport } from "@/lib/reports";
import { paymentEnabled } from "@/lib/reports/config";
import { stripe } from "@/lib/payments/stripe";
import { VerdictCard } from "@/components/analyzer/VerdictCard";
import { ReportActions } from "@/components/report/ReportActions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = isValidId(id) ? await (await getStore()).get(id) : null;
  if (!report) return { title: "Verdkt Verified" };
  return {
    title: `${report.title} — Verdkt Verified`,
    description: `Independent edge verdict: ${report.analysis.verdict}. Method-verified on submitted data.`,
  };
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Pending() {
  return (
    <main className="vk-shell" style={{ paddingTop: 80, paddingBottom: 120, textAlign: "center" }}>
      <div className="vk-eyebrow">Verdkt Verified</div>
      <h1 className="vk-h1" style={{ marginTop: 16, fontSize: "clamp(30px,5vw,52px)" }}>
        This report isn&apos;t available.
      </h1>
      <p className="vk-lede" style={{ margin: "18px auto 28px" }}>
        It may not exist, it may have been unpublished, or payment is still pending. If you just
        paid, give it a moment and refresh.
      </p>
      <Link className="vk-btn" href="/">
        ← Back to Verdkt
      </Link>
    </main>
  );
}

function ReportView({ report, manageToken }: { report: StoredReport; manageToken?: string }) {
  const a = report.analysis;
  return (
    <main>
      <header className="vk-shell">
        <div className="vk-topbar">
          <Link href="/" className="vk-logo">
            <b>Verdkt</b> <span style={{ color: "var(--faint)" }}>/ verified report</span>
          </Link>
          <div className="vk-topbar-note">independent · method-verified</div>
        </div>
      </header>

      <section className="vk-shell" style={{ paddingTop: "clamp(36px,6vw,64px)", paddingBottom: 28 }}>
        <div className="vk-report-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/badge/${report.id}`} alt={`Verdkt Verified: ${a.verdict}`} height={30} />
        </div>
        <h1 className="vk-h1" style={{ marginTop: 18, fontSize: "clamp(30px,5vw,56px)" }}>
          {report.title}
        </h1>
        <div className="vk-report-meta">
          {report.author && <span>{report.author}</span>}
          <span>Published {formatDate(report.createdAt)}</span>
          <span className="vk-report-disc">Method-verified on submitted data</span>
        </div>
      </section>

      <section className="vk-shell" style={{ paddingBottom: 40 }}>
        <VerdictCard analysis={a} />
      </section>

      <section className="vk-shell" style={{ paddingBottom: 72 }}>
        <ReportActions id={report.id} manageToken={manageToken} />
      </section>

      <footer className="vk-foot">
        <div className="vk-shell" style={{ paddingTop: 24, paddingBottom: 40 }}>
          <p className="vk-topbar-note">
            This report states that these numbers, run through Verdkt&apos;s method, produce the
            verdict above. It does not prove the trades are real. Verdkt is an analysis tool, not
            financial advice.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default async function ReportPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isValidId(id)) notFound();

  const store = await getStore();

  const sessionId = typeof sp.session_id === "string" ? sp.session_id : undefined;
  if (sessionId && paymentEnabled()) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && session.metadata?.reportId === id) {
        await store.markPaid(id);
      }
    } catch {
      // ignore; falls through to the pending view
    }
  }

  const report = await store.get(id);
  if (!report) return <Pending />;

  const manageToken = typeof sp.mt === "string" ? sp.mt : undefined;
  return <ReportView report={report} manageToken={manageToken} />;
}
