import app from "./src/app.js";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import logger from "./src/utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";

// Load .env relative to root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const PORT = process.env.PORT || 5000;

import swaggerSpec from "./src/config/swagger.js";

// Mount tài liệu Swagger trên đường dẫn /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  logger.info(`===============================================`);
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`Listening on http://localhost:${PORT}`);
  logger.info(`Swagger API Docs: http://localhost:${PORT}/api-docs`);
  logger.info(`===============================================`);
});
