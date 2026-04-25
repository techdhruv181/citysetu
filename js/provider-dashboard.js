import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  increment,
  addDoc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const taskList = document.getElementById("taskList");
const availableList = document.getElementById("availableList");
const statAvailable = document.getElementById("statAvailable");
const statAssigned = document.getElementById("statAssigned");
const statCompleted = document.getElementById("statCompleted");

// INTERNAL CHAT DOM
const internalChatModal = document.getElementById("internalChatModal");
const closeInternalChat = document.getElementById("closeInternalChat");
const internalChatBody = document.getElementById("internalChatBody");
const internalChatInput = document.getElementById("internalChatInput");
const internalChatSend = document.getElementById("internalChatSend");
const chatLeadName = document.getElementById("chatLeadName");
let currentChatUnsubscribe = null;
let currentChatLeadId = null;

let providerDocId;
let providerCategoryVal = "";
let currentUid = "";
// LOAD PROFILE
async function loadProfile(uid) {

  const q = query(
    collection(db, "providers"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  providerDocId = docSnap.id;

  document.getElementById("providerName").value = data.name || "";
  document.getElementById("providerPhone").value = data.phone || "";
  document.getElementById("providerPrice").value = data.priceStart || "";
  document.getElementById("providerCategory").value = data.category || "";
  providerCategoryVal = data.category || "";

}



// LOAD ASSIGNED TASKS
async function loadTasks(uid) {
  if (!providerCategoryVal) return;

  const q = query(
    collection(db, "leads"),
    where("service", "==", providerCategoryVal)
  );

  onSnapshot(q, (snapshot) => {
    taskList.innerHTML = "";
    if(availableList) availableList.innerHTML = "";

    let assignedCount = 0;
    let availableCount = 0;
    let completedCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;

      // Completed check
      if (data.status === "completed") {
         completedCount++;
         if (data.assignedTo !== uid) return; // Don't show completed if not assigned to us
      }

      // Hide active tasks assigned explicitly to another provider
      if (data.assignedTo && data.assignedTo !== uid) return;

      const isMine = data.assignedTo === uid;

      if (!isMine && data.status !== "completed") availableCount++;
      if (isMine && data.status !== "completed") assignedCount++;

      const card = document.createElement("div");
      card.classList.add("task-card");

      card.innerHTML = `
        <h3>${data.name}</h3>
        <p><strong>Phone:</strong> <span style="letter-spacing: 2px;">+91 9X XXXX XXXX</span> <em style="font-size:12px; color:#888;">(Reveals via WhatsApp)</em></p>
        <p><strong>Requirement:</strong> ${data.description}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <div style="margin-top:5px; margin-bottom:15px;">
           <span class="chip chip-${data.status}">${data.status}</span>
           ${isMine ? `<span class="chip" style="background:#10B981; color:#fff;">Assigned to You</span>` : `<span class="chip chip-new">Broadcasted</span>`}
        </div>

        <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn whatsapp-btn" data-url="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(data.name)},%20I%20am%20reaching%20out%20from%20CitySetu%20regarding%20your%20${encodeURIComponent(data.service)}%20request." style="background:#25D366; color:white; border:none; cursor:pointer;">🟢 Premium WhatsApp</button>
        <button class="btn internal-chat-btn" data-id="${id}" data-name="${data.name}" style="background:#1E2A78; color:white; border:none; cursor:pointer;">💬 Free Chat</button>
        ${data.status === 'new' || data.status === 'contacted' ? `<button class="btn btn-primary contact-btn">Mark Contacted</button>` : ''}
        ${isMine && data.status !== 'completed' ? `<button class="btn btn-orange finish-btn">Mark Completed</button>` : ''}
        </div>
      `;

      // WHATSAPP BUTTON (TRACK CLICKS)
      const waBtn = card.querySelector(".whatsapp-btn");
      if (waBtn) {
         waBtn.addEventListener("click", async () => {
           try {
             // 1. Track click on Provider profile
             await updateDoc(doc(db, "providers", uid), {
               whatsappClicks: increment(1)
             });
             // 2. Open WhatsApp link
             window.open(waBtn.getAttribute("data-url"), "_blank");
           } catch(e) {
             console.error("Tracking Error:", e);
             window.open(waBtn.getAttribute("data-url"), "_blank");
           }
         });
      }

      // OPEN INTERNAL CHAT
      const chatBtn = card.querySelector(".internal-chat-btn");
      if (chatBtn) {
         chatBtn.addEventListener("click", () => {
            openInternalChat(chatBtn.getAttribute("data-id"), chatBtn.getAttribute("data-name"));
         });
      }

      // CONTACT BUTTON
      const contactBtn = card.querySelector(".contact-btn");
      if (contactBtn) {
        contactBtn.addEventListener("click", async () => {
          await updateDoc(doc(db, "leads", id), {
            status: "contacted",
            assignedTo: data.assignedTo || uid // Auto-assign to self if it was broadcasted
          });
          if(window.showToast) window.showToast("Lead Marked Contacted & Locked to You!");
        });
      }

      // FINISH BUTTON
      const finishBtn = card.querySelector(".finish-btn");
      if (finishBtn) {
         finishBtn.addEventListener("click", async () => {
           await updateDoc(doc(db, "leads", id), { status: "completed" });
           if(window.showToast) window.showToast("Job Completed");
         });
      }

      if (isMine || data.status === "completed") {
         taskList.appendChild(card);
      } else {
         if(availableList) availableList.appendChild(card);
      }
    });

    if(statAvailable) statAvailable.innerText = availableCount;
    if(statAssigned) statAssigned.innerText = assignedCount;
    if(statCompleted) statCompleted.innerText = completedCount;
  });
}


// --- INTERNAL CHAT LOGIC ---
if (closeInternalChat) {
  closeInternalChat.addEventListener("click", () => {
    internalChatModal.style.display = "none";
    if (currentChatUnsubscribe) {
      currentChatUnsubscribe();
      currentChatUnsubscribe = null;
    }
  });
}

if (internalChatSend) {
  internalChatSend.addEventListener("click", async () => {
    const text = internalChatInput.value.trim();
    if (!text || !currentChatLeadId) return;

    internalChatInput.value = "";
    
    // Auto-Delete logic payload (TTL)
    const expireAt = new Date();
    expireAt.setHours(expireAt.getHours() + 24);

    await addDoc(collection(db, "messages"), {
      leadId: currentChatLeadId,
      senderId: currentUid, 
      text: text,
      timestamp: serverTimestamp(),
      expireAt: expireAt
    });
  });
}

function openInternalChat(leadId, leadName) {
  currentChatLeadId = leadId;
  chatLeadName.innerText = `Chat with ${leadName}`;
  internalChatBody.innerHTML = `<div style="text-align:center; color:#888; margin-top:20px;">Loading messages...</div>`;
  internalChatModal.style.display = "flex";

  if (currentChatUnsubscribe) currentChatUnsubscribe();

  const q = query(
    collection(db, "messages"),
    where("leadId", "==", leadId)
  );

  currentChatUnsubscribe = onSnapshot(q, (snapshot) => {
    internalChatBody.innerHTML = "";
    if (snapshot.empty) {
       internalChatBody.innerHTML = `<div style="text-align:center; color:#888; margin-top:20px;">No messages yet. Send the first message!</div>`;
       return;
    }

    let messages = [];
    snapshot.forEach((docSnap) => { messages.push(docSnap.data()); });
    messages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

    messages.forEach((msg) => {
      const div = document.createElement("div");
      
      div.className = msg.senderId === currentUid ? "internal-msg mine" : "internal-msg other";
      div.innerText = msg.text;
      internalChatBody.appendChild(div);
    });

    internalChatBody.scrollTop = internalChatBody.scrollHeight;
  });
}

// UPDATE PROFILE
const form = document.getElementById("providerProfileForm");

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  await updateDoc(
    doc(db, "providers", providerDocId),
    {
      name: document.getElementById("providerName").value,
      phone: document.getElementById("providerPhone").value,
      priceStart: Number(document.getElementById("providerPrice").value),
      category: document.getElementById("providerCategory").value
    }
  );

  alert("Profile Updated");

});



// AUTH CHECK
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }
  
  currentUid = user.uid;

  await loadProfile(user.uid);
  loadTasks(user.uid);

});