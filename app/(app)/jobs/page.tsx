"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/client/api";
import { useCreateJob, useJobs } from "@/lib/client/hooks";
import { createJobSchema, type CreateJobInput } from "@/lib/schemas";
import { StatusBadge } from "@/components/status-badge";

// The list half of this page is provided and will light up as soon as GET /api/jobs works
// (Task 2). Note how it handles loading, error and empty separately — we'd like the same care
// in the parts you write.
//
// ---------------------------------------------------------------------------
// TASK 4 — TODO(candidate): build the "New encode job" form where the placeholder is.
// ---------------------------------------------------------------------------
//
// Requirements:
//   - Two fields: source URL (required) and title (optional).
//   - React Hook Form with `zodResolver(createJobSchema)`. app/signin/page.tsx is a complete
//     working example of this setup — the pattern is the same.
//   - Show validation messages under the field they belong to, before anything is sent.
//   - Submit via your useCreateJob mutation from lib/client/hooks.ts.
//   - Disable the submit button while the request is in flight, and reset the form on success.
//   - The new job must appear in the list below without a page reload (that's what
//     invalidateQueries in the mutation is for).
//   - If the server replies 422, map its `fieldErrors` back onto the form. The thrown error is an
//     `ApiError` with a `fieldErrors` object keyed by field name, and React Hook Form's
//     `setError("sourceUrl", { message })` puts a message on a specific field. Test this by
//     temporarily making your client and server rules disagree, or with the curl command in
//     app/api/jobs/route.ts.
//
// Try `https://cdn.example.com/videos/corrupt.mp4` as a source URL — that one is rigged to fail
// partway through its run, so you can build the error path on the detail page.
export default function JobsPage() {
  const jobs = useJobs();
  const createJob = useCreateJob();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      sourceUrl: "",
      title: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await createJob.mutateAsync(values);
      reset();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        const sourceUrlError = error.fieldErrors.sourceUrl?.[0];
        const titleError = error.fieldErrors.title?.[0];

        if (sourceUrlError) {
          setError("sourceUrl", { message: sourceUrlError });
        }

        if (titleError) {
          setError("title", { message: titleError });
        }

        if (sourceUrlError || titleError) return;
      }

      setFormError(error instanceof Error ? error.message : "Could not create job");
    }
  });

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-4 text-xl font-semibold">New encode job</h1>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="sourceUrl" className="mb-1 block text-sm font-medium">
              Source URL
            </label>
            <input
              id="sourceUrl"
              {...register("sourceUrl")}
              type="url"
              placeholder="https://cdn.example.com/videos/clip.mp4"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {errors.sourceUrl && (
              <p className="mt-1 text-xs text-red-600">{errors.sourceUrl.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title <span className="text-neutral-400">(optional)</span>
            </label>
            <input
              id="title"
              {...register("title")}
              type="text"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Create job"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Jobs</h2>

        {jobs.isLoading && <p className="text-sm text-neutral-500">Loading jobs…</p>}

        {jobs.isError && (
          <div className="text-sm text-red-600">
            Couldn’t load jobs — is GET /api/jobs implemented?{" "}
            <button onClick={() => jobs.refetch()} className="underline">
              Retry
            </button>
          </div>
        )}

        {jobs.data?.length === 0 && (
          <p className="rounded-md border border-neutral-200 p-4 text-sm text-neutral-500">
            No jobs yet. Create one above to get started.
          </p>
        )}

        {jobs.data && jobs.data.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
            {jobs.data.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{job.title}</p>
                    <p className="truncate text-xs text-neutral-500">{job.sourceUrl}</p>
                  </div>
                  <StatusBadge value={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
