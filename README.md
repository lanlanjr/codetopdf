# Code-to-PDF App

A local web application that allows you to scan a directory for code files, select specific files, and export them into a cleanly formatted, syntax-highlighted PDF document.

## Features
- **Directory Scanning:** Enter any local directory path to scan for readable code files (ignores hidden and binary files).
- **Code Highlighting:** Uses Pygments to tokenize and highlight code snippets.
- **PDF Generation:** Powered by WeasyPrint to create high-quality, paginated PDFs of your code.
- **Modern UI:** Built with Tailwind CSS and Vanilla JavaScript.

## Prerequisites
- Python 3.9+
- **WeasyPrint System Dependencies:** WeasyPrint requires GTK3, Pango, and other libraries to render HTML to PDF.
  - **macOS:** `brew install pango libffi`
  - **Linux (Ubuntu/Debian):** `sudo apt-get install build-essential python3-dev python3-pip python3-setuptools python3-wheel python3-cffi libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info`
  - **Windows:** See [WeasyPrint installation guide](https://weasyprint.readthedocs.io/en/latest/install.html).

## Setup Instructions

1. **Clone the repository (or navigate to the directory):**
   ```bash
   cd codetopdf
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv  # MacOS/Linux
   # or
   python -m venv venv  # Windows

   source venv/bin/activate  # Activate the virtual environment for MacOS/Linux
   # or
   venv\Scripts\activate  # Activate the virtual environment for Windows
   ```

3. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt  # MacOS/Linux
   # or
   pip install -r requirements.txt  # Windows
   ```

## Running the Application

1. Ensure your virtual environment is activated.
2. Run the Flask application:
   ```bash
   python3 app.py  # MacOS/Linux
   # or
   python app.py  # Windows
   ```
   or

   ```bash
   flask run
   ```

   *Note for macOS users:* If you installed Pango via Homebrew and encounter library loading errors like `Library not loaded`, you may need to export the library path before running the app:
   ```bash
   export DYLD_LIBRARY_PATH="/opt/homebrew/lib:$DYLD_LIBRARY_PATH"
   python app.py
   ```

3. Open a web browser and navigate to `http://127.0.0.1:5000`.

## Docker Deployment (Optional)

If you prefer to run the application via Docker:

1. Build the image and start the container using Docker Compose:
   ```bash
   docker compose up --build -d
   ```
2. Open a web browser and navigate to `http://localhost:5000`.

*Note: The `docker-compose.yml` dynamically mounts your home directory symmetrically inside the container (read-only) using environment variables (`$USERPROFILE` for Windows, falling back to `$HOME` for macOS/Linux). This ensures that any absolute path pointing to files in your user directory (e.g., `/Users/username/...` or `C:\Users\username\...`) will work exactly the same way inside the Docker container.*

## Usage
1. Enter the absolute path of a local directory in the input field.
2. Click "Scan Directory".
3. Select the code files you wish to include.
4. Click "Generate PDF" at the bottom of the screen.
5. The PDF will be generated and automatically downloaded to your browser.
