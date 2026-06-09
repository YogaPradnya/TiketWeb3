"use client";

import ConnectButton from "@/components/ConnectButton";
import { NFTIX_EVENT_ABI, NFTIX_EVENT_ADDRESS } from "@/lib/contract";
import Link from "next/link";
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

function normalizeEventInfo(eventInfo) {
  if (!eventInfo) return null;
  if (Array.isArray(eventInfo)) {
    const [name, venue] = eventInfo;
    return { name, venue };
  }
  return eventInfo;
}

function truncateAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

async function copyToClipboard(value) {
  await navigator.clipboard?.writeText(String(value));
}

function TicketMeta({ label, value, canCopy = true }) {
  return (
    <div className="rounded-lg border border-[#2b3139] bg-[#0b0e11] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#707a8a]">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="break-all font-[var(--font-jetbrains-mono)] text-sm font-semibold text-[#ffffff]">{value}</p>
        {canCopy ? <button className="rounded-md border border-[#2b3139] px-3 py-1 text-xs font-semibold text-[#FCD535] hover:border-[#FCD535]" type="button" onClick={() => copyToClipboard(value)}>Copy</button> : null}
      </div>
    </div>
  );
}

function TicketRow({ tokenId, owner, fullOwner }) {
  const [recipient, setRecipient] = useState("");
  const { writeContractAsync, isPending, error } = useWriteContract();
  const { data: eventId } = useReadContract({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "tokenEventId", args: [tokenId] });
  const { data: used } = useReadContract({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "usedTicket", args: [tokenId] });
  const { data: locked, refetch: refetchLocked } = useReadContract({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "lockedTicket", args: [tokenId] });
  const { data: eventInfo } = useReadContract({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "getEvent", args: eventId ? [eventId] : undefined, query: { enabled: Boolean(eventId) } });

  const eventData = normalizeEventInfo(eventInfo);
  const tokenLabel = tokenId.toString();
  const eventLabel = eventId?.toString() ?? "Loading";
  const canTransfer = !used && locked === false;

  async function transferTicket() {
    await writeContractAsync({
      address: NFTIX_EVENT_ADDRESS,
      abi: NFTIX_EVENT_ABI,
      functionName: "transferFrom",
      args: [fullOwner, recipient, tokenId],
    });
    setRecipient("");
    await refetchLocked();
  }

  return (
    <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[var(--font-jetbrains-mono)] text-sm text-[#FCD535]">CLAIM ID #{tokenLabel}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{eventData?.name ?? "Loading event..."}</h2>
          <p className="mt-2 text-sm text-[#707a8a]">{eventData?.venue ?? "-"}</p>
        </div>
        <span className={`font-[var(--font-jetbrains-mono)] text-sm font-semibold ${used ? "text-[#f6465d]" : "text-[#0ecb81]"}`}>{used ? "USED" : "ACTIVE"}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <TicketMeta label="Claim / Check-in ID" value={tokenLabel} />
        <TicketMeta label="Token ID" value={tokenLabel} />
        <TicketMeta label="Event ID" value={eventLabel} />
        <TicketMeta label="Owner Wallet" value={owner} />
      </div>

      <div className="mt-5 rounded-lg border border-[#2b3139] bg-[#2b3139] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#ffffff]">Transfer Ticket</h3>
            <p className="mt-1 text-sm text-[#707a8a]">Admin harus unlock tiket dulu. Setelah transfer sukses, tiket otomatis lock lagi.</p>
          </div>
          <span className={`rounded-full border px-3 py-1 font-[var(--font-jetbrains-mono)] text-xs font-semibold ${canTransfer ? "border-[#0ecb81] text-[#0ecb81]" : "border-[#f6465d] text-[#f6465d]"}`}>{canTransfer ? "UNLOCKED" : "LOCKED"}</span>
        </div>
        <input className="mt-4 h-10 w-full rounded-lg bg-[#1e2329] px-4 font-[var(--font-jetbrains-mono)] text-sm text-[#eaecef] disabled:cursor-not-allowed disabled:text-[#707a8a]" disabled={!canTransfer || isPending} placeholder={canTransfer ? "Recipient wallet address" : "Ask admin to unlock this ticket"} value={recipient} onChange={(event) => setRecipient(event.target.value)} />
        <button className="mt-3 h-10 w-full rounded-md bg-[#FCD535] font-semibold text-[#181a20] disabled:cursor-not-allowed disabled:bg-[#3a3a1f] disabled:text-[#707a8a]" disabled={!canTransfer || !recipient || isPending} onClick={transferTicket} type="button">{isPending ? "Waiting for MetaMask..." : "Transfer Ticket"}</button>
        {error ? <p className="mt-3 text-xs text-[#f6465d]">{error.shortMessage || error.message}</p> : null}
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  const { address, isConnected } = useAccount();
  const { data: tickets } = useReadContract({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "getOwnedTickets", args: address ? [address] : undefined, query: { enabled: Boolean(address) } });

  return (
    <main className="min-h-screen bg-[#0b0e11] text-[#eaecef]">
      <nav className="h-16 border-b border-[#2b3139]"><div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4"><Link href="/" className="text-xl font-bold text-white">NFTix Tickets</Link><ConnectButton /></div></nav>
      <section className="mx-auto max-w-7xl px-4 py-16">
        <p className="text-sm font-semibold text-[#FCD535]">My Controlled Tickets</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Ticket Wallet</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#707a8a]">Gunakan Claim / Check-in ID untuk validasi. Transfer hanya aktif jika admin unlock tiket tersebut.</p>
        {!isConnected ? <div className="mt-8 rounded-xl bg-[#1e2329] p-8">Connect wallet untuk melihat tiket kamu.</div> : !tickets || tickets.length === 0 ? <div className="mt-8 rounded-xl bg-[#1e2329] p-8 text-[#707a8a]">Belum ada tiket. Beli tiket dari halaman Events.</div> : <div className="mt-8 grid gap-6 lg:grid-cols-2">{tickets.map((tokenId) => <TicketRow key={tokenId.toString()} tokenId={tokenId} owner={truncateAddress(address)} fullOwner={address} />)}</div>}
      </section>
    </main>
  );
}
