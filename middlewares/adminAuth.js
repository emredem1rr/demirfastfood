const { AdminSession } = require('../models'); // AdminSession modelini buradan çekiyoruz.

const adminAuth = async (req, res, next) => {
    try {
        // sessionId değerini kontrol et
        const sessionId = req.session?.sessionId; // Güvenli bir şekilde erişim
        console.log('Session ID:', sessionId); // Debugging için log ekleyin
        
        if (!sessionId) {
            console.warn('Session ID bulunamadı. Oturum açma sayfasına yönlendiriliyor.');
            return res.redirect('/adminGiris');
        }

        // Veritabanında sessionId arıyoruz
        const adminSession = await AdminSession.findOne({ where: { sessionId } });

        if (!adminSession) {
            console.warn(`Session ID '${sessionId}' veritabanında bulunamadı.`);
            return res.redirect('/adminGiris');
        }

        console.log('Oturum doğrulandı:', adminSession); // Doğrulama bilgisi

        // Middleware'den sonraki route'a geç
        next();
    } catch (error) {
        console.error('Oturum doğrulama hatası:', error); // Hata logu
        res.status(500).send("Oturum doğrulama hatası");
    }
};

module.exports = adminAuth;
