# Encodr Lite

Encodr Lite is a small media-transcoding dashboard built with Next.js, React, and TypeScript. A signed-in user can create an encode job from a media URL, start a simulated run, watch its progress, and see the results or retry a failure.

## Run the project

- Use Node.js 20 or later.
- Install the dependencies and start the app:

```bash
npm install
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000).
- Sign in with:
  - Email: `demo@encodr.dev`
  - Password: `password123`
- Run the checks with:

```bash
npm run test:run
npm run typecheck
npm run build
```

- On Windows PowerShell, use `npm.cmd` if script execution blocks `npm`:

```powershell
npm.cmd run dev
npm.cmd run test:run
npm.cmd run typecheck
npm.cmd run build
```

- Jobs and runs are stored in memory and are cleared when the server restarts.

## What's working

- Completed source URL validation.
- Accepts HTTP and HTTPS URLs that include a file path.
- Rejects empty values, invalid URLs, unsupported protocols, and URLs without a file path.
- Completed authenticated job-list and job-creation API routes.
- Completed the run state logic with exact time boundaries.
- Completed the create-job form with browser and server validation.
- Completed live progress, percentage, and log updates.
- Completed successful rendition results.
- Completed corrupt-source failure and retry.
- Added schema, run-state, and form tests.
- No known tasks are incomplete.

## How to see the failure path

- Sign in with the demo account.
- Create a job using `https://cdn.example.com/videos/corrupt.mp4`.
- Open the job and select **Start encode**.
- Wait approximately eight seconds.
- Confirm the stage changes to `FAILED`.
- Confirm the progress bar turns red.
- Confirm the error message and **Retry** button appear.
- Selecting **Retry** creates a fresh run.
- The retry also fails because the source URL is intentionally corrupt.

## Decisions and assumptions

- Used the same Zod validation rules in the browser and API.
- Browser validation gives quick feedback to the user.
- Server validation protects the API when a request does not come from the form.
- Treated any HTTP or HTTPS URL with more than `/` in its path as a usable source.
- Did not restrict file extensions because the brief does not list supported extensions.
- Used the provided `TIMELINE` values for every run stage.
- Calculated the run stage from elapsed time instead of using server timers.
- Checked corrupt-source failure before normal completion so a failed run stays failed.
- Froze failed progress at the eight-second failure point.
- Used the run stage to decide what the detail page should show.
- Used the absence of a run ID as the idle state.
- Kept the active run ID in local React state.
- A page refresh does not automatically resume an earlier run.
- Fetched the run immediately and then approximately once per second.
- Cleared the interval when the run finished, changed, or the page closed.
- Used a cancellation flag to stop an old request from updating the page after cleanup.
- Avoided adding the same log message twice in a row.
- Asked React Query to reload server data after creating a job or starting a run.

## What was hardest

- Task 5 was the most challenging part for me.
- I had not previously worked deeply with polling and React effect cleanup.
- I had to understand that `clearInterval` only stops future timer calls.
- A request that already started can still finish after the user leaves the page.
- I broke the work into immediate fetching, one-second polling, finish detection, timer cleanup, and old-request protection.
- I used a cancellation flag so an old request cannot update a page after cleanup.
- I started a run, navigated away before it finished, and confirmed that requests for the old run stopped.
- This helped me understand polling as a lifecycle problem instead of only a repeating timer.

## Testing

- Tested valid HTTP and HTTPS URLs.
- Tested empty values, invalid URLs, FTP URLs, and URLs without a file path.
- Tested exact run-stage boundaries.
- Tested successful completion and result data.
- Tested that progress remains between 0 and 100.
- Tested corrupt-source failure and frozen progress.
- Tested that an invalid form value shows an error and does not call the API.
- Wrote the `computeRun` tests before implementing the function.
- Ran the tests against the original placeholder and watched them fail.
- Current result: 3 test files and 10 tests pass.
- The TypeScript check and production build also pass.

## What I would do next

- Pause polling while the browser tab is hidden.
- Make progress move smoothly between server responses.
- Show relative job creation times.
- Make form errors easier for screen-reader users to notice.
- Store jobs in a real database so they remain after a server restart.

## Time spent

- Approximately 8 hours.
