const ESSAY_URL =
  "https://williamsab.dev/writing/how-to-build-a-backtest-that-can-prove-you-wrong";

export function SiteFooter() {
  return (
    <footer className="vk-foot">
      <div
        className="vk-shell"
        style={{ paddingTop: 28, paddingBottom: 40, display: "grid", gap: 8 }}
      >
        <p>
          Built by Williams Balogun. The method comes from{" "}
          <a className="vk-link" href={ESSAY_URL} target="_blank" rel="noreferrer">
            How to Build a Backtest That Can Prove You Wrong
          </a>
          .
        </p>
        <p className="vk-topbar-note">
          Verdkt is an analysis tool, not financial advice. A passing verdict is not a
          recommendation to trade. Your data is processed entirely in your browser and never leaves
          your device.
        </p>
      </div>
    </footer>
  );
}
