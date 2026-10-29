"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sparkles,
  Award,
  Lightbulb,
  Users2,
  CheckCircle,
  Network,
  Send,
  MessageSquare,
  FileText,
  ShieldCheck,
  Building,
  LogOut,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { role, user, signOut } = useAuth();

  const sections = [
    {
      title: "Core Discovery",
      colorClass: "text-cyan-600 dark:text-cyan-400",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Faculty Directory",
          href: "/professors",
          icon: Users,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Research Openings",
          href: "/projects",
          icon: Briefcase,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Paper Library",
          href: "/documents",
          icon: FileText,
          roles: ["student", "professor", "admin"],
        },
      ],
    },
    {
      title: "AI & Intelligence",
      colorClass: "text-purple-600 dark:text-purple-400",
      items: [
        {
          name: "Talent Matcher",
          href: "/talent-matcher",
          icon: Sparkles,
          roles: ["professor", "admin", "student"],
          badge: "AI",
        },
        {
          name: "Skill Passport",
          href: "/skills",
          icon: Award,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Idea Pipeline",
          href: "/ideas",
          icon: Lightbulb,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Team Composer",
          href: "/teams",
          icon: Users2,
          roles: ["professor", "admin"],
        },
        {
          name: "Contributions",
          href: "/contributions",
          icon: CheckCircle,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Collab Graph",
          href: "/collaboration-graph",
          icon: Network,
          roles: ["student", "professor", "admin"],
        },
      ],
    },
    {
      title: "Collaboration",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      items: [
        {
          name: role === "professor" ? "Student Applications" : "My Applications",
          href: "/requests",
          icon: Send,
          roles: ["student", "professor", "admin"],
        },
        {
          name: "Messages & Collab",
          href: "/messages",
          icon: MessageSquare,
          roles: ["student", "professor", "admin"],
        },
      ],
    },
    {
      title: "Governance",
      colorClass: "text-amber-600 dark:text-amber-400",
      items: [
        {
          name: "Admin Governance",
          href: "/admin",
          icon: ShieldCheck,
          roles: ["admin"],
          badge: "Admin",
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-950/70 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] select-none transition-colors duration-300">
      <div className="p-4 space-y-6 overflow-y-auto">
        {sections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(role || "student")
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <p className={cn("px-3 text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5", section.colorClass)}>
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                <span>{section.title}</span>
              </p>
              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 font-semibold ring-1 ring-white/20"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 hover:translate-x-0.5"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors shrink-0",
                            isActive
                              ? "text-white"
                              : "text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shadow-[0_0_8px_rgba(99,102,241,0.25)]"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Institutional Context & Session Card at Sidebar Bottom */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2.5 p-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-cyan-500/20">
            {(user?.full_name || "U").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate" suppressHydrationWarning>
              {user?.full_name || "Guest Scholar"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize flex items-center gap-1" suppressHydrationWarning>
              <span className="font-semibold text-cyan-600 dark:text-cyan-400">{role || "Visitor"}</span>
              <span>•</span>
              <span className="truncate">{user?.department_name || "Stanford Univ"}</span>
            </p>
          </div>
        </div>

        {user ? (
          <button
            onClick={async () => {
              await signOut();
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-rose-500/40 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 text-[11px] font-semibold transition-all duration-150 cursor-pointer shadow-xs"
            title="Sign out of account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-[11px] font-semibold transition-all shadow-md shadow-indigo-500/25"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Sign In / Choose Role</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
