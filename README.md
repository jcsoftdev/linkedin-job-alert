# LinkedIn Job Alert

A modular tool designed to automate the discovery and analysis of job opportunities on LinkedIn. It uses Puppeteer for scraping, OpenAI (via OpenRouter) for intelligent job post analysis, and Bun for a fast runtime.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (latest version)
- A LinkedIn account (to obtain the session cookie)
- An OpenAI or OpenRouter API key

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure `.env`:
   - `LINKEDIN_SESSION_COOKIE`: Your `li_at` cookie value from LinkedIn.
   - `OPENAI_API_KEY`: Your API key.
   - `OPENAI_BASE_URL`: (Optional) Defaults to OpenRouter.

### Running the App
- **Development Mode**:
  ```bash
  bun dev
  ```
- **Production Mode**:
  ```bash
  bun start
  ```

The server will be available at `http://localhost:3000` (default).

---

## 🏗️ Architecture

The project follows **Hexagonal Architecture** (Clean Architecture) principles, organized into modules for better maintainability and testability.

### Project Structure
- `src/modules/`: Contains independent business modules.
  - `auth/`: User registration, login, and personalized filter management.
  - `job-collection/`: The core logic for scraping, analyzing, and storing job offers.
- `src/shared/`: Shared infrastructure like database configuration.
- `src/index.ts`: Application entry point and dependency injection.

### Layering within Modules
Each module is divided into three layers:
1. **Domain**: Pure business logic, entities, and interfaces for repositories/services.
2. **Application**: Use cases that orchestrate domain logic and external services.
3. **Infrastructure**: Concrete implementations of domain interfaces (e.g., SQLite repositories, Puppeteer scraper).

### Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: SQLite (via `bun:sqlite`)
- **Scraping**: Puppeteer
- **AI**: OpenAI SDK (compatible with OpenRouter)
- **Scheduling**: node-cron

---

## 🛠️ Development

### Database
The database is SQLite and is stored in `posts.db`. It is automatically initialized and migrated on application startup via [db.ts](file:///Users/jcsoftdev/personal/linkedin-alert-job/src/shared/infrastructure/db.ts).

### API Testing
A Bruno collection is available in the `Linkedin-job-alert/` directory for testing the API endpoints.

### Key Scripts
- `bun dev`: Starts the server with watch mode.
- `bun check`: Runs type checking.
- `bun start`: Starts the production server.

## 📝 Features
- **Automated Scraping**: Scrapes LinkedIn posts based on specific search URLs.
- **AI Filtering**: Uses LLMs to determine if a post is a job offer and extracts key info (title, company, tech stack).
- **User Management**: Support for multiple users with private job filters.
- **Real-time Dashboard**: A simple dashboard to monitor the collection process.
