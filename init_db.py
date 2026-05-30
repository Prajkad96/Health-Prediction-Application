import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables (DB host, user, password)
load_dotenv()

def init_db():
    """
    Initializes the MySQL database and the patients table.
    This script is useful for setting up the environment on a new machine.
    """
    try:
        # Connect to MySQL server (without specifying a database yet)
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )
        cursor = conn.cursor()

        # Create the database if it doesn't already exist
        db_name = os.getenv('DB_NAME', 'health_prediction')
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")

        # Create the 'patients' table with appropriate data types
        # - VARCHAR for names and emails
        # - DATE for birth dates
        # - FLOAT for numeric blood test values
        # - TEXT for AI-generated remarks
        # - TIMESTAMP for record creation time
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                dob DATE NOT NULL,
                email VARCHAR(255) NOT NULL,
                glucose FLOAT NOT NULL,
                haemoglobin FLOAT NOT NULL,
                cholesterol FLOAT NOT NULL,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        print(f"Database '{db_name}' and table 'patients' initialized successfully.")
        
        cursor.close()
        conn.close()
    except mysql.connector.Error as err:
        print(f"Error: {err}")

if __name__ == "__main__":
    init_db()
