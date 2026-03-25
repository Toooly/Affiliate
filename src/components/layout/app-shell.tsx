"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { NavIcon } from "@/components/layout/nav-icon";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants";
import { cn, getInitials } from "@/lib/utils";
import type { NavItem, UserSession } from "@/lib/types";

interface AppShellProps {
  title: string;
  description: string;
  navItems: NavItem[];
  session: UserSession;
  children: ReactNode;
}

export function AppShell({
  title,
  description,
  navItems,
  session,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const workspace =
    session.role === "INFLUENCER"
      ? {
          label: "Portale affiliato",
          description: "Link attivi, codici promo, campagne e payout in un solo posto.",
          homeHref: "/dashboard",
          navLabel: "Strumenti partner",
        }
      : {
          label: "Cabina di regia merchant",
          description: "Gestisci il programma affiliate Shopify da un'unica area di lavoro.",
          homeHref: "/admin",
          navLabel: "Operativita merchant",
        };
  const activeNavItem =
    [...navItems]
      .sort((left, right) => right.href.length - left.href.length)
      .find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navItems[0];
  const activeNavClass =
    session.role === "INFLUENCER"
      ? "surface-affiliate text-white hover:text-white"
      : "surface-admin text-white hover:text-white";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] gap-6 px-4 py-5 lg:px-6">
        <aside className="hidden w-[286px] shrink-0 flex-col rounded-[34px] border border-border/85 bg-card/96 p-5 shadow-[0_24px_64px_-40px_rgba(22,48,56,0.12)] lg:flex">
          <Logo withTagline />
          <div className="mt-8 rounded-[28px] border border-border/75 bg-muted/65 px-4 py-4">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Area corrente
            </div>
            <div className="mt-2 text-base font-semibold">{workspace.label}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {workspace.description}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full justify-between">
              <Link href={workspace.homeHref}>
                Apri area
                <NavIcon name={navItems[0]?.icon ?? "layout-dashboard"} className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 px-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {workspace.navLabel}
          </div>
          <div className="mt-3 space-y-2">
            {navItems.map((item) => {
              const active = activeNavItem.href === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                    active && activeNavClass,
                  )}
                >
                  <NavIcon name={item.icon} className="size-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto rounded-[30px] border border-border/70 bg-muted/45 p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(session.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                  <div className="truncate font-medium">{session.fullName}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {session.email}
                  </div>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline">{roleLabels[session.role]}</Badge>
            </div>
            <form action={logoutAction} className="mt-4">
              <Button variant="outline" className="w-full justify-center">
                <LogOut className="size-4" />
                Esci
              </Button>
            </form>
          </div>
        </aside>
        <main className="flex-1">
          <header className="sticky top-0 z-20 mb-5 rounded-[30px] border border-border/85 bg-card/96 px-5 py-4 shadow-[0_24px_64px_-42px_rgba(22,48,56,0.12)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{workspace.label}</Badge>
                  <Badge variant="secondary">{activeNavItem.title}</Badge>
                </div>
                <div className="font-display text-[1.9rem] font-semibold tracking-tight">
                  {title}
                </div>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
              <div className="flex items-center gap-3 lg:hidden">
                <Avatar>
                  <AvatarFallback>{getInitials(session.fullName)}</AvatarFallback>
                </Avatar>
                <form action={logoutAction}>
                  <Button variant="outline" size="sm">
                    <LogOut className="size-4" />
                    Esci
                  </Button>
                </form>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const active = activeNavItem.href === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-border/85 bg-card px-4 py-2 text-sm font-medium text-muted-foreground",
                      active && activeNavClass,
                    )}
                  >
                    <NavIcon name={item.icon} className="size-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
