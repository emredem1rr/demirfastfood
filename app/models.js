const { DataTypes } = require('sequelize');
const sequelize = require('./db');
const bcrypt = require('bcrypt');

const CartItem = sequelize.define('CartItem', {
    sessionId: { type: DataTypes.STRING, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
});

const Order = sequelize.define('Order', {
    sessionId: { type: DataTypes.STRING, allowNull: false },
    OrderStatus: {
      type: DataTypes.ENUM('ALINDI', 'HAZIRLANIYOR', 'YOLDA','TAMAMLANDI'),
      allowNull: false,
      defaultValue: 'ALINDI'
    },
});

const OrderItem = sequelize.define('OrderItem', {
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
});

const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    isim: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    kategori: {
      type: DataTypes.ENUM('URUN', 'MENU', 'ICECEK'),
      allowNull: false,
    },
    fiyat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    eski_fiyat: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
    gramaj: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kalori: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resim: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: 'urunler',
    timestamps: false,
  });

const User = sequelize.define('User', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phone: { type: DataTypes.STRING, allowNull: false },
    adress: { type: DataTypes.STRING, allowNull: false },
}, {
    tableName: 'users',
    timestamps: false,
});

const Admin = sequelize.define('Admin', {
  id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
  },
  username: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
  },
  password: { 
      type: DataTypes.STRING, 
      allowNull: false 
  },
}, {
  tableName: 'admins',
  timestamps: false,
});

const AdminSession = sequelize.define('AdminSession', {
  sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
  },
  adminId: {
      type: DataTypes.INTEGER,
      allowNull: false
  },
  createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'adminsessions',
  timestamps: false,
});

CartItem.belongsTo(Product, { foreignKey: 'productId', targetKey: 'id' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', targetKey: 'id' });
Product.hasMany(CartItem, { foreignKey: 'productId', sourceKey: 'id' });
Order.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', sourceKey: 'id'});
User.hasMany(Order, { foreignKey: 'userId', sourceKey: 'id' });
sequelize.sync(); // Veritabanını oluşturur veya günceller.

async function createOrder(sessionId, name, email, phone, adress) {
    // 1. Kullanıcıyı veritabanına kaydet

    let user;
        user = await User.create({
            name: name,
            email: email,
            phone: phone,
            adress: adress,
        });
    const cartItems = await CartItem.findAll({
        where: { sessionId: sessionId },
        include: [{
            model: Product,
            attributes: ['id', 'isim', 'fiyat']
        }]
    });

    if (cartItems.length === 0) {
        throw new Error('Sepetinizde ürün bulunmamaktadır.');
    }

    // 3. Yeni bir sipariş oluştur ve kullanıcı ile ilişkilendir
    const newOrder = await Order.create({
        sessionId: sessionId,
        userId: user.id,  // Kullanıcıyı ilişkilendir
    });

    // 4. Sipariş öğelerini `OrderItem` tablosuna kaydet
    for (const cartItem of cartItems) {
        const product = cartItem.Product;

        await OrderItem.create({
            orderId: newOrder.id,
            productId: product.id,
            quantity: cartItem.quantity
        });
    }

    // 5. Sepetteki ürünleri sil
    await CartItem.destroy({
        where: { sessionId: sessionId }
    });

    // 6. Sipariş başarılı olduğunda geri dönüş yapılabilir
    return {
        orderId: newOrder.id,
        userId: user.id,
        message: 'Sipariş başarıyla oluşturuldu.'
    };
}

async function loginAdmin(req, username, password) {
  console.log("calistim");
  // Admini veritabanında arayın
  const admin = await Admin.findOne({ where: { username } });
  if (!admin) {
      return false;
  }

  // Şifreyi kontrol et
  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
      return false;
  }

  // Yeni bir sessionId oluştur
  const sessionId = req.session.sessionId;

  // Yeni admin oturumu oluştur ve kaydet
  await AdminSession.create({
      sessionId: sessionId,
      adminId: admin.id
  });

  return true;
}

async function logoutAdmin(req, res) {
    try {
        // Get the sessionId from the current session
        const sessionId = req.session.sessionId;
        
        if (!sessionId) {
            return res.status(400).send("No active session found.");
        }
        await AdminSession.destroy({
            where: { sessionId: sessionId }
        });
        res.redirect('/adminGiris');

    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).send("An error occurred during logout.");
    }
}


module.exports = { CartItem, Order, OrderItem, Product, createOrder,User,loginAdmin,logoutAdmin,AdminSession };
