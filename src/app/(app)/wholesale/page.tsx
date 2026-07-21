import Link from "next/link";
import {
  getWholesaleAccounts,
  STAGES,
  STAGE_LABELS,
  type WholesaleAccount,
} from "@/lib/wholesale/queries";
import { changeStageAction } from "@/app/(app)/wholesale/actions";
import { StageSelect } from "@/components/wholesale/StageSelect";

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Template D (Board view — Screens & Flows v1's Project Detail pattern,
// applied here). No drag-and-drop: each card gets a fast stage dropdown
// instead, same "plain, fast, not delightful" discipline as Template F.
export default async function WholesalePage() {
  const accounts = await getWholesaleAccounts();

  if (accounts === null) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/wholesale_schema.sql</code> in
          the Supabase SQL Editor to create the Wholesale tables.
        </div>
      </div>
    );
  }

  const byStage: Record<string, WholesaleAccount[]> = {};
  for (const stage of STAGES) byStage[stage] = [];
  for (const a of accounts) {
    (byStage[a.stage] ??= []).push(a);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Wholesale
          </h1>
          <p className="mt-1 text-sm text-muted">
            The live pipeline of wholesale businesses — who they are, where
            they stand, and when to follow up next.
          </p>
        </div>
        <Link
          href="/wholesale/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New business
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/prayer-hands.svg"
            alt=""
            className="mx-auto mb-3 h-12 w-12 opacity-70"
          />
          No wholesale businesses yet.{" "}
          <Link href="/wholesale/new" className="text-accent hover:underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage} className="flex min-w-[220px] flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {STAGE_LABELS[stage]} · {byStage[stage].length}
              </p>
              <div className="flex flex-col gap-3">
                {byStage[stage].map((a) => {
                  const overdue = isOverdue(a.next_follow_up_at);
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-border bg-surface p-3"
                    >
                      <Link
                        href={`/wholesale/${a.id}`}
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        {a.company_name}
                      </Link>
                      {a.contact_name && (
                        <p className="text-sm text-muted">{a.contact_name}</p>
                      )}
                      {a.next_follow_up_at && (
                        <p
                          className={`mt-1 text-xs font-medium ${
                            overdue ? "text-red-600" : "text-muted"
                          }`}
                        >
                          {overdue ? "Follow up overdue: " : "Follow up "}
                          {formatDate(a.next_follow_up_at)}
                        </p>
                      )}
                      <div className="mt-2">
                        <StageSelect
                          id={a.id}
                          stage={a.stage}
                          action={changeStageAction}
                          onCard
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
