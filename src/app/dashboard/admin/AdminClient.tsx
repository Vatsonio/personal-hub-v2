"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  ScrollText,
  Link2,
  Megaphone,
  RefreshCw,
  CheckCircle,
  XCircle,
  Ban,
  ShieldCheck,
  Trash2,
  HardDrive,
  ChevronDown,
  Search,
  Copy,
  Check,
  X,
  Clock,
  BookMarked,
  AlertCircle,
  Info,
  Bell
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "users" | "logs" | "invites" | "announcements";
type StatusFilter = "all" | "pending" | "active" | "banned";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  storage_used_bytes: number | string;
  storage_limit_bytes: number | string;
  last_login_at: string | null;
  created_at: string;
  saved_count: number;
};

type Stats = {
  users: { active: number; pending: number; banned: number };
  storage: { total_used: number | string; total_limit: number | string };
  items: { total: number };
};

type Log = {
  id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  admin_email: string;
  admin_name: string | null;
  target_email: string | null;
  target_name: string | null;
};

type Invite = {
  id: string;
  code: string;
  expires_at: string | null;
  created_at: string;
  used_at: string | null;
  used_by_email: string | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  author_name: string | null;
};

type Notification = { id: string; type: "success" | "error"; message: string };

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

function fmtDateRelative(d: string | null) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} д тому`;
  return fmtDate(d);
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

const STATUS_LABELS: Record<string, string> = {
  active: "Активний",
  pending: "Pending",
  banned: "Заблокований"
};

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminClient() {
  const [tab, setTab] = useState<Tab>("users");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function notify(type: "success" | "error", message: string) {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 4000);
  }

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const url = `/api/admin/users${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`;
    const r = await fetch(url);
    if (r.ok) setUsers((await r.json()).users);
    setLoading(false);
  }, [statusFilter]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/logs?limit=100");
    if (r.ok) setLogs((await r.json()).logs);
    setLoading(false);
  }, []);

  const loadInvites = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/invites");
    if (r.ok) setInvites((await r.json()).invites);
    setLoading(false);
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/announcements");
    if (r.ok) setAnnouncements((await r.json()).announcements);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (tab === "users") loadUsers();
    else if (tab === "logs") loadLogs();
    else if (tab === "invites") loadInvites();
    else if (tab === "announcements") loadAnnouncements();
  }, [tab, statusFilter, loadUsers, loadLogs, loadInvites, loadAnnouncements]);

  async function userAction(userId: string, action: string, extra: Record<string, unknown> = {}) {
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra })
    });
    if (r.ok) {
      await Promise.all([loadUsers(), loadStats()]);
      notify("success", "Дію виконано");
    } else {
      const e = await r.json().catch(() => ({}));
      notify("error", (e as { error?: string }).error ?? "Помилка");
    }
  }

  async function deleteUser(userId: string) {
    const r = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (r.ok) {
      await Promise.all([loadUsers(), loadStats()]);
      notify("success", "Користувача видалено");
    } else {
      notify("error", "Помилка видалення");
    }
  }

  async function createInvite(days: number) {
    const r = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInDays: days })
    });
    if (r.ok) {
      const { url } = (await r.json()) as { url: string };
      await navigator.clipboard.writeText(url).catch(() => {});
      await loadInvites();
      notify("success", "Invite скопійовано в буфер");
    } else {
      notify("error", "Помилка створення invite");
    }
  }

  async function deleteInvite(id: string) {
    const r = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" });
    if (r.ok) {
      await loadInvites();
      notify("success", "Invite видалено");
    } else {
      notify("error", "Помилка");
    }
  }

  async function submitAnnouncement(
    title: string,
    content: string,
    expiresAt: string | null
  ): Promise<boolean> {
    const r = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, expiresAt })
    });
    if (r.ok) {
      await loadAnnouncements();
      notify("success", "Оголошення опубліковано");
      return true;
    }
    notify("error", "Помилка публікації");
    return false;
  }

  async function toggleAnnouncement(id: string, isActive: boolean) {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive })
    });
    await loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    const r = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (r.ok) {
      await loadAnnouncements();
      notify("success", "Оголошення видалено");
    } else {
      notify("error", "Помилка");
    }
  }

  const pendingCount = users.filter((u) => u.status === "pending").length;

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.email.toLowerCase().includes(q) || (u.name?.toLowerCase().includes(q) ?? false)
    );
  }, [users, search]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "users", label: "Користувачі", icon: <Users className="w-4 h-4" />, badge: pendingCount },
    { id: "logs", label: "Audit Log", icon: <ScrollText className="w-4 h-4" /> },
    { id: "invites", label: "Invites", icon: <Link2 className="w-4 h-4" /> },
    { id: "announcements", label: "Оголошення", icon: <Megaphone className="w-4 h-4" /> }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-right-4 ${
              n.type === "success"
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                : "bg-red-500/20 border border-red-500/30 text-red-300"
            }`}
          >
            {n.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {n.message}
          </div>
        ))}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-gray-400">Управління користувачами і системою.</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            icon={<CheckCircle className="w-4 h-4 text-emerald-400" />}
            label="Активні"
            value={stats.users.active}
            color="emerald"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-yellow-400" />}
            label="Pending"
            value={stats.users.pending}
            color="yellow"
            highlight={Number(stats.users.pending) > 0}
          />
          <StatCard
            icon={<Ban className="w-4 h-4 text-red-400" />}
            label="Забанені"
            value={stats.users.banned}
            color="red"
          />
          <StatCard
            icon={<BookMarked className="w-4 h-4 text-blue-400" />}
            label="Записів"
            value={Number(stats.items?.total ?? 0)}
            color="blue"
          />
          <StatCard
            icon={<HardDrive className="w-4 h-4 text-violet-400" />}
            label="Storage"
            value={`${fmtBytes(Number(stats.storage.total_used))} / ${fmtBytes(Number(stats.storage.total_limit))}`}
            color="violet"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t transition-colors ${
              tab === t.id
                ? "text-white border-b-2 border-violet-500 -mb-px"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за email або ім'ям..."
                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {(["all", "pending", "active", "banned"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
            </div>
            <button
              onClick={loadUsers}
              className="text-gray-400 hover:text-white transition-colors ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">Завантаження...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              {search ? "Нічого не знайдено." : "Користувачів не знайдено."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <UserCard key={u.id} user={u} onAction={userAction} onDelete={deleteUser} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <button onClick={loadLogs} className="text-gray-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="text-gray-500 text-sm py-8 text-center">Завантаження...</div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">Логів ще немає.</div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invites tab */}
      {tab === "invites" && (
        <InvitesTab
          invites={invites}
          onCreate={createInvite}
          onDelete={deleteInvite}
          onRefresh={loadInvites}
        />
      )}

      {/* Announcements tab */}
      {tab === "announcements" && (
        <AnnouncementsTab
          announcements={announcements}
          onCreate={submitAnnouncement}
          onToggle={toggleAnnouncement}
          onDelete={deleteAnnouncement}
          onRefresh={loadAnnouncements}
        />
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  highlight
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "emerald" | "yellow" | "red" | "violet" | "blue";
  highlight?: boolean;
}) {
  const borders: Record<string, string> = {
    emerald: "border-emerald-500/20",
    yellow: "border-yellow-500/30",
    red: "border-red-500/20",
    violet: "border-violet-500/20",
    blue: "border-blue-500/20"
  };
  return (
    <div
      className={`rounded-2xl border bg-gray-900/60 p-4 flex items-center gap-3 ${
        highlight ? borders[color] + " ring-1 ring-yellow-500/20" : "border-gray-800"
      }`}
    >
      {icon}
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-white font-semibold text-sm">{value}</div>
      </div>
    </div>
  );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({
  user,
  onAction,
  onDelete
}: {
  user: User;
  onAction: (id: string, action: string, extra?: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(user.status === "pending");
  const [pendingAction, setPendingAction] = useState<"ban" | "delete" | "storage" | null>(null);
  const [banReason, setBanReason] = useState("");
  const [storageInput, setStorageInput] = useState(
    String(Math.round(Number(user.storage_limit_bytes) / 1073741824))
  );
  const [acting, setActing] = useState(false);

  const storagePercent =
    Number(user.storage_limit_bytes) > 0
      ? Math.round((Number(user.storage_used_bytes) / Number(user.storage_limit_bytes)) * 100)
      : 0;

  function fmtBytesLocal(bytes: number | string | bigint) {
    const n = Number(bytes);
    if (!n || n <= 0) return "0 B";
    const k = 1024,
      sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(n) / Math.log(k));
    return `${(n / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }

  async function act(action: string, extra?: Record<string, unknown>) {
    setActing(true);
    await onAction(user.id, action, extra);
    setActing(false);
    setPendingAction(null);
  }

  return (
    <div
      className={`rounded-xl border bg-gray-900/60 overflow-hidden transition-colors ${
        user.status === "pending" ? "border-yellow-500/30" : "border-gray-800"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 text-sm font-bold flex-shrink-0">
          {(user.name ?? user.email)[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium truncate max-w-[160px]">
              {user.name ?? user.email}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[user.status] ?? "text-gray-400 bg-gray-400/10"}`}
            >
              {STATUS_LABELS[user.status] ?? user.status}
            </span>
            {user.role === "admin" && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-violet-400 bg-violet-400/10">
                admin
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate">{user.email}</div>
        </div>

        <div className="hidden lg:flex flex-col items-end gap-1 min-w-[90px]">
          <span className="text-xs text-gray-400">
            {fmtBytesLocal(user.storage_used_bytes)} / {fmtBytesLocal(user.storage_limit_bytes)}
          </span>
          <div className="w-20 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${storagePercent > 80 ? "bg-red-500" : "bg-violet-500"}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-0.5 min-w-[70px]">
          <span className="text-xs text-gray-400">{user.saved_count} записів</span>
          <span className="text-xs text-gray-600">
            {user.last_login_at ? fmtDateRelative(user.last_login_at) : "не входив"}
          </span>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="text-gray-400 hover:text-white transition-colors ml-1"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-800 px-4 py-3 space-y-3">
          <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
            <span>Реєстрація: {fmtDate(user.created_at)}</span>
            {user.last_login_at && <span>Останній вхід: {fmtDate(user.last_login_at)}</span>}
          </div>

          {pendingAction === null && (
            <div className="flex flex-wrap gap-2">
              {user.status === "pending" && (
                <>
                  <ActionBtn
                    label="Підтвердити"
                    color="emerald"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    loading={acting}
                    onClick={() => act("approve")}
                  />
                  <ActionBtn
                    label="Відхилити"
                    color="red"
                    icon={<XCircle className="w-3.5 h-3.5" />}
                    loading={acting}
                    onClick={() => act("reject")}
                  />
                </>
              )}
              {user.status === "active" && (
                <ActionBtn
                  label="Забанити"
                  color="red"
                  icon={<Ban className="w-3.5 h-3.5" />}
                  loading={acting}
                  onClick={() => setPendingAction("ban")}
                />
              )}
              {user.status === "banned" && (
                <ActionBtn
                  label="Розблокувати"
                  color="emerald"
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  loading={acting}
                  onClick={() => act("unban")}
                />
              )}
              <ActionBtn
                label={user.role === "admin" ? "Зняти admin" : "Зробити admin"}
                color="violet"
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                loading={acting}
                onClick={() =>
                  act("change_role", { role: user.role === "admin" ? "user" : "admin" })
                }
              />
              <ActionBtn
                label="Змінити ліміт"
                color="blue"
                icon={<HardDrive className="w-3.5 h-3.5" />}
                loading={false}
                onClick={() => setPendingAction("storage")}
              />
              <ActionBtn
                label="Видалити"
                color="red"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                loading={acting}
                onClick={() => setPendingAction("delete")}
              />
            </div>
          )}

          {pendingAction === "ban" && (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Причина бану (необов'язково)..."
                rows={2}
                className="w-full bg-gray-800 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/60 resize-none"
              />
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => act("ban", { reason: banReason || undefined })}
                  disabled={acting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 disabled:opacity-50 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" /> {acting ? "..." : "Підтвердити бан"}
                </button>
                <button
                  onClick={() => {
                    setPendingAction(null);
                    setBanReason("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Скасувати
                </button>
              </div>
            </div>
          )}

          {pendingAction === "storage" && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                type="number"
                min="0"
                step="1"
                value={storageInput}
                onChange={(e) => setStorageInput(e.target.value)}
                className="w-20 bg-gray-800 border border-blue-500/30 rounded-lg px-3 py-1.5 text-sm text-white text-center focus:outline-none focus:border-blue-500/60"
              />
              <span className="text-xs text-gray-400">GB</span>
              <button
                onClick={() =>
                  act("set_storage_limit", { limitBytes: parseFloat(storageInput) * 1073741824 })
                }
                disabled={acting || !storageInput}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> {acting ? "..." : "Зберегти"}
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Скасувати
              </button>
            </div>
          )}

          {pendingAction === "delete" && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300 flex-1">
                Видалити користувача і всі його дані?
              </span>
              <button
                onClick={() => {
                  setPendingAction(null);
                  onDelete(user.id);
                }}
                disabled={acting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                {acting ? "..." : "Так, видалити"}
              </button>
              <button
                onClick={() => setPendingAction(null)}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Ні
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LogEntry ─────────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: Log }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Object.keys(log.details ?? {}).length > 0;

  return (
    <div className="px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-800 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-violet-400 font-medium text-xs min-w-[110px]">
          {ACTION_LABELS[log.action] ?? log.action}
        </span>
        <span className="text-gray-400 text-xs">{log.admin_name ?? log.admin_email}</span>
        <span className="text-gray-600 text-xs">→</span>
        <span className="text-gray-300 text-xs truncate flex-1">{log.target_email ?? "—"}</span>
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-400"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
        <span className="text-gray-600 text-xs ml-auto whitespace-nowrap">
          {fmtDateRelative(log.created_at)}
        </span>
      </div>
      {expanded && hasDetails && (
        <pre className="mt-2 text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2 overflow-x-auto">
          {JSON.stringify(log.details, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ─── InvitesTab ───────────────────────────────────────────────────────────────

function InvitesTab({
  invites,
  onCreate,
  onDelete,
  onRefresh
}: {
  invites: Invite[];
  onCreate: (days: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [days, setDays] = useState(7);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    await onCreate(days);
    setCreating(false);
  }

  async function copyInvite(code: string) {
    const url = `${window.location.origin}/register?invite=${code}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex-wrap">
        <span className="text-sm text-gray-300">Новий invite:</span>
        <input
          type="number"
          min="1"
          max="365"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 7)}
          className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white text-center focus:outline-none focus:border-violet-500/60"
        />
        <span className="text-sm text-gray-400">днів</span>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Link2 className="w-4 h-4" />
          {creating ? "Створення..." : "Створити і скопіювати"}
        </button>
        <button onClick={onRefresh} className="ml-auto text-gray-400 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {invites.length === 0 ? (
          <div className="text-gray-500 text-sm py-4 text-center">Invite кодів ще немає.</div>
        ) : (
          invites.map((inv) => (
            <div
              key={inv.id}
              className={`px-4 py-3 rounded-xl border text-sm ${
                inv.used_at ? "bg-gray-900/40 border-gray-800/50" : "bg-gray-900/60 border-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <code
                  className={`font-mono text-xs flex-1 ${inv.used_at ? "text-gray-500" : "text-violet-300"}`}
                >
                  {inv.code}
                </code>
                {inv.used_at ? (
                  <span className="text-xs text-gray-500">використано · {inv.used_by_email}</span>
                ) : (
                  <span className="text-xs text-emerald-400">
                    активний · до {fmtDate(inv.expires_at)}
                  </span>
                )}
                {!inv.used_at && (
                  <button
                    onClick={() => copyInvite(inv.code)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="Копіювати посилання"
                  >
                    {copied === inv.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDelete(inv.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-1">Створено: {fmtDate(inv.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── AnnouncementsTab ─────────────────────────────────────────────────────────

function AnnouncementsTab({
  announcements,
  onCreate,
  onToggle,
  onDelete,
  onRefresh
}: {
  announcements: Announcement[];
  onCreate: (title: string, content: string, expiresAt: string | null) => Promise<boolean>;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    const ok = await onCreate(title, content, expiresAt || null);
    if (ok) {
      setTitle("");
      setContent("");
      setExpiresAt("");
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3">
        <h3 className="text-white font-medium text-sm">Нове оголошення</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Текст оголошення..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-gray-400 whitespace-nowrap">Діє до:</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-violet-500 flex-1"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            {submitting ? "Публікація..." : "Опублікувати"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Опубліковані</span>
          <button onClick={onRefresh} className="text-gray-400 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {announcements.length === 0 ? (
          <div className="text-gray-500 text-sm py-4 text-center">Оголошень ще немає.</div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`rounded-xl border p-4 space-y-2 transition-opacity ${
                ann.is_active
                  ? "bg-gray-900/60 border-gray-800"
                  : "bg-gray-900/30 border-gray-800/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium flex-1">{ann.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    ann.is_active
                      ? "text-emerald-400 bg-emerald-400/10"
                      : "text-gray-500 bg-gray-500/10"
                  }`}
                >
                  {ann.is_active ? "активне" : "вимкнено"}
                </span>
                <button
                  onClick={() => onToggle(ann.id, !ann.is_active)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  title={ann.is_active ? "Вимкнути" : "Увімкнути"}
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(ann.id)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-gray-400 text-sm">{ann.content}</p>
              <div className="text-xs text-gray-600 flex gap-3 flex-wrap">
                <span>Автор: {ann.author_name ?? "—"}</span>
                <span>Створено: {fmtDate(ann.created_at)}</span>
                {ann.expires_at && <span>Діє до: {fmtDate(ann.expires_at)}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────

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
