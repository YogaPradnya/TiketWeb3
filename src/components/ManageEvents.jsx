"use client";

import { NFTIX_EVENT_ABI, NFTIX_EVENT_ADDRESS } from "@/lib/contract";
import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useReadContract, useWriteContract } from "wagmi";

function toDatetimeLocal(unixTs) {
  if (!unixTs) return "";
  const d = new Date(Number(unixTs) * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EventRow({ eventId, onAction }) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const { data: raw, refetch } = useReadContract({
    address: NFTIX_EVENT_ADDRESS,
    abi: NFTIX_EVENT_ABI,
    functionName: "getEvent",
    args: [eventId],
    query: { retry: 1 },
  });

  const { writeContractAsync, isPending } = useWriteContract();

  if (!raw) return null;

  const ev = Array.isArray(raw)
    ? { name: raw[0], venue: raw[1], eventDate: raw[2], ticketPrice: raw[3], maxTickets: raw[4], soldTickets: raw[5], saleActive: raw[6] }
    : raw;

  if (!ev.name) return null;

  const dateLabel = new Date(Number(ev.eventDate) * 1000).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

  function openEdit() {
    setEditForm({
      name: ev.name,
      venue: ev.venue,
      date: toDatetimeLocal(ev.eventDate),
      price: formatEther(ev.ticketPrice),
      maxTickets: ev.maxTickets.toString(),
    });
    setEditing(true);
  }

  async function saveEdit() {
    await writeContractAsync({
      address: NFTIX_EVENT_ADDRESS,
      abi: NFTIX_EVENT_ABI,
      functionName: "updateEvent",
      args: [
        eventId,
        editForm.name,
        editForm.venue,
        BigInt(Math.floor(new Date(editForm.date).getTime() / 1000)),
        parseEther(editForm.price),
        BigInt(editForm.maxTickets),
      ],
    });
    await refetch();
    setEditing(false);
    onAction?.();
  }

  async function toggleSale() {
    await writeContractAsync({
      address: NFTIX_EVENT_ADDRESS,
      abi: NFTIX_EVENT_ABI,
      functionName: "setSaleActive",
      args: [eventId, !ev.saleActive],
    });
    await refetch();
    onAction?.();
  }

  const inputCls = "h-10 w-full rounded-lg border border-[#2b3139] bg-[#181a20] px-3 text-sm text-white placeholder-[#4a5568] outline-none focus:border-[#FCD535] focus:ring-1 focus:ring-[#FCD535]/30";
  const monoCls = inputCls + " font-[var(--font-jetbrains-mono)]";

  return (
    <div className="rounded-xl border border-[#2b3139] bg-[#1e2329] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 rounded-md bg-[#FCD535]/10 px-2.5 py-1 font-[var(--font-jetbrains-mono)] text-xs font-bold text-[#FCD535]">
            #{eventId.toString()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{ev.name}</p>
            <p className="truncate text-xs text-[#707a8a]">{ev.venue} · {dateLabel}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${ev.saleActive ? "bg-[#0ecb81]/10 text-[#0ecb81]" : "bg-[#f6465d]/10 text-[#f6465d]"}`}>
            {ev.saleActive ? "OPEN" : "CLOSED"}
          </span>
          <span className="text-xs text-[#707a8a] font-[var(--font-jetbrains-mono)]">
            {ev.soldTickets.toString()}/{ev.maxTickets.toString()}
          </span>
          <span className="text-xs font-[var(--font-jetbrains-mono)] text-[#eaecef]">
            {formatEther(ev.ticketPrice)} ETH
          </span>
          <button
            onClick={openEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2b3139] bg-[#181a20] text-[#707a8a] transition-colors hover:border-[#FCD535]/40 hover:text-[#FCD535]"
            title="Edit event"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </button>
          <button
            onClick={toggleSale}
            disabled={isPending}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-40 ${ev.saleActive ? "border-[#f6465d]/40 bg-[#f6465d]/10 text-[#f6465d] hover:bg-[#f6465d]/20" : "border-[#0ecb81]/40 bg-[#0ecb81]/10 text-[#0ecb81] hover:bg-[#0ecb81]/20"}`}
            title={ev.saleActive ? "Tutup penjualan" : "Buka penjualan"}
          >
            {ev.saleActive ? "Tutup Sale" : "Buka Sale"}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="border-t border-[#2b3139] bg-[#181a20] px-5 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FCD535]">Edit Event #{eventId.toString()}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#707a8a]">Event Name</label>
              <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#707a8a]">Venue</label>
              <input className={inputCls} value={editForm.venue} onChange={(e) => setEditForm({ ...editForm, venue: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-[#707a8a]">Date & Time</label>
              <input className={inputCls} type="datetime-local" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#707a8a]">Price (ETH)</label>
                <input className={monoCls} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#707a8a]">Max Supply</label>
                <input className={monoCls} value={editForm.maxTickets} onChange={(e) => setEditForm({ ...editForm, maxTickets: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={saveEdit}
              disabled={isPending || !editForm.name || !editForm.venue || !editForm.date}
              className="h-9 rounded-lg bg-[#FCD535] px-5 text-xs font-bold text-[#181a20] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="h-9 rounded-lg border border-[#2b3139] px-5 text-xs font-semibold text-[#707a8a] transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageEvents({ eventCount, onAction }) {
  const count = Number(eventCount ?? 0);
  const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));

  return (
    <div className="mt-8 rounded-2xl border border-[#2b3139] bg-[#1e2329] p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2b3139]">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#eaecef" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Manage Events</h2>
          <p className="text-xs text-[#707a8a]">Edit data atau toggle status penjualan event on-chain.</p>
        </div>
      </div>

      {count === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2b3139] p-8 text-center text-sm text-[#4a5568]">
          Belum ada event. Buat event baru di atas.
        </div>
      ) : (
        <div className="space-y-3">
          {ids.map((id) => (
            <EventRow key={id.toString()} eventId={id} onAction={onAction} />
          ))}
        </div>
      )}
    </div>
  );
}
