# HealthPredict AI - Health Prediction Application

HealthPredict AI is a full-stack web application that allows users to manage patient blood test records and uses the Google Gemini AI to provide real-time health risk assessments and predictions.

## 🚀 Features

- **Full CRUD Operations**: Create, Read, Update, and Delete patient records.
- **AI-Powered Insights**: Uses Google Gemini API to analyze Glucose, Haemoglobin, and Cholesterol levels.
- **Data Validation**: Client-side and server-side validation for emails, dates, and numeric inputs.
- **Responsive UI**: A modern, clean interface built with Bootstrap 5.
- **Secure Configuration**: Uses environment variables to manage sensitive API keys and database credentials.

## 🛠️ Tech Stack

- **Backend**: Python, Flask
- **Database**: MySQL
- **AI**: Google Gemini API (`google-genai`)
- **Frontend**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript

## 📋 Prerequisites

- Python 3.10+
- MySQL Server
- Google Gemini API Key

## ⚙️ Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd health-prediction-app
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   - Copy `.env.example` to `.env`.
   - Fill in your MySQL credentials and Gemini API key.
   ```bash
   cp .env.example .env
   ```

4. **Initialize the Database**:
   - Ensure your MySQL server is running.
   - Run the initialization script:
   ```bash
   python init_db.py
   ```

5. **Run the Application**:
   ```bash
   python app.py
   ```
   The application will be available at `http://127.0.0.1:5000`.

## 🔒 Security Note

The `.env` file is included in `.gitignore` to prevent sensitive API keys and passwords from being uploaded to GitHub. Always use `.env.example` as a template for new environments.

## 📄 License

This project is licensed under the MIT License.
