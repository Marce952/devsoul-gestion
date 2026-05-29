"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Ticket,
  Bot,
  Menu,
  X,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Avatar } from "@heroui/react/avatar";
import { Button } from "@heroui/react/button";
import { Dropdown } from "@heroui/react/dropdown";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/softwares", label: "Softwares", icon: Package },
  { href: "/dashboard/facturacion", label: "Facturación", icon: FileText },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/ia", label: "Chat IA", icon: Bot },
];

const sectionLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/clientes": "Clientes",
  "/dashboard/softwares": "Softwares",
  "/dashboard/facturacion": "Facturación",
  "/dashboard/tickets": "Tickets",
  "/dashboard/ia": "Chat IA",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const currentSection =
    Object.entries(sectionLabels)
      .reverse()
      .find(([key]) => pathname.startsWith(key))?.[1] ?? "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-fondo-dark">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col
          glass border-r border-white/10
          transition-transform duration-300 ease-in-out
          md:static md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-white/10">
          <span className="text-xl font-bold text-acento-lima tracking-tight">
            Devsoul
          </span>
          <button
            className="p-1 text-white/50 hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5
                  text-sm font-medium transition-colors
                  ${
                    active
                      ? "bg-acento-lima/10 text-acento-lima"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-white/30 text-center">v1.0.0 · Devsoul</p>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between px-4 glass border-b border-white/10">
          {/* Left: hamburger + section */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg text-white/60 hover:bg-white/5 hover:text-white md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-white">
              {currentSection}
            </span>
          </div>

          {/* Right: user dropdown */}
          <Dropdown>
            <Dropdown.Trigger>
              <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors">
                <Avatar size="sm">
                  <Avatar.Fallback className="bg-acento-lima/20 text-acento-lima text-xs font-bold">
                    DS
                  </Avatar.Fallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-white/80">
                  Admin
                </span>
              </button>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu className="bg-black/90 border border-white/10 backdrop-blur-md min-w-40">
                <Dropdown.Item
                  href="/perfil"
                  className="text-white/80 hover:text-white hover:bg-white/5"
                >
                  <UserCircle size={15} className="mr-2 inline-block" />
                  Perfil
                </Dropdown.Item>
                <Dropdown.Item
                  href="/auth/logout"
                  className="text-red-400 hover:text-red-300 hover:bg-white/5"
                >
                  <LogOut size={15} className="mr-2 inline-block" />
                  Cerrar sesión
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
