import { db, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const myInboxBtn = document.getElementById("myInboxBtn");
const inboxModal = document.getElementById("inboxModal");
const closeInbox = document.getElementById("closeInbox");
const threadList = document.getElementById("threadList");
const inboxChatBody = document.getElementById("inboxChatBody");
const inboxInputArea = document.getElementById("inboxInputArea");
const inboxReply = document.getElementById("inboxReply");
const inboxSendBtn = document.getElementById("inboxSendBtn");

let activeLeadId = null;
let currentUnsubscribe = null;
let currentUid = null;

onAuthStateChanged(auth, async (user) => {
    if (user && myInboxBtn) {
        currentUid = user.uid;
        // Verify if they are a customer (optional, but prevents providers from using customer inbox randomly)
        myInboxBtn.style.display = "inline-block";
        
        myInboxBtn.addEventListener("click", (e) => {
            e.preventDefault();
            inboxModal.style.display = "flex";
            loadThreads(user.uid);
        });
    }
});

if (closeInbox) {
    closeInbox.addEventListener("click", () => {
        inboxModal.style.display = "none";
        if (currentUnsubscribe) currentUnsubscribe();
    });
}

async function loadThreads(uid) {
    threadList.innerHTML = "<p style='font-size:12px; color:#888;'>Loading your requests...</p>";
    
    try {
        const q = query(collection(db, "leads"), where("customerId", "==", uid));
        const snapshots = await getDocs(q);
        
        threadList.innerHTML = "";
        
        if (snapshots.empty) {
            threadList.innerHTML = "<p style='font-size:14px; text-align:center; margin-top:20px; color:#888;'>No requests found.</p>";
            return;
        }

        snapshots.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.style.cssText = "padding:15px; border-bottom:1px solid #eee; cursor:pointer; background:white; border-radius:5px; margin-bottom:5px;";
            div.innerHTML = `
                <div style="font-weight:600; color:#1E2A78; font-size:14px;">${data.service}</div>
                <div style="font-size:12px; color:#666; margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${data.description}</div>
                <div style="font-size:10px; margin-top:8px; padding:3px 8px; border-radius:12px; display:inline-block; background:${data.status === 'new' ? '#E0F2FE' : '#FEF3C7'}; color:${data.status === 'new' ? '#0284C7' : '#D97706'};">${data.status.toUpperCase()}</div>
            `;
            
            div.addEventListener("click", () => {
                // Highlight active thread
                Array.from(threadList.children).forEach(child => child.style.borderLeft = "none");
                div.style.borderLeft = "4px solid #F97316";
                openChat(doc.id, data.service);
            });
            
            threadList.appendChild(div);
        });
        
    } catch(e) {
        threadList.innerHTML = "<p style='color:red;'>Error loading threads</p>";
        console.error(e);
    }
}

function openChat(leadId, serviceName) {
    activeLeadId = leadId;
    inboxInputArea.style.display = "flex";
    inboxChatBody.innerHTML = `<p style="text-align:center; color:#888; margin-top:20px;">Fetching secure messages...</p>`;
    
    if (currentUnsubscribe) currentUnsubscribe();
    
    const q = query(collection(db, "messages"), where("leadId", "==", leadId));
    
    currentUnsubscribe = onSnapshot(q, (snapshot) => {
        inboxChatBody.innerHTML = "";
        
        if (snapshot.empty) {
            inboxChatBody.innerHTML = `<p style="text-align:center; color:#888; margin-top:20px;">No messages yet. Providers will reach out here!</p>`;
            return;
        }
        
        let messages = [];
        snapshot.forEach((docSnap) => { messages.push(docSnap.data()); });
        messages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        messages.forEach((msg) => {
            const div = document.createElement("div");
            
            if (msg.senderId === "customer" || msg.senderId === currentUid) {
                div.className = "chat-message user";
                div.style.background = "#EF4444";
                div.style.alignSelf = "flex-end";
            } else {
                div.className = "chat-message bot";
                div.style.background = "#E0F2FE";
                div.style.border = "1px solid #BAE6FD";
                div.style.alignSelf = "flex-start";
            }
            
            div.innerText = msg.text;
            inboxChatBody.appendChild(div);
        });
        
        inboxChatBody.scrollTop = inboxChatBody.scrollHeight;
    });
}

// Sending Logic
if (inboxSendBtn) {
    inboxSendBtn.addEventListener("click", async () => {
        if (!activeLeadId) return;
        const text = inboxReply.value.trim();
        if (!text) return;
        
        inboxReply.value = "";
        
        const expireAt = new Date();
        expireAt.setHours(expireAt.getHours() + 24);

        await addDoc(collection(db, "messages"), {
             leadId: activeLeadId,
             senderId: currentUid,
             text: text,
             timestamp: serverTimestamp(),
             expireAt: expireAt
        });
    });
}

if (inboxReply) {
    inboxReply.addEventListener("keypress", (e) => {
        if(e.key === 'Enter') inboxSendBtn.click();
    });
}
