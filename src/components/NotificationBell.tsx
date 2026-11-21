import { useCallback, useEffect, useState } from "react";
import axios from "../helper/api";
import { useLive } from "../hooks/useLive";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

const dot: Record<string, string> = {
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

const NotificationBell = () => {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get<Notification[]>("/notifications");
      setItems(data);
    } catch {
      /* the bell is optional - ignore errors */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // new notifications arrive over the WebSocket; refresh the list
  useLive({ notification: () => load() });

  const unread = items.filter((n) => !n.readAt).length;

  const markAll = async () => {
    await axios.patch("/notifications/read-all");
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 border-b border-slate-50 px-4 py-3 ${n.readAt ? "" : "bg-blue-50/40"}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[n.type] ?? dot.info}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
