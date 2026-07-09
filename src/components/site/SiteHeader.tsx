export function SiteHeader() {
  return (
    <header className="vk-shell">
      <div className="vk-topbar">
        <div className="vk-logo">
          <b>Verdkt</b> <span style={{ color: "var(--faint)" }}>/ edge verdict</span>
        </div>
        <div className="vk-topbar-note">runs in your browser · nothing uploaded</div>
      </div>
    </header>
  );
}
