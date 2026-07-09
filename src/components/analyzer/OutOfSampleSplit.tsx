import { formatR } from "@/lib/format";

type HalfProps = {
  label: string;
  value: number;
  flip?: boolean;
};

function Half({ label, value, flip }: HalfProps) {
  const pos = value > 0;
  const width = Math.min(100, Math.abs(value) * 120 + 8);
  return (
    <div className="vk-half">
      <div className="vk-half-label">{label}</div>
      <div className={`vk-half-val ${pos ? "pos" : "neg"}`}>{formatR(value)}</div>
      <div className="vk-bar">
        <div
          className="vk-bar-fill"
          style={{ width: `${width}%`, left: 0, background: pos ? "var(--pass)" : "var(--fail)" }}
        />
      </div>
      {flip && (
        <div className="vk-half-label" style={{ marginTop: 10, color: "var(--fail)" }}>
          ⚠ sign flip vs first half
        </div>
      )}
    </div>
  );
}

type OutOfSampleSplitProps = {
  firstHalfR: number;
  secondHalfR: number;
  signFlip: boolean;
};

export function OutOfSampleSplit({ firstHalfR, secondHalfR, signFlip }: OutOfSampleSplitProps) {
  return (
    <div className="vk-split">
      <Half label="First half (in-sample)" value={firstHalfR} />
      <Half label="Second half (out-of-sample)" value={secondHalfR} flip={signFlip} />
    </div>
  );
}
