# Hệ thống phát hiện té ngã cho người cao tuổi (IoT Fall Detection)

Đồ án đa ngành. Hệ thống IoT giúp giám sát và phát hiện té ngã cho người cao tuổi trong không gian sinh hoạt.

## 🏗️ Kiến trúc thư mục (Folder Structure)

```text
src/
├── common/       # Các hằng số, helper chung cho dự án
├── config/       # Cấu hình môi trường, DB, MQTT, Third-party APIs
├── controllers/  # Xử lý các request HTTP từ Client
├── helpers/      # Các hàm tiện ích logic
├── jobs/         # Tác vụ chạy nền (Cron jobs, dọn dẹp log/video)
├── loaders/      # Khởi tạo các kết nối (Database, MQTT, Express App)
├── middleware/   # Authentication, Authorization, Validation
├── models/       # Định nghĩa Data models (Prisma)
├── routes/       # Định nghĩa API endpoints
└── services/     # Business logic (xử lý phát hiện té ngã, luồng dữ liệu IoT)

