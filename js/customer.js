import { auth, db } from "./firebase.js";

import {
createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
setDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


const form = document.getElementById("customerSignup");

form.addEventListener("submit", async (e) => {

e.preventDefault();

const name = document.getElementById("customerName").value;
const email = document.getElementById("customerEmail").value;
const password = document.getElementById("customerPassword").value;
const phone = document.getElementById("customerPhone").value;

const userCredential = await createUserWithEmailAndPassword(
auth,
email,
password
);

const user = userCredential.user;

await setDoc(doc(db,"customers",user.uid),{

name,
email,
phone,
city: localStorage.getItem("city") || "",
createdAt: new Date()

});

alert("Account created!");

});