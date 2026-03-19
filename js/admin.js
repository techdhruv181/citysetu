import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
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
  await loadBookings();
}

// ================= PROVIDERS =================

async function loadProviders() {
  providerList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "providers"));

  let approvedCount = 0;
  let pendingCount = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

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
        ${
          !data.approved
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

// ================= BOOKINGS =================

async function loadBookings() {
  if (!bookingList) return;

  bookingList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "bookings"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${data.providerName}</h3>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      <p><strong>Status:</strong> ${
        data.status === "completed"
          ? "Completed ✅"
          : "Pending ⏳"
      }</p>

      ${
        data.status !== "completed"
          ? `<button class="btn btn-primary complete-btn">Mark Completed</button>`
          : ""
      }
    `;

    const completeBtn = card.querySelector(".complete-btn");
    if (completeBtn) {
      completeBtn.addEventListener("click", async () => {
        await updateDoc(doc(db, "bookings", id), {
          status: "completed"
        });
        alert("Booking Marked Completed!");
        loadBookings();
      });
    }

    bookingList.appendChild(card);
  });
}