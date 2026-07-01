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
const userInput = document.getElementById('userInput'); // HTML'deki inputun ID'si bu olmalı

// Uygulama açıldığında kaydedilen kullanıcıyı yükle
window.onload = () => {
    const savedUser = localStorage.getItem('suTakipUser') || 'Misafir';
    if(userInput) userInput.value = savedUser;
    gecmisiYukle();
};

// Koleksiyon adını dinamik belirleyen fonksiyon
function getCollectionName() {
    return userInput ? (userInput.value || 'Misafir') : 'Misafir';
}

// Kullanıcı değiştiğinde listeyi tazele
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
    uiGuncelle();
    input.value = '';
}

function gunuKaydet() {
    if (bugunkuToplam === 0) {
        alert("Lütfen önce su miktarı girin.");
        return;
    }

    const bugun = new Date().toLocaleDateString('tr-TR');
    const litreDegeri = parseFloat((bugunkuToplam / 1000).toFixed(3));

    // Artık koleksiyon ismi getCollectionName() ile seçiliyor
    db.collection(getCollectionName()).doc(bugun).set({
        tarih: bugun,
        miktar: litreDegeri,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert("Bugünün verisi kaydedildi.");
        bugunkuToplam = 0;
        uiGuncelle();
        gecmisiYukle();
    })
    .catch((error) => {
        console.error("Hata: ", error);
    });
}

function gecmisiYukle() {
    gecmisListeElement.innerHTML = "";
    
    // Koleksiyon ismine göre verileri çekiyoruz
    db.collection(getCollectionName()).orderBy("timestamp", "desc").limit(30).get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<span class="date">${data.tarih}</span> <span class="amount">${data.miktar} L</span>`;
            gecmisListeElement.appendChild(li);
        });
    })
    .catch((error) => {
        console.error("Geçmiş yüklenemedi: ", error);
    });
}

gecmisiYukle();