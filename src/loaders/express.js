
import rootRouter from '../routes/root.router.js';
import { errorHandler } from '../helpers/handleError.js';
import { setupSwagger } from './swagger.config.js'; 
// Import các cấu hình khác nếu có (swagger, cron...)

export default async (app) => {
    // Nạp tất cả các router với tiền tố API chung
    app.use(rootRouter);

    // Xử lý lỗi (phải để sau các route)
    app.use(errorHandler);

    // Nạp Swagger UI (nếu có)
    await setupSwagger(app);
};