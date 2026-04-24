export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fastik API',
    version: '0.2.0',
    description: 'REST API for the Fastik freelance marketplace diploma project.',
  },
  servers: [
    {
      url: 'http://localhost:4200/api',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Registration, login and current user session',
    },
    {
      name: 'Health',
      description: 'Service diagnostics',
    },
    {
      name: 'Marketplace',
      description: 'Categories, jobs and applications',
    },
    {
      name: 'Profile',
      description: 'Onboarding, skills and portfolio',
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
    schemas: {
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          role: {
            type: 'string',
            enum: ['customer', 'performer', 'support', 'moderator', 'admin', 'super_admin'],
          },
          status: { type: 'string', enum: ['active', 'blocked'] },
          emailVerified: { type: 'boolean' },
          lastLoginAt: { type: 'string', nullable: true },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthUser' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/auth/roles': {
      get: {
        tags: ['Auth'],
        summary: 'Get roles available for self registration',
        responses: {
          '200': {
            description: 'Available roles',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a customer or performer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'displayName', 'role'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  displayName: { type: 'string', minLength: 2 },
                  role: { type: 'string', enum: ['customer', 'performer'] },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registered user with access token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Authenticated user with access token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
          '403': { description: 'Blocked user' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user',
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/marketplace/categories': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get active marketplace categories',
        responses: {
          '200': { description: 'Active categories' },
        },
      },
    },
    '/marketplace/jobs': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get published jobs',
        responses: {
          '200': { description: 'Job list' },
        },
      },
      post: {
        tags: ['Marketplace'],
        summary: 'Create a job as customer',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Created job detail' },
          '403': { description: 'Only customers can create jobs' },
        },
      },
    },
    '/marketplace/jobs/{id}': {
      get: {
        tags: ['Marketplace'],
        summary: 'Get job detail',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Job detail' },
          '404': { description: 'Job not found' },
        },
      },
    },
    '/marketplace/jobs/{id}/applications': {
      post: {
        tags: ['Marketplace'],
        summary: 'Apply to a job as performer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '201': { description: 'Updated job detail' },
          '403': { description: 'Only performers can apply' },
          '409': { description: 'Application conflict' },
        },
      },
    },
    '/marketplace/jobs/{jobId}/applications/{applicationId}/select': {
      post: {
        tags: ['Marketplace'],
        summary: 'Select performer application',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'jobId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Job moved to in progress' },
          '403': { description: 'Only owner or manager can select' },
          '404': { description: 'Job or application not found' },
        },
      },
    },
    '/profile/me': {
      get: {
        tags: ['Profile'],
        summary: 'Get current user profile summary',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Profile summary with onboarding progress' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Update current user base and role-specific profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Updated profile summary' },
          '400': { description: 'Validation error' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/profile/options/skills': {
      get: {
        tags: ['Profile'],
        summary: 'Get available skills for onboarding',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Skill options grouped by categories on the client' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/profile/me/skills': {
      put: {
        tags: ['Profile'],
        summary: 'Replace performer skills',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Updated profile summary' },
          '403': { description: 'Only performers can update skills' },
        },
      },
    },
    '/profile/me/portfolio': {
      post: {
        tags: ['Profile'],
        summary: 'Create performer portfolio item',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Updated profile summary' },
          '403': { description: 'Only performers can edit portfolio' },
        },
      },
    },
    '/profile/me/portfolio/{id}': {
      put: {
        tags: ['Profile'],
        summary: 'Update performer portfolio item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated profile summary' },
          '404': { description: 'Portfolio item not found' },
        },
      },
      delete: {
        tags: ['Profile'],
        summary: 'Delete performer portfolio item',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated profile summary' },
          '404': { description: 'Portfolio item not found' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API availability',
        responses: {
          '200': {
            description: 'API is running',
          },
        },
      },
    },
    '/health/database': {
      get: {
        tags: ['Health'],
        summary: 'Check database connection',
        responses: {
          '200': {
            description: 'Database is available',
          },
          '503': {
            description: 'Database is unavailable',
          },
        },
      },
    },
  },
};
