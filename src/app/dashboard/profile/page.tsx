"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, KeyRound, LogOut, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user.image ?? "");

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.name !== undefined) setName(d.name ?? "");
        if (d.avatar_url !== undefined) setAvatarUrl(d.avatar_url ?? "");
      })
      .catch(() => {});
  }, []);
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSaveProfile() {
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), avatar_url: avatarUrl.trim(), timezone })
    });

    if (!res.ok) {
      setError("Не вдалося зберегти профіль.");
    } else {
      await update({ name: name.trim(), image: avatarUrl.trim() });
      setSuccess("Профіль оновлено.");
    }
    setSavingProfile(false);
  }

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setError("Мінімум 8 символів.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Паролі не співпадають.");
      return;
    }

    setSavingPassword(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/user/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword })
    });

    if (!res.ok) {
      setError("Не вдалося змінити пароль.");
    } else {
      setSuccess("Пароль змінено.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Назад
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Профіль і акаунт</h1>
        <p className="text-gray-400">Профіль, безпека та активні сесії</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <UserCircle2 className="w-5 h-5 text-violet-300" />
          Профіль
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm text-gray-300">Email</span>
            <input
              value={session?.user.email ?? ""}
              disabled
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-400"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Ім&apos;я</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Твоє ім'я"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </label>

          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-gray-300">Avatar URL</span>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Timezone</span>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Europe/Kyiv"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          {savingProfile ? "Зберігаємо..." : "Зберегти профіль"}
        </button>
      </section>

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-5 h-5 text-blue-300" />
          Безпека акаунту
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm text-gray-300">Новий пароль</span>
            <input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Мінімум 8 символів"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-gray-300">Підтверди пароль</span>
            <input
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повтори новий пароль"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <KeyRound className="w-4 h-4" />
            {savingPassword ? "Оновлюємо..." : "Змінити пароль"}
          </button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl px-4 py-2.5 text-sm font-medium border border-red-500/30"
          >
            <LogOut className="w-4 h-4" />
            Logout з усіх сесій
          </button>
        </div>
      </section>
    </div>
  );
}
