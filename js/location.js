const citySelect = document.getElementById("citySelect");

function updateCityUI(cityName) {
    if (!cityName) return;
    document.querySelectorAll('.city-name').forEach(el => {
        el.textContent = cityName;
    });
}

// Initial load
const savedCity = localStorage.getItem("city");
if (savedCity) {
    // Ensure the option exists
    if (citySelect && !Array.from(citySelect.options).some(opt => opt.value === savedCity)) {
        const newOpt = document.createElement('option');
        newOpt.value = savedCity;
        newOpt.textContent = savedCity;
        citySelect.appendChild(newOpt);
    }
    if(citySelect) citySelect.value = savedCity;
    updateCityUI(savedCity);
}

// AUTO DETECT LOCATION
if (navigator.geolocation && !savedCity) {
  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const city = data.address.city || data.address.town || data.address.state;
        if (city) {
            localStorage.setItem("city", city);
            if (citySelect) {
                if (!Array.from(citySelect.options).some(opt => opt.value === city)) {
                    const newOpt = document.createElement('option');
                    newOpt.value = city;
                    newOpt.textContent = city;
                    citySelect.appendChild(newOpt);
                }
                citySelect.value = city;
            }
            updateCityUI(city);
        }
    } catch (err) {
        console.error("Location detection failed", err);
    }
  });
}

// MANUAL CITY SELECT
if (citySelect) {
    citySelect.addEventListener("change", () => {
        const city = citySelect.value;
        if (city) {
            localStorage.setItem("city", city);
            updateCityUI(city);
        }
    });
}