document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("cookieConsent")) {
        const banner = document.createElement("div");
        banner.id = "cookieConsentBanner";
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: #1e293b;
            color: #f8fafc;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
            font-size: 14px;
        `;
        
        banner.innerHTML = `
            <div style="flex: 1; min-width: 200px;">
                We use cookies to improve your experience, personalize content, and serve relevant ads. By continuing to use CitySetu, you agree to our <a href="legal.html" style="color: var(--accent-orange); text-decoration: underline;">Privacy Policy</a>.
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="acceptCookies" class="btn btn-primary" style="padding: 8px 20px; font-size: 14px; white-space: nowrap;">Accept</button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById("acceptCookies").addEventListener("click", () => {
            localStorage.setItem("cookieConsent", "true");
            banner.style.opacity = "0";
            setTimeout(() => banner.remove(), 300);
        });
    }
});
