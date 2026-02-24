
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Support Ticket Management API",
      "version": "1.0.0",
      "description": "Support Ticket Management — Student Project Assignment\n\nOverview:\nBuild a backend for a company helpdesk system where employees raise tickets, support staff handle them, and managers track everything. \nThe API follows REST principles.\n\nGoals & Requirements:\n- Implement authentication (JWT) and secure password hashing (bcrypt).\n- Enforce Role-Based Access Control (MANAGER, SUPPORT, USER) at the API layer.\n- Implement the database schema with at least these tables: Users, Roles, Tickets, TicketComments, TicketStatusLogs.\n- Implement ticket lifecycle and logging: OPEN → IN_PROGRESS → RESOLVED → CLOSED, with each change recorded in TicketStatusLogs.\n- Validate inputs (title >=5 chars, description >=10 chars) and require enum values for status/priority.\n- Provide a Swagger UI for API exploration.\n\nDeliverables:\n- Working backend with routes for authentication, user management (MANAGER), ticket creation/viewing/assignment/status changes, and comments.\n- Swagger documentation accessible at /docs. (optional)\n- README with setup and run instructions.\n\nGrading checklist:\n- Correct RBAC enforcement and proper HTTP status codes (401/403/404/400/201/204).\n- Proper DB relationships and constraints.\n- Validation and status transition enforcement.\n- Secure password handling and JWT usage.\n\nExtensions (optional/bonus):\n- Add pagination and filtering for ticket lists.\n- Add email notifications and/or file attachments.\n- Add tests and database migrations for production readiness.\n\nEndpoint access matrix:\n\n| Endpoint | Method | Roles allowed |\n|---|---:|---|\n| /auth/login | POST | Public (no auth) |\n| /users | POST | MANAGER |\n| /users | GET | MANAGER |\n| /tickets | POST | USER, MANAGER |\n| /tickets | GET | MANAGER (all), SUPPORT (assigned), USER (own) |\n| /tickets/{id}/assign | PATCH | MANAGER, SUPPORT |\n| /tickets/{id}/status | PATCH | MANAGER, SUPPORT |\n| /tickets/{id} | DELETE | MANAGER |\n| /tickets/{id}/comments | POST | MANAGER; SUPPORT if assigned; USER if owner |\n| /tickets/{id}/comments | GET | MANAGER; SUPPORT if assigned; USER if owner |\n| /comments/{id} | PATCH | MANAGER or comment author |\n| /comments/{id} | DELETE | MANAGER or comment author |\n\nValidation & business rules:\n- Title minimum length: 5 characters.\n- Description minimum length: 10 characters.\n- Priority and Status must be valid enums.\n- Status transitions only allowed: OPEN → IN_PROGRESS → RESOLVED → CLOSED (each step forward).\n- Tickets cannot be assigned to users with role USER.\n- Passwords must be stored hashed (bcrypt).\n- All protected endpoints require a valid JWT in Authorization header: Bearer &lt;token&gt;.\n\nTesting notes for students:\n- Create an MANAGER user via your preferred method (database or API), then login to obtain a token for MANAGER actions.\n- Create SUPPORT and USER accounts via POST /users (as MANAGER), then use their tokens to test role-specific flows.\n- Test invalid transitions (e.g., OPEN → RESOLVED) and expect 400.\n- Verify 401 when calling protected endpoints without a token, and 403 when role lacks permission.\n\nDatabase Schema\n\n### roles\n| Column | Type | Constraints |\n|---|---|---|\n| id | INT | PRIMARY KEY, AUTO_INCREMENT |\n| name | ENUM('MANAGER','SUPPORT','USER') | NOT NULL, UNIQUE |\n\n### users\n| Column | Type | Constraints |\n|---|---|---|\n| id | INT | PRIMARY KEY, AUTO_INCREMENT |\n| name | VARCHAR(255) | NOT NULL |\n| email | VARCHAR(255) | NOT NULL, UNIQUE |\n| password | VARCHAR(255) | NOT NULL (store bcrypt hash) |\n| role_id | INT | NOT NULL, FOREIGN KEY → roles(id) |\n| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |\n\n### tickets\n| Column | Type | Constraints |\n|---|---|---|\n| id | INT | PRIMARY KEY, AUTO_INCREMENT |\n| title | VARCHAR(255) | NOT NULL |\n| description | TEXT | NOT NULL |\n| status | ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') | DEFAULT 'OPEN' |\n| priority | ENUM('LOW','MEDIUM','HIGH') | DEFAULT 'MEDIUM' |\n| created_by | INT | NOT NULL, FOREIGN KEY → users(id) |\n| assigned_to | INT | NULL, FOREIGN KEY → users(id) |\n| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |\n\n### ticket_comments\n| Column | Type | Constraints |\n|---|---|---|\n| id | INT | PRIMARY KEY, AUTO_INCREMENT |\n| ticket_id | INT | FOREIGN KEY → tickets(id), ON DELETE CASCADE |\n| user_id | INT | FOREIGN KEY → users(id) |\n| comment | TEXT | NOT NULL |\n| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |\n\n### ticket_status_logs\n| Column | Type | Constraints |\n|---|---|---|\n| id | INT | PRIMARY KEY, AUTO_INCREMENT |\n| ticket_id | INT | FOREIGN KEY → tickets(id), ON DELETE CASCADE |\n| old_status | ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') | NOT NULL |\n| new_status | ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') | NOT NULL |\n| changed_by | INT | FOREIGN KEY → users(id) |\n| changed_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |\n\nRelationships:\n- users.role_id → roles.id (many-to-one)\n- tickets.created_by → users.id (many-to-one)\n- tickets.assigned_to → users.id (many-to-one, nullable)\n- ticket_comments.ticket_id → tickets.id (many-to-one)\n- ticket_comments.user_id → users.id (many-to-one)\n- ticket_status_logs.ticket_id → tickets.id (many-to-one)\n- ticket_status_logs.changed_by → users.id (many-to-one)\n\n"
    },
    "tags": [
      {
        "name": "Auth",
        "description": "Authentication endpoints (login)"
      },
      {
        "name": "Users",
        "description": "User management (MANAGER only)"
      },
      {
        "name": "Tickets",
        "description": "Create, view, assign, update status, and delete tickets"
      },
      {
        "name": "Comments",
        "description": "Add, list, edit, and delete ticket comments"
      },
      {
        "name": "MANAGER",
        "description": "MANAGER-only operations"
      }
    ],
    "servers": [
      {
        "url": "http://localhost:3000"
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      },
      "schemas": {
        "AuthResponse": {
          "type": "object",
          "properties": {
            "token": {
              "type": "string"
            }
          }
        },
        "Role": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string",
              "enum": [
                "MANAGER",
                "SUPPORT",
                "USER"
              ]
            }
          }
        },
        "User": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "name": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "role": {
              "$ref": "#/components/schemas/Role"
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "TicketComment": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "comment": {
              "type": "string"
            },
            "user": {
              "$ref": "#/components/schemas/User"
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        },
        "LoginDTO": {
          "type": "object",
          "required": [
            "email",
            "password"
          ],
          "properties": {
            "email": {
              "type": "string",
              "format": "email"
            },
            "password": {
              "type": "string",
              "minLength": 6
            }
          }
        },
        "CreateUserDTO": {
          "type": "object",
          "required": [
            "name",
            "email",
            "password",
            "role"
          ],
          "properties": {
            "name": {
              "type": "string"
            },
            "email": {
              "type": "string",
              "format": "email"
            },
            "password": {
              "type": "string",
              "minLength": 6
            },
            "role": {
              "type": "string",
              "enum": [
                "MANAGER",
                "SUPPORT",
                "USER"
              ]
            }
          }
        },
        "CreateTicketDTO": {
          "type": "object",
          "required": [
            "title",
            "description",
            "priority"
          ],
          "properties": {
            "title": {
              "type": "string",
              "minLength": 5
            },
            "description": {
              "type": "string",
              "minLength": 10
            },
            "priority": {
              "type": "string",
              "enum": [
                "LOW",
                "MEDIUM",
                "HIGH"
              ]
            }
          }
        },
        "AssignDTO": {
          "type": "object",
          "required": [
            "userId"
          ],
          "properties": {
            "userId": {
              "type": "integer"
            }
          }
        },
        "UpdateStatusDTO": {
          "type": "object",
          "required": [
            "status"
          ],
          "properties": {
            "status": {
              "type": "string",
              "enum": [
                "OPEN",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED"
              ]
            }
          }
        },
        "CommentDTO": {
          "type": "object",
          "required": [
            "comment"
          ],
          "properties": {
            "comment": {
              "type": "string"
            }
          }
        },
        "Ticket": {
          "type": "object",
          "properties": {
            "id": {
              "type": "integer"
            },
            "title": {
              "type": "string"
            },
            "description": {
              "type": "string"
            },
            "status": {
              "type": "string",
              "enum": [
                "OPEN",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED"
              ]
            },
            "priority": {
              "type": "string",
              "enum": [
                "LOW",
                "MEDIUM",
                "HIGH"
              ]
            },
            "created_by": {
              "$ref": "#/components/schemas/User"
            },
            "assigned_to": {
              "$ref": "#/components/schemas/User"
            },
            "created_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      }
    },
    "security": [
      {
        "bearerAuth": []
      }
    ],
    "paths": {
      "/auth/login": {
        "post": {
          "summary": "Login",
          "tags": [
            "Auth"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginDTO"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/AuthResponse"
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          }
        }
      },
      "/users": {
        "post": {
          "summary": "Create user (MANAGER)",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateUserDTO"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        },
        "get": {
          "summary": "List users (MANAGER)",
          "tags": [
            "Users"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        }
      },
      "/tickets": {
        "post": {
          "summary": "Create ticket (USER, MANAGER)",
          "tags": [
            "Tickets"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CreateTicketDTO"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Ticket"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            }
          }
        },
        "get": {
          "summary": "Get tickets (MANAGER=all, SUPPORT=assigned, USER=own)",
          "tags": [
            "Tickets"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/Ticket"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            }
          }
        }
      },
      "/tickets/{id}/assign": {
        "patch": {
          "summary": "Assign ticket (MANAGER, SUPPORT)",
          "tags": [
            "Tickets"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AssignDTO"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Ticket"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/tickets/{id}/status": {
        "patch": {
          "summary": "Update ticket status (MANAGER, SUPPORT)",
          "tags": [
            "Tickets"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UpdateStatusDTO"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/Ticket"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/tickets/{id}": {
        "delete": {
          "summary": "Delete ticket (MANAGER)",
          "tags": [
            "Tickets"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/tickets/{id}/comments": {
        "post": {
          "summary": "Add comment to ticket",
          "tags": [
            "Comments"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CommentDTO"
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/TicketComment"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        },
        "get": {
          "summary": "List comments for a ticket",
          "tags": [
            "Comments"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "type": "array",
                    "items": {
                      "$ref": "#/components/schemas/TicketComment"
                    }
                  }
                }
              }
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      },
      "/comments/{id}": {
        "patch": {
          "summary": "Edit comment (author or MANAGER)",
          "tags": [
            "Comments"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/CommentDTO"
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "OK",
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/TicketComment"
                  }
                }
              }
            },
            "400": {
              "description": "Bad Request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        },
        "delete": {
          "summary": "Delete comment (author or MANAGER)",
          "tags": [
            "Comments"
          ],
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "204": {
              "description": "No Content"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden"
            },
            "404": {
              "description": "Not Found"
            }
          }
        }
      }
    }
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
