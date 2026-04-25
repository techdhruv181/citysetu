import { db, auth } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("leadForm");
const submitBtn = document.getElementById("submitBtn");
const successMsg = document.getElementById("successMsg");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Get Values
        const customerName = document.getElementById("customerName").value.trim();
        const customerPhone = document.getElementById("customerPhone").value.trim();
        const city = document.getElementById("city").value;
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value.trim();

        if (!customerName || !customerPhone || !city || !category || !description) {
            alert("Please fill all fields!");
            return;
        }

        // Disable button to prevent double submission
        submitBtn.disabled = true;
        submitBtn.innerText = "Posting Request...";

        try {
            // 2. Add to Firestore 'leads' collection
            const docRef = await addDoc(collection(db, "leads"), {
                name: customerName,
                phone: customerPhone,
                location: city,
                service: category,
                description: description,
                status: "new",
                customerId: auth.currentUser ? auth.currentUser.uid : "guest",
                createdAt: serverTimestamp()
            });

            console.log("Lead created successfully with ID: ", docRef.id);
            
            // 3. Show Success Message and hide form
            form.style.display = "none";
            successMsg.style.display = "block";
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Something went wrong! Please try again later. Error: " + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = "Post Request Now";
        }
    });
}
