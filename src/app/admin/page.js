"use client";

import { NFTIX_EVENT_ABI, NFTIX_EVENT_ADDRESS } from "@/lib/contract";
import Link from "next/link";
import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

function AdminStatusCard({ address, adminRole, isAdmin, isCheckingAdmin, roleError }) {
  return (
    <div className="mb-6 rounded-xl border border-[#2b3139] bg-[#1e2329] p-5 text-xs leading-6 text-[#707a8a]">
      <p><span className="text-[#eaecef]">Connected wallet:</span> {address ?? "-"}</p>
      <p><span className="text-[#eaecef]">Contract:</span> {NFTIX_EVENT_ADDRESS}</p>
      <p><span className="text-[#eaecef]">Admin role loaded:</span> {adminRole ? "YES" : "NO"}</p>
      <p><span className="text-[#eaecef]">Role status:</span> {isCheckingAdmin ? "CHECKING" : String(Boolean(isAdmin)).toUpperCase()}</p>
      {roleError ? <p className="text-[#f6465d]">Role check error: {roleError.shortMessage || roleError.message}</p> : null}
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ name: "", venue: "", date: "", price: "0.01", maxTickets: "100" });
  const [ticketId, setTicketId] = useState("");
  const [lockTicketId, setLockTicketId] = useState("");

  const { data: adminRole, isLoading: isAdminRoleLoading, error: adminRoleError } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "DEFAULT_ADMIN_ROLE",
    query: { retry: 1 },
  });
  const { data: isAdmin, isLoading: isHasRoleLoading, error: hasRoleError } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "hasRole",
    args: adminRole && address ? [adminRole, address] : undefined,
    query: { enabled: Boolean(adminRole && address), retry: 1 },
  });
  const { data: eventCount, refetch: refetchEventCount } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "eventCount",
    query: { retry: 1 },
  });
  const { writeContractAsync, isPending, error } = useWriteContract();

  const isCheckingAdmin = isConnected && (isAdminRoleLoading || isHasRoleLoading || (adminRole && isAdmin === undefined));
  const roleError = adminRoleError || hasRoleError;

  async function createEvent() {
    await writeContractAsync({
      address: NFTIX_EVENT_ADDRESS,
      abi: NFTIX_EVENT_ABI,
      functionName: "createEvent",
      args: [form.name, form.venue, BigInt(Math.floor(new Date(form.date).getTime() / 1000)), parseEther(form.price), BigInt(form.maxTickets), true],
    });
    await refetchEventCount();
  }

  async function useTicket() {
    await writeContractAsync({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "useTicket", args: [BigInt(ticketId)] });
  }

  async function setTicketLocked(locked) {
    await writeContractAsync({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "setTicketLocked", args: [BigInt(lockTicketId), locked] });
  }

  async function withdraw() {
    await writeContractAsync({ address: NFTIX_EVENT_ADDRESS, abi: NFTIX_EVENT_ABI, functionName: "withdraw" });
  }

  return (
    <main className="text-[#eaecef]">
      <section className="mx-auto max-w-7xl px-4 py-16">
        <AdminStatusCard address={address} adminRole={adminRole} isAdmin={isAdmin} isCheckingAdmin={isCheckingAdmin} roleError={roleError} />
        {!isConnected ? <div className="rounded-xl bg-[#1e2329] p-8">Connect wallet admin terlebih dahulu.</div> : isCheckingAdmin ? <div className="rounded-xl border border-[#FCD535] bg-[#1e2329] p-8 text-[#FCD535]">Checking admin role on Sepolia...</div> : roleError ? <div className="rounded-xl border border-[#f6465d] bg-[#1e2329] p-8 text-[#f6465d]">Role check failed. Pastikan contract address terbaru, MetaMask Sepolia, dan server sudah restart.</div> : !isAdmin ? <div className="rounded-xl border border-[#f6465d] bg-[#1e2329] p-8 text-[#f6465d]">Access Denied. Wallet ini bukan admin contract.</div> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6">
              <p className="text-sm font-semibold text-[#FCD535]">Admin Only</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Create Event</h1>
              <p className="mt-4 rounded-lg border border-[#FCD535] bg-[#2b3139] p-3 text-xs leading-5 text-[#FCD535]">Setelah fitur lock/unlock, deploy ulang contract terbaru dan update src/lib/contract.js.</p>
              <div className="mt-6 space-y-4">
                <input className="h-10 w-full rounded-lg bg-[#2b3139] px-4 text-white" placeholder="Event name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className="h-10 w-full rounded-lg bg-[#2b3139] px-4 text-white" placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                <input className="h-10 w-full rounded-lg bg-[#2b3139] px-4 text-white" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                <input className="h-10 w-full rounded-lg bg-[#2b3139] px-4 font-[var(--font-jetbrains-mono)] text-white" placeholder="Price ETH" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <input className="h-10 w-full rounded-lg bg-[#2b3139] px-4 font-[var(--font-jetbrains-mono)] text-white" placeholder="Max tickets" value={form.maxTickets} onChange={(e) => setForm({ ...form, maxTickets: e.target.value })} />
                <button className="h-10 w-full rounded-md bg-[#FCD535] font-semibold text-[#181a20] disabled:bg-[#3a3a1f]" disabled={isPending || !form.name || !form.venue || !form.date} onClick={createEvent}>{isPending ? "Waiting for MetaMask..." : "Create Event"}</button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6"><p className="text-sm text-[#707a8a]">Total Events</p><p className="font-[var(--font-jetbrains-mono)] text-4xl font-bold text-white">{eventCount?.toString() ?? "0"}</p></div>
              <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6"><h2 className="text-2xl font-bold text-white">Use Ticket / Check-in</h2><input className="mt-4 h-10 w-full rounded-lg bg-[#2b3139] px-4 font-[var(--font-jetbrains-mono)] text-white" placeholder="Token ID" value={ticketId} onChange={(e) => setTicketId(e.target.value)} /><button className="mt-4 h-10 w-full rounded-md bg-[#FCD535] font-semibold text-[#181a20]" disabled={isPending || !ticketId} onClick={useTicket}>Use Ticket</button></div>
              <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] p-6"><h2 className="text-2xl font-bold text-white">Lock / Unlock Ticket</h2><p className="mt-2 text-sm text-[#707a8a]">Unlock mengizinkan owner transfer satu kali. Setelah transfer, tiket auto-lock lagi.</p><input className="mt-4 h-10 w-full rounded-lg bg-[#2b3139] px-4 font-[var(--font-jetbrains-mono)] text-white" placeholder="Token ID" value={lockTicketId} onChange={(e) => setLockTicketId(e.target.value)} /><div className="mt-4 grid grid-cols-2 gap-3"><button className="h-10 rounded-md border border-[#f6465d] font-semibold text-[#f6465d] disabled:opacity-50" disabled={isPending || !lockTicketId} onClick={() => setTicketLocked(true)}>Lock</button><button className="h-10 rounded-md bg-[#0ecb81] font-semibold text-[#081b12] disabled:opacity-50" disabled={isPending || !lockTicketId} onClick={() => setTicketLocked(false)}>Unlock</button></div></div>
              <button className="h-10 w-full rounded-md bg-[#1e2329] font-semibold text-white ring-1 ring-[#2b3139]" disabled={isPending} onClick={withdraw}>Withdraw Funds</button>
            </div>
            {error ? <p className="lg:col-span-2 text-sm text-[#f6465d]">{error.shortMessage || error.message}</p> : null}
          </div>
        )}
      </section>
    </main>
  );
}
