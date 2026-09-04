"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useJob, useStartRun } from "@/lib/client/hooks";
import { useRunPolling } from "@/lib/client/use-run-polling";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";

// The header (title, source URL, status badge, loading and not-found states) is provided.
//
// ---------------------------------------------------------------------------
// TASK 5 — TODO(candidate): build the run panel where the placeholder is.
// ---------------------------------------------------------------------------
//
// This is the most substantial screen in the exercise. Build it in this order:
//
//   1. A "Start encode" button that calls the provided useStartRun(job.id) mutation and keeps
//      the returned `runId` in state. Disable it while a run is in flight.
//
//   2. Live progress, driven by your useRunPolling(runId) hook:
//        - the current stage (<StatusBadge value={run.stage} />),
//        - a percentage bar (<ProgressBar value={run.progressPct} />),
//        - the log — the messages collected so far, newest last.
//      A run takes about 12 seconds, so you'll see the whole thing without waiting long.
//
//   3. The FAILED case. Create a job with the source URL
//        https://cdn.example.com/videos/corrupt.mp4
//      and it will fail partway. Show the error message clearly (a red panel, `failed` on the
//      progress bar) and offer a Retry that starts a fresh run.
//
//   4. The COMPLETED case. `run.result` arrives with the final poll: show the duration and a
//      small table of renditions (label / resolution / size). Plain and readable beats fancy.
//
// A note on state: at any moment this screen is in exactly one of — idle, running, failed,
// completed. Try to make that explicit in how you write it, rather than juggling several
// booleans that could contradict each other (`isRunning && isFailed` should be impossible to
// express, not merely unlikely). Say what you chose in the README.
//
// We are NOT grading visual design. Correct behaviour and readable code are what count.
export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const jobQuery = useJob(id);
  const [runId, setRunId] = useState<string | null>(null);
  const startRun = useStartRun(id);
  const polling = useRunPolling(runId, () => {
    void jobQuery.refetch();
  });
  const run = polling.run;
  const result = run?.result;

  const handleStart = () => {
    startRun.mutate(undefined, {
      onSuccess: ({ runId }) => {
        setRunId(runId);
      },
    });
  };

  if (jobQuery.isLoading) {
    return <p className="text-sm text-neutral-500">Loading job…</p>;
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="text-sm text-red-600">
        Job not found.{" "}
        <Link href="/jobs" className="underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const job = jobQuery.data;

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="text-sm text-neutral-500 hover:underline">
        ← All jobs
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{job.title}</h1>
          <p className="truncate text-sm text-neutral-500">{job.sourceUrl}</p>
        </div>
        <StatusBadge value={job.status} />
      </div>

      <section className="space-y-4 rounded-md border border-neutral-200 p-4">
        {!runId && (
          <button
            type="button"
            onClick={handleStart}
            disabled={startRun.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {startRun.isPending ? "Starting…" : "Start encode"}
          </button>
        )}

        {startRun.isError && (
          <p className="text-sm text-red-600">
            {startRun.error instanceof Error ? startRun.error.message : "Could not start encode"}
          </p>
        )}

        {runId && !run && polling.polling && (
          <p className="text-sm text-neutral-500">Loading run…</p>
        )}

        {polling.fetchError && <p className="text-sm text-red-600">{polling.fetchError}</p>}

        {run && (
          <>
            <div className="flex items-center justify-between gap-4">
              <StatusBadge value={run.stage} />
              <span className="text-sm text-neutral-500">{run.progressPct}%</span>
            </div>

            <ProgressBar value={run.progressPct} failed={run.stage === "FAILED"} />

            <div>
              <h2 className="mb-2 text-sm font-medium">Run log</h2>
              <ul className="space-y-1 text-sm text-neutral-600">
                {polling.log.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>

            {run.stage === "FAILED" && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                <p>{run.error ?? "The encode could not be completed."}</p>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={startRun.isPending}
                  className="mt-3 rounded-md border border-red-300 px-3 py-1.5 font-medium disabled:opacity-50"
                >
                  {startRun.isPending ? "Retrying…" : "Retry"}
                </button>
              </div>
            )}

            {run.stage === "COMPLETED" && result && (
              <div>
                <h2 className="text-sm font-medium">Results</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Duration: {result.durationSec} seconds
                </p>

                <table className="mt-3 w-full text-left text-sm">
                  <thead className="border-b border-neutral-200 text-neutral-500">
                    <tr>
                      <th className="py-2 font-medium">Rendition</th>
                      <th className="py-2 font-medium">Resolution</th>
                      <th className="py-2 text-right font-medium">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {result.renditions.map((rendition) => (
                      <tr key={rendition.label}>
                        <td className="py-2">{rendition.label}</td>
                        <td className="py-2">
                          {rendition.width} × {rendition.height}
                        </td>
                        <td className="py-2 text-right">{rendition.sizeMb} MB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
