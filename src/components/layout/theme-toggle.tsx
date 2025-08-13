"use client";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = (theme === "system" ? resolvedTheme : theme) as
    | "light"
    | "dark"
    | undefined;
  const icon =
    current === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );
  const next =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(next)}
      aria-label="Cambiar tema"
      className="h-9 w-9 p-0"
    >
      {icon}
    </Button>
  );
}
