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

// 1. AÇILIŞTA HAFIZADAN YÜKLEME
window.onload = () => {
    const savedUser = localStorage.getItem('suTakipUser') || 'Misafir';
    const savedSu = parseFloat(localStorage.getItem('bugunkuSu')) || 0;
    const savedHedef = localStorage.getItem('suHedef') || 2.5; // Varsayılan hedef 2.5L

    if(userInput) userInput.value = savedUser;
    if(hedefInput) hedefInput.value = savedHedef;
    bugunkuToplam = savedSu;
    
    uiGuncelle();
    gecmisiYukle();
};

if(hedefInput) {
    hedefInput.addEventListener('input', () => {
        localStorage.setItem('suHedef', hedefInput.value);
        // İleride dairesel barı güncelleyecek fonksiyon buraya eklenecek
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
    toplamSuElement.innerText = litreGosterim + " Litre";
    toplamSuMlElement.innerText = bugunkuToplam + " mL";
}

function suIslem(ml, tip) {
    if (tip === 'ekle') {
        bugunkuToplam += ml;
    } else if (tip === 'cikart') {
        bugunkuToplam = Math.max(0, bugunkuToplam - ml);
    }
    localStorage.setItem('bugunkuSu', bugunkuToplam); // HAFIZAYA YAZ
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
    localStorage.setItem('bugunkuSu', bugunkuToplam); // HAFIZAYA YAZ
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
        localStorage.setItem('bugunkuSu', 0); // HAFIZAYI SIFIRLA
        uiGuncelle();
        // Gecikme ile verinin işlenmesini bekliyoruz
        setTimeout(() => { gecmisiYukle(); }, 500);
    })
    .catch((error) => {
        console.error("Hata: ", error);
    });
}

function gecmisiYukle() {
    gecmisListeElement.innerHTML = "";
    db.collection(getCollectionName()).orderBy("timestamp", "desc").limit(30).get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span class="date">${data.tarih}</span> <span class="amount">${data.miktar} L</span>`;
            gecmisListeElement.appendChild(li);
        });
    });
}

// Ayarlar Menüsü Kontrolleri
const settingsIcon = document.getElementById('settingsIcon');
const settingsOverlay = document.getElementById('settingsOverlay');
const closeSettings = document.getElementById('closeSettings');

// İkona basınca aç
settingsIcon.addEventListener('click', () => {
    settingsOverlay.style.display = 'flex';
});

// Çarpıya basınca kapat
closeSettings.addEventListener('click', () => {
    settingsOverlay.style.display = 'none';
});

// Arka plan blurlu alana basınca kapat
settingsOverlay.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) {
        settingsOverlay.style.display = 'none';
    }
});