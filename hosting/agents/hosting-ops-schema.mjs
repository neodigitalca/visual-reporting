export const HOSTING_OPS_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    severity: { type: "string", enum: ["info", "warning", "critical"] },
    recommended_actions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          label: { type: "string" },
          action_key: { type: "string" },
          requires_confirmation: { type: "boolean" },
        },
        required: ["label", "action_key", "requires_confirmation"],
      },
    },
    tools_used: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "severity", "recommended_actions", "tools_used"],
};

export function parseHostingOpsResponse(raw) {
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!data || typeof data.summary !== "string") {
    throw new Error("Invalid hosting ops agent response shape.");
  }
  return data;
}
