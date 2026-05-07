import { auth } from './firebase.js';
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById('forgotPasswordForm');
const successMsg = document.getElementById('resetSuccess');
const errorMsg = document.getElementById('resetError');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    try {
        await sendPasswordResetEmail(auth, email);
        successMsg.style.display = 'block';
        form.reset();
    } catch (error) {
        errorMsg.innerText = error.message;
        errorMsg.style.display = 'block';
    }
});
