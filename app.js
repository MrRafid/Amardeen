// --- app.js (The Brain of Amar Deen) ---

// English to Bengali Number Converter (Only used where safe, avoiding glitches)
const toBnNum = (str) => {
    const bnMap = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    return str.toString().replace(/[0-9]/g, w => bnMap[w]);
};

// --- 1. Prayer Times Logic (Connected to Aladhan API) ---
let prayerTimesData = {};
let countdownInterval;
const bnPrayerNames = { 'Fajr': 'ফজর', 'Sunrise': 'সূর্যোদয়', 'Dhuhr': 'যোহর', 'Asr': 'আসর', 'Maghrib': 'মাগরিব', 'Isha': 'এশা' };

async function fetchPrayerTimes(city = "Dhaka") {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Bangladesh&method=1`);
        const data = await res.json();
        if (data.code === 200) {
            prayerTimesData = data.data.timings;
            calcNextPrayer();
        }
    } catch (e) { console.error("Error fetching prayer times:", e); }
}

function format12Hour(timeStr) {
    let [h, m] = timeStr.split(':');
    let ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; h = h ? h : 12; 
    return `${h < 10 ? '0'+h : h}:${m} ${ampm}`; // Using English numbers to avoid glitch
}

function calcNextPrayer() {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const now = new Date();
        let nextPrayer = 'Fajr', nextTime = null, timeStrForUI = prayerTimesData['Fajr'];
        const times = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        for (let pt of times) {
            if(!prayerTimesData[pt]) continue;
            let [h, m] = prayerTimesData[pt].split(':');
            let pTime = new Date(); pTime.setHours(h, m, 0, 0);
            if (pTime > now) {
                nextPrayer = pt; nextTime = pTime; timeStrForUI = prayerTimesData[pt];
                break;
            }
        }
        if (!nextTime) {
            let [h, m] = prayerTimesData['Fajr'].split(':');
            nextTime = new Date(); nextTime.setDate(now.getDate() + 1); nextTime.setHours(h, m, 0, 0);
        }

        // Only update UI if the elements exist on the current page
        if(document.getElementById('nextPrayerName')) {
            document.getElementById('nextPrayerName').innerText = bnPrayerNames[nextPrayer];
            document.getElementById('nextPrayerTime').innerText = `(${format12Hour(timeStrForUI)})`;
            
            let diff = nextTime - now;
            let hL = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
            let mL = Math.floor((diff % (1000*60*60)) / (1000*60));
            let sL = Math.floor((diff % (1000*60)) / 1000);
            document.getElementById('countdown').innerText = `${hL < 10 ? '0'+hL : hL}:${mL < 10 ? '0'+mL : mL}:${sL < 10 ? '0'+sL : sL}`;
        }
    }, 1000);
}

// --- 2. Asmaul Husna Logic (Connected to Islamic Network) ---
let husnaNames = [];
let currentHusnaIndex = 0;
let isPlaying = false;
let audioElement = null;

async function fetchHusna() {
    try {
        const res = await fetch('https://api.aladhan.com/v1/asmaAlHusna');
        const data = await res.json();
        if(data.code === 200) {
            husnaNames = data.data;
            updateHusnaUI();
        }
    } catch (e) { console.error("Error fetching 99 names:", e); }
}

function updateHusnaUI() {
    if(husnaNames.length === 0) return;
    const item = husnaNames[currentHusnaIndex];
    
    // Check if we are on a page that has the Husna UI
    if(document.getElementById('husnaDisplay')) {
        const display = document.getElementById('husnaDisplay');
        display.style.opacity = '0';
        
        setTimeout(() => {
            document.getElementById('ahArabic').innerText = item.name;
            document.getElementById('ahBangla').innerText = item.transliteration;
            document.getElementById('ahMeaning').innerText = item.en.meaning;
            document.getElementById('ahCounter').innerText = `${item.number}/99`;
            display.style.opacity = '1';
            
            if(!audioElement) {
                audioElement = new Audio();
                audioElement.onended = () => nextName(true);
            }
            
            // 100% Halal, Pure Voice API from Islamic Network (GitHub CDN)
            audioElement.src = `https://raw.githubusercontent.com/islamic-network/cdn/master/asmaAlHusna/audio/${item.number}.mp3`;
            
            if(isPlaying) {
                audioElement.play().catch(() => {
                    isPlaying = false;
                    document.getElementById('playIcon').className = 'fa-solid fa-play text-[12px] ml-0.5';
                });
            }
        }, 200);
    }
}

function toggleAudio() {
    const playIcon = document.getElementById('playIcon');
    isPlaying = !isPlaying;
    if (isPlaying) {
        playIcon.className = 'fa-solid fa-pause text-[12px]';
        audioElement.play();
    } else {
        playIcon.className = 'fa-solid fa-play text-[12px] ml-0.5';
        audioElement.pause();
    }
}

function nextName(autoPlay = false) {
    currentHusnaIndex = (currentHusnaIndex + 1) % 99;
    if(autoPlay) isPlaying = true;
    updateHusnaUI();
}

function prevName() {
    currentHusnaIndex = (currentHusnaIndex - 1 + 99) % 99;
    updateHusnaUI();
}

// Auto Initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
    fetchPrayerTimes();
    fetchHusna();
});
