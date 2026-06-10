"use client";

import { NFTIX_EVENT_ABI, NFTIX_EVENT_ADDRESS } from "@/lib/contract";
import { notFound } from "next/navigation";
import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import ManageEvents from "@/components/ManageEvents";

function FieldGroup({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-widest text-[#707a8a]">{label}</label>
      {hint && <p className="text-xs text-[#4a5568] leading-4">{hint}</p>}
      {children}
    </div>
  );
}

export default function AdminPage() {
  const { address, isConnected, status } = useAccount();
  const [form, setForm] = useState({ name: "", venue: "", date: "", price: "0.01", maxTickets: "100" });
  const [ticketId, setTicketId] = useState("");
  const [lockTicketId, setLockTicketId] = useState("");

  const { data: adminRole, isLoading: isAdminRoleLoading } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "DEFAULT_ADMIN_ROLE",
    query: { retry: 1 },
  });
  const { data: isAdmin, isLoading: isHasRoleLoading } = useReadContract({
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
  const { data: contractBalance, refetch: refetchContractBalance } = useBalance({
    address: NFTIX_EVENT_ADDRESS,
    query: { retry: 1 },
  });
  const { writeContractAsync, isPending, error } = useWriteContract();

  const isWagmiLoading = status === "reconnecting" || status === "connecting";
  const isCheckingAdmin = isConnected && (isAdminRoleLoading || isHasRoleLoading || (adminRole && isAdmin === undefined));

  if (isWagmiLoading || isCheckingAdmin) {
    return (
      <main className="text-[#eaecef]">
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center gap-3 rounded-xl border border-[#FCD535]/40 bg-[#FCD535]/5 p-5 text-sm text-[#FCD535]">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Verifying admin role on Sepolia...
          </div>
        </section>
      </main>
    );
  }

  if (!isConnected || !isAdmin) return notFound();

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
    await refetchContractBalance();
  }

  const inputClass = "h-11 w-full rounded-lg border border-[#2b3139] bg-[#181a20] px-4 text-sm text-white placeholder-[#4a5568] outline-none transition-colors duration-150 focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30";
  const monoInputClass = inputClass + " font-[var(--font-jetbrains-mono)]";

  return (
    <main className="text-[#eaecef]">
      <section className="mx-auto max-w-7xl px-4 py-12">

        {/* Page Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FCD535]/10 ring-1 ring-[#FCD535]/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FCD535" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FCD535]">Admin Panel</p>
            <h1 className="text-2xl font-bold text-white">NFTix Control Center</h1>
          </div>
        </div>

        <> 
            <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
              {/* Create Event Card */}
              <div className="rounded-2xl border border-[#2b3139] bg-[#1e2329] p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                  <h2 className="text-xl font-bold text-white">Create Event</h2>
                  <p className="mt-1 text-xs text-[#707a8a]">Deploy a new on-chain event. All fields are required.</p>
                </div>
                <span className="rounded-full border border-[#FCD535]/30 bg-[#FCD535]/10 px-3 py-1 text-xs font-semibold text-[#FCD535]">On-chain</span>
              </div>

              <div className="space-y-5">
                <FieldGroup label="Event Name" hint="Nama acara yang akan tampil di halaman tiket.">
                  <input className={inputClass} placeholder="cth. Konser Akhir Tahun 2025" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </FieldGroup>

                <FieldGroup label="Venue" hint="Lokasi fisik atau virtual tempat event berlangsung.">
                  <input className={inputClass} placeholder="cth. Stadion Gelora Bung Karno, Jakarta" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                </FieldGroup>

                <FieldGroup label="Date & Time" hint="Tanggal dan waktu pelaksanaan event (zona waktu lokal).">
                  <input className={inputClass} type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </FieldGroup>

                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Ticket Price (ETH)" hint="Harga mint tiket dalam ETH.">
                    <input className={monoInputClass} placeholder="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Max Supply" hint="Jumlah maksimum tiket yang bisa di-mint.">
                    <input className={monoInputClass} placeholder="100" value={form.maxTickets} onChange={(e) => setForm({ ...form, maxTickets: e.target.value })} />
                  </FieldGroup>
                </div>

                <button
                  className="mt-2 h-11 w-full rounded-lg bg-[#FCD535] text-sm font-bold text-[#181a20] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#3a3a1f] disabled:text-[#707a8a]"
                  disabled={isPending || !form.name || !form.venue || !form.date}
                  onClick={createEvent}
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Waiting for MetaMask...
                    </span>
                  ) : "Create Event"}
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[#2b3139] bg-[#1e2329] p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#707a8a]">Total Events</p>
                  <p className="mt-2 font-[var(--font-jetbrains-mono)] text-4xl font-bold text-white">{eventCount?.toString() ?? "0"}</p>
                  <p className="mt-1 text-xs text-[#4a5568]">On-chain events</p>
                </div>
                <div className="rounded-2xl border border-[#0ecb81]/30 bg-[#0ecb81]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#0ecb81]">Contract Balance</p>
                  <p className="mt-2 font-[var(--font-jetbrains-mono)] text-4xl font-bold text-white">
                    {contractBalance ? parseFloat(contractBalance.formatted).toFixed(4) : "0.0000"}
                  </p>
                  <p className="mt-1 text-xs text-[#4a5568]">{contractBalance?.symbol ?? "ETH"} siap di-withdraw</p>
                </div>
              </div>

              {/* Use Ticket */}
              <div className="rounded-2xl border border-[#2b3139] bg-[#1e2329] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FCD535]/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#FCD535" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Use Ticket / Check-in</h2>
                    <p className="text-xs text-[#707a8a]">Validasi tiket saat entry event.</p>
                  </div>
                </div>
                <FieldGroup label="Token ID" hint="ID unik NFT tiket yang dimiliki attendee.">
                  <input className={monoInputClass} placeholder="cth. 1" value={ticketId} onChange={(e) => setTicketId(e.target.value)} />
                </FieldGroup>
                <button
                  className="mt-4 h-11 w-full rounded-lg bg-[#FCD535] text-sm font-bold text-[#181a20] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isPending || !ticketId}
                  onClick={useTicket}
                >
                  {isPending ? "Processing..." : "Mark as Used"}
                </button>
              </div>

              {/* Lock / Unlock */}
              <div className="rounded-2xl border border-[#2b3139] bg-[#1e2329] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2b3139]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#eaecef" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Lock / Unlock Ticket</h2>
                    <p className="text-xs text-[#707a8a]">Kontrol transferability tiket Soulbound.</p>
                  </div>
                </div>
                <div className="mb-4 rounded-lg bg-[#181a20] p-3 text-xs leading-5 text-[#707a8a]">
                  <span className="font-semibold text-[#0ecb81]">Unlock</span> mengizinkan owner transfer tiket satu kali. Setelah transfer selesai, tiket akan auto-lock kembali.
                  <br />
                  <span className="font-semibold text-[#f6465d]">Lock</span> mencegah tiket berpindah tangan.
                </div>
                <FieldGroup label="Token ID" hint="ID unik NFT tiket yang akan dikontrol.">
                  <input className={monoInputClass} placeholder="cth. 1" value={lockTicketId} onChange={(e) => setLockTicketId(e.target.value)} />
                </FieldGroup>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    className="h-11 rounded-lg border border-[#f6465d]/50 bg-[#f6465d]/10 text-sm font-bold text-[#f6465d] transition-colors hover:bg-[#f6465d]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isPending || !lockTicketId}
                    onClick={() => setTicketLocked(true)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75" />
                        <rect x="3.75" y="10.5" width="16.5" height="10.5" rx="2.25" strokeWidth={2} />
                      </svg>
                      Lock
                    </span>
                  </button>
                  <button
                    className="h-11 rounded-lg border border-[#0ecb81]/50 bg-[#0ecb81]/10 text-sm font-bold text-[#0ecb81] transition-colors hover:bg-[#0ecb81]/20 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isPending || !lockTicketId}
                    onClick={() => setTicketLocked(false)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 0 1 9 0v3.75" />
                        <rect x="0.75" y="10.5" width="16.5" height="10.5" rx="2.25" strokeWidth={2} />
                      </svg>
                      Unlock
                    </span>
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <button
                className="h-11 w-full rounded-lg border border-[#2b3139] bg-[#1e2329] text-sm font-semibold text-[#eaecef] transition-colors hover:border-[#FCD535]/40 hover:text-[#FCD535] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isPending}
                onClick={withdraw}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                  </svg>
                  Withdraw Contract Funds
                </span>
              </button>

            </div>

            {error ? (
              <div className="lg:col-span-2 flex items-start gap-3 rounded-xl border border-[#f6465d]/40 bg-[#f6465d]/5 p-4 text-sm text-[#f6465d]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mt-0.5 h-4 w-4 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {error.shortMessage || error.message}
              </div>
            ) : null}
            </div>
          <ManageEvents eventCount={eventCount} onAction={refetchEventCount} />
          </>
      </section>
    </main>
  );
}
