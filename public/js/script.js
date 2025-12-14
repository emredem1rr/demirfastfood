const searchForm = document.querySelector(".search-form");
const cartItemsContainer = document.querySelector(".cart-items-container");
const totalAmountDisplay = cartItemsContainer.querySelector(".price-value"); 

const searchBtn = document.querySelector("#search-btn");
const cartBtn = document.querySelector("#cart-btn");
const menuBtn = document.querySelector("#menu-btn");
const navbar = document.querySelector(".navbar"); 
const addToCartButtons = document.querySelectorAll('.box .btn');

// Cart Button
cartBtn.addEventListener("click", async function () {
    cartItemsContainer.classList.toggle("active");

    // Sepet verilerini çek ve göster
    const cartItems = await fetchCartItems();
    renderCartItems(cartItems);

    document.addEventListener("click", function (e) {
        if (!e.composedPath().includes(cartBtn) && !e.composedPath().includes(cartItemsContainer)) {
            cartItemsContainer.classList.remove("active");
        }
    });
});

async function fetchCartItems() {
    try {
        const response = await fetch('/cart');
        if (response.ok) {
            const cartItems = await response.json();
            return cartItems; // Sepet öğelerini döndür
        } else {
            console.error("Sepet verileri alınamadı.");
            return [];
        }
    } catch (error) {
        console.error("Hata:", error);
        return [];
    }
}

function renderCartItems(cartItems) {
    const cartItemsContainer = document.querySelector(".cart-items-container");
    
    if (!cartItemsContainer) {
        console.error("Cart container bulunamadı!");
        return;
    }

    cartItemsContainer.innerHTML = ""; // Eski içeriği temizle

    let totalAmount = 0; // Toplam tutar
    let orderButton;

    // Sepet boşsa mesaj göster
    if (cartItems.length === 0) {
        const newEmptyMessage = document.createElement('p');
        newEmptyMessage.classList.add('empty-message');
        newEmptyMessage.innerText = 'Sepetinizde ürün bulunmamaktadır.';
        newEmptyMessage.style.fontSize = "15px";
        cartItemsContainer.insertBefore(newEmptyMessage, cartItemsContainer.lastElementChild);
        return;
    }

    // Sepet öğeleri için HTML içeriğini oluştur
    cartItems.forEach(item => {
        const price = parseFloat(item.mainPrice); // Fiyatı sayısal değere dönüştür
        totalAmount += price * item.count; // Ürünün fiyatını ve miktarını ekle

        const cartItemHTML = `
            <div class="cart-item" style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-times remove-item" data-id="${item.id}" style="cursor: pointer;"></i>
                <img src="${item.imgSrc}" style="width: 80px; height: 70px;" alt="menü">
                <div class="content">
                    <h3>${item.productName}</h3>
                    <div class="details">
                        <span>Miktar: <span class="count">${item.count}</span></span>
                        <div class="price">${price.toFixed(2)}₺</div>
                    </div>
                </div>
            </div>
        `;
        cartItemsContainer.insertAdjacentHTML("beforeend", cartItemHTML);
    });

    // Sepet toplam tutarını ve Sipariş Ver butonunu ekle
    const footerHTML = `
        <div class="sepet-footer" style="display: flex; height: 80px; align-items: center; gap: 10px;">
            <a href="javascript:void(0);" style="background-color: transparent; color: black; font-size: 15px; width: 250px; margin-top: 10px;">
                Tutar: <span class="price-value">${totalAmount.toFixed(2)}₺</span>
            </a>
            <a href="/kayit" id="siparis-ver-btn" class="btn" style="background-color: black; color: white; display: flex; justify-content: center; align-items: center; height: 50px; padding: 0 20px;">SİPARİŞ VER</a>
        </div>
    `;
    cartItemsContainer.insertAdjacentHTML("beforeend", footerHTML);

    // Sipariş Ver butonunu ve fiyatı güncelle
    const priceValue = document.querySelector(".price-value");
    const orderButtonElement = document.querySelector("#siparis-ver-btn");

    // Sipariş Ver butonunu göster
    orderButtonElement.style.display = "flex";

    // Sepet öğelerini silmek için event listener ekle
    const removeBtns = document.querySelectorAll(".remove-item");
    removeBtns.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const productId = e.target.getAttribute("data-id");
            await removeCartItem(productId); // Sepetten öğe kaldırma işlemi
            const cartItems = await fetchCartItems(); // Güncel sepeti al
            renderCartItems(cartItems); // Sepeti tekrar render et
        });
    });
}

// Sepetten öğe kaldırma fonksiyonu
async function removeCartItem(productId) {
    try {
        const response = await fetch(`/cart/${productId}`, {
            method: 'DELETE', // DELETE metoduyla sepetten öğe silme
        });

        if (!response.ok) {
            throw new Error("Sepetten öğe silinemedi.");
        }
    } catch (error) {
        console.error("Hata:", error);
    }
}

function sepetiSifirla(event) {
    // Form alanlarını al
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const adressInput = document.getElementById('adress');
    // Validasyon bayrağı
    let isValid = true;

    // Ad Soyad Doğrulama
    if (!validateName(nameInput)) {
        isValid = false;
    }

    // E-posta Doğrulama
    if (!validateEmail(emailInput)) {
        isValid = false;
    }

    // Telefon Doğrulama
    if (!validatePhone(phoneInput)) {

        isValid = false;
    }

    // Adres Doğrulama
    if (!validateAdress(adressInput)) {
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    event.target.submit();
}

// Menu Button
menuBtn.addEventListener("click", function() {
    navbar.classList.toggle("active");
    document.addEventListener("click", function(e) {
        if (!e.composedPath().includes(menuBtn) && !e.composedPath().includes(navbar)) {
            navbar.classList.remove("active");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");

    addToCartButtons.forEach(button => {
        button.addEventListener("click", async function () {
            const productId = this.getAttribute("data-id");
            const quantity = this.getAttribute("data-quantity") || 1;

            try {
                const response = await fetch("/cart", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        productId: productId,
                        quantity: parseInt(quantity)
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
                } else {
                    const error = await response.json();
                    console.error("Hata:", error.error);
                    alert("Ürün sepete eklenirken bir hata oluştu.");
                }
            } catch (err) {
                console.error("Bağlantı hatası:", err);
                alert("Ürün sepete eklenirken bir hata oluştu.");
            }
        });
    });
});

function validateName(input) {
    let value = input.value.trim();

    value = value.replace(/(^|[\s])([a-zçğıöşü])/g, (match, space, char) => space + char.toUpperCase());

    // En az 2 karakter kontrolü (kelime içinde boşluklar sayılmamalı)
    const wordCount = value.split(' ').filter(word => word.length > 0).length;
    if (wordCount < 2 ) {
        input.setCustomValidity("Ad ve Soyad en az iki kelime olmalıdır.");
        input.reportValidity();
        return false;
    }

    input.setCustomValidity(""); // Geçerli alan
    input.value = value; // Formatlanmış adı input'a geri yaz
    return true;
}


// E-posta Validasyonu
function validateEmail(input) {
    input.value = input.value.toLowerCase().trim(); // Küçük harfe dönüştür ve boşlukları temizle
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(input.value)) {
        input.setCustomValidity("Geçerli bir e-posta adresi girin.");
        input.reportValidity();
        return false;
    } else {
        input.setCustomValidity("");
        return true;
    }
}
// Telefon Validasyonu
function formatPhone(input) {
    let phoneNumber = input.value.replace(/\D/g, ''); // Sadece rakamları al

    if (phoneNumber.length > 0 && phoneNumber[0] !== '0') {
        alert('Hatalı giriş! Telefon numarası 0 ile başlamalıdır.');
        input.value = '';
        return false;
    }

    if (phoneNumber.length > 1 && phoneNumber[1] !== '5') {
        alert('Hatalı giriş! Telefon numarasının ikinci rakamı 5 olmalıdır.');
        input.value = '';
        return false;
    }

    if (phoneNumber.length > 11) {
        phoneNumber = phoneNumber.slice(0, 11);
    }

    if (phoneNumber.length > 7) {
        phoneNumber = phoneNumber.replace(/^(\d{4})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4');
    } else if (phoneNumber.length > 4) {
        phoneNumber = phoneNumber.replace(/^(\d{4})(\d{3})$/, '$1 $2');
    }

    input.value = phoneNumber;

    return true;
}

function validatePhone(input) {
    const phoneNumber = input.value.trim();
    // Telefon numarası tam olarak 11 karakter mi kontrol et
    if (phoneNumber.length !== 14) {
        input.setCustomValidity("Telefon numarası tam olarak 11 haneli olmalıdır.");
        input.reportValidity();
        return false;
    }

    // Telefon numarasının ilk iki rakamını kontrol et
    if (phoneNumber[0] !== '0' || phoneNumber[1] !== '5') {
        input.setCustomValidity("Telefon numarası '05' ile başlamalıdır.");
        input.reportValidity();
        return false;
    }

    // Tüm kontroller geçtiyse
    input.setCustomValidity(""); // Hata yok, alan geçerli
    return true;
}

// Adres Validasyonu
function validateAdress(input) {
    if (input.value.trim().length < 5) {
        input.setCustomValidity("Adres en az 5 karakter uzunluğunda olmalıdır.");
        input.reportValidity();
        return false;
    }

    input.setCustomValidity(""); // Geçerli alan
    return true;
}

document.getElementById('siparis-ver-btn').addEventListener('click', function (event) {
    const cartItemsContainer = document.querySelector('.cart-items-container');
    const cartItems = cartItemsContainer.querySelectorAll('.cart-item');

    if (cartItems.length === 0) {
        event.preventDefault();
        alert('Sepetinizde ürün bulunmamaktadır!');
        return;
    }
});



