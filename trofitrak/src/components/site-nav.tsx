"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Database,
  LayoutDashboard,
  Scale,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { cn } from "./ui/utils";

interface NavItem {
  href: string;
  desktopLabel: string;
  mobileLabel: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  {
    href: "/",
    desktopLabel: "Dashboard",
    mobileLabel: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/inbody",
    desktopLabel: "InBody Scans",
    mobileLabel: "Scans",
    icon: Scale,
  },
  {
    href: "/ingredients",
    desktopLabel: "Ingredients",
    mobileLabel: "Items",
    icon: Database,
  },
  {
    href: "/recipes",
    desktopLabel: "Recipes",
    mobileLabel: "Recipes",
    icon: Utensils,
  },
  {
    href: "/planner",
    desktopLabel: "Meal Planner",
    mobileLabel: "Plan",
    icon: Calendar,
  },
  {
    href: "/shopping",
    desktopLabel: "Shopping",
    mobileLabel: "Shop",
    icon: ShoppingCart,
  },
];

const isActiveRoute = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-2">
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-rose-600 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
            )}
          >
            {item.desktopLabel}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom z-50">
      <div className="grid grid-cols-6 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                active
                  ? "text-rose-600"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
