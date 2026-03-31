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
import {
  adminShellRouteMeta,
  influencerShellRouteMeta,
  roleLabels,
} from "@/lib/constants";
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
      ? "surface-affiliate text-[color:var(--surface-foreground)] hover:text-[color:var(--surface-foreground)]"
      : "surface-admin text-[color:var(--surface-foreground)] hover:text-[color:var(--surface-foreground)]";
  const routeMetaEntries = Object.entries(
    session.role === "INFLUENCER" ? influencerShellRouteMeta : adminShellRouteMeta,
  ).sort((left, right) => right[0].length - left[0].length);
  const activeRouteMeta =
    routeMetaEntries.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix))?.[1] ??
    null;
  const shellTitle = activeRouteMeta?.title ?? title;
  const shellDescription = activeRouteMeta?.description ?? description;
  const quickActions = activeRouteMeta?.quickActions ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[var(--layout-shell-max)] items-start gap-5 px-4 py-4 lg:px-6">
        <aside className="ui-card-shell sticky top-4 hidden max-h-[calc(100vh-2rem)] w-[var(--layout-sidebar-width)] shrink-0 overflow-y-auto rounded-[1.85rem] p-4 lg:flex lg:flex-col">
          <Logo withTagline />
          <div className="ui-soft-block ui-soft-block-strong mt-6 rounded-[24px] px-4 py-3.5">
            <div className="ui-page-overline text-muted-foreground">
              Area corrente
            </div>
            <div className="mt-2 text-[0.95rem] font-semibold">{workspace.label}</div>
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
          <div className="ui-page-overline mt-6 px-2 text-muted-foreground">
            {workspace.navLabel}
          </div>
          <div className="mt-2.5 space-y-1.5">
            {navItems.map((item) => {
              const active = activeNavItem.href === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[18px] px-3.5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-surface-hover hover:text-foreground",
                    active && activeNavClass,
                  )}
                >
                  <NavIcon name={item.icon} className="size-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
          <div className="ui-soft-block mt-6 rounded-[24px] p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(session.fullName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="ui-wrap-pretty font-medium">{session.fullName}</div>
                <div className="ui-wrap-anywhere text-sm text-muted-foreground">
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
        <main className="min-w-0 flex-1">
          <div className="ui-page-shell ui-page-flow">
          <header className="ui-card-shell sticky top-0 z-20 rounded-[26px] px-4 py-4 lg:px-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{workspace.label}</Badge>
                  <Badge variant="secondary">{activeNavItem.title}</Badge>
                </div>
                <div className="ui-page-title">
                  {shellTitle}
                </div>
                <p className="ui-page-copy mt-1 max-w-2xl">
                  {shellDescription}
                </p>
                {quickActions.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {quickActions.map((item) => (
                      <Button key={item.href} asChild size="sm" variant="outline">
                        <Link href={item.href}>
                          <NavIcon name={item.icon} className="size-4" />
                          {item.label}
                        </Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
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
            <div className="ui-scroll-inline mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navItems.map((item) => {
                const active = activeNavItem.href === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-border/85 bg-surface-subtle px-4 py-2 text-sm font-medium text-muted-foreground",
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
          </div>
        </main>
      </div>
    </div>
  );
}
