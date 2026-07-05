"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function AdminDashboard() {
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFare, setNewFare] = useState("");
  
  // New Driver States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    setAllBookings(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  // 1. Driver Create Logic
  const handleAddDriver = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), {
        name, email, role: "driver", createdAt: new Date()
      });
      alert("Driver Created Successfully!");
      setEmail(""); setPassword(""); setName("");
    } catch (err: any) { alert(err.message); }
  };

  // 2. Fare Edit Logic
  const updateFare = async (id: string) => {
    await updateDoc(doc(db, "bookings", id), { fare: newFare });
    setEditingId(null);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-blue-500">Admin Control Panel</h1>

      {/* Driver Registration Section */}
      <div className="p-6 bg-white/5 border border-blue-500/30 rounded-2xl mb-10">
        <h2 className="text-xl font-bold mb-4">Add New Driver</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Name" className="p-3 bg-black border rounded" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" className="p-3 bg-black border rounded" onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" className="p-3 bg-black border rounded" onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button onClick={handleAddDriver} className="mt-4 w-full py-3 bg-blue-600 rounded-lg font-bold">Create Driver</button>
      </div>

      {/* Bookings Overview */}
      <div className="space-y-4">
        {allBookings.map((b: any) => (
          <div key={b.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
            <div>
              <p className="font-bold">{b.pickup} → {b.dropoff}</p>
              <p className="text-xs text-gray-400">Status: {b.status}</p>
            </div>
            {editingId === b.id ? (
              <div className="flex gap-2">
                <input type="number" onChange={(e) => setNewFare(e.target.value)} className="w-20 p-2 bg-black border rounded" />
                <button onClick={() => updateFare(b.id)} className="px-4 bg-green-600 rounded">Save</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-lg">₹{b.fare || "0"}</span>
                <button onClick={() => setEditingId(b.id)} className="text-blue-400">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}