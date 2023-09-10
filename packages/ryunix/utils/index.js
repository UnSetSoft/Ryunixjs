function getPackageManager() {
  const agent = process.env.npm_config_user_agent;

  if (!agent) {
    const parent = process.env._;

    if (!parent) {
      return "npm";
    }

    if (parent.endsWith("pnpx") || parent.endsWith("pnpm")) return "pnpm";
    if (parent.endsWith("bunx") || parent.endsWith("bun")) return "bun";
    if (parent.endsWith("yarn")) return "yarn";

    return "npm";
  }

  const [program] = agent.split("/");

  if (program === "yarn") return "yarn";
  if (program === "pnpm") return "pnpm";
  if (program === "bun") return "bun";

  return "npm";
}

module.exports = {
  getPackageManager,
};
