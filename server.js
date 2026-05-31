import app from "./src/app.js";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import logger from "./src/utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

// Load .env relative to root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const PORT = process.env.PORT || 5000;

// Cấu hình Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Music Market API Documentation",
      version: "1.0.0",
      description: "Hệ thống tài liệu hướng dẫn sử dụng các API Music Market",
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: "Local Development Server",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Mount tài liệu Swagger trên đường dẫn /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(PORT, () => {
  logger.info(`===============================================`);
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Listening on http://localhost:${PORT}`);
  logger.info(`Swagger API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`===============================================`);
});
