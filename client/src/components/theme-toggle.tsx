import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 glass transition-all duration-300 hover:scale-110"
      data-testid="theme-toggle"
      aria-label={theme === 'night' ? "Switch to day mode" : "Switch to night mode"}
    >
      {theme === 'night' ? (
        <Sun className="h-5 w-5 text-orange-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700" />
      )}
    </Button>
  );
}