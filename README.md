# Run and deploy your AI Studio app (Flask Version)

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/57826c58-0fa6-49a6-b64b-8cdd43b70689

## Run Locally

**Prerequisites:** Python 3

1. Activate virtual environment and install dependencies:
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` (or `.env`) to your Gemini API key:
   `export GEMINI_API_KEY="your-api-key"`
3. Run the app:
   `python3 app.py`
4. Access the web app in your browser at `http://127.0.0.1:3000`.




## RUN on Openshift

