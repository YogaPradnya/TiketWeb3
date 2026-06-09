import Providers from "./providers";
import Navbar from "@/components/Navbar";
import BottomBar from "@/components/BottomBar";
import "./globals.css";

export const metadata = {
  title: "NFTix | Web3 NFT Ticketing Anti-Scalping",
  description:
    "NFTix is a secure Web3 NFT ticketing landing page for fair on-chain event access, authentic entry validation, and anti-scalping ticket minting.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <div className="flex flex-col min-h-screen bg-[#0b0e11] text-[#eaecef]">
            <Navbar />
            <div className="flex-grow">
              {children}
            </div>
            <BottomBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
