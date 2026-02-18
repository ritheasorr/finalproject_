const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Final Project API',
    version: '1.0.0',
    description: 'API documentation for the final project backend.'
  },
  servers: [
    { url: 'http://localhost:3000' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  phoneNumber: { type: 'string' },
                  school: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Created' },
          400: { description: 'Missing required fields' },
          409: { description: 'Email already in use' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'OK' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'OK' },
          401: { description: 'Invalid refresh token' }
        }
      }
    },
    '/users/me': {
      get: {
        summary: 'Get current user',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'OK' },
          401: { description: 'Missing or invalid token' }
        }
      }
    },
    '/jobs': {
      get: {
        summary: 'List open jobs (candidate)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string' }
          },
          {
            name: 'title',
            in: 'query',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'OK' },
          403: { description: 'Candidate access required' }
        }
      },
      post: {
        summary: 'Create job (recruiter)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'type', 'company'],
                properties: {
                  title: { type: 'string' },
                  type: { type: 'string' },
                  company: { type: 'string' },
                  location: { type: 'string' },
                  description: { type: 'string' },
                  skills: { type: 'string', description: 'Comma-separated skills' },
                  attachment: { type: 'string', format: 'binary' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Created' },
          403: { description: 'Recruiter access required' }
        }
      }
    },
    '/jobs/{id}': {
      get: {
        summary: 'Get job by id (candidate)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: { description: 'OK' },
          404: { description: 'Job not found' }
        }
      }
    },
    '/applications/my': {
      get: {
        summary: 'List my applications (candidate)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'OK' },
          403: { description: 'Candidate access required' }
        }
      }
    },
    '/applications/received': {
      get: {
        summary: 'List received applications (recruiter)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'OK' },
          403: { description: 'Recruiter access required' }
        }
      }
    },
    '/applications/{id}/status': {
      patch: {
        summary: 'Update application status (recruiter)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['hired', 'rejected'] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Invalid status' },
          403: { description: 'Recruiter access required' }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
