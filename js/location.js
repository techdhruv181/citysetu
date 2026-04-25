const citySelect = document.getElementById("citySelect");

// AUTO DETECT LOCATION
if (navigator.geolocation) {

  navigator.geolocation.getCurrentPosition(async (position) => {

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );

    const data = await res.json();

    const city =
      data.address.city ||
      data.address.town ||
      data.address.state;

    if (city) {
      localStorage.setItem("city", city);
      citySelect.value = city;
    }

  });

}

// MANUAL CITY SELECT
citySelect.addEventListener("change", () => {

  const city = citySelect.value;

  localStorage.setItem("city", city);

});