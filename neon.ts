import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  auth: true,
  buckets: {
    avatars: { access: "private" },
  },
  branch: (branch) => {
    if (branch.isDefault || branch.exists) {
      return {};
    }
    return { ttl: "7d" };
  },
});
