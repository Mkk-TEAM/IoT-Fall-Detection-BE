import expressLoader from './express.js';
import { connectDB } from './dbLoader.js'; // Giả sử bạn để hàm kết nối ở đây

export default async (app) => {
    // 1. Kết nối DB trước
    await connectDB();
    console.log('✅ Database đã kết nối');

    // 2. Nạp các cấu hình Express (Routes, Swagger, ErrorHandler)
    await expressLoader(app);
    console.log('✅ Express routes & middlewares đã nạp');
};