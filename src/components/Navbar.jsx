"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ConnectButton from "./ConnectButton";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Events" },
    { href: "/my-tickets", label: "My Tickets" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <nav className="h-16 border-b border-[#2b3139] bg-[#0b0e11] sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#ffffff]">
          <img src="/icon.png" alt="NFTix Logo" className="h-7 w-7 object-contain" />
          <span>NFTix</span>
        </Link>
        
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-[#FCD535]" : "text-[#eaecef] hover:text-[#FCD535]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
