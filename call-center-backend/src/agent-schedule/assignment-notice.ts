/**
 * Builds the "you have been assigned" message for each agent from the
 * schedule rows that were just created. Pure function (unit-tested).
 */

export interface AssignedRow {
  agentId: number;
  skillId: number;
  channel: string;
  intervalStart: Date;
  intervalEnd: Date;
}

interface Block {
  skillId: number;
  channel: string;
  start: Date;
  end: Date;
}

const MAX_BLOCKS = 6;
const MAX_LENGTH = 480; // Notification.message is VARCHAR(500)

const hhmm = (d: Date) => d.toISOString().slice(11, 16);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function buildAssignmentNotices(
  rows: AssignedRow[],
  skillNames: Map<number, string>,
): Map<number, { title: string; message: string }> {
  const byAgent = new Map<number, AssignedRow[]>();
  for (const row of rows) {
    const list = byAgent.get(row.agentId) ?? [];
    list.push(row);
    byAgent.set(row.agentId, list);
  }

  const notices = new Map<number, { title: string; message: string }>();

  for (const [agentId, list] of byAgent) {
    const sorted = [...list].sort(
      (a, b) => a.intervalStart.getTime() - b.intervalStart.getTime(),
    );

    const blocks: Block[] = [];
    for (const row of sorted) {
      const last = blocks[blocks.length - 1];
      if (
        last &&
        last.skillId === row.skillId &&
        last.channel === row.channel &&
        last.end.getTime() === row.intervalStart.getTime()
      ) {
        last.end = row.intervalEnd;
      } else {
        blocks.push({
          skillId: row.skillId,
          channel: row.channel,
          start: row.intervalStart,
          end: row.intervalEnd,
        });
      }
    }

    const shown = blocks.slice(0, MAX_BLOCKS).map(
      (b) =>
        `${ymd(b.start)} ${hhmm(b.start)}-${hhmm(b.end)} ${skillNames.get(b.skillId) ?? "Skill"} (${b.channel})`,
    );
    let message = `You are assigned: ${shown.join("; ")}`;
    if (blocks.length > MAX_BLOCKS) message += `; +${blocks.length - MAX_BLOCKS} more (times are UTC)`;
    else message += " (times are UTC)";

    notices.set(agentId, {
      title: "New work assignment",
      message: message.slice(0, MAX_LENGTH),
    });
  }

  return notices;
}
