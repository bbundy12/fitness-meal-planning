"use client";

import { useRouter } from "next/navigation";
import { Dashboard } from "./Dashboard";

const routeBySection: Record<string, string> = {
  dashboard: "/",
  inbody: "/inbody",
  ingredients: "/ingredients",
  recipes: "/recipes",
  planner: "/planner",
  shopping: "/shopping",
  "recipe-selector": "/planner",
};

export function DashboardPage() {
  const router = useRouter();

  const handleNavigate = (section: string) => {
    router.push(routeBySection[section] ?? "/");
  };

  return <Dashboard onNavigate={handleNavigate} />;
}
