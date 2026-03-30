"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  Ban,
  Clock,
  HardDrive,
  ScrollText,
  Megaphone,
  Link2,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  last_login_at: string | null;
  created_at: string;
  saved_count: number;
}

interface Stats {
  users: { active: number; pending: number; banned: number };
  storage: { total_used: number; total_limit: number };
  items: { total: number };
}

interface Log {
  id: string;
  action: string;
  admin_email: string;
  target_email: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
  expires_at: string | null;
  used_at: string | null;
  used_by_email: string | null;
  created_at: string;
}

type Tab = "users" | "logs" | "invites" | "announcements";
type StatusFilter = "all" | "pending" | "active" | "banned";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number | string | bigint) {
  const n = Number(bytes);
  if (!n || n <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("uk-UA", { dateStyle: "short", timeStyle: "short" });
}

const ACTION_LABELS: Record<string, string> = {
  approve_user: "Підтвердив",
  reject_user: "Відхилив",
  ban_user: "Заблокував",
  unban_user: "Розблокував",
  change_role: "Змінив роль",
  set_storage_limit: "Змінив ліміт",
  create_invite: "Створив invite",
  delete_user: "Видалив"
};

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  pending: "text-yellow-400 bg-yellow-400/10",
  banned: "text-red-400 bg-red-400/10"
};

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminClient() {
  const [tab, setTab] = useState<Tab>("users");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Announcements form
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annSubmitting, setAnnSubmitting] = useState(false);

  async function loadStats() {
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }

  async function loadUsers() {
    setLoading(true);
    const url = `/api/admin/users${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
    const r = await fetch(url);
    if (r.ok) setUsers((await r.json()).users);
    setLoading(false);
  }

  async function loadLogs() {
    setLoading(true);
    const r = await fetch("/api/admin/logs?limit=100");
    if (r.ok) setLogs((await r.json()).logs);
    setLoading(false);
  }

  async function loadInvites() {
    setLoading(true);
    const r = await fetch("/api/admin/invites");
    if (r.ok) setInvites((await r.json()).invites);
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers();
    else if (tab === "logs") loadLogs();
    else if (tab === "invites") loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter]);

  async function userAction(userId: string, action: string, extra: Record<string, unknown> = {}) {
    setActionLoading(userId + action);
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    if (r.ok) {
      await loadUsers();
      await loadStats();
    } else {
      const e = await r.json();
      alert(e.error);
    }
    setActionLoading(null);
  }

  async function deleteUser(userId: string) {
    if (!confirm("Видалити користувача і всі його дані?")) return;
    setActionLoading(userId + "delete");
    await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    await loadUsers();
    await loadStats();
    setActionLoading(null);
  }

  async function createInvite() {
    const r = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: 7 })
    });
    if (r.ok) {
      const { url } = await r.json();
      await navigator.clipboard.writeText(url);
      alert(`Invite посилання скопійовано:\n${url}`);
      await loadInvites();
    }
  }

  async function submitAnnouncement() {
    if (!annTitle.trim() || !annContent.trim()) return;
    setAnnSubmitting(true);
    const r = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: annTitle, content: annContent })
    });
    if (r.ok) {
      setAnnTitle("");
      setAnnContent("");
    }
    setAnnSubmitting(false);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "users", label: "Користувачі", icon: <Users className="w-4 h-4" /> },
    { id: "logs", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
    { id: "invites", label: "Invites", icon: <Link2 className="w-4 h-4" /> },
    { id: "announcements", label: "Оголошення", icon: <Megaphone className="w-4 h-4" /> }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-gray-400">Управління користувачами і системою.</p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<CheckCircle className="w-5 h-5 text-emerald-400" />}
            label="Активні"
            value={stats.users.active}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-yellow-400" />}
            label="Pending"
            value={stats.users.pending}
          />
          <StatCard
            icon={<Ban className="w-5 h-5 text-red-400" />}
            label="Забанені"
            value={stats.users.banned}
          />
          <StatCard
            icon={<HardDrive className="w-5 h-5 text-violet-400" />}
            label="Storage"
            value={`${fmtBytes(Number(stats.storage.total_used))} / ${fmtBytes(Number(stats.storage.total_limit))}`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              tab === t.id
                ? "text-white border-b-2 border-violet-500"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {(["all", "pending", "active", "banned"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s === "all"
                  ? "Всі"
                  : s === "pending"
                    ? "Pending"
                    : s === "active"
                      ? "Активні"
                      : "Забанені"}
              </button>
            ))}
            <button
              onClick={loadUsers}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">Завантаження...</div>
          ) : users.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">Користувачів не знайдено.</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  actionLoading={actionLoading}
                  onAction={userAction}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">Завантаження...</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">Логів ще немає.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-sm"
              >
                <span className="text-violet-400 font-medium min-w-[120px]">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <span className="text-gray-300">{log.target_email ?? "—"}</span>
                <span className="text-gray-500 ml-auto">{fmtDate(log.created_at)}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Invites tab */}
      {tab === "invites" && (
        <div className="space-y-4">
          <button
            onClick={createInvite}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Створити invite (7 днів)
          </button>

          <div className="space-y-2">
            {invites.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">Invite кодів ще немає.</div>
            ) : (
              invites.map((inv) => (
                <div
                  key={inv.id}
                  className="px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-sm space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-violet-300 font-mono">{inv.code}</code>
                    {inv.used_at ? (
                      <span className="text-xs text-gray-500">
                        використано · {inv.used_by_email}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400">активний</span>
                    )}
                  </div>
                  <div className="text-gray-500 text-xs">
                    Діє до: {fmtDate(inv.expires_at)} · Створено: {fmtDate(inv.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Announcements tab */}
      {tab === "announcements" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3">
            <h3 className="text-white font-medium">Нове оголошення</h3>
            <input
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              placeholder="Заголовок"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <textarea
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              placeholder="Текст оголошення..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <button
              onClick={submitAnnouncement}
              disabled={annSubmitting || !annTitle.trim() || !annContent.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {annSubmitting ? "Публікація..." : "Опублікувати"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-white font-semibold">{value}</div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  actionLoading,
  onAction,
  onDelete
}: {
  user: User;
  actionLoading: string | null;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const storagePercent =
    Number(user.storage_limit_bytes) > 0
      ? Math.round((Number(user.storage_used_bytes) / Number(user.storage_limit_bytes)) * 100)
      : 0;

  function fmtBytes(bytes: number | string | bigint) {
    const n = Number(bytes);
    if (!n || n <= 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-sm font-bold flex-shrink-0">
          {(user.name ?? user.email)[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">
              {user.name ?? user.email}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[user.status] ?? "text-gray-400 bg-gray-400/10"}`}
            >
              {user.status}
            </span>
            {user.role === "admin" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-violet-400 bg-violet-400/10">
                admin
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        </div>

        {/* Storage bar */}
        <div className="hidden md:flex flex-col items-end gap-1 min-w-[100px]">
          <span className="text-xs text-gray-400">
            {fmtBytes(user.storage_used_bytes)} / {fmtBytes(user.storage_limit_bytes)}
          </span>
          <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${storagePercent > 80 ? "bg-red-500" : "bg-violet-500"}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 hidden md:block min-w-[60px] text-right">
          {user.saved_count} items
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 hover:text-white transition-colors ml-2"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Expanded actions */}
      {open && (
        <div className="border-t border-gray-800 px-4 py-3 flex flex-wrap gap-2">
          {user.status === "pending" && (
            <>
              <ActionBtn
                label="Підтвердити"
                color="emerald"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                loading={actionLoading === user.id + "approve"}
                onClick={() => onAction(user.id, "approve")}
              />
              <ActionBtn
                label="Відхилити"
                color="red"
                icon={<XCircle className="w-3.5 h-3.5" />}
                loading={actionLoading === user.id + "reject"}
                onClick={() => onAction(user.id, "reject")}
              />
            </>
          )}
          {user.status === "active" && (
            <ActionBtn
              label="Забанити"
              color="red"
              icon={<Ban className="w-3.5 h-3.5" />}
              loading={actionLoading === user.id + "ban"}
              onClick={() => {
                const reason = prompt("Причина бану (необов'язково):");
                onAction(user.id, "ban", { reason: reason ?? undefined });
              }}
            />
          )}
          {user.status === "banned" && (
            <ActionBtn
              label="Розблокувати"
              color="emerald"
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              loading={actionLoading === user.id + "unban"}
              onClick={() => onAction(user.id, "unban")}
            />
          )}
          <ActionBtn
            label={user.role === "admin" ? "Зняти admin" : "Зробити admin"}
            color="violet"
            icon={<ShieldCheck className="w-3.5 h-3.5" />}
            loading={actionLoading === user.id + "change_role"}
            onClick={() =>
              onAction(user.id, "change_role", { role: user.role === "admin" ? "user" : "admin" })
            }
          />
          <ActionBtn
            label="Змінити ліміт"
            color="blue"
            icon={<HardDrive className="w-3.5 h-3.5" />}
            loading={false}
            onClick={() => {
              const gb = prompt(
                "Ліміт в GB:",
                String(Math.round(user.storage_limit_bytes / 1073741824))
              );
              if (gb !== null)
                onAction(user.id, "set_storage_limit", { limitBytes: parseFloat(gb) * 1073741824 });
            }}
          />
          <ActionBtn
            label="Видалити"
            color="red"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            loading={actionLoading === user.id + "delete"}
            onClick={() => onDelete(user.id)}
          />
          <div className="ml-auto text-xs text-gray-500 self-center">
            Реєстрація: {new Date(user.created_at).toLocaleDateString("uk-UA")}
            {user.last_login_at &&
              ` · Вхід: ${new Date(user.last_login_at).toLocaleDateString("uk-UA")}`}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  color,
  icon,
  loading,
  onClick
}: {
  label: string;
  color: "emerald" | "red" | "violet" | "blue";
  icon: React.ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20",
    violet: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border-violet-500/20",
    blue: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20"
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {icon}
      {loading ? "..." : label}
    </button>
  );
}
