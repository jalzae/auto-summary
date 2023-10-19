const spec = {
  "openapi": "3.0.1",
  "info": {
    "version": "1.0.0",
    "title": "API Specification"
  },
  "servers": [
    {
      "url": "https://jsonplaceholder.typicode.com",
      "description": "JSONPlaceholder API"
    }
  ],
  "paths": {
    "/posts": {
      "get": {
        "summary": "Get Posts",
        "description": "For get the post",
        "code": `
const previewCodeElements = document.getElementsByClassName('code-preview');
for (let i = 0; i < previewCodeElements.length; i++) {
  previewCodeElements[i].innerHTML = 'Your new HTML content here';
}`,
        "operationId": "getPosts",
        "tags": ["Post"],
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "description": "Authentication token",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of posts",
            "content": {
              "application/json": {
                "example": [
                  {
                    "userId": 1,
                    "id": 1,
                    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                    "body": "quia et suscipit\nsuscipit"
                  },
                  {
                    "userId": 1,
                    "id": 2,
                    "title": "qui est esse",
                    "body": "est rerum tempore quis soluta deleniti quidem"
                  }
                ]
              }
            },
            "expected": `
{
  status:true,
  message:'Connected',
  data:[{users}]
}`
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "example": {
                  "status": false,
                  "message": "Resource not found"
                }
              }
            },
            "expected": `
{
  status:false,
  message:'Not Found'
}`
          }
        }
      },
      "post": {
        "summary": "Create Post",
        "operationId": "createPost",
        "tags": ["Post"],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "userId": {
                    "type": "integer",
                    "description": "User ID"
                  },
                  "title": {
                    "type": "string",
                    "description": "Title of the post"
                  },
                  "body": {
                    "type": "string",
                    "description": "Content of the post"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Post created successfully",
            "content": {
              "application/json": {
                "example": {
                  "userId": 1,
                  "id": 101,
                  "title": "Newly Created Post",
                  "body": "This is a new post created via the API"
                }
              }
            }
          },
          "400": {
            "description": "Bad Request",
            "content": {
              "application/json": {
                "example": {
                  "status": false,
                  "message": "Bad request error"
                }
              }
            }
          }
        }
      }
    },
    "/posts/{id}": {
      "get": {
        "summary": "Get Post by ID",
        "operationId": "getPostById",
        "tags": ["Post"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Post ID",
            "required": true,
            "schema": {
              "type": "integer"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Details of a post",
            "content": {
              "application/json": {
                "example": {
                  "userId": 1,
                  "id": 1,
                  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
                  "body": "quia et suscipit\nsuscipit"
                }
              }
            }
          },
          "404": {
            "description": "Not Found",
            "content": {
              "application/json": {
                "example": {
                  "status": false,
                  "message": "Post not found"
                }
              }
            }
          }
        },
       
      }
    }
  },
  "menu": {
    "usage": `<div class="tabsContent"><p>Its documentation session </p></div>`,
    "readme": `<div class="tabsContent">
        <h2>Read Me</h2>
        <p>
          its Read me documentation for this document api example
        </p>
      </div>`,
  }
}
