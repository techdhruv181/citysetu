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
async function loadProviders() {

  const q = query(
    collection(db, "providers"),
    where("approved", "==", true)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {

    const data = docSnap.data();

    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
<h3>${data.name}</h3>
<p>Category: ${data.category}</p>
<p>Starting From ₹${data.priceStart}</p>

<div style="margin-top:15px;">
<button class="btn btn-primary book-btn">Book Now</button>
<button class="btn btn-orange whatsapp-btn">WhatsApp</button>
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

      await addDoc(collection(db, "whatsappClicks"), {

        providerUid: data.uid,
        providerName: data.name,

        customerUid: auth.currentUser.uid,
        customerEmail: auth.currentUser.email,

        city: city,

        createdAt: new Date()

      });

      window.location.href = `https://wa.me/${data.phone}`;

    });

    providerList.appendChild(card);

  });

}


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