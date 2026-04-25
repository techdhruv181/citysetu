import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAIL = "dhruviltechshop@gmail.com";

const providerList = document.getElementById("adminProviderList");
const bookingList = document.getElementById("bookingList");
const totalText = document.getElementById("totalProviders");

// 🔐 Protect Admin Page
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    alert("Access Denied");
    window.location.href = "index.html";
  } else {
    initializeAdmin();
  }
});

async function initializeAdmin() {
  await loadProviders();
  await loadLeads();
}

// ================= PROVIDERS =================

async function loadProviders() {
  providerList.innerHTML = "";
  allProvidersData = [];

  const snapshot = await getDocs(collection(db, "providers"));

  let approvedCount = 0;
  let pendingCount = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    allProvidersData.push({ id, ...data });

    if (data.approved) {
      approvedCount++;
    } else {
      pendingCount++;
    }

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${data.name}</h3>
      <p>Category: ${data.category}</p>
      <p>Status: ${data.approved ? "Approved ✅" : "Pending ⏳"}</p>

      <div style="margin-top:15px;">
        ${!data.approved
        ? `<button class="btn btn-primary approve-btn">Approve</button>`
        : ""
      }
        <button class="btn btn-orange delete-btn">Delete</button>
      </div>
    `;

    // Approve
    const approveBtn = card.querySelector(".approve-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "providers", id), {
          approved: true
        });
        alert("Provider Approved!");
        loadProviders();
      });
    }

    // Delete
    card.querySelector(".delete-btn").addEventListener("click", async () => {
      await deleteDoc(doc(db, "providers", id));
      alert("Provider Deleted!");
      loadProviders();
    });

    providerList.appendChild(card);
  });

  totalText.innerText = `
    Total: ${snapshot.size} | 
    Approved: ${approvedCount} | 
    Pending: ${pendingCount}
  `;
}

// ================= LEADS =================

const leadList = document.getElementById("leadList");
const leadFilter = document.getElementById("leadFilter");
let allLeads = [];
let allProvidersData = [];

async function loadLeads() {
  if (!leadList) return;

  const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    allLeads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderLeads();
  });

  if (leadFilter) {
    leadFilter.addEventListener("change", renderLeads);
  }
}

function renderLeads() {
  if (!leadList) return;
  leadList.innerHTML = "";

  const filterVal = leadFilter ? leadFilter.value : "All";
  const filtered = filterVal === "All" ? allLeads : allLeads.filter(l => l.service === filterVal);

  filtered.forEach((data) => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${data.service || 'Unknown Service'}</h3>
      <p><strong>Customer:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Description:</strong> ${data.description}</p>
      <p><strong>Assigned To:</strong> <span style="font-weight:600; color:#1E2A78;">${data.assignedToName || 'None (Broadcast)'}</span></p>
      <p><strong>Status:</strong> <span style="font-weight:bold; color: ${data.status === 'new' ? '#10B981' : data.status === 'contacted' ? '#F97316' : '#6B7280'}">${data.status.toUpperCase()}</span></p>

      <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <select class="assign-select" style="padding:6px; border-radius:6px; border:1px solid #ddd; outline:none; max-width:200px;">
           <option value="">-- Unassigned (Broadcast) --</option>
           ${allProvidersData.filter(p => p.category === data.service && p.approved).map(p => 
             `<option value="${p.id}" ${data.assignedTo === p.id ? 'selected' : ''}>${p.name}</option>`
           ).join('')}
        </select>
        <button class="btn btn-primary assign-btn">Assign</button>
      </div>
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        ${data.status === "new" ? `<button class="btn btn-primary contact-btn">Mark Contacted</button>` : ""}
        ${data.status === "contacted" ? `<button class="btn btn-primary close-btn">Mark Closed</button>` : ""}
        <button class="btn btn-orange delete-lead-btn" style="background:#EF4444;">Delete</button>
      </div>
    `;

    const contactBtn = card.querySelector(".contact-btn");
    if (contactBtn) {
      contactBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "leads", data.id), { status: "contacted" });
      });
    }

    const closeBtn = card.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "leads", data.id), { status: "closed" });
      });
    }

    const deleteBtn = card.querySelector(".delete-lead-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this lead?")) {
          await deleteDoc(doc(db, "leads", data.id));
        }
      });
    }

    const assignBtn = card.querySelector(".assign-btn");
    const assignSelect = card.querySelector(".assign-select");
    if (assignBtn && assignSelect) {
      assignBtn.addEventListener("click", async () => {
         const providerId = assignSelect.value;
         if (providerId) {
             const providerName = assignSelect.options[assignSelect.selectedIndex].text;
             await updateDoc(doc(db, "leads", data.id), { assignedTo: providerId, assignedToName: providerName });
             if(window.showToast) window.showToast("Lead assigned!", "success");
             else alert("Lead assigned!");
         } else {
             // Revert to broadcast
             await updateDoc(doc(db, "leads", data.id), { assignedTo: null, assignedToName: null });
             if(window.showToast) window.showToast("Assignment removed. Broadcasted globally.", "success");
             else alert("Assignment removed. Broadcasted globally.");
         }
      });
    }

    leadList.appendChild(card);
  });
}