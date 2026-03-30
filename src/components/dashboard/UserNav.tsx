"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Settings, User, BookMarked, ChevronDown, ShieldCheck } from "lucide-react";
import type { Session } from "next-auth";

type Props = {
  session: Session;
  savedCount: number;
};

export default function UserNav({ session, savedCount }: Props) {
  const { user } = session;
  const isAdmin = (user as { role?: string }).role === "admin";
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-800 outline-none group"
          aria-label="User menu"
        >
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full ring-2 ring-gray-700 group-hover:ring-violet-500/60 transition-all flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-gray-700 group-hover:ring-violet-500/60 transition-all flex-shrink-0">
              {initials}
            </div>
          )}
          <span className="text-gray-300 text-sm hidden md:block max-w-[120px] truncate">
            {displayName}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-600 hidden md:block group-data-[state=open]:rotate-180 transition-transform" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[100] min-w-[220px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 p-1.5 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        >
          <div className="px-3 py-2.5 mb-1 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full ring-2 ring-gray-700 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                {user.name && (
                  <p className="text-white text-sm font-medium truncate leading-tight">
                    {user.name}
                  </p>
                )}
                <p className="text-gray-500 text-xs truncate leading-tight">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <BookMarked className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="text-violet-300 text-xs font-medium">
                {savedCount} saved {savedCount === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <DropdownMenu.Item asChild>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 text-sm hover:text-white hover:bg-gray-800 transition-colors outline-none cursor-pointer"
            >
              <User className="w-4 h-4 text-gray-500" />
              Profile
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-300 text-sm hover:text-white hover:bg-gray-800 transition-colors outline-none cursor-pointer"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              Settings
            </Link>
          </DropdownMenu.Item>

          {isAdmin && (
            <DropdownMenu.Item asChild>
              <Link
                href="/dashboard/admin"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-400 text-sm hover:text-amber-300 hover:bg-amber-400/10 transition-colors outline-none cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                Admin Panel
              </Link>
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-gray-800" />

          <DropdownMenu.Item
            onSelect={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors outline-none cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
