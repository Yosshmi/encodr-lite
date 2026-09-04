import { describe, expect, it } from "vitest";
import { sourceUrlSchema } from "@/lib/schemas";

describe("sourceUrlSchema", () => {
  it("accepts valid HTTP and HTTPS URLs with a path", () => {
    expect(
      sourceUrlSchema.safeParse("https://cdn.example.com/videos/clip.mp4").success,
    ).toBe(true);

    expect(
      sourceUrlSchema.safeParse("http://media.example.com/a/b/movie.mov").success,
    ).toBe(true);
  });

  it("rejects an empty source URL with a useful message", () => {
    const result = sourceUrlSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Source URL is required");
    }
  });

  it("rejects text that is not a URL", () => {
    expect(sourceUrlSchema.safeParse("not a url").success).toBe(false);
  });

  it("rejects unsupported URL protocols", () => {
    expect(
      sourceUrlSchema.safeParse("ftp://cdn.example.com/clip.mp4").success,
    ).toBe(false);
  });

  it("rejects a URL without a path", () => {
    expect(sourceUrlSchema.safeParse("https://cdn.example.com").success).toBe(false);
  });
});
