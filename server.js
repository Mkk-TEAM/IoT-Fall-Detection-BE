import 'dotenv/config'; 
import app from './src/app.js'; 
import loaders from './src/loaders/index.js';

async function startServer() {
    try {
        // Nạp tất cả loader
        await loaders(app);

        // Xử lý 404 sau khi mọi route đã được nạp
        app.use((req, res) => {
            res.status(404).json({ message: 'Endpoint not found' });
        });
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🛡️  Server đang chạy tại port: ${PORT} 🛡️`);
        });
    } catch (error) {
        console.error('❌ Không thể khởi chạy server:', error);
        process.exit(1);
    }
}

startServer();