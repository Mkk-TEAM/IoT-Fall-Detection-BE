import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerDefinition = {
    openapi: "3.0.0",
    info: {
        title: "IoT Fall Detection API",
        version: "1.0",
        description: "Hệ thống phát hiện té ngã ở người cao tuổi (ĐAĐN - 252)"
    },

    // Truy cập vào API tại http://localhost:3000/swagger/api
    servers: [
        {
            url: "http://localhost:3000",
        }
    ],

    tags: [
        {
            name: "Auth",
            description: "Các APIs cho Authentication",
        },
    ],

    "components": {
        "securitySchemes": {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
        }
    }



}

const options = {
    definition: swaggerDefinition,
    apis: ["../../routers/*.js", "./src/controllers/*.js"] // which contain Swagger comment
}

const swaggerSpec = swaggerJSDoc(options)

export function setupSwagger(app){
    app.use("/swagger/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}