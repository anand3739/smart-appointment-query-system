import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Appointment & Queue Management API',
      version: '1.0.0',
      description:
        'Production-style REST API for multi-branch appointment booking, deterministic priority queue management, resource allocation, and operational analytics.',
      contact: {
        name: 'QueueFlow Engineering Team',
        email: 'engineering@queueflow.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local Development Server',
      },
      {
        url: '/api',
        description: 'Production Server / Reverse Proxy',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token obtained from /api/auth/login',
        },
        IdempotencyKey: {
          type: 'apiKey',
          in: 'header',
          name: 'Idempotency-Key',
          description: 'Unique UUID to prevent duplicate transaction executions',
        },
      },
      schemas: {
        StandardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation completed successfully' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'SLOT_UNAVAILABLE' },
                message: { type: 'string', example: 'The selected appointment slot is no longer available.' },
              },
            },
          },
        },
      },
    },
    paths: {
      '/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new customer account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', example: 'customer@example.com' },
                    password: { type: 'string', example: 'Password123!' },
                    fullName: { type: 'string', example: 'Emma Watson' },
                    phone: { type: 'string', example: '+1 (555) 200-0001' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Account registered successfully with JWT' },
            400: { description: 'Validation error' },
            409: { description: 'User already exists' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Authenticate user and receive JWT token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'admin@example.com' },
                    password: { type: 'string', example: 'Password123!' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful with token and user claims' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current authenticated user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Authenticated user profile' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/branches': {
        get: {
          tags: ['Branches'],
          summary: 'List all active organization branches',
          responses: {
            200: { description: 'Array of branches with operating hours' },
          },
        },
        post: {
          tags: ['Branches'],
          summary: 'Create a new branch (Admin only)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'address', 'openTime', 'closeTime'],
                  properties: {
                    name: { type: 'string', example: 'Downtown Flagship Hub' },
                    address: { type: 'string', example: '100 Main Street, Suite 400' },
                    phone: { type: 'string', example: '+1 (555) 123-4567' },
                    openTime: { type: 'string', example: '09:00' },
                    closeTime: { type: 'string', example: '18:00' },
                    breakStart: { type: 'string', example: '13:00' },
                    breakEnd: { type: 'string', example: '14:00' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Branch created' },
            403: { description: 'Admin role required' },
          },
        },
      },
      '/services': {
        get: {
          tags: ['Services'],
          summary: 'List all available services',
          parameters: [
            { name: 'branchId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'List of services with durations and buffers' },
          },
        },
        post: {
          tags: ['Services'],
          summary: 'Create a new service (Admin only)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'durationMinutes', 'capacityPerSlot'],
                  properties: {
                    name: { type: 'string', example: 'General Consultation' },
                    durationMinutes: { type: 'integer', example: 30 },
                    bufferMinutes: { type: 'integer', example: 10 },
                    capacityPerSlot: { type: 'integer', example: 2 },
                    price: { type: 'number', example: 50 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Service created' },
            403: { description: 'Admin role required' },
          },
        },
      },
      '/availability': {
        get: {
          tags: ['Availability Engine'],
          summary: 'Calculate real-time slot availability for branch, service, and date',
          parameters: [
            { name: 'branchId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'serviceId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-09-26' } },
          ],
          responses: {
            200: { description: 'Available slot timestamps adhering to capacity and buffers' },
          },
        },
      },
      '/availability/reserve': {
        post: {
          tags: ['Availability Engine'],
          summary: 'Create a 10-minute temporary slot hold (TTL)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['branchId', 'serviceId', 'slotStartTime'],
                  properties: {
                    branchId: { type: 'string' },
                    serviceId: { type: 'string' },
                    slotStartTime: { type: 'string', example: '2026-09-26T09:00:00.000Z' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Temporary reservation hold created with TTL countdown' },
            409: { description: 'Slot is already held or unavailable' },
          },
        },
      },
      '/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'List user appointments (or branch appointments for staff/admin)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Array of appointments' },
          },
        },
        post: {
          tags: ['Appointments'],
          summary: 'Book an appointment with concurrency lock & idempotency key',
          security: [{ BearerAuth: [] }, { IdempotencyKey: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['branchId', 'serviceId', 'startTime'],
                  properties: {
                    branchId: { type: 'string' },
                    serviceId: { type: 'string' },
                    startTime: { type: 'string', example: '2026-09-26T09:00:00.000Z' },
                    reservationId: { type: 'string' },
                    notes: { type: 'string', example: 'Routine consultation' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Appointment confirmed' },
            409: { description: 'Slot unavailable (concurrent race condition prevented)' },
          },
        },
      },
      '/appointments/{id}/reschedule': {
        post: {
          tags: ['Appointments'],
          summary: 'Atomically reschedule appointment to a new available slot',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['newStartTime'],
                  properties: {
                    newStartTime: { type: 'string', example: '2026-09-26T10:20:00.000Z' },
                    reason: { type: 'string', example: 'Schedule conflict' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Appointment rescheduled successfully' },
            409: { description: 'New slot unavailable' },
          },
        },
      },
      '/appointments/{id}/cancel': {
        post: {
          tags: ['Appointments'],
          summary: 'Cancel appointment and trigger waiting list auto-allocation',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', example: 'Unable to attend' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Appointment cancelled; slot released to waiting list' },
          },
        },
      },
      '/queue/live': {
        get: {
          tags: ['Smart Queue Engine'],
          summary: 'Fetch real-time live queue and now-serving displays',
          parameters: [
            { name: 'branchId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Ordered queue list and active counter assignments' },
          },
        },
      },
      '/queue/walkin': {
        post: {
          tags: ['Smart Queue Engine'],
          summary: 'Create a walk-in queue ticket (Staff/Admin)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['branchId', 'serviceId', 'customerName'],
                  properties: {
                    branchId: { type: 'string' },
                    serviceId: { type: 'string' },
                    customerName: { type: 'string', example: 'John Doe' },
                    customerPhone: { type: 'string', example: '+1 (555) 300-0001' },
                    priority: { type: 'string', enum: ['NORMAL', 'PRIORITY', 'EMERGENCY'], example: 'NORMAL' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Walk-in ticket generated and placed in priority queue' },
          },
        },
      },
      '/queue/checkin': {
        post: {
          tags: ['Smart Queue Engine'],
          summary: 'Check-in confirmed appointment into the live queue',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['appointmentId'],
                  properties: {
                    appointmentId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Customer checked in with ticket number and estimated wait time' },
          },
        },
      },
      '/queue/call-next': {
        post: {
          tags: ['Smart Queue Engine'],
          summary: 'Call next prioritized customer (Staff/Admin)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['branchId'],
                  properties: {
                    branchId: { type: 'string' },
                    resourceId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Next customer called and station assigned' },
          },
        },
      },
      '/queue/{id}/start-service': {
        post: {
          tags: ['Smart Queue Engine'],
          summary: 'Start service for called ticket',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Ticket transitioned to SERVING; timer started' },
          },
        },
      },
      '/queue/{id}/complete': {
        post: {
          tags: ['Smart Queue Engine'],
          summary: 'Complete service for active ticket',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notes: { type: 'string', example: 'Service rendered successfully' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Ticket completed and recorded in analytics' },
          },
        },
      },
      '/analytics/dashboard': {
        get: {
          tags: ['Analytics & Reporting'],
          summary: 'Fetch organizational throughput, average wait times, and station utilization',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'branchId', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Dashboard metrics, volume charts, and resource heatmap' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
