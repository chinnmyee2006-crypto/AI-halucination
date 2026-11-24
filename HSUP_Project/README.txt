HSUP - AI CHAT WEBSITE
=====================

This project includes a full-stack AI chat website. The browser sends a prompt
to a Python server, which calls an OpenAI-compatible chat API. The provider key
stays on the server and is never included in browser JavaScript.

RUN LOCALLY (Python 3.10+)
--------------------------
Windows PowerShell:
  $env:AI_API_KEY = "your-provider-key"
  $env:AI_MODEL = "your-model-name"
  $env:AI_BASE_URL = "https://api.openai.com/v1"
  python site/server.py

Then open http://127.0.0.1:8000/ . The site supports normal chat, follow-up
questions, suggested prompts, and optional source excerpts with citations such
as [S1]. Conversation state stays in browser memory.

AI_API_KEY and AI_MODEL are required. AI_BASE_URL defaults to the OpenAI API
base URL and can be changed for another OpenAI-compatible provider. The server
uses only the Python standard library. Your provider may charge for API use.
The server limits requests to 100 per UTC day by default; set
AI_DAILY_REQUEST_LIMIT in the service environment to change this. The cap is
held in memory and resets if the server restarts. Never share an API key in chat
or publish it in client-side files.

PUBLISH A PUBLIC WEBSITE
------------------------
The repository-root render.yaml is a Render deployment blueprint. Connect a
repository containing these project files to Render and create a Blueprint.
During setup, enter AI_API_KEY as a secret and set AI_MODEL to a model enabled
for your provider. AI_BASE_URL defaults to OpenAI and can be changed in the
service environment. Render then provides a public HTTPS URL.

The public URL is not yet provisioned: that requires a hosting account/repo and
a valid AI provider key with available quota. The app shows “AI setup needed”
until its server environment has AI_API_KEY and AI_MODEL. The key belongs in
the hosting provider's secret settings, never in this chat or the website files.

PROJECT STRUCTURE
-----------------
render.yaml                   Render deployment blueprint
site/index.html              AI chat interface
site/styles.css              responsive chat styling
site/app.js                  chat, source panel, and API client
site/server.py               static server and private AI API gateway
site/.env.example            variable names only; no secrets
site/PROJECT_REPORT.md       project research report
hsup/core.py                 lexical verification baseline
hsup/cli.py                  command-line JSON interface
PROJECT_REPORT.md            research design and evaluation protocol
REFERENCES.md                checked literature references

RESEARCH LIMITATIONS
--------------------
The chat response comes from the configured AI provider. When source text is
supplied, HSUP asks the model to prioritize it, cite source IDs, and disclose
gaps or conflicts. A language model can still make mistakes; its citations are
not independent fact verification. The CLI verifier is separate and is not used
to generate chat responses. No controlled accuracy results are claimed.
