import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const ADMIN_EMAIL = "dhruviltechshop@gmail.com";

// LOGIN FORM
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}

// 🔥 ROLE BASED REDIRECT
// 🔥 ROLE BASED REDIRECT
onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const currentPage = window.location.pathname;

  // ADMIN
  if (user.email === ADMIN_EMAIL) {

    if (!currentPage.includes("admin.html")) {
      window.location.href = "admin.html";
    }

    return;
  }

  // PROVIDER
  const q = query(
    collection(db, "providers"),
    where("uid", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {

    const providerData = snapshot.docs[0].data();

    if (providerData.approved) {

      if (!currentPage.includes("provider-dashboard.html")) {
        window.location.href = "provider-dashboard.html";
      }

    } else {

      alert("Waiting for admin approval.");
      window.location.href = "index.html";

    }

  } else {

    window.location.href = "index.html";

  }

});
const nav = document.getElementById("navLinks");

onAuthStateChanged(auth, async (user) => {

  if (!nav) return;

  if (!user) {

    nav.innerHTML = nav.innerHTML + `
<a href="login.html">Login</a>
<a href="join.html" class="btn btn-orange">Sign Up</a>
`;

    return;

  }

  // ADMIN LOGIN
  if (user.email === ADMIN_EMAIL) {

    nav.innerHTML += `
<a href="admin.html">Admin Panel</a>
<a href="#" id="logoutBtn">Logout</a>
`;

  }

  // PROVIDER LOGIN
  else {

    nav.innerHTML += `
<a href="provider-dashboard.html">Dashboard</a>
<a href="profile.html">Profile</a>
<a href="#" id="logoutBtn">Logout</a>
`;

  }

  // Logout button
  setTimeout(() => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
      });
    }

  }, 200);

});