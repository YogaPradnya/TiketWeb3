import Providers from "./providers";
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
