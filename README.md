# E-Learning Platform

## Mô tả dự án

Đây là nền tảng học trực tuyến (E-Learning Platform) được phát triển như đồ án cuối kỳ môn **SE347 - Phân tích và Thiết kế Hệ thống** tại trường Đại học Công nghệ Thông tin (UIT).

Nền tảng này cung cấp một giải pháp toàn diện cho việc học trực tuyến, cho phép người dùng tạo, quản lý và tham gia các khóa học với các tính năng hiện đại như video streaming, bài kiểm tra, theo dõi tiến độ, thanh toán trực tuyến, và hỗ trợ AI.

## Tính năng chính

### Đối với Học viên (Students)
- Đăng ký và đăng nhập tài khoản
- Duyệt và đăng ký khóa học
- Xem video bài giảng (HLS streaming)
- Tham gia bài kiểm tra và câu hỏi trắc nghiệm
- Theo dõi tiến độ học tập
- Ghi chú video và đặt câu hỏi
- Tham gia Q&A với giảng viên
- Đánh giá và nhận xét khóa học
- Thanh toán trực tuyến (VNPay, PayPal, MoMo)
- Nhận đề xuất khóa học cá nhân hóa
- Chatbot AI hỗ trợ (sử dụng OpenAI và LangChain)

### Đối với Giảng viên (Instructors)
- Tạo và quản lý khóa học
- Upload video và tài liệu
- Tạo bài kiểm tra và câu hỏi
- Quản lý học viên và tiến độ
- Phân tích hiệu suất học viên
- Tương tác với học viên qua Q&A

## Kiến trúc hệ thống

### Backend
- **Framework**: Node.js với Express.js
- **Database**: MongoDB với Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **AI Integration**: OpenAI API, LangChain
- **Cloud Services**: AWS S3, Cloudinary, Lambda
- **Payment Gateways**: VNPay, PayPal, MoMo
- **Video Caption Generation**: Python service sử dụng AWS Lambda
- **Video HLS Conversion**: Python service cho chuyển đổi video

### Frontend
- **Framework**: React với Vite
- **State Management**: Redux Toolkit
- **UI Components**: Radix UI, Tailwind CSS
- **Rich Text Editor**: TipTap
- **Drag & Drop**: @dnd-kit


