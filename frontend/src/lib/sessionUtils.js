export const STATUS_ORDER = [
  "accepted",
  "completed",
  "pending",
  "rescheduled",
  "rejected",
];

export function groupSessionsByStatus(sessions = [], order = STATUS_ORDER) {
  const groups = sessions.reduce((acc, s) => {
    const st = (s.status || "unknown").toString();
    if (!acc[st]) acc[st] = [];
    acc[st].push(s);
    return acc;
  }, {});

  // preserve requested order for statuses that actually exist
  const ordered = order
    .filter((st) => groups[st] && groups[st].length)
    .map((st) => ({ status: st, items: groups[st] }));

  // add any other statuses not present in the order at the end
  const extras = Object.keys(groups)
    .filter((k) => !order.includes(k))
    .map((k) => ({ status: k, items: groups[k] }));

  return ordered.concat(extras);
}
