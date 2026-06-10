"use client";

import { NFTIX_EVENT_ABI, NFTIX_EVENT_ADDRESS } from "@/lib/contract";
import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

const EVENT_IDS = [1n, 2n, 3n, 4n, 5n, 6n];

function normalizeEventInfo(eventInfo) {
  if (!eventInfo) return null;
  if (Array.isArray(eventInfo)) {
    const [name, venue, eventDate, ticketPrice, maxTickets, soldTickets, saleActive] = eventInfo;
    return { name, venue, eventDate, ticketPrice, maxTickets, soldTickets, saleActive };
  }
  return eventInfo;
}

function EventCard({ eventId }) {
  const { address, isConnected } = useAccount();
  const { data: eventInfo, refetch } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "getEvent",
    args: [eventId],
    query: { retry: 1 },
  });
  const { data: alreadyOwned, refetch: refetchOwned } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "hasTicketForEvent",
    args: address ? [eventId, address] : undefined,
    query: { enabled: Boolean(address), retry: 1 },
  });
  const { writeContractAsync, isPending, error } = useWriteContract();

  const eventData = normalizeEventInfo(eventInfo);
  if (!eventData) return null;

  const { name, venue, eventDate, ticketPrice, maxTickets, soldTickets, saleActive } = eventData;
  const soldOut = soldTickets >= maxTickets;
  const dateLabel = new Date(Number(eventDate) * 1000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function buyTicket() {
    await writeContractAsync({
      address: NFTIX_EVENT_ADDRESS,
      abi: NFTIX_EVENT_ABI,
      functionName: "buyTicket",
      args: [eventId],
      value: ticketPrice,
    });
    await Promise.all([refetch(), refetchOwned()]);
  }

  return (
    <article className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6">
      <div className="aspect-video rounded-lg border border-[#2b3139] bg-[#181a20] p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(252,213,53,0.08)_0%,transparent_100%)] pointer-events-none" />
        <div className="flex justify-between items-start z-10">
          <span className="w-fit rounded-md bg-[#FCD535] px-3 py-1 text-xs font-semibold text-[#181a20]">SBT TICKET</span>
          <span className="font-[var(--font-jetbrains-mono)] text-sm font-semibold text-[#eaecef]">EVENT #{eventId.toString()}</span>
        </div>
        <div className="flex justify-center items-center my-auto z-10">
          <img src="/icon.png" alt="Ticket Icon" className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(252,213,53,0.25)]" />
        </div>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-[#ffffff]">{name}</h3>
      <p className="mt-2 text-sm text-[#707a8a]"><span className="font-[var(--font-jetbrains-mono)]">{dateLabel}</span> · {venue}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#2b3139] pt-5">
        <div><p className="text-sm text-[#707a8a]">Mint Price</p><p className="font-[var(--font-jetbrains-mono)] text-2xl font-bold text-[#ffffff]">{formatEther(ticketPrice)} ETH</p></div>
        <div className="text-right"><p className="text-sm text-[#707a8a]">Sold</p><p className="font-[var(--font-jetbrains-mono)] text-2xl font-bold text-[#ffffff]">{soldTickets.toString()}/{maxTickets.toString()}</p></div>
      </div>
      <button
        className="mt-6 h-10 w-full rounded-md bg-[#FCD535] px-6 text-sm font-semibold text-[#181a20] hover:bg-[#f0b90b] disabled:cursor-not-allowed disabled:bg-[#3a3a1f] disabled:text-[#707a8a]"
        disabled={!isConnected || !saleActive || soldOut || alreadyOwned || isPending}
        onClick={buyTicket}
        type="button"
      >
        {isPending ? "Waiting for MetaMask..." : alreadyOwned ? "Ticket Owned" : !saleActive ? "Sale Closed" : soldOut ? "Sold Out" : isConnected ? "Buy Soulbound Ticket" : "Connect Wallet First"}
      </button>
      {error ? <p className="mt-3 text-xs text-[#f6465d]">{error.shortMessage || error.message}</p> : null}
    </article>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: adminRole } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "DEFAULT_ADMIN_ROLE",
    query: { enabled: isConnected, retry: 1 },
  });
  const { data: isAdmin } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "hasRole",
    args: adminRole && address ? [adminRole, address] : undefined,
    query: { enabled: Boolean(adminRole && address), retry: 1 },
  });
  const { data: eventCount } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "eventCount",
    query: { retry: 1 },
  });

  const visibleIds = EVENT_IDS.filter((id) => eventCount && id <= eventCount);

  return (
    <main className="font-[var(--font-inter)] text-[#eaecef]">

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 inline-flex rounded-lg border border-[#2b3139] bg-[#1e2329] px-4 py-2 text-sm font-semibold text-[#FCD535]">Soulbound Anti-Calo Ticketing</p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-[#ffffff] sm:text-5xl lg:text-[64px] lg:leading-[1.1]">Secure Your Seat. Zero Scalpers.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#eaecef] sm:text-lg">Admin membuat event on-chain. User membeli tiket NFT Soulbound yang tidak bisa ditransfer atau dijual ulang.</p>
          <div className="mt-8 flex gap-3">{isAdmin && <Link href="/admin" className="inline-flex h-10 items-center rounded-md bg-[#1e2329] px-6 text-sm font-semibold text-[#ffffff]">Admin Panel</Link>}<Link href="/my-tickets" className="inline-flex h-10 items-center rounded-md bg-[#FCD535] px-6 text-sm font-semibold text-[#181a20]">My Tickets</Link></div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#FCD535]">Live On-Chain Events</p><h2 className="mt-2 text-3xl font-bold text-[#ffffff]">Available tickets</h2></div><p className="font-[var(--font-jetbrains-mono)] text-sm text-[#707a8a]">Total events: {eventCount?.toString() ?? "0"}</p></div>
          {visibleIds.length === 0 ? <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-8 text-[#707a8a]">Belum ada event on-chain. Login sebagai admin lalu buat event di halaman Admin.</div> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visibleIds.map((id) => <EventCard key={id.toString()} eventId={id} />)}</div>}
        </div>
      </section>
    </main>
  );
}
