import { json, readJson, validationError, withAuth } from "@/lib/server/http";
import { createJobSchema } from "@/lib/schemas";
import { createJob, listJobs } from "@/lib/server/store";

// TASK 2

export async function GET(req: Request) {
  return withAuth(req, () => json(listJobs()));
}

export async function POST(req: Request) {
  return withAuth(req, async () => {
    const parsed = createJobSchema.safeParse(await readJson(req));
    if (!parsed.success) return validationError(parsed.error);

    return json(createJob(parsed.data), 201);
  });
}
