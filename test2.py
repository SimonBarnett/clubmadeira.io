{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Comprehensive Project Schema",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the project (optional)"
        },
        "description": {
            "type": "string",
            "description": "A brief description of the project"
        },
        "base_url": {
            "type": "string",
            "format": "uri",
            "description": "The base URL of the project"
        },
        "main_file": {
            "type": "string",
            "description": "The main file of the project"
        },
        "github": {
            "type": "string",
            "format": "uri",
            "description": "The GitHub repository URL"
        },
        "files": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/file"
            },
            "description": "An array of files in the project"
        },
        "version": {
            "type": "string",
            "description": "The version of the project (optional)"
        },
        "dependencies": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of dependencies (optional)"
        },
        "technologies": {
            "type": "array",
            "items": {
                "type": "string"
            },
            "description": "List of technologies used (optional)"
        }
    },
    "required": [
        "description",
        "base_url",
        "main_file",
        "github",
        "files"
    ],
    "definitions": {
        "file": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the file"
                },
                "type": {
                    "type": "string",
                    "description": "The type or extension of the file"
                },
                "relative_location": {
                    "type": "string",
                    "description": "The relative path to the file from the main file"
                }
            },
            "required": [
                "name",
                "type",
                "relative_location"
            ],
            "oneOf": [
                {
                    "$ref": "#/definitions/js_file"
                },
                {
                    "$ref": "#/definitions/blueprint_file"
                },
                {
                    "$ref": "#/definitions/template_file"
                },
                {
                    "$ref": "#/definitions/document_file"
                }
            ]
        },
        "parameter": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the parameter"
                },
                "type": {
                    "type": "string",
                    "description": "The data type of the parameter"
                },
                "optional": {
                    "type": "boolean",
                    "description": "Whether the parameter is optional"
                },
                "description": {
                    "type": "string",
                    "description": "A concise description of the parameter"
                }
            },
            "required": [
                "name",
                "type",
                "optional",
                "description"
            ]
        },
        "js_file": {
            "allOf": [
                {
                    "$ref": "#/definitions/file"
                },
                {
                    "type": "object",
                    "properties": {
                        "functions": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/function"
                            },
                            "description": "An array of functions defined in the JS file"
                        }
                    },
                    "required": [
                        "functions"
                    ]
                }
            ]
        },
        "function": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the function"
                },
                "description": {
                    "type": "string",
                    "description": "A brief description of the function"
                },
                "parameters": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/parameter"
                    },
                    "description": "An array of parameters for the function"
                }
            },
            "required": [
                "name",
                "description",
                "parameters"
            ]
        },
        "blueprint_file": {
            "allOf": [
                {
                    "$ref": "#/definitions/file"
                },
                {
                    "type": "object",
                    "properties": {
                        "flask_blueprint": {
                            "type": "string",
                            "description": "The name of the Flask blueprint"
                        },
                        "endpoint_name": {
                            "type": "string",
                            "description": "The name of the endpoint"
                        },
                        "method": {
                            "type": "string",
                            "enum": [
                                "GET",
                                "POST",
                                "PUT",
                                "DELETE"
                            ],
                            "description": "The HTTP method of the endpoint"
                        },
                        "description": {
                            "type": "string",
                            "description": "A brief description of the endpoint"
                        },
                        "parameters": {
                            "type": "array",
                            "items": {
                                "$ref": "#/definitions/parameter"
                            },
                            "description": "An array of parameters for the endpoint"
                        }
                    },
                    "required": [
                        "flask_blueprint",
                        "endpoint_name",
                        "method",
                        "description",
                        "parameters"
                    ]
                }
            ]
        },
        "template_file": {
            "allOf": [
                {
                    "$ref": "#/definitions/file"
                },
                {
                    "type": "object",
                    "properties": {
                        "engine": {
                            "type": "string",
                            "enum": [
                                "jinja2",
                                "handlebars",
                                "mustache"
                            ],
                            "description": "The templating engine used"
                        }
                    },
                    "required": [
                        "engine"
                    ]
                }
            ]
        },
        "document_file": {
            "allOf": [
                {
                    "$ref": "#/definitions/file"
                },
                {
                    "type": "object",
                    "properties": {
                        "format": {
                            "type": "string",
                            "enum": [
                                "pdf",
                                "docx",
                                "txt"
                            ],
                            "description": "The format of the document"
                        }
                    },
                    "required": [
                        "format"
                    ]
                }
            ]
        },
        "command": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the command"
                },
                "syntax": {
                    "type": "string",
                    "description": "The syntax of the command"
                },
                "description": {
                    "type": "string",
                    "description": "A brief description of the command"
                },
                "responses": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/response"
                    },
                    "description": "An array of possible responses"
                }
            },
            "required": [
                "name",
                "syntax",
                "description",
                "responses"
            ]
        },
        "response": {
            "type": "object",
            "properties": {
                "accepted_response": {
                    "type": "string",
                    "description": "The accepted response message"
                },
                "condition": {
                    "type": "string",
                    "description": "The condition under which this response is issued"
                }
            },
            "required": [
                "accepted_response",
                "condition"
            ]
        }
    }
}