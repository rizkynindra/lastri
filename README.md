## Lastrii Virtual Assistant (AI Chatbot)

A modern AI-powered virtual assistant built with Flask, designed to integrate seamlessly with n8n workflows for backend logic and automation. This application serves as the frontend interface for customer service and engagement.

### Features
- **AI-Powered Chat**: Utilizes Google Gemini for intelligent responses.
- **n8n Integration**: Connects to n8n webhooks for powerful backend automation.
- **State Management**: Supports session-based conversations.
- **Modern UI**: Clean, responsive web interface.
- **Docker Ready**: Pre-configured for easy deployment.

### Prerequisites
- Docker
- Docker Compose
- Internet connection
- Access to n8n webhook (or willingness to set one up)

### Quick Start

#### Option 1: Using Docker Compose (Recommended)
1. **Clone or Copy the Repository**
   If you don't have the project yet:
   ```bash
   git clone <repository-url>
   cd lastri
   ```
   
   If you already have the files, just navigate to the directory:
   ```bash
   cd /path/to/lastri
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory (copy from `.env.example` if available):
   ```bash
   cp .env.example .env
   ```
   
   Open `.env` and add your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   # Optional: Configure proxy if needed
   # HTTP_PROXY=http://your-proxy:port
   # HTTPS_PROXY=http://your-proxy:port
   ```

3. **Start the Application**
   Run the following command to build and start the container:
   ```bash
   docker-compose up --build
   ```
   
   To run in detached mode (background):
   ```bash
   docker-compose up -d --build
   ```

4. **Access the Application**
   Open your web browser and navigate to:
   - **App UI**: http://localhost:3000
   - **n8n Webhook Test**: http://localhost:3000/webhook-test/lastri

#### Option 2: Local Development (Without Docker)
1. **Prerequisites Check**
   Ensure you have Python 3.8+ installed.

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```
   
   Add your `GEMINI_API_KEY` to `.env.local`:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the Application**
   ```bash
   export GEMINI_API_KEY="your_key_here"  # For Linux/Mac
   # or
   set GEMINI_API_KEY=your_key_here  # For Windows
   
   python app.py
   ```

5. **Access the Application**
   Open your browser and go to: http://localhost:3000

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google Gemini API Key |
| `PORT` | No | Port for the Flask server (default: 3000) |
| `HTTP_PROXY` | No | Proxy server for HTTP requests |
| `HTTPS_PROXY` | No | Proxy server for HTTPS requests |

The backend sends the user's message and chat history to this webhook. The n8n workflow should process this data and return a JSON response containing the AI's reply.

### File Structure
```
lastri/
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── .env.example            # Environment variable template
├── .env                    # Local environment variables (gitignored)
├── static/                 # Static frontend files
│   ├── css/
│   ├── js/
│   └── images/
└── templates/              # HTML templates
    └── index.html          # Main chat interface
```

### Development
- The Flask app runs in debug mode when `DEBUG=True` (set in `.env` or via `docker-compose.yml`),
  providing hot-reload on code changes and detailed error pages.
- The frontend uses vanilla JavaScript for simplicity and performance.