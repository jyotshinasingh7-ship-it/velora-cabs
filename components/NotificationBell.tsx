"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, Timestamp, where } from "firebase/firestore";
import { Bell, CheckCheck, LoaderCircle, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import type { AppNotification } from "@/types/notifications";

function dateLabel(value: unknown) {
  const date = value instanceof Timestamp ? value.toDate() : null;
  return date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date) : "Just now";
}

async function authorizedPost(user: User, url: string) {
  const response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  if (!response.ok) throw new Error("Unable to update notifications.");
}

export default function NotificationBell({ className = "" }: { className?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    if (!user) { setItems([]); setUnread(0); setLoading(false); return; }
    setLoading(true);
    const unsubscribeItems = onSnapshot(query(collection(db, "notifications"), where("recipientUid", "==", user.uid), orderBy("createdAt", "desc"), limit(30)), snapshot => {
      const now = Date.now();
      setItems(snapshot.docs.map(document => ({ notificationId: document.id, ...document.data() } as AppNotification)).filter(item => !(item.expiresAt instanceof Timestamp) || item.expiresAt.toMillis() > now));
      setError(""); setLoading(false);
    }, () => { setError("Unable to load notifications."); setLoading(false); });
    const unsubscribeUnread = onSnapshot(query(collection(db, "notifications"), where("recipientUid", "==", user.uid), where("isRead", "==", false), limit(100)), snapshot => { const now = Date.now(); setUnread(snapshot.docs.filter(document => !(document.data().expiresAt instanceof Timestamp) || document.data().expiresAt.toMillis() > now).length); }, () => setError("Unable to load unread notifications."));
    return () => { unsubscribeItems(); unsubscribeUnread(); };
  }, [user]);
  useEffect(() => {
    function close(event: MouseEvent) { if (!panelRef.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, []);

  async function markRead(id: string) { if (!user) return; try { await authorizedPost(user, `/api/notifications/${id}/read`); } catch { setError("Unable to mark notification as read."); } }
  async function markAll() { if (!user || unread === 0) return; try { await authorizedPost(user, "/api/notifications/read-all"); } catch { setError("Unable to mark all notifications as read."); } }

  return <div ref={panelRef} className={`relative ${className}`}>
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen(value => !value)} className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-amber-400/30 hover:text-amber-400">
      <Bell size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <section role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-20 z-[90] max-h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1018] shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[390px]">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><h2 className="font-bold text-white">Notifications</h2><p className="text-xs text-white/40">Latest 30</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => void markAll()} disabled={!unread} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-amber-400 disabled:opacity-40"><CheckCheck size={15} /> Mark all read</button><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="rounded-lg p-2 text-white/45 hover:bg-white/5"><X size={17} /></button></div></header>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto sm:max-h-[520px]">
        {loading ? <div className="flex justify-center py-16"><LoaderCircle className="animate-spin text-amber-400" /></div> : error && items.length === 0 ? <p role="alert" className="p-6 text-center text-sm text-red-300">{error}</p> : items.length === 0 ? <div className="p-10 text-center"><Bell className="mx-auto text-white/20" /><p className="mt-3 text-sm text-white/45">No notifications yet.</p></div> : items.map(item => <article key={item.notificationId} className={`border-b border-white/[0.07] p-4 ${item.isRead ? "bg-transparent" : "bg-amber-400/[0.05]"}`}>
          <div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? "bg-white/15" : "bg-amber-400"}`} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-bold text-white">{item.title}</h3><time className="shrink-0 text-[10px] text-white/35">{dateLabel(item.createdAt)}</time></div><p className="mt-1 text-sm leading-5 text-white/55">{item.message}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">{item.type.replaceAll("_", " ")}</p><div className="mt-3 flex items-center gap-3">{item.actionUrl && <Link href={item.actionUrl} onClick={() => { void markRead(item.notificationId); setOpen(false); }} className="text-xs font-bold text-amber-400 hover:underline">View</Link>}{!item.isRead && <button type="button" onClick={() => void markRead(item.notificationId)} className="text-xs font-semibold text-white/45 hover:text-white">Mark read</button>}</div></div></div>
        </article>)}
        {error && items.length > 0 && <p role="alert" className="p-3 text-center text-xs text-red-300">{error}</p>}
      </div>
    </section>}
  </div>;
}
