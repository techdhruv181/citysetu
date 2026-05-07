import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const ADMIN_EMAIL = "dhruviltechshop@gmail.com";

const providerList = document.getElementById("adminProviderList");
const bookingList = document.getElementById("bookingList");
const totalText = document.getElementById("totalProviders");

// Plan Modal Elements
const editPlanModal = document.getElementById("editPlanModal");
const editPlanName = document.getElementById("editPlanName");
const editPlanCredits = document.getElementById("editPlanCredits");
const editPlanProviderId = document.getElementById("editPlanProviderId");
const savePlanBtn = document.getElementById("savePlanBtn");

if (savePlanBtn) {
  savePlanBtn.addEventListener("click", async () => {
    const pId = editPlanProviderId.value;
    const pName = editPlanName.value;
    const pCredits = parseInt(editPlanCredits.value) || 0;
    
    if(!pId) return;
    
    try {
      await updateDoc(doc(db, "providers", pId), {
        plan: pName,
        credits: pCredits
      });
      window.showToast("Plan updated successfully!", "success");
      editPlanModal.style.display = "none";
      loadProviders();
    } catch(err) {
      alert("Error updating plan: " + err.message);
    }
  });
}

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
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <h3 style="margin-bottom: 0;">${data.name}</h3>
        <span class="chip" style="background: ${data.approved ? 'var(--success-bg)' : 'var(--warning-bg)'}; color: ${data.approved ? 'var(--success)' : 'var(--warning)'};">${data.approved ? "Approved ✅" : "Pending ⏳"}</span>
      </div>
      <p style="margin-bottom: 5px;"><strong>Category:</strong> ${data.category}</p>
      <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${data.phone}</p>
      <p style="margin-bottom: 15px;"><strong>Plan:</strong> ${data.plan || 'Free'} | <strong>Credits:</strong> ${data.credits || 0}</p>

      <div style="margin-top:auto; display: flex; gap: 10px; flex-wrap: wrap;">
        ${!data.approved ? `<button class="btn btn-primary approve-btn" style="flex:1;">Approve</button>` : ""}
        <button class="btn btn-outline edit-plan-btn" style="flex:1; border-color:var(--primary-blue); color:var(--primary-blue);">Edit Plan</button>
        <button class="btn btn-orange delete-btn" style="flex:1; background: var(--danger);">Delete</button>
      </div>
    `;

    // Approve
    const approveBtn = card.querySelector(".approve-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "providers", id), {
          approved: true
        });
        window.showToast("Provider Approved!", "success");
        loadProviders();
      });
    }
    
    // Edit Plan
    const editPlanBtn = card.querySelector(".edit-plan-btn");
    if(editPlanBtn) {
      editPlanBtn.addEventListener("click", () => {
        editPlanProviderId.value = id;
        editPlanName.value = data.plan || "Free";
        editPlanCredits.value = data.credits || 0;
        editPlanModal.style.display = "flex";
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
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <h3 style="margin-bottom: 0;">${data.service || 'Unknown Service'}</h3>
        <span class="chip chip-${data.status}">${data.status.toUpperCase()}</span>
      </div>
      <p><strong>Customer:</strong> ${data.name}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Location:</strong> ${data.location}</p>
      <p style="background: var(--bg-main); padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 14px;"><strong>Req:</strong> ${data.description}</p>
      <p><strong>Assigned To:</strong> <span style="font-weight:600; color:var(--primary-blue);">${data.assignedToName || 'None (Broadcast)'}</span></p>

      <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; background: var(--bg-main); padding: 10px; border-radius: 6px; border: 1px solid var(--border-light);">
        <select class="assign-select" style="flex: 1; padding:8px; border-radius:6px; border:1px solid var(--border-light); outline:none;">
           <option value="">-- Unassigned (Broadcast) --</option>
           ${allProvidersData.filter(p => p.category === data.service && p.approved).map(p => 
             `<option value="${p.id}" ${data.assignedTo === p.id ? 'selected' : ''}>${p.name}</option>`
           ).join('')}
        </select>
        <button class="btn btn-primary assign-btn">Assign</button>
      </div>
      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
        ${data.status === "new" ? `<button class="btn btn-outline contact-btn" style="flex:1; padding: 8px;">Contacted</button>` : ""}
        ${data.status === "contacted" ? `<button class="btn btn-outline close-btn" style="flex:1; padding: 8px;">Closed</button>` : ""}
        <button class="btn btn-orange delete-lead-btn" style="flex:1; padding: 8px; background:var(--danger); box-shadow:none;">Delete</button>
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


// ================= PLANS MANAGEMENT =================
const adminPlanList = document.getElementById("adminPlanList");
const managePlanModal = document.getElementById("managePlanModal");
const openAddPlanBtn = document.getElementById("openAddPlanBtn");
const saveGlobalPlanBtn = document.getElementById("saveGlobalPlanBtn");
const managePlanId = document.getElementById("managePlanId");
const managePlanName = document.getElementById("managePlanName");
const managePlanCredits = document.getElementById("managePlanCredits");
const managePlanDuration = document.getElementById("managePlanDuration");
const managePlanPrice = document.getElementById("managePlanPrice");

if(openAddPlanBtn) {
  openAddPlanBtn.addEventListener("click", () => {
    document.getElementById("managePlanTitle").innerText = "Add Subscription Plan";
    managePlanId.value = "";
    managePlanName.value = "";
    managePlanCredits.value = "";
    managePlanDuration.value = "";
    managePlanPrice.value = "";
    managePlanModal.style.display = "flex";
  });
}

if(saveGlobalPlanBtn) {
  saveGlobalPlanBtn.addEventListener("click", async () => {
    const id = managePlanId.value;
    const pData = {
      name: managePlanName.value,
      credits: parseInt(managePlanCredits.value) || 0,
      durationDays: parseInt(managePlanDuration.value) || 0,
      price: managePlanPrice.value,
      createdAt: serverTimestamp()
    };
    
    if(id) {
      await updateDoc(doc(db, "plans", id), pData);
      window.showToast("Plan updated!", "success");
    } else {
      await addDoc(collection(db, "plans"), pData);
      window.showToast("Plan created!", "success");
    }
    managePlanModal.style.display = "none";
  });
}

async function loadPlans() {
  if(!adminPlanList) return;
  const q = query(collection(db, "plans"), orderBy("credits", "asc"));
  onSnapshot(q, (snapshot) => {
    adminPlanList.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <h3 style="color:var(--primary-blue);">${data.name}</h3>
        <p><strong>Lead Credits:</strong> ${data.credits}</p>
        <p><strong>Duration:</strong> ${data.durationDays} Days</p>
        <p style="font-size: 18px; font-weight:600; color:var(--accent-orange); margin-top:10px;">${data.price}</p>
        <div style="display:flex; gap:10px; margin-top:15px;">
          <button class="btn btn-outline edit-global-plan" style="flex:1;">Edit</button>
          <button class="btn btn-orange delete-global-plan" style="flex:1; background:var(--danger);">Delete</button>
        </div>
      `;
      
      card.querySelector(".edit-global-plan").addEventListener("click", () => {
        document.getElementById("managePlanTitle").innerText = "Edit Subscription Plan";
        managePlanId.value = id;
        managePlanName.value = data.name;
        managePlanCredits.value = data.credits;
        managePlanDuration.value = data.durationDays;
        managePlanPrice.value = data.price;
        managePlanModal.style.display = "flex";
      });
      
      card.querySelector(".delete-global-plan").addEventListener("click", async () => {
        if(confirm("Delete this plan globally?")) {
           await deleteDoc(doc(db, "plans", id));
        }
      });
      
      adminPlanList.appendChild(card);
    });
  });
}

loadPlans();