"use client";

import { useEffect, useState } from "react";
import { fetchRun } from "@/lib/client/hooks";
import { isTerminalStage, type EncodeRun } from "@/lib/types";

export interface RunPollingState {
  /** The latest run state we've received, or null before the first response. */
  run: EncodeRun | null;
  /** True while we're still asking the server for updates. */
  polling: boolean;
  /** A request failed (network, 404, …). Not the same thing as the RUN failing. */
  fetchError: string | null;
  /** Every message we've seen, oldest first — the log the UI renders. */
  log: string[];
}

const initialState: RunPollingState = {
  run: null,
  polling: false,
  fetchError: null,
  log: [],
};

// TASK 5
export function useRunPolling(runId: string | null, onFinished?: () => void): RunPollingState {
  const [state, setState] = useState<RunPollingState>(initialState);

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const run = await fetchRun(runId);
        if (cancelled) return;

        const finished = isTerminalStage(run.stage);

        setState((previous) => ({
          run,
          polling: !finished,
          fetchError: null,
          log:
            previous.log.at(-1) === run.message
              ? previous.log
              : [...previous.log, run.message],
        }));

        if (finished) {
          cancelled = true;
          clearInterval(intervalId);
          onFinished?.();
        }
      } catch (error) {
        if (cancelled) return;

        cancelled = true;
        clearInterval(intervalId);

        setState((previous) => ({
          ...previous,
          polling: false,
          fetchError: error instanceof Error ? error.message : "Could not load run",
        }));
      }
    };

    setState({
      ...initialState,
      polling: true,
    });

    const intervalId = setInterval(() => {
      void poll();
    }, 1_000);

    void poll();

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [runId]);

  return state;
}
