import {
  BadgeDollarSign,
  Images,
  LayoutDashboard,
  Link2,
  Megaphone,
  Settings,
  ShieldAlert,
  Sparkles,
  Store,
  TicketPercent,
  Users,
  Wallet,
} from "lucide-react";

import type { NavItem } from "@/lib/types";

interface NavIconProps {
  name: NavItem["icon"];
  className?: string;
}

const iconMap = {
  "layout-dashboard": LayoutDashboard,
  store: Store,
  sparkles: Sparkles,
  users: Users,
  "badge-dollar-sign": BadgeDollarSign,
  wallet: Wallet,
  settings: Settings,
  images: Images,
  link: Link2,
  "ticket-percent": TicketPercent,
  megaphone: Megaphone,
  "shield-alert": ShieldAlert,
};

export function NavIcon({ name, className }: NavIconProps) {
  const Icon = iconMap[name];
  return <Icon className={className} />;
}
