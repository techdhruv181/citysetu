const https = require('https');
const lat = 23.0225;
const lon = 72.5714;
const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

https.get(url, { headers: { "User-Agent": "CitySetuTest/1.0" } }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        console.log("RESPONSE:", data);
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
