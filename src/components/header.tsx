"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Settings, Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeaderTabId = "reminders" | "notes" | "connexions";

interface HeaderProps {
  activeTab: HeaderTabId;
  onTabChange: (tab: HeaderTabId) => void;
  pendingCount: number;
}

const TABS: { id: HeaderTabId; label: string; icon: string }[] = [
  { id: "connexions", label: "Connexions", icon: "📊" },
  { id: "reminders", label: "Rappels", icon: "📌" },
  { id: "notes", label: "Notes", icon: "📝" },
];

export function Header({ activeTab, onTabChange, pendingCount }: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border bg-card shadow-sm">
      <h1 className="text-xl font-bold shrink-0">ClassBoard</h1>

      <div className="flex-1 flex justify-center min-w-0">
        <div className="inline-flex rounded-lg border border-border/60 bg-muted/30 p-0.5">
          {TABS.map((t) => {
            const active = t.id === activeTab;
            const showCount = t.id === "reminders" && pendingCount > 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-1">{t.icon}</span>
                {t.label}
                {showCount && <span className="ml-1 opacity-70">({pendingCount})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} title="Se déconnecter">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
