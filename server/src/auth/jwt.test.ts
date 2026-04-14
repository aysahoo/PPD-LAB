import { describe, it, expect } from "vitest";

import { signAccessToken, verifyAccessToken } from "./jwt.js";

describe("jwt", () => {
  it("round-trips user id and role", async () => {
    const token = await signAccessToken(42, "student");
    const { userId } = await verifyAccessToken(token);
    expect(userId).toBe(42);
  });

  it("rejects garbage", async () => {
    await expect(verifyAccessToken("not-a-jwt")).rejects.toThrow();
  });
});
