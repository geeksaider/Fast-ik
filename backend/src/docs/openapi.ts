export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fastik API',
    version: '0.1.0',
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
      name: 'Health',
      description: 'Service diagnostics',
    },
  ],
  paths: {
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
