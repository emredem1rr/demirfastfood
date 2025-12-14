# Demir Fast Food 🍔🍟

Demir Fast Food, Node.js ve Express.js kullanılarak geliştirilmiş bir fast food sipariş uygulamasıdır. Uygulama; ürün listeleme, sepet yönetimi, sipariş oluşturma ve admin paneli gibi temel e-ticaret fonksiyonlarını içerir. Projede session tabanlı sepet sistemi ve MySQL veritabanı kullanılmıştır.

Bu proje eğitim ve geliştirme amaçlı olarak hazırlanmıştır.

## Özellikler

- Sepete ürün ekleme ve çıkarma
- Sipariş oluşturma ve sipariş geçmişi görüntüleme
- Kullanıcı bilgileri ile sipariş alma
- Admin giriş sistemi
- Admin paneli üzerinden sipariş ve ürün yönetimi
- Session tabanlı sepet yapısı
- MySQL veritabanı
- Sequelize ORM kullanımı
- EJS template engine

## Kullanılan Teknolojiler

Node.js, Express.js, MySQL, Sequelize ORM, EJS, express-session, mysql2, dotenv


## Kurulum

Projeyi bilgisayarınıza klonlayın:

git clone https://github.com/emredem1rr/demirfastfood.git

cd demirfastfood/app

Bağımlılıkları yükleyin:

npm install

## Ortam Değişkenleri

Uygulamanın çalışması için `app/` klasörü içine `.env` dosyası oluşturulmalıdır.

PORT=3000
SESSION_SECRET=your_session_secret

DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name


`.env` dosyası güvenlik sebebiyle GitHub reposuna eklenmemiştir.

## Uygulamayı Çalıştırma

npm start

Uygulama çalıştıktan sonra tarayıcıdan aşağıdaki adresten erişilebilir:

http://localhost:3000

## Admin Paneli

Admin giriş sayfasına aşağıdaki adresten ulaşabilirsiniz:

/adminGiris

Admin paneli üzerinden siparişler ve ürünler yönetilebilir.

## Notlar

- Sepet sistemi session bazlı çalışmaktadır
- Sequelize kullanılarak veritabanı tabloları otomatik olarak senkronize edilir
- Proje öğrenme ve geliştirme amaçlıdır

## Geliştirici

Emre Demir  
GitHub: https://github.com/emredem1rr

## Lisans

Bu proje eğitim ve kişisel kullanım amaçlıdır.
