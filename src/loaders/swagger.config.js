import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const port = process.env.PORT || 3000;
const apiPrefix = process.env.API_PREFIX || "/api/v1";
const serverUrl = process.env.API_PUBLIC_URL || `http://localhost:${port}`;

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "IoT Fall Detection API",
    version: "1.0.0",
    description: "Backend API cho hệ thống phát hiện té ngã ở người cao tuổi.",
  },
  servers: [
    {
      url: `${serverUrl}${apiPrefix}`,
      description: "Local/API server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Xác thực, OTP và tài khoản người dùng",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
  app.use("/swagger/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "IoT Fall Detection API Docs",
  }));
}
