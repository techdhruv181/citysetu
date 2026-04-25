import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  collection,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const form = document.getElementById("joinForm");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const accountType = document.getElementById("accountType") ? document.getElementById("accountType").value : "provider";
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const category = document.getElementById("category").value.trim();
  const priceStart = Number(document.getElementById("priceStart").value);

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!accountType || !name || !email || !phone) {
    alert("Please fill all common fields.");
    return;
  }

  if (accountType === "provider") {
    if (!category || !priceStart) {
      alert("Please fill all provider fields properly.");
      return;
    }
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {

    // 🔐 Create Auth User
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // 📦 Save User in Firestore based on role
    if (accountType === "provider") {
      await setDoc(doc(db, "providers", user.uid), {
        uid: user.uid,
        name,
        email,
        phone,
        category: category,
        priceStart,
        role: "provider",
        approved: false,
        rating: 0,
        ratingCount: 0,
        ratingTotal: 0,
        totalJobs: 0,
        completedJobs: 0,
        whatsappClicks: 0,
        createdAt: new Date()
      });
      alert("Provider Application submitted. Wait for admin approval.");
    } else {
      await setDoc(doc(db, "customers", user.uid), {
        uid: user.uid,
        name,
        email,
        phone,
        role: "customer",
        createdAt: new Date()
      });
      alert("Customer Account successfully created!");
      window.location.href = "login.html"; // send to login manually if they want
    }

    form.reset();

  } catch (error) {
    alert("Error: " + error.message);
    console.error(error);
  }

});