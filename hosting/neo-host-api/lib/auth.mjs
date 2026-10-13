const TOKEN = () => (process.env.PULSE_HOST_API_TOKEN || process.env.NEO_HOST_API_TOKEN || "").trim();

export function assertServiceOrUserAuth(req) {
  const token = TOKEN();
  const auth = (req.headers.authorization || "").trim();
  if (token && auth === `Bearer ${token}`) {
    return {
      ok: true,
      mode: "service",
      teamId: Number(req.headers["x-neo-pulse-team-id"] || 0) || null,
      userId: Number(req.headers["x-neo-pulse-user-id"] || 0) || null,
      hostingWrite: true,
    };
  }
  const teamId = Number(req.headers["x-neo-pulse-team-id"] || 0);
  const userId = Number(req.headers["x-neo-pulse-user-id"] || 0);
  const write = (req.headers["x-neo-pulse-hosting-write"] || "") === "1";
  if (!teamId || !userId) {
    return { ok: false, error: "Unauthorized.", status: 401 };
  }
  return { ok: true, mode: "user", teamId, userId, hostingWrite: write };
}

export function cronAuth(req) {
  const token = TOKEN();
  const auth = (req.headers.authorization || "").trim();
  if (!token || auth !== `Bearer ${token}`) {
    return { ok: false, error: "Unauthorized.", status: 401 };
  }
  return { ok: true };
}
