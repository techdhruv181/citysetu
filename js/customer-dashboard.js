import { db, auth } from './firebase.js';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const leadsList = document.getElementById("customerLeadsList");

// RATING MODAL ELEMENTS
const ratingModal = document.getElementById("ratingModal");
const stars = document.querySelectorAll(".star");
const selectedRatingInput = document.getElementById("selectedRating");
const ratingProviderIdInput = document.getElementById("ratingProviderId");
const rateProviderName = document.getElementById("rateProviderName");
const submitRatingBtn = document.getElementById("submitRatingBtn");

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadCustomerLeads(user.uid);
    } else {
        window.location.href = "login.html";
    }
});

function loadCustomerLeads(uid) {
    if (!leadsList) return;

    const q = query(
        collection(db, "leads"),
        where("customerId", "==", uid)
    );

    onSnapshot(q, (snapshot) => {
        leadsList.innerHTML = "";
        
        if (snapshot.empty) {
            leadsList.innerHTML = `
                <div style="text-align:center; grid-column:1/-1; padding: 40px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-light);">
                    <p style="color:var(--text-muted); margin-bottom: 20px;">You haven't posted any service requests yet.</p>
                    <a href="request-service.html" class="btn btn-primary">Post a Free Request</a>
                </div>`;
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            const card = document.createElement("div");
            card.classList.add("card");
            
            card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <h3 style="margin-bottom: 0;">${data.service || 'Unknown Service'}</h3>
                <span class="chip chip-${data.status}">${data.status.toUpperCase()}</span>
              </div>
              <p style="background: var(--bg-main); padding: 10px; border-radius: 6px; margin: 10px 0; font-size: 14px;"><strong>Details:</strong> ${data.description}</p>
              <p style="margin-bottom: 5px;"><strong>Location:</strong> ${data.location}</p>
              <p style="margin-bottom: 15px;"><strong>Assigned Provider:</strong> <span style="font-weight:600; color:var(--primary-blue);">${data.assignedToName || 'Searching for providers...'}</span></p>

              <div style="margin-top:auto; display: flex; gap: 10px; flex-wrap: wrap;">
                ${data.status === 'completed' && data.assignedTo ? 
                  `<button class="btn btn-primary rate-btn" data-pid="${data.assignedTo}" data-pname="${data.assignedToName}" style="flex:1;">Rate Provider</button>` 
                  : ''}
                ${data.status === 'new' ? 
                  `<button class="btn btn-outline delete-btn" data-id="${id}" style="flex:1; border-color: var(--danger); color: var(--danger);">Cancel Request</button>` 
                  : ''}
              </div>
            `;
            
            // Delete Listener
            const deleteBtn = card.querySelector(".delete-btn");
            if(deleteBtn) {
                deleteBtn.addEventListener("click", async () => {
                    if(confirm("Are you sure you want to cancel this request?")) {
                        await deleteDoc(doc(db, "leads", id));
                        window.showToast("Request cancelled successfully.", "success");
                    }
                });
            }

            // Rate Listener
            const rateBtn = card.querySelector(".rate-btn");
            if(rateBtn) {
                rateBtn.addEventListener("click", () => {
                    ratingProviderIdInput.value = rateBtn.getAttribute("data-pid");
                    rateProviderName.innerText = rateBtn.getAttribute("data-pname");
                    ratingModal.style.display = "flex";
                    // Reset stars
                    stars.forEach(s => s.style.color = "#ccc");
                    selectedRatingInput.value = "0";
                });
            }

            leadsList.appendChild(card);
        });
    });
}

// STAR RATING LOGIC
stars.forEach(star => {
    star.addEventListener("click", (e) => {
        const value = parseInt(e.target.getAttribute("data-value"));
        selectedRatingInput.value = value;
        stars.forEach(s => {
            if (parseInt(s.getAttribute("data-value")) <= value) {
                s.style.color = "#FFD700"; // Gold
            } else {
                s.style.color = "#ccc";
            }
        });
    });
});

submitRatingBtn.addEventListener("click", async () => {
    const rating = parseInt(selectedRatingInput.value);
    const providerId = ratingProviderIdInput.value;
    
    if(rating === 0) {
        alert("Please select a star rating first.");
        return;
    }
    
    try {
        const providerRef = doc(db, "providers", providerId);
        // Simple logic: we just increment totalRatingScore and ratingCount.
        // We'd need to fetch first to do an average if we want, or just let DB hold it.
        const snap = await getDoc(providerRef);
        if(snap.exists()) {
            const data = snap.data();
            const currentTotal = data.ratingTotalScore || 0;
            const currentCount = data.ratingCount || 0;
            
            const newTotal = currentTotal + rating;
            const newCount = currentCount + 1;
            const newAvg = (newTotal / newCount).toFixed(1);
            
            await updateDoc(providerRef, {
                ratingTotalScore: newTotal,
                ratingCount: newCount,
                rating: newAvg
            });
            
            window.showToast("Thank you for your feedback!", "success");
            ratingModal.style.display = "none";
        }
    } catch (error) {
        console.error(error);
        alert("Rules error or update failed. Make sure customers have write access to provider ratings.");
    }
});
