# vidTube
# 🎥 vidTube

"vidTube" is a Node.js backend project that simulates the core functionalities of a modern video-sharing platform. It demonstrates clean code architecture using MVC principles, RESTful API design, file uploads to the cloud, and secure key management. This project is ideal for brushing up on your backend development knowledge.

---

## 🚀 Features

- 🔧 MVC Architecture: Cleanly separated Models, Controllers, and Routes.
- 🔐 Environment Security: Uses `dotenv` to secure sensitive keys like API tokens.
- ☁️ Cloudinary Integration: Upload and store images/videos directly to the cloud.
- 📦 Modular Design: Loosely coupled components for better maintainability.
- 📁 Public/Temp Storage: Temporarily stores files before cloud upload.
- 🧭 Custom API Responses and Error Handling: Consistent and informative error messages.
- 📜 Routing System: Organized RESTful routes for resources.
- ⚙️ Middleware Integration: Logging, parsing, and custom middleware support.

---

## 📁 Project Structure
vidTube/
├── Node modules
├── controllers/ # Handles business logic
├── models/ # Database schemas/models
├── routes/ # API endpoints definitions
├── middlewares/ # Custom middleware (auth, error handlers)
├── public/temp/ # Temporary file storage
├── utils/ # Utility functions (e.g. apiResponse.js, apiError.js)
├── config/ # Cloudinary & dotenv configuration
├── app.js # Express app setup
├── index.js # Entry point of the application
└── .env # Environment variables (not committed)

---

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/vidTube.git
   cd vidTube
2. Install Dependencies:
  npm install
3. Create a .env file in the root directory and add:
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    JWT_SECRET=your_jwt_secret
4. Run the server
  npm start
📡 API Endpoints
| Method | Endpoint             | Description                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/api/upload`        | Uploads a file to Cloudinary |
| GET    | `/api/videos`        | Fetches all videos           |
| POST   | `/api/auth/register` | User registration            |
| POST   | `/api/auth/login`    | User login                   |

🧪 Testing
To test the API endpoints, use tools like:
    Postman
    Insomnia
✨ Acknowledgments
    Express.js
    Cloudinary
    MongoDB
