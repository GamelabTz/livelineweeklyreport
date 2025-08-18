// === SUPABASE CONNECTION (CODE MPYA) ===
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
// Add this to your initializeApp() function
async function initializeApp() {
    // ... existing code ...
    
    // Load reports from database
    await loadReportsFromSupabase();
}


// Example function to fetch data
async function fetchData() {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*');
  
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  console.log('Data:', data);
  // Process data here
}
// Function to save report to Supabase
async function saveReportToSupabase() {
  const reportData = collectReportData();
  
  const { data, error } = await supabase
    .from('weekly_reports')  // Badilisha na jina la table yako
    .insert([
      { 
        line: reportData.line,
        from_location: reportData.from,
        to_location: reportData.to,
        team: reportData.team,
        location: reportData.location,
        ref: reportData.ref,
        report_date: reportData.date,
        work_days: reportData.workDays,
        created_at: new Date()
      }
    ]);
  
  if (error) {
    console.error('Error saving report:', error);
    alert('Failed to save report to database');
    return false;
  }
  
  console.log('Report saved:', data);
  alert('Report saved successfully!');
  return true;
}
// Function to load saved reports
async function loadSavedReports() {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading reports:', error);
    return;
  }async function saveReportToSupabase() {
    const reportData = collectReportData();
    
    if (!validateReportData(reportData)) {
        return;
    }
    
    try {
        // Show loading state
        const saveButton = event.target;
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="bi bi-spinner-border spinner-border-sm"></i> Saving...';
        saveButton.disabled = true;
        
        // Prepare data for database
        const dbData = {
            line: reportData.line,
            from_person: reportData.from,
            to_person: reportData.to,
            report_date: reportData.reportDate,
            team: reportData.team,
            location: reportData.location,
            reference: reportData.ref,
            work_days: JSON.stringify(reportData.workDays),
            status: 'completed',
            created_at: new Date().toISOString()
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
            .from('weekly_reports')
            .insert([dbData])
            .select();
        
        if (error) {
            throw error;
        }
        
        alert('Report saved to database successfully!');
        
        // Reset button
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
        
    } catch (error) {
        console.error('Error saving to database:', error);
        alert('Error saving to database: ' + error.message);
        
        // Reset button
        saveButton.innerHTML = originalText;
        saveButton.disabled = false;
    }
}
async function loadReportsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('weekly_reports')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Merge with local storage reports
        const dbReports = data.map(report => ({
            id: report.id,
            line: report.line,
            from: report.from_person,
            to: report.to_person,
            reportDate: report.report_date,
            team: report.team,
            location: report.location,
            ref: report.reference,
            workDays: JSON.parse(report.work_days),
            status: report.status,
            savedAt: report.created_at,
            source: 'database'
        }));
        
        // Update the savedReports array
        savedReports = [...savedReports, ...dbReports];
        loadSavedReports();
        
    } catch (error) {
        console.error('Error loading from database:', error);
        alert('Error loading reports from database: ' + error.message);
    }
}

  
  // Display reports in a list
  const reportsContainer = document.getElementById('savedReportsContainer');
  reportsContainer.innerHTML = '';
  
  data.forEach(report => {
    const reportItem = document.createElement('div');
    reportItem.className = 'report-item';
    reportItem.innerHTML = `
      <h5>${report.line} - ${formatDate(report.report_date)}</h5>
      <p>Team: ${report.team}</p>
      <button onclick="loadReport(${report.id})">Load</button>
    `;
    reportsContainer.appendChild(reportItem);
  });
}


// === CODE YAKO YA ZAMANI INAANZA HAPA ===
// (Acha code yako ya zamani hapa)

// Set today's date as default
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    document.getElementById('dateInput').value = today.toISOString().split('T')[0];
// Call Supabase function to fetch data
fetchData();

    
    // Add initial work day
    addWorkDay();
    
    // Initialize Bootstrap components
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });
});

// Function to add a new work day
function addWorkDay() {
    const template = document.getElementById('workDayTemplate');
    const workDaysContainer = document.getElementById('workDaysContainer');
    
    // Clone the template
    const clone = document.importNode(template.content, true);
    
    // Set unique name for radio buttons
    const uniqueId = Date.now();
    const radioButtons = clone.querySelectorAll('.work-type');
    radioButtons.forEach(radio => {
        radio.name = 'workType_' + uniqueId;
    });
    
    // Add event listeners to radio buttons
    const workDayEntry = clone.querySelector('.work-day-entry');
    const normalRadio = workDayEntry.querySelector('.work-type[value="normal"]');
    const noWorkRadio = workDayEntry.querySelector('.work-type[value="nowork"]');
    
    normalRadio.addEventListener('change', function() {
        if (this.checked) {
            workDayEntry.querySelector('.normal-work-section').classList.remove('d-none');
            workDayEntry.querySelector('.no-work-section').classList.add('d-none');
        }
    });
    
    noWorkRadio.addEventListener('change', function() {
        if (this.checked) {
            workDayEntry.querySelector('.normal-work-section').classList.add('d-none');
            workDayEntry.querySelector('.no-work-section').classList.remove('d-none');
        }
    });
    
    // Set today's date + index as default
    const dateInput = clone.querySelector('.day-date');
    const today = new Date();
    const workDayCount = workDaysContainer.querySelectorAll('.work-day-entry').length;
    today.setDate(today.getDate() + workDayCount);
    dateInput.value = today.toISOString().split('T')[0];
    
    // Add the cloned template to the container
    workDaysContainer.appendChild(clone);
}

// Function to remove a work day
function removeWorkDay(button) {
    const workDayEntry = button.closest('.work-day-entry');
    workDayEntry.remove();
}

// Function to add a tower to a work day
function addTower(button) {
    const workDayEntry = button.closest('.work-day-entry');
    const towersContainer = workDayEntry.querySelector('.towers-container');
    
    // Clone the first tower entry
    const firstTower = towersContainer.querySelector('.tower-entry');
    const newTower = firstTower.cloneNode(true);
    
    // Reset values
    newTower.querySelector('.tower-number').value = '';
    newTower.querySelector('.tower-remarks').value = '';
    
    // Add the new tower to the container
    towersContainer.appendChild(newTower);
}

// Function to remove a tower
function removeTower(button) {
    const towerEntry = button.closest('.tower-entry');
    const towersContainer = towerEntry.parentElement;
    
    // Only remove if there's more than one tower
    if (towersContainer.querySelectorAll('.tower-entry').length > 1) {
        towerEntry.remove();
    } else {
        alert('You need at least one tower entry.');
    }
}

// Function to add a new line
function addNewLine() {
    const lineName = document.getElementById('newLineName').value;
    const lineVoltage = document.getElementById('newLineVoltage').value;
    
    if (!lineName || !lineVoltage) {
        alert('Please enter both line name and voltage.');
        return;
    }
    
    const lineSelect = document.getElementById('lineSelect');
    const newOption = document.createElement('option');
    newOption.value = `${lineName} ${lineVoltage}kv`;
    newOption.textContent = `${lineName} ${lineVoltage}kv`;
    lineSelect.appendChild(newOption);
    
    // Select the new option
    lineSelect.value = newOption.value;
    
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addLineModal'));
    modal.hide();
    
    // Clear the form
    document.getElementById('newLineName').value = '';
    document.getElementById('newLineVoltage').value = '';
}

// Function to select a line from the quick select buttons
function selectLine(lineName) {
    document.getElementById('lineSelect').value = lineName;
}

// Function to preview the report
function previewReport() {
    const previewSection = document.getElementById('previewSection');
    previewSection.classList.remove('d-none');
    
    // Get report data
    const reportData = collectReportData();
    
    // Generate HTML for preview
    let previewHTML = `
        <h4>WEEKLY REPORT PREVIEW</h4>
        <p><strong>LINE:</strong> ${reportData.line}</p>
        <p><strong>FROM:</strong> ${reportData.from} <strong>TO:</strong> ${reportData.to}</p>
        <p><strong>TEAM:</strong> ${reportData.team} <strong>LOCATION:</strong> ${reportData.location}</p>
        <p><strong>REF:</strong> ${reportData.ref} <strong>DATE:</strong> ${formatDate(reportData.date)}</p>
        <hr>
    `;
    
    // Add work days
    reportData.workDays.forEach(day => {
        previewHTML += `<h5>${day.day} ${formatDate(day.date)}</h5>`;
        
        if (day.isWorkDay) {
            previewHTML += `<table class="table table-bordered table-sm">
                <thead>
                    <tr>
                        <th>Tower No</th>
                        <th>Tower Type</th>
                        <th>R</th>
                        <th>Y</th>
                        <th>B</th>
                        <th>Total</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>`;
                
            day.towers.forEach(tower => {
                const total = parseInt(tower.r || 0) + parseInt(tower.y || 0) + parseInt(tower.b || 0);
                previewHTML += `
                    <tr>
                        <td>${tower.number || ''}</td>
                        <td>${tower.type || ''}</td>
                        <td>${tower.r || 0}</td>
                        <td>${tower.y || 0}</td>
                        <td>${tower.b || 0}</td>
                        <td>${total}</td>
                        <td>${tower.remarks || ''}</td>
                    </tr>
                `;
            });
            
            previewHTML += `</tbody></table>`;
        } else {
            previewHTML += `<p><strong>${day.noWorkReason || ''}</strong>: ${day.noWorkDetails || ''}</p>`;
        }
    });
    
    // Add totals
    let totalR = 0, totalY = 0, totalB = 0;
    reportData.workDays.forEach(day => {
        if (day.isWorkDay) {
            day.towers.forEach(tower => {
                totalR += parseInt(tower.r || 0);
                totalY += parseInt(tower.y || 0);
                totalB += parseInt(tower.b || 0);
            });
        }
    });
    
    previewHTML += `
        <hr>
        <h5>TOTAL DISC:</h5>
        <p>R: ${totalR}, Y: ${totalY}, B: ${totalB} - Total: ${totalR + totalY + totalB}</p>
    `;
    
    previewSection.innerHTML = previewHTML;
}

// Function to collect all report data
function collectReportData() {
    const data = {
        line: document.getElementById('lineSelect').value,
        from: document.getElementById('fromInput').value,
        to: document.getElementById('toInput').value,
        team: document.getElementById('teamInput').value,
        location: document.getElementById('locationInput').value,
        ref: document.getElementById('refInput').value,
        date: document.getElementById('dateInput').value,
        workDays: []
    };
    
    // Collect work days data
    const workDayEntries = document.querySelectorAll('.work-day-entry');
    workDayEntries.forEach(entry => {
        const day = entry.querySelector('.day-select').value;
        const date = entry.querySelector('.day-date').value;
        const isWorkDay = entry.querySelector('.work-type[value="normal"]').checked;
        
        const workDay = {
            day: day,
            date: date,
            isWorkDay: isWorkDay
        };
        
        if (isWorkDay) {
            workDay.towers = [];
            const towerEntries = entry.querySelectorAll('.tower-entry');
            
            towerEntries.forEach(tower => {
                workDay.towers.push({
                    number: tower.querySelector('.tower-number').value,
                    type: tower.querySelector('.tower-type').value,
                    r: tower.querySelector('.insulator-r').value,
                    y: tower.querySelector('.insulator-y').value,
                    b: tower.querySelector('.insulator-b').value,
                    remarks: tower.querySelector('.tower-remarks').value
                });
            });
        } else {
            workDay.noWorkReason = entry.querySelector('.no-work-reason').value;
            workDay.noWorkDetails = entry.querySelector('.no-work-details').value;
        }
        
        data.workDays.push(workDay);
    });
    
    return data;
}

// Function to generate Excel file
function generateExcel() {
    const reportData = collectReportData();
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws_data = [];
    
    // Add header rows
    ws_data.push(['TANZANIA ELECTRIC SUPPLY COMPANY LIMITED.']);
    ws_data.push(['FROM: ' + reportData.from, '', '', '', 'TO : ' + reportData.to]);
    ws_data.push([reportData.team, '', '', '', reportData.location]);
    ws_data.push(['OUR REF: ' + reportData.ref, '', '', '', 'DATE: ' + formatDate(reportData.date)]);
    ws_data.push(['LINE', 'WORKING DAYS', 'TOWER No.', 'TOWER TYPE', 'WASHED INSULATORS', '', '', 'TOTAL', 'REMARKS']);
    ws_data.push(['', '', '', '', 'R', 'Y', 'B', '', '']);
    
    // Add work days data
    let currentRow = 6;
    let totalR = 0, totalY = 0, totalB = 0;
    
    reportData.workDays.forEach((day, dayIndex) => {
        if (day.isWorkDay) {
            day.towers.forEach((tower, towerIndex) => {
                const r = parseInt(tower.r || 0);
                const y = parseInt(tower.y || 0);
                const b = parseInt(tower.b || 0);
                const total = r + y + b;
                
                totalR += r;
                totalY += y;
                totalB += b;
                
                const row = [];
                if (towerIndex === 0) {
                    row.push(dayIndex === 0 ? reportData.line : '');
                    row.push(day.day + ' ' + formatDate(day.date));
                } else {
                    row.push('', '');
                }
                
                row.push(tower.number, tower.type, r, y, b, total, tower.remarks);
                ws_data.push(row);
                currentRow++;
            });
        } else {
            const row = [];
            row.push(dayIndex === 0 ? reportData.line : '');
            row.push(day.day + ' ' + formatDate(day.date));
            row.push(day.noWorkReason, '', '', '', '', '', day.noWorkDetails);
            ws_data.push(row);
            currentRow++;
        }
    });
    
    // Add total row
    ws_data.push(['', 'TOTAL  DISC', '', '', totalR, totalY, totalB, totalR + totalY + totalB, '']);
    
    // Add prepared by row
    ws_data.push(['PREPARED BY: ' + reportData.from + '     TITTLE: Technician  COY: (T887)']);
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Weekly Report");
    
    // Generate Excel file
    XLSX.writeFile(wb, `WEEKLY REPORT ${formatDate(reportData.date)}.xlsx`);
}

// Function to format date as DD/MM/YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Function to generate monthly report
function generateMonthlyReport() {
    alert('Monthly report generation will be implemented in the next phase.');
    // This would combine weekly reports for a month
}
