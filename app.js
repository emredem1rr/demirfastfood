require('dotenv').config();
const express = require('express');

const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const sequelize = require('./db');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

const { CartItem, Order, OrderItem, Product,createOrder,loginAdmin,AdminSession,User} = require('./models');
const adminRouter = require('./routes/admin');

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const sessionStore = new SequelizeStore({
    db: sequelize,
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}));

sessionStore.sync();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

  
  // Veritabanına bağlan
db.connect(err => {
    if (err) {
      console.error('MySQL bağlantı hatası:', err);
      process.exit(1);
    }
    console.log('MySQL bağlantısı başarılı.');
});
  
  // EJS ayarları
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
  
  // Statik dosyalar için public klasörü kullan
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminRouter);

// Burada tüm yönlendirmeler ve işlem akışları devam eder
app.get('/adminGiris', async (req, res) => {
  try {
    const error = req.query.error || null;
    const sessionId = req.session.sessionId;

    const adminSession = await AdminSession.findOne({ where: { sessionId } });

    if (adminSession) {
      return res.redirect('/admin');
    }
    res.render('adminGiris', { error });
  } catch (err) {
    console.error('adminGiris hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});


app.get('/siparislerim', async (req, res) => {
    const sessionId = req.session.sessionId;

    try {
        const orders = await Order.findAll({
            where: { sessionId },
            include: [
              {
                model: OrderItem,
                include: [Product]
              },
              {
                model: User,
                attributes: ['name', 'email', 'phone', 'adress']
              }
            ],
            order: [['OrderStatus', 'ASC']] // OrderStatus'a göre artan sıralama
          });
          
          
        // Eğer sipariş bulunmazsa, boş bir dizi döndür
        if (!orders || orders.length === 0) {
            return res.render('siparislerim', { orders: [] });
        }

        // Siparişler ile birlikte sayfayı render et
        res.render('siparislerim', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Sunucu hatası');
    }
});


app.post('/adminGiris', async (req, res) => {
    const { username, password } = req.body;

    const sessionId = req.session.sessionId;

    // AdminSession tablosunda bu sessionId'yi kontrol et
    const adminSession = await AdminSession.findOne({ where: { sessionId } });

    // Eğer sessionId bulunamazsa, admin girişine yönlendir
    if (adminSession) {
        return res.redirect('/admin');
    }
    try {
        const isLoginSuccessful = await loginAdmin(req, username, password); // await kullanarak sonucu bekle

        if (!isLoginSuccessful) {
            console.log('Kullanıcı adı veya şifre hatalı.');
            return res.render('adminGiris', { error: 'Kullanıcı adı veya şifre hatalı!' });
        } else {
            // Giriş başarılı, admin paneline yönlendir
            res.redirect('/admin');
        }
    } catch (error) {
        console.error('Admin giriş hatası:', error.message);
        res.status(500).send('Sunucu hatası meydana geldi.');
    }
});


// Sunucu başlatma
app.listen(port, async () => {
    console.log('Sunucu 3000 portunda çalışıyor.');
    try {
        await sequelize.authenticate();
        console.log('Veritabanı bağlantısı başarılı.');
        await sequelize.sync();
    } catch (error) {
        console.error('Veritabanı bağlantı hatası:', error);
    }
});


// Ana sayfa
app.get('/', (req, res) => {
  res.redirect('/anasayfa');
});

// Oturum oluşturma
app.use((req, res, next) => {
    if (!req.session.sessionId) {
        req.session.sessionId = `session_${Date.now()}`;
    }
    next();
});

// Sepete ürün ekleme
app.post('/cart', async (req, res) => {
    const { productId, quantity } = req.body;
    const sessionId = req.session.sessionId;

    try {
        const cartItem = await CartItem.findOne({ where: { sessionId, productId } });
        if (cartItem) {
            cartItem.quantity += quantity;
            await cartItem.save();
        } else {
            await CartItem.create({ sessionId, productId, quantity });
        }
        res.json({ message: 'Ürün sepete eklendi.' });
    } catch (error) {
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});

// Sepeti görüntüleme
app.get('/cart', async (req, res) => {
    const sessionId = req.session.sessionId;

    try {
        // CartItem ile ilişkili Product bilgilerini dahil et
        const cartItems = await CartItem.findAll({
            where: { sessionId },
            include: [
                {
                    model: Product, // Product modelini dahil et
                    attributes: ['id', 'isim', 'fiyat', 'resim'], // İstediğiniz alanları seçin
                },
            ],
        });

        // Verileri işleyerek istemciye gönder
        const cartDetails = cartItems.map(cartItem => ({
            id: cartItem.Product.id,
            productName: cartItem.Product.isim, // 'isim' yerine doğru alanı kullanın
            mainPrice: cartItem.Product.fiyat, // 'fiyat' yerine doğru alanı kullanın
            imgSrc: cartItem.Product.resim, // 'resim' yerine doğru alanı kullanın
            count: cartItem.quantity,
        }));

        res.json(cartDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});

app.delete('/cart/:productId', async (req, res) => {
    const { productId } = req.params;
    const sessionId = req.session.sessionId;

    try {
        // Sepetteki ürünü bul ve miktarını bir azalt
        const cartItem = await CartItem.findOne({
            where: {
                sessionId,
                productId, // Ürün ID'si ile eşleşen öğeyi bul
            },
        });

        if (!cartItem) {
            return res.status(404).json({ error: "Sepette öğe bulunamadı." });
        }

        // Miktarı 1 azalt
        if (cartItem.quantity > 1) {
            cartItem.quantity -= 1;
            await cartItem.save();
        } else {
            // Miktar 1 ise öğeyi tamamen sil
            await cartItem.destroy();
        }

        res.status(200).json({ message: "Sepet güncellendi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});


// Sipariş oluşturma
app.post('/order', async (req, res) => {
    const sessionId = req.session.sessionId;

    try {
        const cartItems = await CartItem.findAll({ where: { sessionId } });
        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Sepet boş!' });
        }

        const order = await Order.create({ sessionId });
        const orderItems = cartItems.map(item => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
        }));

        await OrderItem.bulkCreate(orderItems);
        await CartItem.destroy({ where: { sessionId } });

        res.json({ message: 'Sipariş oluşturuldu.', order });
    } catch (error) {
        res.status(500).json({ error: 'Bir hata oluştu.' });
    }
});

app.get('/index', (req, res) => {
    const query1 = "SELECT * FROM urunler where kategori = 'MENU'";
    const query2 = "SELECT * FROM urunler where kategori = 'URUN'";
    const query3 = "SELECT * FROM urunler where kategori = 'ICECEK'";

    //Tüm sorguları paralel çalıştırmak için
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(query1, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(query2, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(query3, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
    ])
        .then(([menuler, urunler, icecekler]) => {
            // EJS view'ına veri gönder
            res.render('index', { menuler, urunler, icecekler });
        })
        .catch((err) => {
            console.error('Veri alırken hata oluştu:', err);
            res.status(500).send('Sunucu hatası.');
        });
});

app.get('/anasayfa', (req, res) => {
    res.render('anasayfa');
});

app.get('/menu', (req, res) => {
    const query = "SELECT * FROM urunler where kategori = 'MENU'";
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Veritabanı hatası');
        }
        res.render('menu', { products: results });
    });
});

app.get('/urunler', (req, res) => {
    const query = "SELECT * FROM urunler where kategori = 'URUN'";
    db.query(query, (err, results) => {
      if (err) {
        return res.status(500).send('Veritabanı hatası.');
      }
      res.render('urunler', { urunler: results });
    });
});

app.get('/icecekler', (req, res) => {
    const query = "SELECT * FROM urunler where kategori = 'ICECEK'";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Veritabanı hatası.');
    }
    res.render('icecekler', { drinks: results });
  });
});

app.get("/kayit", (req, res) => {
    res.render("kayit");
  });

  app.post('/index', (req, res) => {
    const { name, email, phone, adress } = req.body;

    if (!name || !email || !phone || !adress) {
        return res.redirect('/index');
    }
    res.redirect('/index');
    
});

// GET: /index endpoint'i
app.get('/index', (req, res) => {
    const message = req.query.message || '';
    res.render('index', { message });
});

app.post('/siparisolustur', async (req, res) => {
    const { name, email, phone, adress } = req.body;
    console.log('Gelen veri:', req.body);
    const sessionId = req.session.sessionId;

    try {
        const result = await createOrder(sessionId, name, email, phone, adress);

        // Sipariş başarıyla oluşturulduysa
        res.send(`
            <script>
                alert("Sipariş Başarıyla Oluşturuldu!");
                window.location.href = '/index'; // Başarıyla sipariş oluşturulduktan sonra index sayfasına yönlendir
            </script>
        `);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


