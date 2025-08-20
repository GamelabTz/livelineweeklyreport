// Global variables
let currentWorkDayId = 0;
let currentImages = [];
let currentWorkDayElement = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    // Hide loading spinner
    document.getElementById('loadingSpinner').style.display = 'none';
    
    // Load transmission lines
    await loadTransmissionLines();
    
    // Load dashboard statistics
    await loadDashboardStats();
    
    // Load recent reports for dashboard
    await loadRecentReports();
    
    // Set default date to today
    document.getElementById('reportDate').valueAsDate = new Date();
    
    // Add initial work day
    addWorkDay();
    
    // Setup image upload
    setupImageUpload();
    
    // Setup tab change handlers
    document.getElementById('reports-tab').addEventListener('click', loadSavedReports);
    document.getElementById('monthly-tab').addEventListener('click', loadMonthlyData);
});

// Load transmission lines from database
async function loadTransmissionLines() {
    const lines = await Database.getLines();
    
    // Populate line selects
    const lineSelect = document.getElementById('lineSelect');
    const monthlyLine = document.getElementById('monthlyLine');
    const lineFilter = document.getElementById('lineFilter');
    
    // Clear existing options except the first one
    lineSelect.innerHTML = '<option value="">Select Line...</option>';
    monthlyLine.innerHTML = '<option value="">Select Line...</option>';
    lineFilter.innerHTML = '<option value="">All Lines</option>';
    
    lines.forEach(line => {
        const option = new Option(`${line.name} ${line.voltage}kV`, `${line.name} ${line.voltage}kV`);
        lineSelect.appendChild(option);
        
        const monthlyOption = option.cloneNode(true);
        monthlyLine.appendChild(monthlyOption);
        
        const filterOption = option.cloneNode(true);
        lineFilter.appendChild(filterOption);
    });
}

// Load dashboard statistics
async function loadDashboardStats() {
    const stats = await Database.getDashboardStats();
    
    document.getElementById('totalReports').textContent = stats.totalReports;
    document.getElementById('completedReports').textContent = stats.completedReports;
    document.getElementById('draftReports').textContent = stats.draftReports;
    document.getElementById('totalTowers').textContent = stats.totalTowers;
}

// Load recent reports for dashboard
async function loadRecentReports() {
    const reports = await Database.getReports();
    const recentReports = reports.slice(0, 5); // Get only the 5 most recent
    
    const container = document.getElementById('recentReports');
    
    if (recentReports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-2">No reports found</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    recentReports.forEach(report => {
        html += `
            <div class="report-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6>${report.line}</h6>
                        <p class="mb-1">
                            <small class="text-muted">Date: ${new Date(report.report_date).toLocaleDateString()}</small>
                        </p>
                        <p class="mb-1">
                            <small class="text-muted">Team: ${report.team}</small>
                        </p>
                    </div>
                    <div>
                        <span class="badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                            ${report.status.toUpperCase()}
                        </span>
                        <div class="btn-group btn-group-sm mt-2">
                            <button class="btn btn-outline-primary" onclick="viewReport('${report.id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editReport('${report.id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Add a new work day
function addWorkDay() {
    currentWorkDayId++;
    
    const container = document.getElementById('workDaysContainer');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Calculate default date (today + number of existing work days)
    const today = new Date();
    const workDayCount = container.querySelectorAll('.work-day-card').length;
    today.setDate(today.getDate() + workDayCount);
    const defaultDate = today.toISOString().split('T')[0];
    const defaultDayName = dayNames[today.getDay()];
    
    const workDayHtml = `
        <div class="card work-day-card mb-3" id="workDay_${currentWorkDayId}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Work Day</h6>
                <div>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeWorkDay(${currentWorkDayId})">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-4">
                        <label class="form-label">Day:</label>
                        <input type="text" class="form-control day-name" value="${defaultDayName}" readonly>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Date:</label>
                        <input type="date" class="form-control day-date" value="${defaultDate}" onchange="updateDayName(this, ${currentWorkDayId})">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Work Type:</label>
                        <div class="d-flex">
                            <div class="form-check me-3">
                                <input class="form-check-input work-type" type="radio" name="workType_${currentWorkDayId}" value="normal" checked onchange="toggleWorkSections(${currentWorkDayId})">
                                <label class="form-check-label">Normal Work</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input work-type" type="radio" name="workType_${currentWorkDayId}" value="nowork" onchange="toggleWorkSections(${currentWorkDayId})">
                                <label class="form-check-label">No Work</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Normal Work Section -->
                <div class="normal-work-section" id="normalWork_${currentWorkDayId}">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6>Towers</h6>
                        <button class="btn btn-primary btn-sm" onclick="addTower(${currentWorkDayId})">
                            <i class="bi bi-plus-circle"></i> Add Tower
                        </button>
                    </div>
                    
                    <div class="towers-container" id="towersContainer_${currentWorkDayId}">
                        <!-- Initial tower will be added by addTower function -->
                    </div>
                </div>
                
                <!-- No Work Section -->
                <div class="no-work-section d-none" id="noWork_${currentWorkDayId}">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Reason:</label>
                            <select class="form-select no-work-reason">
                                <option value="PUBLIC HOLIDAY">PUBLIC HOLIDAY</option>
                                <option value="RAIN">RAIN</option>
                                <option value="EQUIPMENT ISSUE">EQUIPMENT ISSUE</option>
                                <option value="OTHER">OTHER</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Details:</label>
                            <input type="text" class="form-control no-work-details">
                        </div>
                    </div>
                </div>
                
                <!-- Images Section -->
                <div class="mt-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="openImageUpload(${currentWorkDayId})">
                        <i class="bi bi-camera"></i> Add Images
                    </button>
                    <div class="images-container mt-2" id="imagesContainer_${currentWorkDayId}"></div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', workDayHtml);
    
    // Add initial tower
    addTower(currentWorkDayId);
    
    // Update summary
    updateReportSummary();
}

// Remove a work day
function removeWorkDay(workDayId) {
    if (confirm('Are you sure you want to remove this work day?')) {
        document.getElementById(`workDay_${workDayId}`).remove();
        updateReportSummary();
    }
}

// Update day name based on selected date
function updateDayName(dateInput, workDayId) {
    const date = new Date(dateInput.value);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const workDayCard = document.getElementById(`workDay_${workDayId}`);
    const dayNameInput = workDayCard.querySelector('.day-name');
    
    dayNameInput.value = dayNames[date.getDay()];
}

// Toggle between normal work and no work sections
function toggleWorkSections(workDayId) {
    const workDayCard = document.getElementById(`workDay_${workDayId}`);
    const normalWorkSection = document.getElementById(`normalWork_${workDayId}`);
    const noWorkSection = document.getElementById(`noWork_${workDayId}`);
    const workType = workDayCard.querySelector('.work-type:checked').value;
    
    if (workType === 'normal') {
        normalWorkSection.classList.remove('d-none');
        noWorkSection.classList.add('d-none');
    } else {
        normalWorkSection.classList.add('d-none');
        noWorkSection.classList.remove('d-none');
    }
    
    updateReportSummary();
}

// Add a tower to a work day
function addTower(workDayId) {
    const towersContainer = document.getElementById(`towersContainer_${workDayId}`);
    const towerCount = towersContainer.querySelectorAll('.tower-entry').length + 1;
    
    const towerHtml = `
        <div class="tower-entry">
            <div class="row mb-3">
                <div class="col-md-4">
                    <label class="form-label">Tower No:</label>
                    <input type="number" class="form-control tower-number">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Tower Type:</label>
                    <select class="form-select tower-type">
                        <option value="SS">SS</option>
                        <option value="TT">TT</option>
                    </select>
                </div>
                <div class="col-md-4 d-flex align-items-end">
                    <button class="btn btn-outline-danger btn-sm" onclick="removeTower(this)">
                        <i class="bi bi-trash"></i> Remove
                    </button>
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-12">
                    <label class="form-label">Washed Insulators:</label>
                    <div class="d-flex">
                        <div class="me-3">
                            <label>R:</label>
                            <input type="number" class="form-control form-control-sm insulator-r" value="9" onchange="updateReportSummary()">
                        </div>
                        <div class="me-3">
                            <label>Y:</label>
                            <input type="number" class="form-control form-control-sm insulator-y" value="9" onchange="updateReportSummary()">
                        </div>
                        <div>
                            <label>B:</label>
                            <input type="number" class="form-control form-control-sm insulator-b" value="9" onchange="updateReportSummary()">
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-12">
                    <label class="form-label">Remarks:</label>
                    <input type="text" class="form-control tower-remarks">
                </div>
            </div>
        </div>
    `;
    
    towersContainer.insertAdjacentHTML('beforeend', towerHtml);
    updateReportSummary();
}

// Remove a tower
function removeTower(button) {
    const towerEntry = button.closest('.tower-entry');
    const towersContainer = towerEntry.parentElement;
    
    if (towersContainer.querySelectorAll('.tower-entry').length > 1) {
        towerEntry.remove();
        updateReportSummary();
    } else {
        alert('At least one tower entry is required');
    }
}

// Setup image upload
function setupImageUpload() {
    const uploadArea = document.getElementById('imageUploadArea');
    const imageInput = document.getElementById('imageInput');
    
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleImageFiles(e.dataTransfer.files);
    });
    
    imageInput.addEventListener('change', () => {
        handleImageFiles(imageInput.files);
    });
}

// Open image upload modal
function openImageUpload(workDayId) {
    currentWorkDayElement = document.getElementById(`workDay_${workDayId}`);
    currentImages = [];
    
    document.getElementById('imagePreview').innerHTML = '';
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

// Handle image files
function handleImageFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageId = Date.now() + Math.random().toString(36).substring(2, 9);
                currentImages.push({
                    id: imageId,
                    file: file,
                    name: file.name,
                    data: e.target.result,
                    caption: ''
                });
                
                displayImagePreview(imageId, e.target.result, file.name);
            };
            reader.readAsDataURL(file);
        } else {
            alert(`File ${file.name} is either not an image or exceeds 5MB limit`);
        }
    });
}

// Display image preview
function displayImagePreview(imageId, src, name) {
    const preview = document.getElementById('imagePreview');
    
    const imageItem = document.createElement('div');
    imageItem.className = 'image-item';
    imageItem.innerHTML = `
        <img src="${src}" alt="${name}">
        <div class="p-2">
            <input type="text" class="form-control form-control-sm" placeholder="Add caption..." 
                   onchange="updateImageCaption('${imageId}', this.value)">
        </div>
        <button class="remove-btn" onclick="removeImage('${imageId}')">×</button>
    `;
    
    preview.appendChild(imageItem);
}

// Update image caption
function updateImageCaption(imageId, caption) {
    const image = currentImages.find(img => img.id === imageId);
    if (image) {
        image.caption = caption;
    }
}

// Remove image from preview
function removeImage(imageId) {
    currentImages = currentImages.filter(img => img.id !== imageId);
    document.getElementById('imagePreview').innerHTML = '';
    
    currentImages.forEach(img => {
        displayImagePreview(img.id, img.data, img.name);
    });
}

// Save images to work day
function saveImages() {
    if (currentWorkDayElement && currentImages.length > 0) {
        const imagesContainer = currentWorkDayElement.querySelector('.images-container');
        imagesContainer.innerHTML = '';
        
        const imagePreview = document.createElement('div');
        imagePreview.className = 'image-preview';
        
        currentImages.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${image.data}" alt="${image.name}">
                <div class="image-caption">${image.caption || image.name}</div>
            `;
            imagePreview.appendChild(imageItem);
        });
        
        imagesContainer.appendChild(imagePreview);
        
        // Store images data in the work day element
        currentWorkDayElement.dataset.images = JSON.stringify(currentImages);
    }
    
    bootstrap.Modal.getInstance(document.getElementById('imageModal')).hide();
}

// Update report summary
function updateReportSummary() {
    let totalWorkDays = 0;
    let totalTowers = 0;
    let totalR = 0;
    let totalY = 0;
    let totalB = 0;
    
    document.querySelectorAll('.work-day-card').forEach(workDay => {
        const workType = workDay.querySelector('.work-type:checked').value;
        
        if (workType === 'normal') {
            totalWorkDays++;
            
            workDay.querySelectorAll('.tower-entry').forEach(tower => {
                totalTowers++;
                totalR += parseInt(tower.querySelector('.insulator-r').value || 0);
                totalY += parseInt(tower.querySelector('.insulator-y').value || 0);
                totalB += parseInt(tower.querySelector('.insulator-b').value || 0);
            });
        }
    });
    
    document.getElementById('summaryWorkDays').textContent = totalWorkDays;
    document.getElementById('summaryTowers').textContent = totalTowers;
    document.getElementById('summaryR').textContent = totalR;
    document.getElementById('summaryY').textContent = totalY;
    document.getElementById('summaryB').textContent = totalB;
}

// Save report as draft
async function saveDraft() {
    const reportData = collectReportData();
    
    if (!validateReportData(reportData)) {
        return;
    }
    
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const result = await Database.saveReport(reportData, false);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (result.success) {
        alert('Report saved as draft successfully!');
        clearForm();
        loadDashboardStats();
        loadRecentReports();
    } else {
        alert(`Error saving report: ${result.error}`);
    }
}

// Submit completed report
async function submitReport() {
    const reportData = collectReportData();
    
    if (!validateReportData(reportData)) {
        return;
    }
    
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const result = await Database.saveReport(reportData, true);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (result.success) {
        alert('Report submitted successfully!');
        clearForm();
        loadDashboardStats();
        loadRecentReports();
    } else {
        alert(`Error submitting report: ${result.error}`);
    }
}

// Collect report data from form
function collectReportData() {
    const data = {
        line: document.getElementById('lineSelect').value,
        fromPerson: document.getElementById('fromPerson').value,
        toPerson: document.getElementById('toPerson').value,
        reportDate: document.getElementById('reportDate').value,
        team: document.getElementById('team').value,
        location: document.getElementById('location').value,
        reference: document.getElementById('reference').value,
        workDays: []
    };
    
    // Collect work days data
    document.querySelectorAll('.work-day-card').forEach(workDayCard => {
        const workDayId = workDayCard.id.split('_')[1];
        const workType = workDayCard.querySelector('.work-type:checked').value;
        
        const workDay = {
            dayName: workDayCard.querySelector('.day-name').value,
            date: workDayCard.querySelector('.day-date').value,
            workType: workType,
            towers: [],
            noWorkReason: '',
            noWorkDetails: '',
            images: JSON.parse(workDayCard.dataset.images || '[]')
        };
        
        if (workType === 'normal') {
            workDayCard.querySelectorAll('.tower-entry').forEach(towerEntry => {
                workDay.towers.push({
                    number: towerEntry.querySelector('.tower-number').value,
                    type: towerEntry.querySelector('.tower-type').value,
                    insulators: {
                        r: towerEntry.querySelector('.insulator-r').value || 0,
                        y: towerEntry.querySelector('.insulator-y').value || 0,
                        b: towerEntry.querySelector('.insulator-b').value || 0
                    },
                    remarks: towerEntry.querySelector('.tower-remarks').value
                });
            });
        } else {
            workDay.noWorkReason = workDayCard.querySelector('.no-work-reason').value;
            workDay.noWorkDetails = workDayCard.querySelector('.no-work-details').value;
        }
        
        data.workDays.push(workDay);
    });
    
    return data;
}

// Validate report data
function validateReportData(data) {
    if (!data.line) {
        alert('Please select a transmission line');
        return false;
    }
    
    if (!data.reportDate) {
        alert('Please select a report date');
        return false;
    }
    
    if (!data.fromPerson || !data.toPerson) {
        alert('Please fill in the From and To fields');
        return false;
    }
    
    if (!data.team || !data.location) {
        alert('Please fill in the Team and Location fields');
        return false;
    }
    
    if (data.workDays.length === 0) {
        alert('Please add at least one work day');
        return false;
    }
    
    for (const workDay of data.workDays) {
        if (!workDay.date) {
            alert('Please select a date for all work days');
            return false;
        }
        
        if (workDay.workType === 'normal') {
            if (workDay.towers.length === 0) {
                alert(`Please add at least one tower for ${workDay.dayName}`);
                return false;
            }
            
            for (const tower of workDay.towers) {
                if (!tower.number) {
                    alert('Please enter a tower number for all towers');
                    return false;
                }
            }
        } else if (!workDay.noWorkReason) {
            alert(`Please select a reason for no work on ${workDay.dayName}`);
            return false;
        }
    }
    
    return true;
}

// Clear the form
function clearForm() {
    document.getElementById('reportForm').reset();
    document.getElementById('workDaysContainer').innerHTML = '';
    document.getElementById('reportDate').valueAsDate = new Date();
    
    currentWorkDayId = 0;
    addWorkDay();
    updateReportSummary();
}

// Preview report
function previewReport() {
    const reportData = collectReportData();
    
    if (!validateReportData(reportData)) {
        return;
    }
    
    const previewHtml = generateReportHtml(reportData);
    document.getElementById('reportPreview').innerHTML = previewHtml;
    
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

// Generate HTML for report preview
function generateReportHtml(data) {
    let html = `
        <div class="report-preview">
            <div class="text-center mb-4">
                <h4>TANZANIA ELECTRIC SUPPLY COMPANY LIMITED</h4>
                <h5>WEEKLY REPORT</h5>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <p><strong>FROM:</strong> ${data.fromPerson}</p>
                    <p><strong>TO:</strong> ${data.toPerson}</p>
                    <p><strong>LINE:</strong> ${data.line}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>DATE:</strong> ${formatDate(data.reportDate)}</p>
                    <p><strong>TEAM:</strong> ${data.team}</p>
                    <p><strong>LOCATION:</strong> ${data.location}</p>
                    <p><strong>REF:</strong> ${data.reference}</p>
                </div>
            </div>
            
            <hr>
    `;
    
    // Add work days
    let totalR = 0, totalY = 0, totalB = 0;
    
    data.workDays.forEach(workDay => {
        html += `
            <div class="work-day mb-4">
                <h6 class="bg-light p-2">${workDay.dayName} - ${formatDate(workDay.date)}</h6>
        `;
        
        if (workDay.workType === 'normal') {
            html += `
                <div class="table-responsive">
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Tower No.</th>
                                <th>Tower Type</th>
                                <th>R</th>
                                <th>Y</th>
                                <th>B</th>
                                <th>Total</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            workDay.towers.forEach(tower => {
                const r = parseInt(tower.insulators.r) || 0;
                const y = parseInt(tower.insulators.y) || 0;
                const b = parseInt(tower.insulators.b) || 0;
                const total = r + y + b;
                
                totalR += r;
                totalY += y;
                totalB += b;
                
                html += `
                    <tr>
                        <td>${tower.number}</td>
                        <td>${tower.type}</td>
                        <td>${r}</td>
                        <td>${y}</td>
                        <td>${b}</td>
                        <td>${total}</td>
                        <td>${tower.remarks || ''}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            html += `
                <div class="alert alert-warning">
                    <strong>No Work:</strong> ${workDay.noWorkReason}
                    ${workDay.noWorkDetails ? ` - ${workDay.noWorkDetails}` : ''}
                </div>
            `;
        }
        
        // Add images if any
        if (workDay.images && workDay.images.length > 0) {
            html += `
                <div class="mt-3">
                    <h6>Images:</h6>
                    <div class="row">
            `;
            
            workDay.images.forEach(image => {
                html += `
                    <div class="col-md-3 mb-2">
                        <div class="card">
                            <img src="${image.data}" class="card-img-top" alt="${image.name}">
                            ${image.caption ? `<div class="card-body p-2"><small>${image.caption}</small></div>` : ''}
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    // Add summary
    html += `
        <hr>
        <div class="row">
            <div class="col-md-6">
                <h6>SUMMARY:</h6>
                <p>Total Insulators Washed:</p>
                <ul>
                    <li>R Phase: ${totalR}</li>
                    <li>Y Phase: ${totalY}</li>
                    <li>B Phase: ${totalB}</li>
                    <li><strong>Total: ${totalR + totalY + totalB}</strong></li>
                </ul>
            </div>
            <div class="col-md-6 text-end">
                <p class="mt-4">Prepared by: ${data.fromPerson}</p>
                <p>Date: ${formatDate(data.reportDate)}</p>
            </div>
        </div>
    `;
    
    return html;
}

// Format date as DD/MM/YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Print report from preview
function printFromPreview() {
    const printWindow = window.open('', '_blank');
    const previewContent = document.getElementById('reportPreview').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TANESCO Weekly Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @media print {
                    body { font-size: 12px; }
                }
                .report-preview { max-width: 1000px; margin: 0 auto; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="report-preview">
                ${previewContent}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Export to Excel
function exportToExcel() {
    const reportData = collectReportData();
    
    if (!validateReportData(reportData)) {
        return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data
    const wsData = [
        ['TANZANIA ELECTRIC SUPPLY COMPANY LIMITED'],
        ['WEEKLY REPORT'],
        [],
        ['FROM:', reportData.fromPerson, '', 'DATE:', formatDate(reportData.reportDate)],
        ['TO:', reportData.toPerson, '', 'TEAM:', reportData.team],
        ['LINE:', reportData.line, '', 'LOCATION:', reportData.location],
        ['REF:', reportData.reference],
        []
    ];
    
    // Add work days data
    let totalR = 0, totalY = 0, totalB = 0;
    
    reportData.workDays.forEach(workDay => {
        wsData.push([`${workDay.dayName} - ${formatDate(workDay.date)}`]);
        
        if (workDay.workType === 'normal') {
            wsData.push(['Tower No.', 'Tower Type', 'R', 'Y', 'B', 'Total', 'Remarks']);
            
            workDay.towers.forEach(tower => {
                const r = parseInt(tower.insulators.r) || 0;
                const y = parseInt(tower.insulators.y) || 0;
                const b = parseInt(tower.insulators.b) || 0;
                const total = r + y + b;
                
                totalR += r;
                totalY += y;
                totalB += b;
                
                wsData.push([
                    tower.number,
                    tower.type,
                    r,
                    y,
                    b,
                    total,
                    tower.remarks || ''
                ]);
            });
        } else {
            wsData.push([`No Work: ${workDay.noWorkReason} ${workDay.noWorkDetails ? '- ' + workDay.noWorkDetails : ''}`]);
        }
        
        wsData.push([]);
    });
    
    // Add summary
    wsData.push(['SUMMARY:']);
    wsData.push(['R Phase:', totalR]);
    wsData.push(['Y Phase:', totalY]);
    wsData.push(['B Phase:', totalB]);
    wsData.push(['Total:', totalR + totalY + totalB]);
    wsData.push([]);
    wsData.push(['Prepared by:', reportData.fromPerson]);
    wsData.push(['Date:', formatDate(reportData.reportDate)]);
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');
    
    // Generate Excel file
    const fileName = `TANESCO_Weekly_Report_${reportData.reportDate.replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Load saved reports
async function loadSavedReports() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const reports = await Database.getReports();
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    const container = document.getElementById('savedReportsList');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                <p class="text-muted mt-2">No saved reports found</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    reports.forEach(report => {
        html += `
            <div class="report-item" data-id="${report.id}" data-line="${report.line}" data-status="${report.status}">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5>${report.line}</h5>
                        <p class="mb-1">Date: ${formatDate(report.report_date)}</p>
                        <p class="mb-1">Team: ${report.team}</p>
                        <p class="mb-1">Location: ${report.location}</p>
                        <p class="mb-0">
                            <small class="text-muted">Created: ${new Date(report.created_at).toLocaleString()}</small>
                        </p>
                    </div>
                    <div class="text-end">
                        <span class="badge ${report.status === 'completed' ? 'bg-success' : 'bg-warning'} mb-2">
                            ${report.status.toUpperCase()}
                        </span>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewReport('${report.id}')">
                                <i class="bi bi-eye"></i> View
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="editReport('${report.id}')">
                                <i class="bi bi-pencil"></i> Edit
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteReport('${report.id}')">
                                <i class="bi bi-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter saved reports
function filterReports() {
    const statusFilter = document.getElementById('statusFilter').value;
    const lineFilter = document.getElementById('lineFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    document.querySelectorAll('.report-item').forEach(item => {
        let show = true;
        
        if (statusFilter && item.dataset.status !== statusFilter) {
            show = false;
        }
        
        if (lineFilter && item.dataset.line !== lineFilter) {
            show = false;
        }
        
        if (searchFilter) {
            const text = item.textContent.toLowerCase();
            if (!text.includes(searchFilter)) {
                show = false;
            }
        }
        
        item.style.display = show ? 'block' : 'none';
    });
}

// View a saved report
async function viewReport(reportId) {
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const report = await Database.getReportDetails(reportId);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (!report) {
        alert('Error loading report');
        return;
    }
    
    // Convert to the format expected by generateReportHtml
    const reportData = {
        line: report.line,
        fromPerson: report.from_person,
        toPerson: report.to_person,
        reportDate: report.report_date,
        team: report.team,
        location: report.location,
        reference: report.ref,
        workDays: report.workDays.map(day => ({
            dayName: day.day_name,
            date: day.work_date,
            workType: day.work_type,
            noWorkReason: day.no_work_reason,
            noWorkDetails: day.no_work_details,
            towers: day.towers.map(tower => ({
                number: tower.tower_number,
                type: tower.tower_type,
                insulators: {
                    r: tower.insulators_r,
                    y: tower.insulators_y,
                    b: tower.insulators_b
                },
                remarks: tower.remarks
            })),
            images: day.images.map(image => ({
                data: image.image_url,
                name: image.file_name,
                caption: image.caption
            }))
        }))
    };
    
    const previewHtml = generateReportHtml(reportData);
    document.getElementById('reportPreview').innerHTML = previewHtml;
    
    const modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
}

// Edit a saved report
async function editReport(reportId) {
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const report = await Database.getReportDetails(reportId);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (!report) {
        alert('Error loading report');
        return;
    }
    
    // Switch to weekly tab
    document.getElementById('weekly-tab').click();
    
    // Clear existing form
    clearForm();
    
    // Fill in form data
    document.getElementById('lineSelect').value = report.line;
    document.getElementById('fromPerson').value = report.from_person;
    document.getElementById('toPerson').value = report.to_person;
    document.getElementById('reportDate').value = report.report_date;
    document.getElementById('team').value = report.team;
    document.getElementById('location').value = report.location;
    document.getElementById('reference').value = report.ref;
    
    // Clear work days container
    document.getElementById('workDaysContainer').innerHTML = '';
    currentWorkDayId = 0;
    
    // Add work days
    report.workDays.forEach(day => {
        addWorkDay();
        const workDayCard = document.getElementById(`workDay_${currentWorkDayId}`);
        
        workDayCard.querySelector('.day-name').value = day.day_name;
        workDayCard.querySelector('.day-date').value = day.work_date;
        
        // Set work type
        const workType = day.work_type;
        workDayCard.querySelector(`.work-type[value="${workType}"]`).checked = true;
        toggleWorkSections(currentWorkDayId);
        
        if (workType === 'normal') {
            // Clear default tower
            const towersContainer = document.getElementById(`towersContainer_${currentWorkDayId}`);
            towersContainer.innerHTML = '';
            
            // Add towers
            day.towers.forEach(tower => {
                addTower(currentWorkDayId);
                const towerEntry = towersContainer.lastElementChild;
                
                towerEntry.querySelector('.tower-number').value = tower.tower_number;
                towerEntry.querySelector('.tower-type').value = tower.tower_type;
                towerEntry.querySelector('.insulator-r').value = tower.insulators_r;
                towerEntry.querySelector('.insulator-y').value = tower.insulators_y;
                towerEntry.querySelector('.insulator-b').value = tower.insulators_b;
                towerEntry.querySelector('.tower-remarks').value = tower.remarks;
            });
        } else {
            workDayCard.querySelector('.no-work-reason').value = day.no_work_reason;
            workDayCard.querySelector('.no-work-details').value = day.no_work_details;
        }
        
        // Add images if any
        if (day.images && day.images.length > 0) {
            const imagesContainer = workDayCard.querySelector('.images-container');
            const imagePreview = document.createElement('div');
            imagePreview.className = 'image-preview';
            
            day.images.forEach(image => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.innerHTML = `
                    <img src="${image.image_url}" alt="${image.file_name || 'Image'}">
                    <div class="image-caption">${image.caption || image.file_name || 'Image'}</div>
                `;
                imagePreview.appendChild(imageItem);
            });
            
            imagesContainer.appendChild(imagePreview);
            
            // Store images data
            const imagesData = day.images.map(image => ({
                id: image.id,
                data: image.image_url,
                name: image.file_name,
                caption: image.caption
            }));
            
            workDayCard.dataset.images = JSON.stringify(imagesData);
        }
    });
    
    updateReportSummary();
}

// Delete a report
async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
        document.getElementById('loadingSpinner').style.display = 'flex';
        
        const result = await Database.deleteReport(reportId);
        
        document.getElementById('loadingSpinner').style.display = 'none';
        
        if (result.success) {
            alert('Report deleted successfully');
            loadSavedReports();
            loadDashboardStats();
            loadRecentReports();
        } else {
            alert(`Error deleting report: ${result.error}`);
        }
    }
}

// Load monthly data
function loadMonthlyData() {
    // This would be implemented to load data for monthly reports
    // For now, we'll just show a message
    document.getElementById('monthlyReportPreview').style.display = 'block';
    document.getElementById('monthlyReportPreview').innerHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> 
            Select a line, month, and year above, then click "Generate Monthly Report" to create a summary of all weekly reports for that period.
        </div>
    `;
}

// Generate monthly report
async function generateMonthlyReport() {
    const line = document.getElementById('monthlyLine').value;
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    
    if (!line) {
        alert('Please select a transmission line');
        return;
    }
    
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    // Get all completed reports for the selected line, month, and year
    const allReports = await Database.getReports({ status: 'completed', line });
    
    const monthlyReports = allReports.filter(report => {
        const reportDate = new Date(report.report_date);
        return reportDate.getMonth() + 1 === month && reportDate.getFullYear() === year;
    });
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (monthlyReports.length === 0) {
        document.getElementById('monthlyReportPreview').style.display = 'block';
        document.getElementById('monthlyReportPreview').innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> 
                No completed reports found for ${getMonthName(month)} ${year} on line ${line}.
            </div>
        `;
        return;
    }
    
    // Get full details for each report
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    const reportDetails = await Promise.all(
        monthlyReports.map(report => Database.getReportDetails(report.id))
    );
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    // Generate monthly summary
    let totalWorkDays = 0;
    let totalTowers = 0;
    let totalR = 0;
    let totalY = 0;
    let totalB = 0;
    
    reportDetails.forEach(report => {
        report.workDays.forEach(day => {
            if (day.work_type === 'normal') {
                totalWorkDays++;
                
                day.towers.forEach(tower => {
                    totalTowers++;
                    totalR += parseInt(tower.insulators_r || 0);
                    totalY += parseInt(tower.insulators_y || 0);
                    totalB += parseInt(tower.insulators_b || 0);
                });
            }
        });
    });
    
    // Create monthly report preview
    const monthlyHtml = `
        <div class="card">
            <div class="card-header bg-warning text-white">
                <h5>Monthly Report: ${getMonthName(month)} ${year} - ${line}</h5>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white text-center p-3">
                            <h3>${reportDetails.length}</h3>
                            <p class="mb-0">Weekly Reports</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white text-center p-3">
                            <h3>${totalWorkDays}</h3>
                            <p class="mb-0">Work Days</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white text-center p-3">
                            <h3>${totalTowers}</h3>
                            <p class="mb-0">Towers</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-secondary text-white text-center p-3">
                            <h3>${totalR + totalY + totalB}</h3>
                            <p class="mb-0">Insulators</p>
                        </div>
                    </div>
                </div>
                
                <h5>Weekly Reports Included:</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Week</th>
                                <th>Date</th>
                                <th>Team</th>
                                <th>Work Days</th>
                                <th>Towers</th>
                                <th>Insulators</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
    
    let monthlyHtmlRows = '';
    
    reportDetails.forEach(report => {
        let reportWorkDays = 0;
        let reportTowers = 0;
        let reportInsulators = 0;
        
        report.workDays.forEach(day => {
            if (day.work_type === 'normal') {
                reportWorkDays++;
                
                day.towers.forEach(tower => {
                    reportTowers++;
                    reportInsulators += parseInt(tower.insulators_r || 0) + 
                                       parseInt(tower.insulators_y || 0) + 
                                       parseInt(tower.insulators_b || 0);
                });
            }
        });
        
        monthlyHtmlRows += `
            <tr>
                <td>Week ${new Date(report.report_date).getDate()}</td>
                <td>${formatDate(report.report_date)}</td>
                <td>${report.team}</td>
                <td>${reportWorkDays}</td>
                <td>${reportTowers}</td>
                <td>${reportInsulators}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewReport('${report.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    const monthlyHtmlEnd = `
                        </tbody>
                    </table>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-success" onclick="exportMonthlyToExcel()">
                        <i class="bi bi-file-earmark-excel"></i> Export to Excel
                    </button>
                    <button class="btn btn-primary" onclick="printMonthlyReport()">
                        <i class="bi bi-printer"></i> Print Report
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('monthlyReportPreview').style.display = 'block';
    document.getElementById('monthlyReportPreview').innerHTML = monthlyHtml + monthlyHtmlRows + monthlyHtmlEnd;
}

// Get month name
function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
}

// Add a new line
async function saveNewLine() {
    const name = document.getElementById('newLineName').value.trim();
    const voltage = parseInt(document.getElementById('newLineVoltage').value);
    
    if (!name || !voltage) {
        alert('Please enter both line name and voltage');
        return;
    }
    
        document.getElementById('loadingSpinner').style.display = 'flex';
    
    const result = await Database.addLine(name, voltage);
    
    document.getElementById('loadingSpinner').style.display = 'none';
    
    if (result.success) {
        alert('Line added successfully');
        
        // Add to select options
        const fullLineName = `${name} ${voltage}kV`;
        
        const lineSelect = document.getElementById('lineSelect');
        const monthlyLine = document.getElementById('monthlyLine');
        const lineFilter = document.getElementById('lineFilter');
        
        lineSelect.add(new Option(fullLineName, fullLineName));
        monthlyLine.add(new Option(fullLineName, fullLineName));
        lineFilter.add(new Option(fullLineName, fullLineName));
        
        // Select the new line
        lineSelect.value = fullLineName;
        
        // Close modal and clear form
        bootstrap.Modal.getInstance(document.getElementById('addLineModal')).hide();
        document.getElementById('newLineName').value = '';
        document.getElementById('newLineVoltage').value = '';
    } else {
        alert(`Error adding line: ${result.error}`);
    }
}

// Export monthly report to Excel
function exportMonthlyToExcel() {
    const line = document.getElementById('monthlyLine').value;
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data
    const wsData = [
        ['TANZANIA ELECTRIC SUPPLY COMPANY LIMITED'],
        ['MONTHLY REPORT SUMMARY'],
        [],
        ['Month:', getMonthName(month)],
        ['Year:', year.toString()],
        ['Line:', line],
        []
    ];
    
    // Add summary data
    // This would be populated with actual data from the monthly report
    // For now, we'll just add placeholder data
    wsData.push(['SUMMARY']);
    wsData.push(['Total Weekly Reports:', document.querySelector('.card.bg-primary.text-white h3').textContent]);
    wsData.push(['Total Work Days:', document.querySelector('.card.bg-success.text-white h3').textContent]);
    wsData.push(['Total Towers:', document.querySelector('.card.bg-info.text-white h3').textContent]);
    wsData.push(['Total Insulators:', document.querySelector('.card.bg-secondary.text-white h3').textContent]);
    wsData.push([]);
    
    // Add weekly reports data
    wsData.push(['WEEKLY REPORTS']);
    wsData.push(['Week', 'Date', 'Team', 'Work Days', 'Towers', 'Insulators']);
    
    // Get data from the table
    const table = document.querySelector('#monthlyReportPreview table');
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        wsData.push([
            cells[0].textContent,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
            cells[5].textContent
        ]);
    });
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');
    
    // Generate Excel file
    const fileName = `TANESCO_Monthly_Report_${getMonthName(month)}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Print monthly report
function printMonthlyReport() {
    const printWindow = window.open('', '_blank');
    const reportContent = document.getElementById('monthlyReportPreview').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>TANESCO Monthly Report</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @media print {
                    body { font-size: 12px; }
                    .btn { display: none; }
                }
                .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                ${reportContent}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// Export all data
function exportAllData() {
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    // This would typically fetch all data from the database
    // For now, we'll just export what's in localStorage
    setTimeout(async () => {
        const reports = await Database.getReports();
        
        if (reports.length === 0) {
            alert('No data to export');
            document.getElementById('loadingSpinner').style.display = 'none';
            return;
        }
        
        const dataStr = JSON.stringify(reports, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'tanesco_reports_backup.json';
        link.click();
        
        URL.revokeObjectURL(url);
        document.getElementById('loadingSpinner').style.display = 'none';
    }, 500);
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        // This would typically clear data from the database
        // For now, we'll just clear localStorage
        localStorage.clear();
        alert('All data has been cleared');
        window.location.reload();
    }
}


