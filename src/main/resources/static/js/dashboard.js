console.log('dashboard.js loaded');

let timeout;
let hoursTimeout; // For debouncing hours updates
let previousHours = document.getElementById('current-hours')?.value || 0;

function updateRealTimeClock() {
    const clockElement = document.getElementById('real-time-clock');
    const now = new Date();
    const dateString = now.toLocaleDateString(); // e.g., "3/30/2025"
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // e.g., "09:23 AM"
    clockElement.textContent = `${dateString} ${timeString}`;
}

function setTextareaMinHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.minHeight = '0';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.minHeight = `${Math.min(scrollHeight, 120)}px`;
    textarea.style.height = 'auto';
    if (scrollHeight > 120) {
        const currentValue = textarea.value;
        let truncatedValue = currentValue;
        textarea.style.height = 'auto';
        textarea.style.minHeight = '0';
        while (textarea.scrollHeight > 120 && truncatedValue.length > 0) {
            truncatedValue = truncatedValue.slice(0, -1);
            textarea.value = truncatedValue;
        }
        textarea.setSelectionRange(truncatedValue.length, truncatedValue.length);
        textarea.style.minHeight = '120px';
    }
}

function autoSave(input) {
    const row = input.closest('.auto-save-row');
    if (!row) return;

    const id = row.getAttribute('data-id');
    const status = row.querySelector('.save-status');
    
    const data = {
        item: row.querySelector('textarea[name="item"]').value,
        description: row.querySelector('input[name="description"]').value,
        cycle: row.querySelector('textarea[name="cycle"]').value
    };

    ['lastDone', 'dueDate'].forEach((field, index) => {
        const container = row.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`);
        const dateInput = container.querySelector('input[type="date"]');
        const textInput = container.querySelector('input[type="text"].extra-input');
        let value = '';
        if (dateInput) value += dateInput.value;
        if (textInput) value += value ? ` ${textInput.value}` : textInput.value;
        data[field] = value.trim();
    });

    const timeLeftSpan = row.querySelector('td:nth-child(7) .time-left');
    if (timeLeftSpan) {
        const currentHoursInput = document.getElementById('current-hours');
        const currentHours = currentHoursInput ? parseInt(currentHoursInput.value) || 0 : 0;
        const dueDate = data.dueDate || '';
        setTimeLeftText(timeLeftSpan, calculateTimeLeft(dueDate, currentHours));
        data.timeLeft = timeLeftSpan.textContent;
    }

    clearTimeout(timeout);
    status.textContent = '...';
    status.className = 'save-status saving';

    timeout = setTimeout(() => {
        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

        console.log(data);
        axios.post(`/update/${id}`, data, {
            headers: { [csrfHeader]: csrfToken }
        })
        .then(response => {
            status.textContent = '✓';
            status.className = 'save-status saved';
        })
        .catch(error => {
            status.textContent = '✖';
            status.className = 'save-status error';
            console.error('Error saving:', error.response ? error.response.data : error);
        });
    }, 500);
}

function deleteRow(icon) {
    const row = icon.closest('tr');
    if (!row) return;
    const id = row.getAttribute('data-id');
    if (!id) {
        console.error('No data-id found for the row');
        return;
    }
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
    if (confirm('Are you sure you want to delete this entry?')) {
        axios.delete(`/delete/${id}`, { headers: { [csrfHeader]: csrfToken } })
            .then(() => row.remove())
            .catch(error => console.error('Error deleting:', error.response ? error.response.data : error));
    }
}

function updateOrderOnServer() {
    const rows = document.querySelectorAll('table tbody tr:not(.add-row)');
    const order = Array.from(rows).map(row => row.getAttribute('data-id'));
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
    axios.post('/updateOrder', order, {
        headers: {
            [csrfHeader]: csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('Order updated');
    })
    .catch(error => {
        console.error('Error updating order:', error);
    });
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('dropdown-trigger')) {
        event.stopPropagation();
        const dropdown = event.target.parentElement.querySelector('.dropdown-options');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            if (dropdown.style.display === 'block') {
                setTimeout(() => document.addEventListener('click', closeDropdownOutside, { once: true }), 0);
            }
        } else {
            console.error('Dropdown options not found for:', event.target);
        }
    }
});

function closeDropdownOutside(event) {
    if (!event.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.dropdown-options').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
}

function closeDropdownOutside(event) {
    if (!event.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.dropdown-options').forEach(dropdown => dropdown.style.display = 'none');
    }
}

function selectOption(option) {
    const dropdown = option.closest('.custom-dropdown');
    const selected = dropdown.querySelector('.selected-option');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    const value = option.getAttribute('data-value');
    selected.textContent = value === '' ? '' : option.textContent;
    hiddenInput.value = value;
    dropdown.querySelector('.dropdown-options').style.display = 'none';
    if (dropdown.closest('.auto-save-row')) autoSave(hiddenInput);
}

function addCustomDescription(button) {
    const container = button.parentElement;
    const input = container.querySelector('.custom-description');
    const customValue = input.value.trim();
    if (!customValue) return;
    const dropdown = container.parentElement.parentElement;
    const selected = dropdown.querySelector('.selected-option');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    selected.textContent = customValue;
    hiddenInput.value = customValue;
    if (!isDefaultOption(customValue)) updateAllDropdowns(customValue);
    if (dropdown.closest('.auto-save-row')) autoSave(hiddenInput);
    input.value = '';
}

function updateAllDropdowns(newOption) {
    document.querySelectorAll('.dropdown-options').forEach(dropdown => {
        if (!dropdown.querySelector(`.option[data-value="${newOption}"]`)) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option custom-option';
            optionDiv.setAttribute('data-value', newOption);
            optionDiv.textContent = newOption;
            optionDiv.onclick = () => selectOption(optionDiv);
            dropdown.insertBefore(optionDiv, dropdown.querySelector('.add-option-container'));
        }
    });
    updateDropdownWidths();
}

function isDefaultOption(value) {
    return ['Inspect', 'Test', 'Replace', 'Overhaul'].includes(value);
}

function updateDropdownWidths() {
    document.querySelectorAll('.dropdown-options').forEach(dropdown => {
        const options = dropdown.querySelectorAll('.option');
        let maxWidth = 0;
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.position = 'absolute';
        tempSpan.style.font = getComputedStyle(options[0]).font;
        tempSpan.style.padding = '4px 8px';
        document.body.appendChild(tempSpan);

        options.forEach(option => {
            tempSpan.textContent = option.textContent;
            const width = tempSpan.offsetWidth;
            maxWidth = Math.max(maxWidth, width);
        });

        document.body.removeChild(tempSpan);
        const cappedWidth = Math.min(maxWidth, 150);
        dropdown.style.minWidth = `${cappedWidth}px`;
    });
}

function calculateTimeLeft(dueDateStr, currentHours) {
    if (!dueDateStr) return 'N/A';

    const now = new Date();
    let output = '';

    // Parse dueDateStr
    const dueDateParts = dueDateStr.split(' ');
    const dueDateDate = dueDateParts[0]?.match(/^\d{4}-\d{2}-\d{2}$/) ? dueDateParts[0] : null;
    const dueDateTime = dueDateParts.find(part => part.match(/^\d+$/)) || null;

    // Calculate days if dueDate has a calendar date
    if (dueDateDate) {
        const dueDate = new Date(dueDateDate + 'T00:00:00');
        const timeDiff = dueDate - now;
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        output += daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`;
    }

    // Calculate hours if dueDate has a clock value
    if (dueDateTime) {
        const dueDateHours = parseInt(dueDateTime);
        if (!isNaN(dueDateHours) && !isNaN(currentHours)) {
            const hoursLeft = dueDateHours - currentHours;
            const hoursText = hoursLeft < 0 ? `${Math.abs(hoursLeft)} hours overdue` : `${hoursLeft} hours left`;
            output += output ? `\n${hoursText}` : hoursText;
        }
    }

    return output || 'N/A';
}

function setTimeLeftText(cell, text) {
    cell.textContent = text;
    cell.style.color = text.includes('overdue') ? 'red' : 'black';
}

// Function to update all Time Left cells in real-time
function updateAllTimeLeft() {
    const currentHoursInput = document.getElementById('current-hours');
    const currentHours = currentHoursInput ? parseInt(currentHoursInput.value) || 0 : 0;
    console.log('Current Hours:', currentHours);
    document.querySelectorAll('.auto-save-row').forEach(row => {
        const dueDateContainer = row.querySelector('td:nth-child(6) .input-with-dropdown');
        const timeLeftCell = row.querySelector('td:nth-child(7) .time-left');
        if (timeLeftCell) {
            const dueDateDate = dueDateContainer.querySelector('input[type="date"]');
            const dueDateText = dueDateContainer.querySelector('input[type="text"].extra-input');
            let dueDateStr = '';
            if (dueDateDate) dueDateStr += dueDateDate.value;
            if (dueDateText) dueDateStr += dueDateStr ? ` ${dueDateText.value}` : dueDateText.value;
            console.log('Due Date String:', dueDateStr);
            const timeLeftText = calculateTimeLeft(dueDateStr, currentHours);
            console.log('Calculated Time Left:', timeLeftText);
            setTimeLeftText(timeLeftCell, timeLeftText);
        }
        
    });
}

function updateAddRowTimeLeft() {
    const currentHoursInput = document.getElementById('current-hours');
    const currentHours = currentHoursInput ? parseInt(currentHoursInput.value) || 0 : 0;
    const addRow = document.querySelector('.add-row');
    const dueDateContainer = addRow.querySelector('td:nth-child(6) .input-with-dropdown');
    const timeLeftCell = addRow.querySelector('td:nth-child(7) .time-left');

    if (timeLeftCell) {
        const dueDateDate = dueDateContainer.querySelector('input[type="date"]');
        const dueDateText = dueDateContainer.querySelector('input[type="text"].extra-input');
        let dueDateStr = '';
        if (dueDateDate) dueDateStr += dueDateDate.value;
        if (dueDateText) dueDateStr += dueDateStr ? ` ${dueDateText.value}` : dueDateText.value;

        setTimeLeftText(timeLeftCell, calculateTimeLeft(dueDateStr, currentHours));
    }
}


function scheduleMidnightUpdate() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    const timeToMidnight = midnight - now;

    setTimeout(() => {
        updateAllTimeLeft();      // Update all Time Left values
        scheduleMidnightUpdate(); // Schedule for the next day
    }, timeToMidnight);
}

function selectRowType(type, element) {
    const addRow = document.querySelector('.add-row');
    const itemInputDiv = document.getElementById('itemInput');
    const titleInputDiv = document.getElementById('titleInput');
    const itemInput = itemInputDiv.querySelector('textarea');
    const titleInput = titleInputDiv.querySelector('input');
    const itemHidden = document.getElementById('itemHidden');
    const isTitleHidden = document.getElementById('isTitleHidden');

    // Remove 'selected' class from all options
    document.querySelectorAll('.row-type-option').forEach(opt => opt.classList.remove('selected'));
    // Add 'selected' class to clicked option
    element.classList.add('selected');

    if (type === 'item') {
        itemInputDiv.style.display = 'block';
        titleInputDiv.style.display = 'none';
        addRow.classList.remove('title-mode');
        itemHidden.value = itemInput.value;
        isTitleHidden.value = 'false';
    } else if (type === 'title') {
        itemInputDiv.style.display = 'none';
        titleInputDiv.style.display = 'block';
        addRow.classList.add('title-mode');
        itemHidden.value = titleInput.value;
        isTitleHidden.value = 'true';
    }

    // Update hidden inputs on input change
    itemInput.oninput = () => itemHidden.value = itemInput.value;
    titleInput.oninput = () => itemHidden.value = titleInput.value;
}

document.addEventListener('DOMContentLoaded', () => {
    // Start the real-time clock
    updateRealTimeClock();
    updateAllTimeLeft(); // Initial call to set Time Left immediately
    updateAddRowTimeLeft();
    scheduleMidnightUpdate();
    setInterval(() => {
        updateRealTimeClock();
    }, 1000);

    console.log('Dropdown triggers found:', document.querySelectorAll('.dropdown-trigger').length);
    console.log('add-row td:nth-child(5) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(5) .input-with-dropdown'));
    console.log('add-row td:nth-child(6) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(6) .input-with-dropdown'));


    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('trigger-dropdown')) {
            const dropdown = event.target.nextElementSibling; // The .type-dropdown menu
            const isOpen = dropdown.style.display === 'block';
            // Close all other dropdowns
            document.querySelectorAll('.type-dropdown').forEach(d => d.style.display = 'none');
            // Toggle the clicked dropdown
            if (!isOpen) {
                dropdown.style.display = 'block';
                // Add a one-time listener to close the dropdown when clicking outside
                setTimeout(() => document.addEventListener('click', closeTypeDropdowns, { once: true }), 0);
            }
        }
    });

    document.querySelectorAll('.auto-save-row textarea[name="item"]').forEach(textarea => {
        setTextareaMinHeight(textarea);
        textarea.addEventListener('input', () => {
            setTextareaMinHeight(textarea);
        });
    });

    document.querySelectorAll('.auto-save-row textarea[name="cycle"]').forEach(textarea => {
        setTextareaMinHeight(textarea);
        textarea.addEventListener('input', () => {
            setTextareaMinHeight(textarea);
        });
    });
    // Initialize Sortable.js
    const tbody = document.querySelector('.sortable');
    Sortable.create(tbody, {
        handle: '.grip-icon',
        animation: 150,
        onEnd: function (evt) {
            updateOrderOnServer();
        }
    });

    
    let currentSectionId = null; // To track the current section being viewed
    function filterByTitle(titleRow) {
        currentSectionId = titleRow.getAttribute('data-id');
        // Hide all rows in the sortable tbody
        document.querySelectorAll('.sortable tr').forEach(row => {
            row.style.display = 'none';
        });
        // Show the clicked title row
        titleRow.style.display = '';
        // Show subsequent item rows until the next title row
        let nextRow = titleRow.nextElementSibling;
        while (nextRow && !nextRow.classList.contains('title-row')) {
            nextRow.style.display = '';
            nextRow = nextRow.nextElementSibling;
        }
        // Ensure the add row remains visible
        document.querySelector('.add-row').style.display = '';
        // Add the "Back" button
        addBackButton();
    }

    function addBackButton() {
        const existingButton = document.querySelector('.back-button');
        if (existingButton) existingButton.remove();
    
        const button = document.createElement('button');
        button.textContent = 'Back to Full List';
        button.className = 'back-button';
        button.addEventListener('click', () => {
            document.querySelectorAll('.sortable tr').forEach(row => {
                row.style.display = '';
            });
            button.remove();
            currentSectionId = null; // Reset current section
        });
    
        const table = document.querySelector('table');
        table.parentNode.insertBefore(button, table);
    }

    document.querySelectorAll('.title-row .title-cell').forEach(cell => {
        cell.addEventListener('click', function(e) {
            // Prevent triggering if clicking the delete icon or grip
            if (e.target.classList.contains('delete-icon') || e.target.classList.contains('grip-icon')) return;
            const titleRow = this.closest('tr');
            filterByTitle(titleRow);
        });
    });

    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const selected = dropdown.querySelector('.selected-option');
        const options = dropdown.querySelectorAll('.option');
        const value = hiddenInput.value || '';
        const matchingOption = Array.from(options).find(opt => opt.getAttribute('data-value') === value);
        selected.textContent = value === '' ? '' : (matchingOption ? matchingOption.textContent : value);
        options.forEach(option => option.onclick = () => selectOption(option));
    });

    const currentHoursInput = document.getElementById('current-hours');
    if (currentHoursInput) {
        previousHours = currentHoursInput.value || 0;
        currentHoursInput.addEventListener('input', function() {
            updateAllTimeLeft(); // Update all existing rows
            updateAddRowTimeLeft(); // Update add row
            clearTimeout(hoursTimeout);
            const newTotalHours = this.value.trim();
            if (newTotalHours === '' || isNaN(parseInt(newTotalHours))) {
                return;
            }
            hoursTimeout = setTimeout(() => {
                const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
                const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
                const params = new URLSearchParams();
                params.append('newTotalHours', parseInt(newTotalHours));
                axios.post('/updateHours', params, {
                    headers: { [csrfHeader]: csrfToken }
                })
                .then(response => {
                    if (response.data.status === 'success') {
                        previousHours = newTotalHours;
                        console.log('Hours updated successfully:', response.data.newHours);
                    } else {
                        this.value = previousHours;
                        console.error('Failed to update hours:', response.data.message);
                        alert('Failed to update hours');
                    }
                })
                .catch(error => {
                    console.error('Error updating hours:', error.response ? error.response.data : error);
                    this.value = previousHours;
                    alert('Error updating hours');
                });
            }, 500);
        });
    }

// Handle adding hours
document.getElementById('add-hours-btn').addEventListener('click', function() {
    const hoursToAdd = document.getElementById('add-hours').value.trim();
    if (hoursToAdd && !isNaN(hoursToAdd)) {
        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
        const params = new URLSearchParams();
        params.append('hoursToAdd', parseInt(hoursToAdd));
        axios.post('/updateHours', params, {
            headers: { [csrfHeader]: csrfToken }
        })
        .then(response => {
            if (response.data.status === 'success') {
                const newHours = response.data.newHours;
                document.getElementById('current-hours').value = newHours; // Use value, not textContent
                previousHours = newHours; // Update previousHours
                document.getElementById('add-hours').value = ''; // Clear the input
                console.log('Hours added successfully:', newHours);
            } else {
                console.error('Failed to add hours:', response.data.message);
                alert('Failed to add hours');
            }
        })
        .catch(error => {
            console.error('Error adding hours:', error.response ? error.response.data : error);
            alert('Error adding hours');
        });
    }
});


    document.querySelectorAll('.auto-save-row').forEach(row => {
        ['lastDone', 'dueDate'].forEach((field, index) => {
            const container = row.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`);
            const savedValue = row.getAttribute(`data-${field}`) || '';
            if (savedValue) {
                const parts = savedValue.split(' ');
                let datePart = null;
                let textPart = null;

                if (parts[0] && parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
                    datePart = parts[0];
                    if (parts.length > 1) {
                        textPart = parts.slice(1).join(' ');
                    }
                } else {
                    textPart = savedValue;
                }

                if (datePart) {
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.name = `${field}_date`;
                    dateInput.className = 'extra-input';
                    dateInput.value = datePart;
                    dateInput.oninput = () => autoSave(dateInput);
                    container.insertBefore(dateInput, container.querySelector('.trigger-dropdown'));
                    container.querySelector('.add-type[data-type="calendar"]').textContent = '-';
                }

                if (textPart) {
                    const textInput = document.createElement('input');
                    textInput.type = 'text';
                    textInput.name = `${field}_text`;
                    textInput.className = 'extra-input';
                    textInput.placeholder = 'Enter hours';
                    textInput.value = textPart;
                    textInput.oninput = () => autoSave(textInput);
                    container.insertBefore(textInput, container.querySelector('.trigger-dropdown'));
                    container.querySelector('.add-type[data-type="clock"]').textContent = '-';
                }
            }
        });
    });

    updateAllTimeLeft();

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-type')) {
            const button = event.target;
            const type = button.getAttribute('data-type');
            const container = button.closest('.input-with-dropdown');
            const tr = button.closest('tr');
            const td = button.closest('td');
            const isAddMode = button.textContent === '+';
    
            const existingDate = container.querySelector('input[type="date"]');
            const existingText = container.querySelector('input[type="text"].extra-input');
    
            if (isAddMode) {
                if (type === 'calendar' && existingDate) return;
                if (type === 'clock' && existingText) return;
    
                let newInput;
                if (type === 'calendar') {
                newInput = document.createElement('input');
                newInput.type = 'date';
                newInput.className = 'extra-input';
                newInput.oninput = () => {
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(newInput);
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft(); // Ensures time left updates
                    }
                };
            // Replace the clock input creation with this:
            } else if (type === 'clock') {
                newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.className = 'extra-input';
                newInput.placeholder = 'Enter hours';
                newInput.oninput = () => {
                    newInput.value = newInput.value.replace(/[^0-9]/g, '');
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(newInput);
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft(); // Ensures time left updates
                    }
                };
            }

            if (newInput) {
                container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                button.textContent = '-';
                if (!tr.classList.contains('auto-save-row')) {
                    updateAddRowHiddenInputs();
                    updateAddRowTimeLeft();
                }
            } else {
                if (type === 'calendar' && existingDate) {
                    existingDate.remove();
                    button.textContent = '+';
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(button);
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft(); // Add this line
                    }
                } else if (type === 'clock' && existingText) {
                    existingText.remove();
                    button.textContent = '+';
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(button);
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft(); // Add this line
                    }
                }
            }
        }
    
            button.closest('.type-dropdown').style.display = 'none';
        }
    });
    
    function closeTypeDropdowns(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            document.querySelectorAll('.type-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    }

    const addRowCycleTextarea = document.querySelector('.add-row textarea[name="cycle"]');
    if (addRowCycleTextarea) {
        setTextareaMinHeight(addRowCycleTextarea);
        addRowCycleTextarea.addEventListener('input', () => {
            setTextareaMinHeight(addRowCycleTextarea);
        });
    }

    function updateAddRowHiddenInputs() {
        const lastDoneTd = document.getElementById('lastDoneHidden').parentElement;
        const dueDateTd = document.getElementById('dueDateHidden').parentElement;

        const lastDoneContainer = lastDoneTd.querySelector('.input-with-dropdown');
        const dueDateContainer = dueDateTd.querySelector('.input-with-dropdown');

        if (lastDoneContainer) {
            const lastDoneDate = lastDoneContainer.querySelector('input[type="date"]');
            const lastDoneText = lastDoneContainer.querySelector('input[type="text"].extra-input');
            let lastDoneValue = '';
            if (lastDoneDate) lastDoneValue += lastDoneDate.value;
            if (lastDoneText) lastDoneValue += lastDoneValue ? ` ${lastDoneText.value}` : lastDoneText.value;
            document.getElementById('lastDoneHidden').value = lastDoneValue.trim();
        }

        if (dueDateContainer) {
            const dueDateDate = dueDateContainer.querySelector('input[type="date"]');
            const dueDateText = dueDateContainer.querySelector('input[type="text"].extra-input');
            let dueDateValue = '';
            if (dueDateDate) dueDateValue += dueDateDate.value;
            if (dueDateText) dueDateValue += dueDateValue ? ` ${dueDateText.value}` : dueDateText.value;
            document.getElementById('dueDateHidden').value = dueDateValue.trim();
        }
    }

    function updateItemHiddenInputs() {
        const itemContainer = document.querySelector('.add-row td:nth-child(2) .input-with-dropdown');
        const itemInput = itemContainer.querySelector('input[type="text"].extra-input');
        const titleInput = itemContainer.querySelector('input[type="text"].title-input');
        
        if (itemInput) {
            document.getElementById('itemHidden').value = itemInput.value;
            document.getElementById('isTitleHidden').value = 'false';
        } else if (titleInput) {
            document.getElementById('itemHidden').value = titleInput.value;
            document.getElementById('isTitleHidden').value = 'true';
        } else {
            document.getElementById('itemHidden').value = '';
            document.getElementById('isTitleHidden').value = 'false';
        }
        console.log('itemHidden set to:', document.getElementById('itemHidden').value);
    }

    const itemOption = document.querySelector('.row-type-option[data-type="item"]');
    if (itemOption) {
        selectRowType('item', itemOption);
    }

    const addForm = document.querySelector('.add-row form');
if (addForm) {
    addForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Update hidden inputs (existing code)
        const itemHidden = document.getElementById('itemHidden');
        const isTitleHidden = document.getElementById('isTitleHidden');
        const itemInput = document.getElementById('itemInput').querySelector('textarea');
        const titleInput = document.getElementById('titleInput').querySelector('input');
        const isTitle = isTitleHidden.value === 'true';
        const item = isTitle ? titleInput.value : itemInput.value;

        if (!item) {
            alert('Please enter an item or title before submitting.');
            return;
        }

        const description = document.querySelector('.add-row .custom-dropdown input[name="description"]').value;
        const cycle = document.querySelector('.add-row textarea[name="cycle"]').value;
        const lastDone = document.getElementById('lastDoneHidden').value;
        const dueDate = document.getElementById('dueDateHidden').value;
        const timeLeft = document.querySelector('.add-row .time-left').textContent;

        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

        const data = {
            item: item,
            isTitle: isTitleHidden.value,
            description: description,
            cycle: cycle,
            lastDone: lastDone,
            dueDate: dueDate,
            timeLeft: timeLeft,
            ajax: 'true'
        };

        axios.post('/dashboard', data, {
            headers: {
                [csrfHeader]: csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            const newRowData = response.data;
            const newRow = document.createElement('tr');
            newRow.setAttribute('data-id', newRowData.id);
            newRow.className = newRowData.isTitle ? 'title-row' : 'auto-save-row';

            // Construct the new row HTML (existing code remains largely unchanged)
            const addRowDropdown = document.querySelector('.add-row .dropdown-options');
            const customOptions = addRowDropdown ? Array.from(addRowDropdown.querySelectorAll('.custom-option')) : [];
            const customOptionsHTML = customOptions.map(opt => opt.outerHTML).join('');

            if (newRowData.isTitle) {
                newRow.innerHTML = `
                    <td><span class="grip-icon">⋮</span></td>
                    <td colspan="7" class="title-cell">${newRowData.item}</td>
                    <td class="delete-cell"><span class="delete-icon" onclick="deleteRow(this)">🗑️</span></td>
                `;
            } else {
                newRow.innerHTML = `
                    <td><span class="grip-icon">⋮</span></td>
                    <td><textarea name="item" oninput="autoSave(this)">${newRowData.item}</textarea></td>
                    <td>
                        <div class="custom-dropdown">
                            <div class="selected-option">${newRowData.description || ''}</div>
                            <input type="hidden" name="description" value="${newRowData.description || ''}">
                            <button class="dropdown-trigger">▼</button>
                            <div class="dropdown-options">
                                <div class="option" data-value="">--None--</div>
                                <div class="option" data-value="Inspect">Inspect</div>
                                <div class="option" data-value="Test">Test</div>
                                <div class="option" data-value="Replace">Replace</div>
                                <div class="option" data-value="Overhaul">Overhaul</div>
                                ${customOptionsHTML}
                                <div class="add-option-container">
                                    <input type="text" class="custom-description" placeholder="New option">
                                    <button class="add-option-btn" onclick="addCustomDescription(this)">Add</button>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td><textarea name="cycle" oninput="autoSave(this)">${newRowData.cycle || ''}</textarea></td>
                    <td>
                        <div class="input-with-dropdown">
                            <button class="trigger-dropdown">▼</button>
                            <div class="type-dropdown" style="display: none;">
                                <div class="type-option"><span>Calendar</span><button class="add-type" data-type="calendar">+</button></div>
                                <div class="type-option"><span>Clock</span><button class="add-type" data-type="clock">+</button></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="input-with-dropdown">
                            <button class="trigger-dropdown">▼</button>
                            <div class="type-dropdown" style="display: none;">
                                <div class="type-option"><span>Calendar</span><button class="add-type" data-type="calendar">+</button></div>
                                <div class="type-option"><span>Clock</span><button class="add-type" data-type="clock">+</button></div>
                            </div>
                        </div>
                    </td>
                    <td><div class="time-left">${newRowData.timeLeft || 'N/A'}</div></td>
                    <td class="status-cell"><span class="save-status">✓</span></td>
                    <td class="delete-cell"><span class="delete-icon" onclick="deleteRow(this)">🗑️</span></td>
                `;
                // Handle lastDone and dueDate inputs (existing code)
                ['lastDone', 'dueDate'].forEach((field, index) => {
                    const value = newRowData[field];
                    if (value) {
                        const container = newRow.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`);
                        const parts = value.split(' ');
                        let datePart = null;
                        let textPart = null;

                        if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
                            datePart = parts[0];
                            if (parts.length > 1) {
                                textPart = parts.slice(1).join(' ');
                            }
                        } else {
                            textPart = value;
                        }

                        if (datePart) {
                            const dateInput = document.createElement('input');
                            dateInput.type = 'date';
                            dateInput.className = 'extra-input';
                            dateInput.value = datePart;
                            dateInput.oninput = () => autoSave(dateInput);
                            container.insertBefore(dateInput, container.querySelector('.trigger-dropdown'));
                            container.querySelector('.add-type[data-type="calendar"]').textContent = '-';
                        }

                        if (textPart) {
                            const textInput = document.createElement('input');
                            textInput.type = 'text';
                            textInput.className = 'extra-input';
                            textInput.value = textPart;
                            textInput.oninput = () => autoSave(textInput);
                            container.insertBefore(textInput, container.querySelector('.trigger-dropdown'));
                            container.querySelector('.add-type[data-type="clock"]').textContent = '-';
                        }
                    }
                });
                const dropdown = newRow.querySelector('.custom-dropdown');
                dropdown.querySelectorAll('.option').forEach(opt => opt.onclick = () => selectOption(opt));
                updateAllDropdowns(newRowData.description);
            }

            const sortableTbody = document.querySelector('.sortable');

            // Insert the new row in the correct position
            if (currentSectionId && !newRowData.isTitle) {
                const titleRow = document.querySelector(`tr[data-id="${currentSectionId}"]`);
                let nextRow = titleRow.nextElementSibling;
                while (nextRow && !nextRow.classList.contains('title-row')) {
                    nextRow = nextRow.nextElementSibling;
                }
                if (nextRow) {
                    sortableTbody.insertBefore(newRow, nextRow);
                } else {
                    sortableTbody.appendChild(newRow);
                }
            } else {
                sortableTbody.appendChild(newRow);
            }

            // Update the order on the server
            updateOrderOnServer();

            // Reset add row (existing code)
            document.querySelector('.add-row textarea[name="item"]').value = '';
            document.querySelector('.add-row input[name="title"]').value = '';
            document.querySelector('.add-row textarea[name="cycle"]').value = '';
            document.querySelector('.add-row .custom-dropdown input[name="description"]').value = '';
            document.querySelector('.add-row .selected-option').textContent = '';
            document.querySelectorAll('.add-row .input-with-dropdown input.extra-input').forEach(input => input.remove());
            document.querySelectorAll('.add-row .add-type').forEach(btn => btn.textContent = '+');
            document.querySelector('.add-row .time-left').textContent = '';
            document.getElementById('lastDoneHidden').value = '';
            document.getElementById('dueDateHidden').value = '';

            selectRowType('item', document.querySelector('.row-type-option[data-type="item"]'));

            const timeLeftCell = newRow.querySelector('.time-left');
            if (timeLeftCell && newRowData.timeLeft) {
                setTimeLeftText(timeLeftCell, newRowData.timeLeft);
            }
        })
        .catch(error => {
            console.error('Error adding row:', error.response ? error.response.data : error);
            alert('Error adding row: ' + (error.response?.data || error.message));
        });
    });
}
    
    // Function to update all Time Left cells in real-time

    function closeTypeDropdowns(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            document.querySelectorAll('.type-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    }

    document.getElementById('add-hours-btn').addEventListener('click', function() {
        const hoursToAdd = document.getElementById('add-hours').value.trim();
        if (hoursToAdd && !isNaN(hoursToAdd)) {
            const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
            const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
            const params = new URLSearchParams();
            params.append('hoursToAdd', parseInt(hoursToAdd));
            axios.post('/updateHours', params, {
                headers: { [csrfHeader]: csrfToken }
            })
            .then(response => {
                if (response.data.status === 'success') {
                    const newHours = response.data.newHours;
                    document.getElementById('current-hours').value = newHours; // Update the input value
                    previousHours = newHours; // Update previousHours
                    document.getElementById('add-hours').value = ''; // Clear the input
                    console.log('Hours added successfully:', newHours);
                    // Add these lines to update "time left" immediately
                    updateAllTimeLeft();      // Update all existing rows
                    updateAddRowTimeLeft();   // Update the add row
                } else {
                    console.error('Failed to add hours:', response.data.message);
                    alert('Failed to add hours');
                }
            })
            .catch(error => {
                console.error('Error adding hours:', error.response ? error.response.data : error);
                alert('Error adding hours');
            });
        }
    });
});