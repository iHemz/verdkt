"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Trade } from "@/lib/analysis";
import { publishFormSchema, type PublishFormValues } from "@/lib/reports/schema";
import { usePublishReport } from "@/hooks/reports/usePublishReport";
import { Button } from "@/components/ui/Button";

const MIN_TO_PUBLISH = 30;

export function PublishReport({ trades }: { trades: Trade[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const publish = usePublishReport();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublishFormValues>({
    resolver: zodResolver(publishFormSchema),
    defaultValues: { title: "", author: "", agreed: false },
  });

  if (trades.length < MIN_TO_PUBLISH) {
    return (
      <div className="vk-publish">
        <p className="vk-topbar-note">
          Publish a shareable Verdkt Verified report at {MIN_TO_PUBLISH}+ trades. This log has{" "}
          {trades.length}.
        </p>
      </div>
    );
  }

  const onSubmit = handleSubmit((values) => {
    publish.mutate(
      { title: values.title, author: values.author, trades },
      {
        onSuccess: (data) => {
          if (data.mode === "checkout" && data.checkoutUrl) {
            // External redirect to Stripe Checkout; router can't route off-site.
            window.location.assign(data.checkoutUrl);
            return;
          }
          router.push(`/r/${data.id}?mt=${encodeURIComponent(data.manageToken)}`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  });

  if (!open) {
    return (
      <div className="vk-publish">
        <div className="vk-section-label" style={{ padding: 0, marginBottom: 6 }}>
          Prove it to others
        </div>
        <p className="vk-attr-sub" style={{ marginBottom: 14 }}>
          Turn this verdict into an independent, shareable report at its own link, with an
          embeddable <strong>Verdkt Verified</strong> badge for your profile or sales page.
        </p>
        <Button onClick={() => setOpen(true)}>Publish a verified report →</Button>
      </div>
    );
  }

  const pending = publish.isPending;

  return (
    <div className="vk-publish">
      <div className="vk-section-label" style={{ padding: 0, marginBottom: 12 }}>
        Publish a verified report
      </div>
      <form className="vk-publish-form" onSubmit={onSubmit} noValidate>
        <label className="vk-field">
          <span>Strategy name</span>
          <input className="vk-input" placeholder="e.g. London breakout v3" {...register("title")} />
          {errors.title && <span className="vk-field-error">{errors.title.message}</span>}
        </label>
        <label className="vk-field">
          <span>Your name or handle (optional)</span>
          <input className="vk-input" placeholder="@yourname" {...register("author")} />
          {errors.author && <span className="vk-field-error">{errors.author.message}</span>}
        </label>
        <label className="vk-check-row">
          <input type="checkbox" {...register("agreed")} />
          <span>
            I understand this verifies the method on my submitted data. It does not prove the trades
            are real.
          </span>
        </label>
        {errors.agreed && <span className="vk-field-error">{errors.agreed.message}</span>}

        <div className="vk-report-row">
          <Button type="submit" disabled={pending}>
            {pending ? "Publishing…" : "Publish"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
