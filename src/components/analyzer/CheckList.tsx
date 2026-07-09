import type { Check } from "@/lib/analysis";
import { checkMark } from "@/lib/format";

export function CheckList({ checks }: { checks: Check[] }) {
  return (
    <div className="vk-checks">
      {checks.map((c) => (
        <div className="vk-check" key={c.key}>
          <span className="vk-check-mark" data-s={c.status} aria-hidden>
            {checkMark(c.status)}
          </span>
          <div>
            <div className="vk-check-title">{c.title}</div>
            <div className="vk-check-body">{c.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
