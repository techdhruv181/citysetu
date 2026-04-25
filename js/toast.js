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

// Make globally accessible
window.showToast = showToast;
