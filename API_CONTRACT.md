# API Contract for Frontend Integration

Tài liệu này tổng hợp các API chính phục vụ cho việc phát triển ứng dụng Frontend (bao gồm cổng Public cho khách hàng và cổng Admin/Producer).

---

## 1. Authentication (Xác thực)

### 1.1 Đăng nhập (Login)
- **Endpoint**: `POST /auth/login`
- **Token Requirement**: Không (Public)
- **Request Body**:
  ```json
  {
    "email": "admin@musicmarket.com",
    "password": "adminpassword"
  }
  ```
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "user_id": "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7",
        "username": "Admin User",
        "email": "admin@musicmarket.com",
        "role": "admin",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_active": true
      }
    }
  }
  ```

### 1.2 Lấy thông tin tài khoản hiện tại (Get Me)
- **Endpoint**: `GET /auth/me`
- **Token Requirement**: **Bắt buộc** (Bearer Token)
  - *Header*: `Authorization: Bearer <JWT_TOKEN>`
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin người dùng thành công",
    "data": {
      "user": {
        "user_id": "a8e9c612-40db-4ff0-87a0-0f8b3b4f6cf7",
        "username": "Admin User",
        "email": "admin@musicmarket.com",
        "role": "admin",
        "avatar_url": "https://example.com/avatar.jpg",
        "is_active": true,
        "created_at": "2026-05-31T10:00:00.000Z",
        "updated_at": "2026-05-31T10:00:00.000Z"
      }
    }
  }
  ```

---

## 2. Public Track APIs (Dành cho Trang chủ / Tìm kiếm / Chi tiết nhạc)

### 2.1 Duyệt danh sách bài nhạc (Get Tracks)
- **Endpoint**: `GET /tracks`
- **Token Requirement**: Không (Public)
- **Query Parameters (Optional)**:
  - `genre`: Lọc theo slug hoặc ID thể loại nhạc.
  - `mood`: Lọc theo slug hoặc ID mood.
  - `tag`: Lọc theo slug hoặc ID tag.
  - `bpm_min` / `bpm_max`: Giá trị BPM tối thiểu / tối đa (số nguyên).
  - `musical_key`: Tông nhạc (ví dụ: `C Major`, `D Minor`).
  - `search`: Tìm kiếm theo tiêu đề bài nhạc.
  - `page`: Trang hiện tại (mặc định: `1`).
  - `limit`: Số bài nhạc trên mỗi trang (mặc định: `10`).
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách thành công",
    "data": {
      "tracks": [
        {
          "track_id": 1,
          "title": "Chill Lofi Beat",
          "slug": "chill-lofi-beat",
          "bpm": 85,
          "musical_key": "C Major",
          "duration_seconds": 180,
          "cover_image_url": "https://example.com/cover.jpg",
          "preview_audio_url": "https://example.com/preview.mp3",
          "allow_inquiry": true,
          "view_count": 150
        }
      ],
      "pagination": {
        "total": 45,
        "page": 1,
        "limit": 10,
        "totalPages": 5
      }
    }
  }
  ```

### 2.2 Xem chi tiết bài nhạc (Get Track Details)
- **Endpoint**: `GET /tracks/:slug`
- **Token Requirement**: Không (Public)
- **Path Parameter**:
  - `slug`: Slug của bài nhạc (ví dụ: `chill-lofi-beat`).
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "track_id": 1,
      "title": "Chill Lofi Beat",
      "slug": "chill-lofi-beat",
      "bpm": 85,
      "musical_key": "C Major",
      "duration_seconds": 180,
      "cover_image_url": "https://example.com/cover.jpg",
      "preview_audio_url": "https://example.com/preview.mp3",
      "allow_inquiry": true,
      "view_count": 151
    }
  }
  ```

### 2.3 Ghi nhận lượt nghe nhạc demo (Log Play)
- **Endpoint**: `POST /tracks/:trackId/play`
- **Token Requirement**: Không (Public)
- **Path Parameter**:
  - `trackId`: ID bài nhạc.
- **Request Body**:
  ```json
  {
    "played_seconds": 30
  }
  ```
- **Response mẫu (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Ghi nhận lượt nghe thành công"
  }
  ```

---

## 3. Public Inquiry APIs (Dành cho việc hỏi mua nhạc)

### 3.1 Gửi yêu cầu mua nhạc (Create Inquiry)
- **Endpoint**: `POST /inquiries`
- **Token Requirement**: Không (Public)
- **Request Body**:
  ```json
  {
    "customer_name": "Nguyen Van A",
    "customer_email": "nva@example.com",
    "customer_phone": "0901234567",
    "company_name": "Cong ty Giai Tri XYZ",
    "social_link": "https://facebook.com/nva",
    "note": "Tôi muốn mua bài hát này bản quyền độc quyền",
    "track_id": 1,
    "preferred_license_option_id": 2,
    "usage_purpose": "commercial_release",
    "usage_description": "Phát hành trên các nền tảng streaming âm nhạc",
    "budget": 5000000,
    "currency": "VND",
    "message": "Vui lòng liên hệ sớm nhất"
  }
  ```
- **Response mẫu (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Gửi yêu cầu mua nhạc thành công.",
    "data": {
      "inquiry": {
        "purchase_inquiry_id": 12,
        "status": "new",
        "customer_name": "Nguyen Van A",
        "created_at": "2026-05-31T10:15:00.000Z"
      }
    }
  }
  ```

### 3.2 Tra cứu trạng thái yêu cầu mua nhạc (Get Inquiry Status)
- **Endpoint**: `GET /inquiries/:purchaseInquiryId/status`
- **Token Requirement**: Không (Public)
- **Path Parameter**:
  - `purchaseInquiryId`: ID của yêu cầu mua nhạc được trả về từ API tạo yêu cầu.
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "inquiry": {
        "purchase_inquiry_id": 12,
        "status": "new",
        "customer_name": "Nguyen Van A",
        "created_at": "2026-05-31T10:15:00.000Z"
      }
    }
  }
  ```

---

## 4. Admin Dashboard APIs (Dành cho trang Dashboard của Quản trị viên)

*Tất cả các API dưới đây yêu cầu Authorization Header với quyền **admin**.*

### 4.1 Số liệu thống kê tổng hợp (Summary Stats)
- **Endpoint**: `GET /admin/dashboard/summary`
- **Token Requirement**: **Bắt buộc** (Bearer Token & Role: `admin`)
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "tracks_count": 45,
      "inquiries_count": 12,
      "purchases_count": 8,
      "total_revenue": 35000000.00
    }
  }
  ```

### 4.2 Top bài nhạc được tương tác nhiều nhất (Top Tracks)
- **Endpoint**: `GET /admin/dashboard/top-tracks`
- **Token Requirement**: **Bắt buộc** (Bearer Token & Role: `admin`)
- **Query Parameters (Optional)**:
  - `sortBy`: Tiêu chí sắp xếp (`play_count` hoặc `inquiry_count`. Mặc định: `play_count`).
  - `limit`: Giới hạn số lượng bản ghi (Mặc định: `10`).
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "track_id": 1,
        "title": "Chill Lofi Beat",
        "play_count": 1500,
        "inquiry_count": 12
      },
      {
        "track_id": 2,
        "title": "Summer Vibe Pop",
        "play_count": 920,
        "inquiry_count": 5
      }
    ]
  }
  ```

### 4.3 Biểu đồ thống kê doanh thu hàng ngày (Revenue Chart Data)
- **Endpoint**: `GET /admin/dashboard/revenue`
- **Token Requirement**: **Bắt buộc** (Bearer Token & Role: `admin`)
- **Query Parameters (Optional)**:
  - `startDate`: Ngày bắt đầu định dạng `YYYY-MM-DD` (Ví dụ: `2026-05-01`).
  - `endDate`: Ngày kết thúc định dạng `YYYY-MM-DD` (Ví dụ: `2026-05-31`).
- **Response mẫu (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "date": "2026-05-15",
        "revenue": 12000000.00
      },
      {
        "date": "2026-05-20",
        "revenue": 5000000.00
      },
      {
        "date": "2026-05-28",
        "revenue": 18000000.00
      }
    ]
  }
  ```
