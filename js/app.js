import { auth, db } from "./firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const providerList = document.getElementById("providerList");

let selectedProvider = null;


// LOAD PROVIDERS
let allProvidersData = [];

async function loadProviders() {

  const q = query(
    collection(db, "providers"),
    where("approved", "==", true)
  );

  const snapshot = await getDocs(q);
  allProvidersData = snapshot.docs.map(doc => doc.data());
  
  renderProviders();
}

function renderProviders() {
  if (!providerList) return;
  providerList.innerHTML = "";
  
  const searchTxt = (document.getElementById("searchInput")?.value || "").toLowerCase();
  const catVal = document.getElementById("filterCategory")?.value || "All";

  const filtered = allProvidersData.filter(p => {
    const matchName = (p.name || "").toLowerCase().includes(searchTxt);
    const matchCat = catVal === "All" || p.category === catVal;
    return matchName && matchCat;
  });

  if (filtered.length === 0) {
    providerList.innerHTML = "<p style='text-align:center; grid-column:1/-1; color:var(--text-muted); padding:40px;'>No providers found matching your criteria.</p>";
    return;
  }

  filtered.forEach((data) => {

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
  <h3 style="margin-bottom: 0;">${data.name}</h3>
  <span class="chip chip-new" style="background: #e0f2fe; color: #0284c7; font-size: 11px;">Verified</span>
</div>
<p style="margin-bottom: 8px;"><strong>Category:</strong> ${data.category}</p>
<p style="margin-bottom: 15px; color: var(--primary-blue); font-weight: 600; font-size: 16px;">Starting From ₹${data.priceStart}</p>

<div style="margin-top:auto; display: flex; gap: 10px;">
  <button class="btn btn-primary book-btn" style="flex: 1; padding: 10px;">Book</button>
  <button class="btn btn-orange whatsapp-btn" style="flex: 1; padding: 10px; background: #25D366; box-shadow: 0 4px 14px 0 rgba(37, 211, 102, 0.25);">WhatsApp</button>
</div>
`;

    // BOOK BUTTON
    card.querySelector(".book-btn").addEventListener("click", () => {

      if (!auth.currentUser) {
        alert("Please login first to book service");
        window.location.href = "login.html";
        return;
      }

      selectedProvider = {
        uid: data.uid,
        name: data.name,
        phone: data.phone
      };

      document.getElementById("bookingModal").style.display = "block";

    });


    // WHATSAPP BUTTON
    card.querySelector(".whatsapp-btn").addEventListener("click", async () => {

      if (!auth.currentUser) {
        alert("Please login first to contact provider");
        window.location.href = "login.html";
        return;
      }

      const city = localStorage.getItem("city") || "";

      try {
        await addDoc(collection(db, "whatsappClicks"), {
          providerUid: data.uid,
          providerName: data.name,
          customerUid: auth.currentUser.uid,
          customerEmail: auth.currentUser.email,
          city: city,
          createdAt: new Date()
        });
      } catch (error) {
        console.log("Could not track click (rules restriction):", error.message);
      }

      window.open(`https://wa.me/${data.phone}`, "_blank");

    });

    providerList.appendChild(card);

  });

}

document.getElementById("searchInput")?.addEventListener("input", renderProviders);
document.getElementById("filterCategory")?.addEventListener("change", renderProviders);


// CONFIRM BOOKING
document.addEventListener("click", async (e) => {

  if (e.target && e.target.id === "confirmBooking") {

    const customerName = document.getElementById("customerName").value;
    const customerPhone = document.getElementById("customerPhone").value;
    const serviceDetails = document.getElementById("serviceDetails").value;

    if (!selectedProvider) {
      alert("Provider not selected");
      return;
    }

    const city = localStorage.getItem("city") || "Unknown";

    await addDoc(collection(db, "bookings"), {

      providerUid: selectedProvider.uid,
      providerName: selectedProvider.name,

      customerUid: auth.currentUser.uid,

      city: city,

      customerName,
      customerPhone,
      serviceDetails,

      status: "assigned",
      providerDecision: "pending",

      createdAt: new Date()

    });

    alert("Booking Submitted!");

    document.getElementById("bookingModal").style.display = "none";

  }

});


loadProviders();