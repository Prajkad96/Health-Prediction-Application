/**
 * Frontend logic for Health Prediction App
 * Handles CRUD operations and UI updates using Fetch API.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Load patient data when the page finishes loading
    fetchPatients();
});

/**
 * Shows a toast notification.
 */
function showToast(message, type = 'primary') {
    const toastElement = document.getElementById('liveToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastHeader = toastElement.querySelector('.toast-header');
    const icon = toastHeader.querySelector('i');
    
    toastMessage.innerText = message;
    
    // Set color based on type
    icon.className = `fas fa-info-circle me-2 text-${type}`;
    
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}

/**
 * Fetches all patient records from the backend and displays them in the table.
 */
function fetchPatients() {
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('patientTableBody');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center py-5 text-muted">
                            <i class="fas fa-folder-open fa-3x mb-3 opacity-25"></i>
                            <p>No patient records found. Click 'New Patient Record' to add one.</p>
                        </td>
                    </tr>
                `;
                return;
            }

            data.forEach((patient, index) => {
                const row = `
                    <tr class="animate-fade-in" style="animation-delay: ${0.1 + (index * 0.05)}s">
                        <td class="ps-4">
                            <div class="d-flex align-items-center">
                                <div class="patient-avatar me-3">
                                    ${patient.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div class="fw-bold text-dark" style="font-size: 1.05rem;">${patient.full_name}</div>
                                    <div class="small text-muted"><i class="far fa-envelope me-1 text-xs"></i>${patient.email}</div>
                                    <div class="small text-muted mt-1"><i class="far fa-calendar-alt me-1 text-xs"></i>${formatDate(patient.dob)}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="d-flex flex-column gap-1">
                                <span class="badge-health badge-bg-light">
                                    <i class="fas fa-droplet me-2 text-blue-500"></i>Glucose: <strong>${patient.glucose}</strong> mg/dL
                                </span>
                                <span class="badge-health badge-bg-light">
                                    <i class="fas fa-tint me-2 text-red-500"></i>Haemoglobin: <strong>${patient.haemoglobin}</strong> g/dL
                                </span>
                                <span class="badge-health badge-bg-light">
                                    <i class="fas fa-heartbeat me-2 text-purple-500"></i>Cholesterol: <strong>${patient.cholesterol}</strong> mg/dL
                                </span>
                            </div>
                        </td>
                        <td>
                            <div class="remarks-text">
                                ${patient.remarks || 'No remarks available.'}
                            </div>
                        </td>
                        <td class="text-end pe-4 action-btns">
                            <button class="btn btn-outline-primary shadow-sm" onclick="editPatient(${patient.id})" title="Edit Patient">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="btn btn-outline-danger shadow-sm" onclick="confirmDelete(${patient.id})" title="Delete Patient">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error fetching patients:', error);
            showToast('Failed to load patient records.', 'danger');
        });
}

/**
 * Formats a date string into a more readable format.
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Resets the patient form for adding a new record.
 */
function resetForm() {
    document.getElementById('patientForm').reset();
    document.getElementById('patientId').value = '';
    document.getElementById('patientModalLabel').innerText = 'New Patient Record';
    document.getElementById('aiLoading').classList.add('d-none');
    document.getElementById('saveBtn').disabled = false;
}

/**
 * Saves a patient record (Create or Update).
 */
function savePatient() {
    const id = document.getElementById('patientId').value;
    const patientData = {
        full_name: document.getElementById('fullName').value,
        dob: document.getElementById('dob').value,
        email: document.getElementById('email').value,
        glucose: parseFloat(document.getElementById('glucose').value),
        haemoglobin: parseFloat(document.getElementById('haemoglobin').value),
        cholesterol: parseFloat(document.getElementById('cholesterol').value)
    };

    // Client-side validation
    if (!validateForm(patientData)) return;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/patients/${id}` : '/api/patients';

    // Show AI loading indicator and disable save button
    document.getElementById('aiLoading').classList.remove('d-none');
    document.getElementById('saveBtn').disabled = true;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast('Error: ' + data.error, 'danger');
        } else {
            // Success: Close modal and refresh table
            const modalElement = document.getElementById('patientModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            fetchPatients();
            showToast(id ? 'Patient record updated successfully.' : 'New patient record added successfully.', 'success');
        }
    })
    .catch(error => {
        console.error('Error saving patient:', error);
        showToast('An error occurred while saving.', 'danger');
    })
    .finally(() => {
        // Hide loading indicator and re-enable button
        document.getElementById('aiLoading').classList.add('d-none');
        document.getElementById('saveBtn').disabled = false;
    });
}

/**
 * Validates the patient form data.
 */
function validateForm(data) {
    if (!data.full_name || !data.dob || !data.email || isNaN(data.glucose) || isNaN(data.haemoglobin) || isNaN(data.cholesterol)) {
        showToast('Please fill all fields correctly.', 'warning');
        return false;
    }

    // Check if DOB is a valid date
    const dobDate = new Date(data.dob);
    const dateParts = data.dob.split('-'); // YYYY-MM-DD
    if (
        isNaN(dobDate.getTime()) || 
        dobDate.getFullYear() != dateParts[0] || 
        dobDate.getMonth() + 1 != dateParts[1] || // JS months are 0-11
        dobDate.getDate() != dateParts[2]
    ) {
        showToast('Invalid date of birth. Please check the day, month, and year.', 'warning');
        return false;
    }

    // Check if DOB is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    if (dobDate > today) {
        showToast('Date of birth cannot be in the future.', 'warning');
        return false;
    }

    // Email format validation: must contain @ and a valid TLD (like .com)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
        showToast('Please enter a valid email address (e.g., name@example.com).', 'warning');
        return false;
    }

    return true;
}

/**
 * Prepares the form for editing an existing patient.
 */
function editPatient(id) {
    fetch(`/api/patients/${id}`)
        .then(response => response.json())
        .then(patient => {
            document.getElementById('patientId').value = patient.id;
            document.getElementById('fullName').value = patient.full_name;
            
            // Convert date to YYYY-MM-DD for input[type="date"]
            const dobDate = new Date(patient.dob);
            const dob = dobDate.toISOString().split('T')[0];
            document.getElementById('dob').value = dob;
            
            document.getElementById('email').value = patient.email;
            document.getElementById('glucose').value = patient.glucose;
            document.getElementById('haemoglobin').value = patient.haemoglobin;
            document.getElementById('cholesterol').value = patient.cholesterol;
            
            document.getElementById('patientModalLabel').innerText = 'Edit Patient Record';
            const modal = new bootstrap.Modal(document.getElementById('patientModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Error fetching patient details:', error);
            showToast('Failed to load patient details for editing.', 'danger');
        });
}

/**
 * Logic for deleting a patient record.
 */
let patientIdToDelete = null;

function confirmDelete(id) {
    patientIdToDelete = id;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (patientIdToDelete) {
        fetch(`/api/patients/${patientIdToDelete}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            const modalElement = document.getElementById('deleteModal');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            fetchPatients();
            showToast('Patient record deleted successfully.', 'success');
        })
        .catch(error => {
            console.error('Error deleting patient:', error);
            showToast('Failed to delete patient record.', 'danger');
        });
    }
});
