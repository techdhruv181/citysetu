import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM Elements
const chatModal = document.getElementById("chatModal");
const closeChat = document.getElementById("closeChat");
const chatBody = document.getElementById("chatBody");

// Form Inputs
const serviceSelect = document.getElementById("chatService");
const reqInput = document.getElementById("chatRequirement");
const nameInput = document.getElementById("chatName");
const phoneInput = document.getElementById("chatPhone");
const locationInput = document.getElementById("chatLocation");
const sendBtn = document.getElementById("chatSendBtn");
const chatInputArea = document.getElementById("chatInputArea");

// Questions Flow
const questions = [
    { key: "service", text: "Hi! Welcome to CitySetu. What service do you need?", type: "select" },
    { key: "description", text: "Great! Please describe your requirement in detail.", type: "text", placeholder: "e.g., I need a portfolio website" },
    { key: "name", text: "May I know your good name?", type: "text", placeholder: "John Doe" },
    { key: "phone", text: "Please provide your phone number (WhatsApp preferred).", type: "text", placeholder: "+91 9876543210" },
    { key: "location", text: "Lastly, which city are you located in?", type: "text", placeholder: "Ahmedabad" }
];

let currentStep = 0;
const leadData = {};

async function addBotMessage(text, delay = 1000) {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message bot typing-indicator";
    typingDiv.innerHTML = "<span></span><span></span><span></span>";
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    return new Promise(resolve => {
        setTimeout(() => {
            typingDiv.remove();
            const div = document.createElement("div");
            div.className = "chat-message bot";
            div.innerText = text;
            chatBody.appendChild(div);
            chatBody.scrollTop = chatBody.scrollHeight;
            resolve();
        }, delay);
    });
}

function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "chat-message user";
    div.innerText = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showInputForStep() {
    // Hide all inputs initially
    serviceSelect.style.display = "none";
    reqInput.style.display = "none";
    nameInput.style.display = "none";
    phoneInput.style.display = "none";
    locationInput.style.display = "none";
    sendBtn.style.display = "block";

    const q = questions[currentStep];
    if (q.key === "service") {
        serviceSelect.style.display = "block";
    } else if (q.key === "description") {
        reqInput.style.display = "block";
        reqInput.placeholder = q.placeholder;
        reqInput.focus();
    } else if (q.key === "name") {
        nameInput.style.display = "block";
        nameInput.placeholder = q.placeholder;
        nameInput.focus();
    } else if (q.key === "phone") {
        phoneInput.style.display = "block";
        phoneInput.placeholder = q.placeholder;
        phoneInput.focus();
    } else if (q.key === "location") {
        locationInput.style.display = "block";
        locationInput.placeholder = q.placeholder;
        locationInput.focus();
    }
}

async function askQuestion() {
    if (currentStep < questions.length) {
        let text = questions[currentStep].text;

        // Make AI more friendly by using their previously answered data
        if (questions[currentStep].key === "phone" && leadData.name) {
            text = `Nice to meet you, ${leadData.name}! ` + text;
        } else if (questions[currentStep].key === "location") {
            text = `Got it! Let's find local experts near you. ` + text;
        }

        await addBotMessage(text, currentStep === 0 ? 600 : 1200);
        showInputForStep();
    } else {
        await finishChat();
    }
}

async function finishChat() {
    chatInputArea.style.display = "none";
    await addBotMessage("Analyzing your request and finding the perfect match...", 1500);
    
    try {
        const docRef = await addDoc(collection(db, "leads"), {
            service: leadData.service,
            description: leadData.description,
            name: leadData.name,
            phone: leadData.phone,
            location: leadData.location,
            status: "new",
            createdAt: serverTimestamp()
        });
        
        addBotMessage("🎉 Request Submitted! We will connect you with experts shortly. We will keep this chat open so you can talk to providers right here!");
        showToast("Success! Lead saved.", "success");
        
        localStorage.setItem("guestLeadId", docRef.id);
        
        setTimeout(() => {
            switchToGuestChat(docRef.id);
        }, 3000);

    } catch (error) {
        addBotMessage("Sorry, something went wrong. Please try again.");
        showToast("Error saving lead.", "error");
        chatInputArea.style.display = "flex";
    }
}

async function handleSend() {
    let val = "";
    let q = questions[currentStep];
    
    if (q.key === "service") {
        val = serviceSelect.value;
    } else if (q.key === "description") {
        val = reqInput.value.trim();
        reqInput.value = "";
    } else if (q.key === "name") {
        val = nameInput.value.trim();
        nameInput.value = "";
    } else if (q.key === "phone") {
        val = phoneInput.value.trim();
        phoneInput.value = "";
    } else if (q.key === "location") {
        val = locationInput.value.trim();
        locationInput.value = "";
    }

    if (!val) {
        showToast("Please provide an answer", "error");
        return;
    }

    leadData[q.key] = val;
    addUserMessage(val);
    
    // Hide inputs immediately so user can't spam while bot is "typing"
    serviceSelect.style.display = "none";
    reqInput.style.display = "none";
    nameInput.style.display = "none";
    phoneInput.style.display = "none";
    locationInput.style.display = "none";
    sendBtn.style.display = "none";

    currentStep++;
    await askQuestion();
}

// GUEST SESSION ENGINE
let guestChatActive = false;

function switchToGuestChat(leadId) {
    guestChatActive = true;
    chatInputArea.style.display = "flex";
    serviceSelect.style.display = "none";
    reqInput.style.display = "none";
    nameInput.style.display = "none";
    phoneInput.style.display = "none";
    locationInput.style.display = "none";
    
    let guestReply = document.getElementById("guestChatReply");
    if (!guestReply) {
       guestReply = document.createElement("input");
       guestReply.type = "text";
       guestReply.id = "guestChatReply";
       guestReply.placeholder = "Type your message to Providers...";
       guestReply.style.cssText = "width:100%; margin-bottom:10px; padding:12px; border-radius:8px; border:1px solid #ddd; outline:none;";
       chatInputArea.insertBefore(guestReply, sendBtn);
       
       guestReply.addEventListener("keypress", (e) => {
           if(e.key === 'Enter') sendBtn.click();
       });
    }
    guestReply.style.display = "block";
    sendBtn.style.display = "block";
    sendBtn.innerText = "Reply";
    
    // Clear old form bindings
    sendBtn.removeEventListener("click", handleSend);
    sendBtn.addEventListener("click", async () => {
        const text = guestReply.value.trim();
        if (!text) return;
        guestReply.value = "";
        
        const expireAt = new Date();
        expireAt.setHours(expireAt.getHours() + 24);

        await addDoc(collection(db, "messages"), {
             leadId: leadId,
             senderId: "customer",
             text: text,
             timestamp: serverTimestamp(),
             expireAt: expireAt
        });
    });

    const q = query(
        collection(db, "messages"),
        where("leadId", "==", leadId)
    );
    
    onSnapshot(q, (snapshot) => {
        chatBody.innerHTML = "";
        if (snapshot.empty) {
             const div = document.createElement("div");
             div.className = "chat-message bot";
             div.innerHTML = "<strong>System:</strong> Waiting for providers to review your request...";
             chatBody.appendChild(div);
             return;
        }
        
        // Sort manually by timestamp to bypass Firebase Composite Index requirement
        let messages = [];
        snapshot.forEach((docSnap) => { messages.push(docSnap.data()); });
        messages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

        messages.forEach((msg) => {
            const div = document.createElement("div");
            if (msg.senderId === "customer") {
                div.className = "chat-message user";
                div.style.background = "#EF4444"; // Distinguish visually from standard Orange
            } else {
                div.className = "chat-message bot";
                div.style.background = "#E0F2FE"; // Visually highlight Provider messages
                div.style.border = "1px solid #BAE6FD";
            }
            div.innerText = msg.text;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}

// Events
const chatBtns = document.querySelectorAll(".open-chatbot-btn");
chatBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        chatModal.style.display = "flex";
        
        const existingLead = localStorage.getItem("guestLeadId");
        if (existingLead) {
            switchToGuestChat(existingLead);
            return;
        }
        
        if (currentStep === 0 && chatBody.innerHTML === "") {
            askQuestion();
        }
    });
});

if (closeChat) {
    closeChat.addEventListener("click", () => {
        chatModal.style.display = "none";
    });
}

if (sendBtn) {
    sendBtn.addEventListener("click", handleSend);
}

// Handle enter keys for text inputs
[reqInput, nameInput, phoneInput, locationInput].forEach(el => {
    el.addEventListener("keypress", (e) => {
        if(e.key === 'Enter') handleSend();
    });
});

// Toast functionality
export function showToast(message, type="success") {
    let toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) {
        toastContainer = document.createElement("div");
        toastContainer.id = "toastContainer";
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make globally accessible for other pages to use custom toasts
window.showToast = showToast;
