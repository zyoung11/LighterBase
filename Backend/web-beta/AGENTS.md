# LighterBaseHub Development Guide

## Build Commands
- `go build -o LighterBaseHub .` - Build the main executable
- `go run .` - Run the application directly
- `go vet .` - Run static analysis
- `go fmt .` - Format code

## Code Generation
- `sqlc generate` - Generate database code from SQL files
- Database models are in `database/` package (auto-generated)

## Code Style Guidelines

### Imports
- Group imports: stdlib, third-party, local packages
- Use blank imports (`_`) for side-effects only (e.g., `_ "embed"`)
- Database package: `LighterBaseHub/database`

### Naming Conventions
- Use CamelCase for exported functions/types
- Use camelCase for private variables
- Database queries: PascalCase (e.g., `CreateProject`, `GetUserByID`)
- HTTP handlers: lowercase (e.g., `createProject`, `login`)

### Error Handling
- Always handle errors from function calls
- Return structured JSON errors with appropriate HTTP status codes
- Use fiber.Status* constants for HTTP status codes
- Log errors with `log.Printf("ERROR: ...")` format

### Project Structure
- `main.go` - HTTP handlers and routing
- `Base.go` - Core infrastructure, JWT, database init
- `database/` - Auto-generated database code
- `SQL/` - SQL schema and query files
- Embedded files use `//go:embed` directive

### Key Patterns
- JWT middleware for authentication
- Fiber framework for HTTP handling
- SQLite with WAL mode for database
- Embedded LighterBase executable for single-binary deployment