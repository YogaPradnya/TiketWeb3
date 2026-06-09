"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";

export default function BottomBar() {
  const pathname = usePathname();
  const { isConnected, chain } = useAccount();

  const links = [
    { 
      href: "/", 
      label: "Events", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    },
    { 
      href: "/my-tickets", 
      label: "Tickets", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h9.75c1.05 0 1.9.85 1.9 1.9v8.2c0 1.05-.85 1.9-1.9 1.9H7.5a1.9 1.9 0 0 1-1.9-1.9V7.9c0-1.05.85-1.9 1.9-1.9Z" />
        </svg>
      )
    },
    { 
      href: "/admin", 
      label: "Admin", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Desktop Footer / Status Bar */}
      <footer className="hidden md:block border-t border-[#2b3139] bg-[#0b0e11] py-6 text-sm text-[#707a8a] mt-auto">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p>© {new Date().getFullYear()} NFTix. Soulbound Anti-Scalping Ticketing.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-[#0ecb81]" : "bg-[#f6465d]"}`} />
              <span className="font-[var(--font-jetbrains-mono)] text-xs text-[#eaecef]">
                {isConnected ? `Sepolia Connected (${chain?.name || "Unknown"})` : "Wallet Disconnected"}
              </span>
            </div>
            <a href="https://github.com/YogaPradnya/TiketWeb3" target="_blank" rel="noreferrer" className="hover:text-[#FCD535] transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-[#2b3139] bg-[#0b0e11] bg-opacity-95 backdrop-blur-md z-50 flex items-center justify-around px-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-200 ${
                isActive ? "text-[#FCD535]" : "text-[#707a8a] hover:text-[#eaecef]"
              }`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
      
      {/* Padding space for mobile bottom bar */}
      <div className="h-16 md:hidden" />
    </>
  );
}
