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
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const taskList = document.getElementById("taskList");

let providerDocId;


// LOAD PROFILE
async function loadProfile(uid){

const q = query(
collection(db,"providers"),
where("uid","==",uid)
);

const snapshot = await getDocs(q);

if(snapshot.empty) return;

const docSnap = snapshot.docs[0];
const data = docSnap.data();

providerDocId = docSnap.id;

document.getElementById("providerName").value = data.name || "";
document.getElementById("providerPhone").value = data.phone || "";
document.getElementById("providerPrice").value = data.priceStart || "";
document.getElementById("providerCategory").value = data.category || "";

}



// LOAD ASSIGNED TASKS
async function loadTasks(uid){

const q = query(
collection(db,"bookings"),
where("providerUid","==",uid)
);

const snapshot = await getDocs(q);

taskList.innerHTML = "";

snapshot.forEach((docSnap)=>{

const data = docSnap.data();
const id = docSnap.id;

const card = document.createElement("div");
card.classList.add("card");

card.innerHTML = `
<h3>${data.customerName}</h3>
<p>Phone: ${data.customerPhone}</p>
<p>Service: ${data.serviceDetails}</p>
<p>Status: ${data.status}</p>

<div style="margin-top:15px;">
<button class="btn btn-primary accept-btn">Accept</button>
<button class="btn btn-orange reject-btn">Reject</button>
</div>
`;


// ACCEPT
card.querySelector(".accept-btn").addEventListener("click", async()=>{

await updateDoc(doc(db,"bookings",id),{
providerDecision:"accepted",
status:"accepted"
});

alert("Job Accepted");

});


// REJECT
card.querySelector(".reject-btn").addEventListener("click", async()=>{

await updateDoc(doc(db,"bookings",id),{
providerDecision:"rejected",
status:"rejected"
});

alert("Job Rejected");

});

taskList.appendChild(card);

});

}


// UPDATE PROFILE
const form = document.getElementById("providerProfileForm");

form.addEventListener("submit", async (e)=>{

e.preventDefault();

await updateDoc(
doc(db,"providers",providerDocId),
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
onAuthStateChanged(auth,(user)=>{

if(!user){
window.location.href="login.html";
return;
}

loadProfile(user.uid);
loadTasks(user.uid);

});