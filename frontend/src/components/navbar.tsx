"use client"

import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/Logo";
import { useRouter, usePathname } from "next/navigation";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("precioar_search_state");
      window.dispatchEvent(new Event("precioar_reset_home"));
    }
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <a
          href="/"
          onClick={handleGoHome}
          className="flex items-center cursor-pointer hover:opacity-90 transition-opacity select-none py-1"
          aria-label="Volver al inicio"
        >
          <Logo className="h-8 sm:h-9 w-auto" />
        </a>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
