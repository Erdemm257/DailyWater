const firebaseConfig = {
    apiKey: "AIzaSyDxVEBY-YZhzQlJHOn-18uWiSTvKRxTZ4g",
    authDomain: "dailywater-88252.firebaseapp.com",
    projectId: "dailywater-88252",
    storageBucket: "dailywater-88252.firebasestorage.app",
    messagingSenderId: "968182146593",
    appId: "1:968182146593:web:0af36ebf7050e24a7fe560",
    measurementId: "G-9F806FRWLJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let bugunkuToplam = 0;
const toplamSuElement = document.getElementById('toplamSu');
const toplamSuMlElement = document.getElementById('toplamSuMl');
const gecmisListeElement = document.getElementById('gecmisListe');
const userInput = document.getElementById('userInput');
const hedefInput = document.getElementById('hedefInput');
const settingsIcon = document.getElementById('settingsIcon');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettings = document.getElementById('closeSettings');

// 1. AÇILIŞTA HAFIZADAN YÜKLEME
window.onload = () => {
    const savedUser = localStorage.getItem('suTakipUser') || 'Misafir';
    const savedSu = parseFloat(localStorage.getItem('bugunkuSu')) || 0;
    const savedHedef = localStorage.getItem('suHedef') || 2500; 

    if(userInput) userInput.value = savedUser;
    if(hedefInput) hedefInput.value = savedHedef;
    bugunkuToplam = savedSu;
    
    uiGuncelle();
    gecmisiYukle();
};

// Hedef değiştiğinde suyu anlık güncelle
if(hedefInput) {
    hedefInput.addEventListener('input', () => {
        localStorage.setItem('suHedef', hedefInput.value);
        uiGuncelle(); 
    });
}

function getCollectionName() {
    return userInput ? (userInput.value || 'Misafir') : 'Misafir';
}

if(userInput) {
    userInput.addEventListener('input', () => {
        localStorage.setItem('suTakipUser', userInput.value);
        gecmisiYukle();
    });
}

function uiGuncelle() {
    const litreGosterim = (Math.floor(bugunkuToplam / 100) / 10).toFixed(1);
    if(toplamSuElement) toplamSuElement.innerText = litreGosterim + " Litre";
    if(toplamSuMlElement) toplamSuMlElement.innerText = bugunkuToplam + " mL";

    const hedefMl = parseInt(hedefInput ? hedefInput.value : 2500) || 2500;
    
    const hedefGosterge = document.getElementById('hedefGosterge');
    if (hedefGosterge) {
        hedefGosterge.innerText = "Hedef: " + hedefMl + " ML";
    }

    const waves = document.querySelectorAll('.water-wave');
    const circleContainer = document.querySelector('.circle-container');

    //if (bugunkuToplam === 0) {
    //    waves.forEach(wave => wave.style.display = 'none');
    //} else {
    //    waves.forEach(wave => wave.style.display = 'block');
    //}

    let yuzde = bugunkuToplam / hedefMl;
    if (yuzde > 1) yuzde = 1;
    if (yuzde < 0) yuzde = 0;

    const startBottom = -450;
    const endBottom = -220;
    const bottomValue = startBottom + (yuzde * (endBottom - startBottom));
    
    waves.forEach(wave => {
        wave.style.bottom = bottomValue + "px";
    });

    if (circleContainer) {
        if (bugunkuToplam > 0 && bugunkuToplam >= hedefMl) {
            circleContainer.style.borderColor = "#22c55e";
            circleContainer.style.boxShadow = "0 0 0 6px #1e293b, 0 0 20px rgba(34, 197, 94, 0.4)";
        } else {
            circleContainer.style.borderColor = "#38bdf8";
            circleContainer.style.boxShadow = "0 0 0 6px #1e293b, 0 0 20px rgba(56, 189, 248, 0.2)";
        }
    }
}

function suIslem(ml, tip) {
    if (tip === 'ekle') {
        bugunkuToplam += ml;
    } else if (tip === 'cikart') {
        bugunkuToplam = Math.max(0, bugunkuToplam - ml);
    }
    localStorage.setItem('bugunkuSu', bugunkuToplam);
    uiGuncelle();
}

function customSuIslem(tip) {
    const input = document.getElementById('customInput');
    const miktar = parseInt(input.value);
    if (isNaN(miktar) || miktar <= 0) return;

    if (tip === 'ekle') {
        bugunkuToplam += miktar;
    } else if (tip === 'cikart') {
        bugunkuToplam = Math.max(0, bugunkuToplam - miktar);
    }
    localStorage.setItem('bugunkuSu', bugunkuToplam);
    uiGuncelle();
    input.value = '';
}

function gunuKaydet() {
    if (bugunkuToplam === 0) {
        alert("Lütfen önce su miktarı girin.");
        return;
    }

    const bugun = new Date().toLocaleDateString('tr-TR');
    const litreDegeri = parseFloat((bugunkuToplam / 1000).toFixed(1));

    db.collection(getCollectionName()).doc(bugun).set({
        tarih: bugun,
        miktar: litreDegeri,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Bugünün verisi kaydedildi.");
        bugunkuToplam = 0;
        localStorage.setItem('bugunkuSu', 0);
        uiGuncelle();
        setTimeout(() => { gecmisiYukle(); }, 500);
    })
    .catch((error) => console.error("Hata: ", error));
}

function gecmisiYukle() {
    if(!gecmisListeElement) return;
    gecmisListeElement.innerHTML = "";
    db.collection(getCollectionName()).orderBy("timestamp", "desc").limit(30).get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span class="date">${data.tarih}</span> <span class="amount">${data.miktar.toString().replace('.', ',')} L</span>`;
            gecmisListeElement.appendChild(li);
        });
    });
}

// Ayarlar Menüsü Kontrolleri
settingsIcon.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsOverlay.style.display = 'none';
});

settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        settingsOverlay.style.display = 'none';
    }
});