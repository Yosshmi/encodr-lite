import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import JobsPage from "@/app/(app)/jobs/page";
import { api } from "@/lib/client/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("JobsPage", () => {
  it("shows an error and does not submit an invalid source URL", async () => {
    vi.spyOn(api, "get").mockResolvedValue([]);
    const postSpy = vi.spyOn(api, "post");
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <JobsPage />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Source URL"), "not a url");
    await user.click(screen.getByRole("button", { name: "Create job" }));

    expect(await screen.findByText("Enter a valid URL")).toBeInTheDocument();
    expect(postSpy).not.toHaveBeenCalled();
  });
});
