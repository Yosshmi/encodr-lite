import { describe, expect, it } from "vitest";
import {
  computeRun,
  FAIL_URL,
  makeResult,
  type RunRecord,
} from "@/lib/server/store";
import { TIMELINE } from "@/lib/types";

const record: RunRecord = {
  id: "r_test",
  jobId: "j_test",
  sourceUrl: "https://cdn.example.com/videos/clip.mp4",
  startedAt: 10_000,
};

const corruptRecord: RunRecord = {
  ...record,
  sourceUrl: FAIL_URL,
};

function runAt(elapsedMs: number) {
  return computeRun(record, record.startedAt + elapsedMs);
}

describe("computeRun", () => {
  it("uses the correct active stage at each boundary", () => {
    expect(runAt(0).stage).toBe("QUEUED");
    expect(runAt(TIMELINE.queuedEndsMs - 1).stage).toBe("QUEUED");
    expect(runAt(TIMELINE.queuedEndsMs).stage).toBe("DOWNLOADING");
    expect(runAt(TIMELINE.downloadingEndsMs - 1).stage).toBe("DOWNLOADING");
    expect(runAt(TIMELINE.downloadingEndsMs).stage).toBe("TRANSCODING");
    expect(runAt(TIMELINE.transcodingEndsMs - 1).stage).toBe("TRANSCODING");
  });

  it("completes at the end of the timeline", () => {
    const run = runAt(TIMELINE.transcodingEndsMs);

    expect(run.stage).toBe("COMPLETED");
    expect(run.progressPct).toBe(100);
    expect(run.result).toEqual(makeResult());
    expect(run.error).toBeUndefined();
  });

  it("keeps progress between 0 and 100", () => {
    const beforeStart = computeRun(record, record.startedAt - 1_000);
    const halfway = runAt(TIMELINE.downloadingEndsMs);
    const afterCompletion = runAt(TIMELINE.transcodingEndsMs * 2);

    expect(beforeStart.progressPct).toBe(0);
    expect(halfway.progressPct).toBe(50);
    expect(afterCompletion.progressPct).toBe(100);
  });

  it("fails the corrupt source and freezes its progress", () => {
    const beforeFailure = computeRun(
      corruptRecord,
      corruptRecord.startedAt + TIMELINE.failAtMs - 1,
    );
    const atFailure = computeRun(
      corruptRecord,
      corruptRecord.startedAt + TIMELINE.failAtMs,
    );
    const afterCompletion = computeRun(
      corruptRecord,
      corruptRecord.startedAt + TIMELINE.transcodingEndsMs * 2,
    );

    expect(beforeFailure.stage).toBe("TRANSCODING");
    expect(atFailure.stage).toBe("FAILED");
    expect(atFailure.error).toBeDefined();
    expect(atFailure.result).toBeUndefined();
    expect(afterCompletion.stage).toBe("FAILED");
    expect(afterCompletion.progressPct).toBe(atFailure.progressPct);
  });
});
