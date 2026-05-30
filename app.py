import os
import datetime
import mysql.connector
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from google import genai
from dotenv import load_dotenv

# Load environment variables from .env file (DB credentials, API keys)
load_dotenv()

app = Flask(__name__)
CORS(app) # Enable Cross-Origin Resource Sharing for frontend-backend communication

# --- AI Configuration ---
# Initialize the Google Gemini AI client using the API key from environment variables
client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
model_id = 'gemini-2.5-flash' # Using the lightweight and fast Flash model

# --- Database Helper ---
def get_db_connection():
    """Establishes and returns a connection to the MySQL database."""
    return mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'health_prediction')
    )

# --- AI Integration Logic ---
def generate_health_remarks(full_name, dob, glucose, haemoglobin, cholesterol):
    """
    Sends blood test data to Gemini AI to generate a health risk assessment.
    This demonstrates AI integration capability by providing value-added analysis.
    """
    prompt = f"""
    As a health assistant, analyze the following blood test results for a patient:
    Name: {full_name}
    Date of Birth: {dob}
    Glucose: {glucose} mg/dL
    Haemoglobin: {haemoglobin} g/dL
    Cholesterol: {cholesterol} mg/dL

    Please provide a brief, professional health prediction or disease risk assessment in 2-3 sentences.
    Focus on what these levels might indicate (e.g., normal, high risk for diabetes, anemia, or cardiovascular issues).
    Mention that this is an AI-generated assessment and not a medical diagnosis.
    """
    try:
        # Call the Gemini API generate_content method
        response = client.models.generate_content(
            model=model_id,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "AI analysis unavailable at this time."

# --- Routes ---

@app.route('/')
def index():
    """Renders the main frontend page."""
    return render_template('index.html')

# --- CRUD API Endpoints ---

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """READ: Fetches all patient records from the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # Returns results as dictionaries
        cursor.execute("SELECT * FROM patients ORDER BY created_at DESC")
        patients = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(patients)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients', methods=['POST'])
def create_patient():
    """CREATE: Adds a new patient record and generates AI remarks."""
    data = request.json
    try:
        # Backend Validation: Ensure all required fields are present
        required_fields = ['full_name', 'dob', 'email', 'glucose', 'haemoglobin', 'cholesterol']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Field '{field}' is required"}), 400

        # AI Prediction: Generate remarks before saving to DB
        remarks = generate_health_remarks(
            data['full_name'], data['dob'], 
            data['glucose'], data['haemoglobin'], data['cholesterol']
        )

        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO patients (full_name, dob, email, glucose, haemoglobin, cholesterol, remarks)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['full_name'], data['dob'], data['email'], 
            data['glucose'], data['haemoglobin'], data['cholesterol'], remarks
        )
        cursor.execute(query, values)
        conn.commit() # Save changes to the database
        patient_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return jsonify({"id": patient_id, "remarks": remarks}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients/<int:id>', methods=['GET'])
def get_patient(id):
    """READ (Single): Fetches a specific patient record by ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM patients WHERE id = %s", (id,))
        patient = cursor.fetchone()
        cursor.close()
        conn.close()
        if patient:
            return jsonify(patient)
        return jsonify({"error": "Patient not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients/<int:id>', methods=['PUT'])
def update_patient(id):
    """UPDATE: Modifies an existing patient record and regenerates AI remarks."""
    data = request.json
    try:
        # Regenerate remarks based on updated health data
        remarks = generate_health_remarks(
            data['full_name'], data['dob'], 
            data['glucose'], data['haemoglobin'], data['cholesterol']
        )

        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            UPDATE patients 
            SET full_name=%s, dob=%s, email=%s, glucose=%s, haemoglobin=%s, cholesterol=%s, remarks=%s
            WHERE id=%s
        """
        values = (
            data['full_name'], data['dob'], data['email'], 
            data['glucose'], data['haemoglobin'], data['cholesterol'], remarks, id
        )
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Patient updated successfully", "remarks": remarks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/patients/<int:id>', methods=['DELETE'])
def delete_patient(id):
    """DELETE: Removes a patient record from the database."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM patients WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Patient deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Start the Flask development server
    app.run(debug=True, port=5000)
