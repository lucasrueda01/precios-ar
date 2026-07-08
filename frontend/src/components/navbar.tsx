import { ThemeToggle } from "@/components/theme-toggle";
import { Search } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex gap-2 items-center">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
            <Search className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">PrecioAR</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
