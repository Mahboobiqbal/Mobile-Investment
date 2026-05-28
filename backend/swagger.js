const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mobile Investment API',
      version: '1.0.0',
      description: 'Backend API for the Mobile Investment platform',
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

module.exports = swaggerJsdoc(options);
