export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fastik API',
    version: '0.4.0',
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
      name: 'Finance',
      description: 'Mock wallet, escrow and transactions',
    },
    {
      name: 'Marketplace',
      description: 'Categories, jobs and applications',
    },
    {
      name: 'Orders',
      description: 'Orders in progress and escrow lifecycle',
    },
    {
      name: 'Communication',
      description: 'Order conversations and messages',
    },
    {
      name: 'Notifications',
      description: 'User event feed and unread state',
    },
    {
      name: 'Levels',
      description: 'Performer RPG roadmap, XP and level requirements',
    },
    {
      name: 'Performers',
      description: 'Public performer trust profiles, portfolio and reviews',
    },
    {
      name: 'Customers',
      description: 'Public customer profiles, jobs and contests',
    },
    {
      name: 'Admin',
      description: 'Operational dashboard, moderation, disputes, Elite interviews and audit log',
    },
    {
      name: 'Analytics',
      description: 'Role-aware customer, performer and admin product metrics',
    },
    {
      name: 'Contests',
      description: 'Level-gated contests for performers and customers',
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
    '/analytics/me': {
      get: {
        tags: ['Analytics'],
        summary: 'Get role-aware analytics summary for the current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Analytics metrics, pipeline, money and activity breakdowns' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/admin/overview': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin operational overview',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Admin stats, permissions and recent actions' },
          '403': { description: 'Manager role required' },
        },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List platform users for admins',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User list with balances and role state' },
          '403': { description: 'Admin role required' },
        },
      },
    },
    '/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Update user status',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated user' },
          '403': { description: 'Admin role required' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/admin/disputes': {
      get: {
        tags: ['Admin'],
        summary: 'List open order disputes',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Disputed orders' },
          '403': { description: 'Support/admin role required' },
        },
      },
    },
    '/admin/disputes/{id}/resolve': {
      post: {
        tags: ['Admin'],
        summary: 'Resolve dispute through mock escrow',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated dispute queue and resolution result' },
          '403': { description: 'Support/admin role required' },
          '409': { description: 'Dispute already resolved or invalid escrow state' },
        },
      },
    },
    '/admin/moderation/jobs': {
      get: {
        tags: ['Admin'],
        summary: 'List jobs for moderation',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Jobs ordered by moderation priority' },
          '403': { description: 'Moderator/admin role required' },
        },
      },
    },
    '/admin/moderation/jobs/{id}': {
      post: {
        tags: ['Admin'],
        summary: 'Approve or reject a job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Moderated job' },
          '403': { description: 'Moderator/admin role required' },
          '404': { description: 'Job not found' },
        },
      },
    },
    '/admin/interviews': {
      get: {
        tags: ['Admin'],
        summary: 'List performer Elite interview states',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Performer interview queue and latest decisions' },
          '403': { description: 'Admin role required' },
        },
      },
    },
    '/admin/interviews/{id}/decision': {
      post: {
        tags: ['Admin'],
        summary: 'Save Elite HR interview decision for performer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated interview queue after RPG progress recalculation' },
          '403': { description: 'Admin role required' },
          '404': { description: 'Performer not found' },
        },
      },
    },
    '/admin/audit-log': {
      get: {
        tags: ['Admin'],
        summary: 'List admin audit events',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Recent admin actions' },
          '403': { description: 'Admin role required' },
        },
      },
    },
    '/finance/me': {
      get: {
        tags: ['Finance'],
        summary: 'Get current wallet and transaction history',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Wallet and transactions' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/finance/top-up': {
      post: {
        tags: ['Finance'],
        summary: 'Mock top up current user wallet',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Updated wallet and transactions' },
          '400': { description: 'Validation error' },
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
    '/marketplace/jobs/{id}/invites': {
      post: {
        tags: ['Marketplace'],
        summary: 'Invite a performer to a customer job',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '201': { description: 'Updated job detail with invitation' },
          '403': { description: 'Only the job owner can invite performers' },
          '404': { description: 'Job or performer not found' },
          '409': { description: 'Invite conflict or job is not published' },
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
    '/contests': {
      get: {
        tags: ['Contests'],
        summary: 'Get public contests with optional filters',
        responses: {
          '200': { description: 'Contest list with required performer levels' },
        },
      },
      post: {
        tags: ['Contests'],
        summary: 'Create a level-gated contest as customer',
        security: [{ bearerAuth: [] }],
        responses: {
          '201': { description: 'Created contest detail' },
          '403': { description: 'Only customers and managers can create contests' },
        },
      },
    },
    '/contests/{id}': {
      get: {
        tags: ['Contests'],
        summary: 'Get contest detail and visible submissions',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Contest detail with level gate state' },
          '404': { description: 'Contest not found' },
        },
      },
    },
    '/contests/{id}/submissions': {
      post: {
        tags: ['Contests'],
        summary: 'Submit work to a contest as performer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '201': { description: 'Updated contest detail' },
          '403': { description: 'Performer role or level gate required' },
          '409': { description: 'Contest is closed or performer already submitted' },
        },
      },
    },
    '/contests/{contestId}/submissions/{submissionId}/select': {
      post: {
        tags: ['Contests'],
        summary: 'Select contest winner as contest owner or manager',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'contestId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'submissionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Contest completed and winner notified' },
          '403': { description: 'Only owner or manager can select winner' },
          '409': { description: 'Contest already closed or submission already processed' },
        },
      },
    },
    '/performers/{id}': {
      get: {
        tags: ['Performers'],
        summary: 'Get public performer profile',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description:
              'Public performer profile with base profile, RPG level, stats, portfolio and reviews',
          },
          '404': { description: 'Performer not found' },
        },
      },
    },
    '/customers': {
      get: {
        tags: ['Customers'],
        summary: 'Get public customer profiles',
        responses: {
          '200': { description: 'Customer list with company profiles and public stats' },
        },
      },
    },
    '/customers/{id}': {
      get: {
        tags: ['Customers'],
        summary: 'Get public customer profile',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Public customer profile with company, jobs, contests and stats',
          },
          '404': { description: 'Customer not found' },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'Get current user orders',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Order list' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order detail',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Order detail' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/submit': {
      post: {
        tags: ['Orders'],
        summary: 'Submit work result as performer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Submitted order' },
          '409': { description: 'Invalid status' },
        },
      },
    },
    '/orders/{id}/accept': {
      post: {
        tags: ['Orders'],
        summary: 'Accept submitted work and release escrow',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Completed order' },
          '409': { description: 'Invalid status' },
        },
      },
    },
    '/orders/{id}/dispute': {
      post: {
        tags: ['Orders'],
        summary: 'Open dispute for active order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Disputed order' },
        },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel order and refund escrow to customer',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Cancelled order with refund' },
        },
      },
    },
    '/orders/{id}/review': {
      post: {
        tags: ['Orders'],
        summary: 'Create customer review after completed order',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['rating', 'comment'],
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  comment: { type: 'string', minLength: 20, maxLength: 1600 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Order detail with created review and updated RPG impact' },
          '403': { description: 'Only customer can review the order' },
          '409': { description: 'Order is not completed or review already exists' },
        },
      },
    },
    '/conversations': {
      get: {
        tags: ['Communication'],
        summary: 'Get current user conversations',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Conversation list with unread counters' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/conversations/{id}': {
      get: {
        tags: ['Communication'],
        summary: 'Get conversation detail and mark it as read',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Conversation with participants and messages' },
          '404': { description: 'Conversation not found' },
        },
      },
    },
    '/conversations/{id}/messages': {
      post: {
        tags: ['Communication'],
        summary: 'Send text message and optional demo attachments to a conversation',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  body: { type: 'string', maxLength: 4000 },
                  attachments: {
                    type: 'array',
                    maxItems: 3,
                    items: {
                      type: 'object',
                      required: ['fileName', 'fileUrl', 'sizeBytes'],
                      properties: {
                        fileName: { type: 'string', maxLength: 180 },
                        fileUrl: { type: 'string', description: 'Data URL or demo file URL' },
                        mimeType: { type: 'string', nullable: true },
                        sizeBytes: { type: 'integer', maximum: 524288 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created message and refreshed conversation' },
          '400': { description: 'Validation error' },
          '404': { description: 'Conversation not found' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get current user notifications',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Notification list with unread count' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/notifications/read-all': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark all current user notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Updated notifications' },
        },
      },
    },
    '/notifications/{id}/read': {
      post: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Updated notifications' },
          '404': { description: 'Notification not found' },
        },
      },
    },
    '/levels/me': {
      get: {
        tags: ['Levels'],
        summary: 'Get current performer RPG roadmap',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current level, next level, metrics, requirements and XP events' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Only performers can open level roadmap' },
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
