import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    realtime: { allowedOrigins: ["http://localhost:3000", "http://localhost:3100"] },
  },
  auth: true,
  buckets: {
    avatars: { access: "private" },
    sounds: { access: "private" },
  },
  branch: (branch) => {
    if (branch.isDefault || branch.exists) {
      return {};
    }
    return { ttl: "7d" };
  },
});
