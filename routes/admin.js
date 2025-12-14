const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const multer = require('multer');
const {Order, OrderItem, Product,User,logoutAdmin} = require('../models');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images');  // Dosyaların kaydedileceği klasör
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));  // Dosya ismi
    }
  });
  const upload = multer({ storage: storage });
router.use(adminAuth);
router.get('/', async (req, res) => {
    try {
        // Oturum middleware tarafından kontrol edildikten sonra bu kod çalışır.
        const products = await Product.findAll();
        const orders = await Order.findAll({
            include: [
                {
                    model: OrderItem,
                    include: [Product],
                },
                {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'adress'],
                },
            ],
        });

        res.render('admin', { product: products, orders });
    } catch (error) {
        console.error('Veritabanı hatası:', error);
        res.status(500).send('Veritabanı hatası');
    }
});

router.get('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(id);
        if (product) {
            await product.destroy();
            const products = await Product.findAll();
            const orders = await Order.findAll({
                include: [{
                    model: OrderItem,
                    include: [Product]
                }, {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'adress']
                }],
            });
            return res.redirect('/admin');
        } else {
            res.status(404).send('Ürün bulunamadı');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Sunucu hatası');
    }
});


router.get('/edit/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByPk(id);
        if (product) {
            res.render('edit-product', { product });
        } else {
            res.status(404).send('Ürün bulunamadı');
        }
    } catch (error) {
        console.error('Error fetching product for editing:', error);
        res.status(500).send('Sunucu hatası');
    }
});

router.get('/order/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: OrderItem,
                    include: [Product],
                },
                {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'adress'],
                },
            ],
        });
        if (order) {
            res.render('orderDetails', {order});
        } else {
            res.status(404).send('Ürün bulunamadı');
        }
    } catch (error) {
        console.error('Error fetching product for editing:', error);
        res.status(500).send('Sunucu hatası');
    }
});

router.post('/order/:id', async (req, res) => {
    const { id } = req.params;
    const { orderStatus } = req.body;
    
    // ENUM'daki geçerli değerler
    const validStatuses = ['ALINDI', 'HAZIRLANIYOR', 'YOLDA', 'TAMAMLANDI'];
    
    try {
        // Siparişi bul
        const order = await Order.findByPk(id);
        console.log(orderStatus);
        if (order) {
            // Geçerli bir orderStatus olup olmadığını kontrol et
            if (validStatuses.includes(orderStatus)) {
                // Sipariş durumunu güncelle
                order.OrderStatus = orderStatus;
                await order.save();
                
                // Siparişin detay sayfasına yönlendir
                res.redirect(`/admin`);
            } else {
                res.status(400).send('Geçersiz sipariş durumu');
            }
        } else {
            res.status(404).send('Sipariş bulunamadı');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Sunucu hatası');
    }
});



router.post('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { isim, kategori, eski_fiyat, fiyat, gramaj, kalori } = req.body;
    let updateData = { isim, kategori, fiyat, eski_fiyat, gramaj, kalori };

    try {
        if (req.body.resimyolu && req.body.resimyolu.trim() !== '') {
            updateData.resim = "images/" + req.body.resimyolu;
        }

        await Product.update(updateData, { where: { id } });
        res.redirect('/admin');
    } catch (error) {
        console.error("Ürün düzenleme hatası:", error);
        res.status(500).send("Ürün düzenlenemedi");
    }
});

router.post('/add-product', upload.single('resim'), async (req, res) => {
    try {
        const { kategori, isim, fiyat, eski_fiyat, gramaj, kalori } = req.body;
        const resim = req.file ? "images/" + req.file.filename : null;  // Dosya yüklenmişse, dosya adını al
        await Product.create({
            kategori,
            isim,
            fiyat,
            eski_fiyat,  // Yeni alanı ekliyoruz
            gramaj,
            kalori,
            resim
        });
        const product = await Product.findAll();
        const orders = await Order.findAll({
            include: [{
                model: OrderItem,
                include: [Product]
            }, {
                model: User,
                attributes: ['name', 'email', 'phone', 'adress']
            }],
        });
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).send("Ürün eklenemedi");
    }
});

router.get('/logout', async (req, res) => {
    await logoutAdmin(req, res);
});


module.exports = router;
