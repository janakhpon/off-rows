import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { app } from "./server";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OffRows API",
      version: "1.0.0",
      description: "API for OffRows - Offline-first data management platform with cloud sync capabilities",
      contact: {
        name: "OffRows API Support",
        email: "support@offrows.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server"
      },
      {
        url: "https://api.offrows.com",
        description: "Production server"
      }
    ],
    tags: [
      {
        name: "Tables",
        description: "Table management operations"
      },
      {
        name: "Rows",
        description: "Table row operations"
      },
      {
        name: "Views",
        description: "Table view operations"
      },
      {
        name: "Sync",
        description: "Data synchronization operations"
      },
      {
        name: "S3",
        description: "File storage operations"
      },
      {
        name: "Stories",
        description: "Story management operations"
      },
      {
        name: "Health",
        description: "Health check endpoints"
      }
    ],
    components: {
      schemas: {
        TableInput: {
          type: "object",
          required: ["name", "fields"],
          properties: {
            name: {
              type: "string",
              description: "Name of the table"
            },
            description: {
              type: "string",
              description: "Description of the table"
            },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Field ID"
                  },
                  name: {
                    type: "string",
                    description: "Field name"
                  },
                  type: {
                    type: "string",
                    enum: ["text", "number", "boolean", "date", "dropdown", "image", "file", "images", "files"],
                    description: "Field type"
                  },
                  required: {
                    type: "boolean",
                    description: "Whether the field is required"
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Options for dropdown fields"
                  },
                  defaultValue: {
                    description: "Default value for the field"
                  }
                }
              }
            },
            colWidths: {
              type: "object",
              description: "Column width settings"
            },
            rowHeights: {
              type: "object",
              description: "Row height settings"
            }
          }
        },
        TableRowInput: {
          type: "object",
          required: ["tableId", "data"],
          properties: {
            tableId: {
              type: "integer",
              description: "ID of the table this row belongs to"
            },
            data: {
              type: "object",
              description: "Row data as key-value pairs"
            },
            order: {
              type: "integer",
              description: "Row order/position"
            }
          }
        },
        TableViewInput: {
          type: "object",
          required: ["tableId", "name", "hiddenFields", "filters", "sorts", "rowHeight", "colorRules"],
          properties: {
            tableId: {
              type: "integer",
              description: "ID of the table this view belongs to"
            },
            name: {
              type: "string",
              description: "Name of the view"
            },
            hiddenFields: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of field IDs to hide in this view"
            },
            filters: {
              type: "array",
              items: {
                type: "object"
              },
              description: "Array of filter objects"
            },
            sorts: {
              type: "array",
              items: {
                type: "object"
              },
              description: "Array of sort objects"
            },
            rowHeight: {
              type: "string",
              enum: ["compact", "default", "large"],
              description: "Row height setting for this view"
            },
            colorRules: {
              type: "array",
              items: {
                type: "object"
              },
              description: "Array of color rule objects"
            },
            isDefault: {
              type: "boolean",
              description: "Whether this is the default view"
            }
          }
        },
        StoryInput: {
          type: "object",
          required: ["header", "paragraphs", "tags"],
          properties: {
            header: {
              type: "string",
              description: "Story header/title"
            },
            paragraphs: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of story paragraphs"
            },
            tags: {
              type: "array",
              items: {
                type: "string"
              },
              description: "Array of story tags"
            }
          }
        },
        SyncRequest: {
          type: "object",
          properties: {
            tables: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TableInput"
              },
              description: "Array of tables to sync"
            },
            rows: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TableRowInput"
              },
              description: "Array of rows to sync"
            },
            views: {
              type: "array",
              items: {
                $ref: "#/components/schemas/TableViewInput"
              },
              description: "Array of views to sync"
            }
          }
        },
        S3UploadRequest: {
          type: "object",
          required: ["filename", "data"],
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to upload"
            },
            data: {
              type: "string",
              description: "Base64 encoded image data"
            },
            contentType: {
              type: "string",
              description: "MIME type of the image (optional)"
            }
          }
        },
        S3DeleteRequest: {
          type: "object",
          properties: {
            s3Key: {
              type: "string",
              description: "S3 key of the file to delete"
            },
            filename: {
              type: "string",
              description: "Alternative to s3Key - filename to delete"
            }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message"
            },
            code: {
              type: "string",
              description: "Error code"
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        BadRequest: {
          description: "Bad request",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        },
        InternalServerError: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error"
              }
            }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.ts", "./src/server.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "OffRows API Documentation",
  customfavIcon: "/favicon.ico",
  swaggerOptions: {
    docExpansion: "list",
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
}));

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});
