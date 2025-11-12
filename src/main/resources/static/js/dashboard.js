console.log('dashboard.js loaded');

let timeout;
let userInfoTimeout;
let hoursTimeout; // For debouncing hours updates
let previousHours = document.getElementById('current-hours')?.value || 0;


function setTextareaMinHeight(textarea) {
    textarea.style.height = 'auto'; // Reset to measure content
    const scrollHeight = textarea.scrollHeight;
    if (scrollHeight > 140) {
        textarea.style.height = '140px'; // Cap at 120px
        textarea.style.overflowY = 'auto'; // Show scrollbar
    } else {
        textarea.style.height = `${scrollHeight}px`; // Match content height
        textarea.style.overflowY = 'hidden'; // Hide scrollbar
    }
}

function autoSave(input) {
    const row = input.closest('.auto-save-row');
    if (!row) return;

    const id = row.getAttribute('data-id'); //grab 'data-id' of row
    //const status = row.querySelector('.save-status');  grab element in the auto-save-row called 'save-status'
    
    const data = {
        item: row.querySelector('textarea[name="item"]').value, //get rows item name 
        description: row.querySelector('input[name="description"]').value, //get rows description option
        cycle: row.querySelector('textarea[name="cycle"]').value //get rows cycle text
    };

    ['lastDone', 'dueDate'].forEach((field, index) => { //loops through lastDone and dueDate fields
        const container = row.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`); //grab .input-with-dropdown in td child n
        const dateInput = container.querySelector('input[type="date"]'); //get the 'date' input 
        const textInput = container.querySelector('input[type="text"].extra-input'); //get the 'text' input 
        let value = '';
        if (dateInput) value += dateInput.value; //if date input then append to value
        if (textInput) value += value ? ` ${textInput.value}` : textInput.value; //if text input append to value 
        data[field] = value.trim(); // set data[field] to the value trimmed
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
    //status.textContent = '...';
    //status.className = 'save-status saving';

    timeout = setTimeout(() => {
        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

        console.log(data);
        axios.post(`/update/${id}`, data, {
            headers: { [csrfHeader]: csrfToken }
        })
        .then(response => {
            
            console.log ('Row id: ' + id + ' saved ✓');
        })
        .catch(error => {
            //status.textContent = '✖';
            //status.className = 'save-status error';
            console.error('Error saving:', error.response ? error.response.data : error);
        });
    }, 500);
}

function autoSaveUserInfo(input) {
    clearTimeout(userInfoTimeout);

    const data = {};
    data[input.name] = input.value; // Only send the changed field

    userInfoTimeout = setTimeout(() => {
        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

        axios.post('/updateUserInfo', data, {
            headers: { [csrfHeader]: csrfToken }
        })
        .then(response => {
            console.log('User info saved successfully: ');
            console.log(data);
            // Optionally add a status indicator next to the input if needed

            // NEW: Update the adjacent print-only span with the new value
            const printSpan = input.nextElementSibling;
            if (printSpan && printSpan.classList.contains('print-only')) {
                printSpan.textContent = input.value;
            }
        })
        .catch(error => {
            console.error('Error saving user info:', error.response ? error.response.data : error);
            // Optionally show an error indicator
        });
    }, 500); // Debounce for 500ms
}

// In printDashboard, add this loop for redundancy (before window.print())
document.querySelectorAll('.aircraft-info input.user-info-input').forEach(input => {
    const printSpan = input.nextElementSibling;
    if (printSpan && printSpan.classList.contains('print-only')) {
        printSpan.textContent = input.value;
    }
});

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
    const rows = document.querySelectorAll('.sortable tr:not(.add-row)');
    const order = Array.from(rows).map(row => row.getAttribute('data-id'));
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
    //Gets the row order by getting the 'data-id' of each row and sending that to the /updateOrders endpoint
    //Ex. If order is 3, 1, 2 then that is the order sent
    console.log("Order request sent");
    axios.post('/updateOrder', order, {        
        headers: {
            [csrfHeader]: csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('RESPONSE: Order updated');
    })
    .catch(error => {
        console.error('RESPONSE: Error updating order:', error);
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
    // Add the new option to all dropdowns without selecting it
    if (!isDefaultOption(customValue)) {
        updateAllDropdowns(customValue);
    }
    input.value = '';
    // Do not select the new option or trigger autoSave
}

function updateAllDropdowns(newOption) {
    document.querySelectorAll('.dropdown-options').forEach(dropdown => {
        if (!dropdown.querySelector(`.option[data-value="${newOption}"]`)) {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option custom-option';
            optionDiv.setAttribute('data-value', newOption);
            // Create span for the option text
            const span = document.createElement('span');
            span.textContent = newOption;
            optionDiv.appendChild(span);
            // Create remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-option-btn';
            removeBtn.textContent = 'x';
            // Use data-option-value since we don't have an ID yet
            removeBtn.setAttribute('data-option-value', newOption);
            optionDiv.appendChild(removeBtn);
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

    console.log("calculateTimeLeft OUTPUT--->" + output);

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

function selectRowType(type, rowTypeElement) {
    const addRow = document.querySelector('.add-row'); //Get the add row
    const itemInputDiv = document.getElementById('itemInput'); //Get the "Enter Item" div
    const titleInputDiv = document.getElementById('titleInput'); //Get the "Enter Title" div
    const itemInput = itemInputDiv.querySelector('textarea'); //Get the item textarea
    const titleInput = titleInputDiv.querySelector('input'); //Get the title input
    const itemHidden = document.getElementById('itemHidden');
    const isTitleHidden = document.getElementById('isTitleHidden');

    // Removes 'selected' class from all options
    document.querySelectorAll('.row-type-option').forEach(opt => opt.classList.remove('selected'));
    // Add 'selected' class to clicked option
    rowTypeElement.classList.add('selected');

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
    updateAllTimeLeft(); // Initial call to set Time Left immediately
    updateAddRowTimeLeft();
    scheduleMidnightUpdate();
    
    console.log('Dropdown triggers found:', document.querySelectorAll('.dropdown-trigger').length);
    console.log('add-row td:nth-child(5) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(5) .input-with-dropdown'));
    console.log('add-row td:nth-child(6) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(6) .input-with-dropdown'));

    document.querySelectorAll('.user-info-input').forEach(input => {
        input.addEventListener('input', () => autoSaveUserInfo(input));
    });


    document.addEventListener('click', function(event) {
        if (event.target.className === 'remove-option-btn') {
            event.preventDefault();
            event.stopPropagation();
            const optionId = event.target.getAttribute('data-option-id');
            const optionValue = event.target.getAttribute('data-option-value');
            const optionDiv = event.target.closest('.option');
            const deletedValue = optionDiv.getAttribute('data-value');
    
            if (confirm('Are you sure you want to delete this option?')) {
                if (optionId) {
                    // Existing option with an ID (from server)
                    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
                    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
                    axios.delete(`/deleteOption/${optionId}`, {
                        headers: { [csrfHeader]: csrfToken }
                    })
                    .then(response => {
                        if (response.data === "Option deleted") {
                            document.querySelectorAll(`.option.custom-option[data-option-id="${optionId}"]`)
                                .forEach(opt => opt.remove());
                            // Reset dropdowns where this option was selected
                            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                                const hiddenInput = dropdown.querySelector('input[type="hidden"]');
                                const selected = dropdown.querySelector('.selected-option');
                                if (hiddenInput && selected && hiddenInput.value === deletedValue) {
                                    selected.textContent = '';
                                    hiddenInput.value = '';
                                    if (dropdown.closest('.auto-save-row')) autoSave(hiddenInput);
                                }
                            });
                            console.log(`Option ${deletedValue} (ID: ${optionId}) deleted successfully`);
                        } else {
                            throw new Error('Deletion failed on server');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting option:', error);
                        alert('Failed to delete option: ' + (error.response?.data || error.message));
                    });
                } else if (optionValue) {
                    // New option without an ID (not yet saved)
                    document.querySelectorAll(`.option.custom-option[data-value="${optionValue}"]`)
                        .forEach(opt => opt.remove());
                    console.log(`New option ${optionValue} removed locally`);
                }
            }
        } else if (event.target.classList.contains('trigger-dropdown')) {
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

        } else if (event.target.classList.contains('add-type')) {
            const button = event.target;
            const type = button.getAttribute('data-type');
            const container = button.closest('.input-with-dropdown');
            const tr = button.closest('tr');
            const isAddMode = button.textContent === '+';
    
            const existingDate = container.querySelector('input[type="date"]');
            const existingText = container.querySelector('input[type="text"].extra-input');
    
            if (isAddMode) {
                // Adding a new input
                if (type === 'calendar' && !existingDate) {
                    const newInput = document.createElement('input');
                    newInput.type = 'date';
                    newInput.className = 'extra-input';
                    newInput.oninput = () => {
                        if (tr.classList.contains('auto-save-row')) {
                            autoSave(newInput);
                        } else {
                            updateAddRowHiddenInputs();
                            updateAddRowTimeLeft();
                        }
                    };
                    container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                    button.textContent = '-';
                } else if (type === 'clock' && !existingText) {
                    const newInput = document.createElement('input');
                    newInput.type = 'text';
                    newInput.className = 'extra-input';
                    newInput.placeholder = 'Enter hours';
                    newInput.oninput = () => {
                        newInput.value = newInput.value.replace(/[^0-9]/g, '');
                        if (tr.classList.contains('auto-save-row')) {
                            autoSave(newInput);
                        } else {
                            updateAddRowHiddenInputs();
                            updateAddRowTimeLeft();
                        }
                    };
                    container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                    button.textContent = '-';
                }
            } else {
                // Removing an existing input
                if (type === 'calendar' && existingDate) {
                    existingDate.remove();
                    button.textContent = '+';
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(button); // Trigger save for sortable rows
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft();
                    }
                } else if (type === 'clock' && existingText) {
                    existingText.remove();
                    button.textContent = '+';
                    if (tr.classList.contains('auto-save-row')) {
                        autoSave(button); // Trigger save for sortable rows
                    } else {
                        updateAddRowHiddenInputs();
                        updateAddRowTimeLeft();
                    }
                }
            }
    
            // Hide the dropdown after action
            button.closest('.type-dropdown').style.display = 'none';
        } else if (event.target.classList.contains('edit-hours-btn')) {
            document.getElementById('add-hours').value = '';
            const editSection = document.querySelector('.edit-hours-section');
            editSection.style.display = editSection.style.display === 'block' ? 'none' : 'block';
        }
    });
    
    function selectOption(option) {
        if (event.target.classList.contains('remove-option-btn')) {
            return; // Prevent selection on remove button click
        }
        const dropdown = option.closest('.custom-dropdown');
        const selected = dropdown.querySelector('.selected-option');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const value = option.getAttribute('data-value');
        const optionText = option.querySelector('span') ? option.querySelector('span').textContent : option.textContent;
        selected.textContent = value === '' ? '' : optionText;
        hiddenInput.value = value;
        dropdown.querySelector('.dropdown-options').style.display = 'none';
        if (dropdown.closest('.auto-save-row')) autoSave(hiddenInput);
    }

    document.querySelectorAll('.auto-save-row textarea[name="item"]').forEach(textarea => {
        setTimeout(() => {
            setTextareaMinHeight(textarea);
        }, 0); // 0ms delay ensures rendering is complete
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

    window.addEventListener('resize', () => {
        document.querySelectorAll('.auto-save-row textarea[name="item"], .auto-save-row textarea[name="cycle"], .add-row textarea[name="item"], .add-row textarea[name="cycle"]').forEach(textarea => {
            setTextareaMinHeight(textarea);
        });
    });

    // Initialize Sortable.js
    const tbody = document.querySelector('.sortable');
    Sortable.create(tbody, {
        handle: '.grip-icon', //Restricts dragging to grip-icon 
        animation: 150, // 150ms animation for smooth dragging
        onEnd: function (evt) {
            updateOrderOnServer(); //After calls this function
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
        selected.textContent = value === '' ? '' : (matchingOption ? (matchingOption.querySelector('span') ? matchingOption.querySelector('span').textContent : matchingOption.textContent) : value);
        options.forEach(option => option.onclick = () => selectOption(option));
    });

    const currentHoursInput = document.getElementById('current-hours');
    if (currentHoursInput) {
        previousHours = currentHoursInput.value || 0;
        currentHoursInput.addEventListener('input', function() {
            updateAllTimeLeft();
            updateAddRowTimeLeft();
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
                        document.getElementById('current-hours-display').textContent = `Current Hours: ${newTotalHours}`;
                        console.log('Hours updated successfully:', response.data.newHours);
                    } else {
                        this.value = previousHours;
                        document.getElementById('current-hours-display').textContent = `Current Hours: ${previousHours}`;
                        console.error('Failed to update hours:', response.data.message);
                        alert('Failed to update hours');
                    }
                })
                .catch(error => {
                    console.error('Error updating hours:', error.response ? error.response.data : error);
                    this.value = previousHours;
                    document.getElementById('current-hours-display').textContent = `Current Hours: ${previousHours}`;
                    alert('Error updating hours');
                });
            }, 500);
        });
    }

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

    const addRowItemTextarea = document.querySelector('.add-row textarea[name="item"]');
    if (addRowItemTextarea) {
        setTextareaMinHeight(addRowItemTextarea);
        addRowItemTextarea.addEventListener('input', () => {
            setTextareaMinHeight(addRowItemTextarea);
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

    const itemOption = document.querySelector('.row-type-option[data-type="item"]');
    if (itemOption) {
        selectRowType('item', itemOption);
    }

    const addForm = document.querySelector('.add-row form');
    if (addForm) {
    addForm.addEventListener('submit', function(event) {
        event.preventDefault();

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

        console.log("New row REQUEST: ", data);

        axios.post('/dashboard', data, {
            headers: {
                [csrfHeader]: csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
    const newRowData = response.data;
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-id', newRowData.id); // Use server-provided ID
    if (newRowData.isTitle) {
        newRow.className = 'title-row';
        newRow.innerHTML = `
            <td class="grip-cell"><span class="grip-icon no-print">⋮</span></td>
            <td colspan="7" class="title-cell">${newRowData.item}</td>
            <td class="delete-cell"><span class="delete-icon no-print" onclick="deleteRow(this)">🗑️</span></td>
        `;
    } else {
        newRow.className = 'auto-save-row';
        newRow.setAttribute('data-lastDone', newRowData.lastDone);
        newRow.setAttribute('data-dueDate', newRowData.dueDate);
        newRow.setAttribute('data-cycle', newRowData.cycle);
        newRow.innerHTML = `
            <td class="grip-cell"><span class="grip-icon no-print">⋮</span></td>
            <td><textarea name="item" class="no-print" oninput="autoSave(this)">${newRowData.item}</textarea><span class="print-only">${newRowData.item}</span></td>
            <td>
                <div class="custom-dropdown">
                    <div class="selected-option no-print">${newRowData.description}</div>
                    <input type="hidden" name="description" value="${newRowData.description}">
                    <button class="dropdown-trigger no-print">▼</button>
                    <div class="dropdown-options no-print">
                        <div class="option" data-value="">--None--</div>
                        <div class="option" data-value="Inspect">Inspect</div>
                        <div class="option" data-value="Test">Test</div>
                        <div class="option" data-value="Replace">Replace</div>
                        <div class="option" data-value="Overhaul">Overhaul</div>
                        <div class="add-option-container">
                            <input type="text" class="custom-description" placeholder="New option">
                            <button class="add-option-btn" onclick="addCustomDescription(this)">Add</button>
                        </div>
                    </div>
                </div>
                <span class="print-only">${newRowData.description}</span>
            </td>
            <td><textarea name="cycle" class="no-print" oninput="autoSave(this)">${newRowData.cycle}</textarea><span class="print-only">${newRowData.cycle}</span></td>
            <td>
                <div class="input-with-dropdown no-print">
                    <button class="trigger-dropdown">▼</button>
                    <div class="type-dropdown" style="display: none;">
                        <div class="type-option"><span>Calendar</span><button class="add-type" data-type="calendar">+</button></div>
                        <div class="type-option"><span>Clock</span><button class="add-type" data-type="clock">+</button></div>
                    </div>
                </div>
                <span class="print-only">${newRowData.lastDone}</span>
            </td>
            <td>
                <div class="input-with-dropdown no-print">
                    <button class="trigger-dropdown">▼</button>
                    <div class="type-dropdown" style="display: none;">
                        <div class="type-option"><span>Calendar</span><button class="add-type" data-type="calendar">+</button></div>
                        <div class="type-option"><span>Clock</span><button class="add-type" data-type="clock">+</button></div>
                    </div>
                </div>
                <span class="print-only">${newRowData.dueDate}</span>
            </td>
            <td><div class="time-left">${newRowData.timeLeft}</div></td>
            <td class="delete-cell"><span class="delete-icon no-print" onclick="deleteRow(this)">🗑️</span></td>
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

            if (!newRow.classList.contains('title-row')) {
                const itemTextarea = newRow.querySelector('textarea[name="item"]');
                if (itemTextarea) {
                    setTextareaMinHeight(itemTextarea);
                    itemTextarea.addEventListener('input', () => {
                        setTextareaMinHeight(itemTextarea);
                    });
                }
                const cycleTextarea = newRow.querySelector('textarea[name="cycle"]');
                if (cycleTextarea) {
                    setTextareaMinHeight(cycleTextarea);
                    cycleTextarea.addEventListener('input', () => {
                        setTextareaMinHeight(cycleTextarea);
                    });
                }
            }

            // Update the order on the server TAKE A LOOK HERE

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
            console.log(hoursToAdd + " hours added");
            axios.post('/updateHours', params, {
                headers: { [csrfHeader]: csrfToken }
            })
            .then(response => {
                if (response.data.status === 'success') {
                    const newHours = response.data.newHours;
                    document.getElementById('current-hours').value = newHours; // Update the input value
                    document.getElementById('current-hours-display').textContent = `Current Hours: ${newHours}`;
                    previousHours = newHours; // Update previousHours
                    //document.getElementById('add-hours').value = ''; // Clear the input
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

    // New: Export button listener
    const exportBtn = document.getElementById('export-excel');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }

    // Helper to generate Excel formula for Time Left (mimics calculateTimeLeft)
    function getTimeLeftFormula(row) { // row is 1-based Excel row
        return `=IF(E${row}="","N/A",IF(ISERROR(DATEVALUE(LEFT(E${row},10))),LET(hourVal,VALUE(E${row}),IF(hourVal>B$1,(hourVal-B$1)&" hours left",ABS(hourVal-B$1)&" hours overdue")),LET(dateVal,DATEVALUE(LEFT(E${row},10)),spacePos,FIND(" ",E${row}&" "),hourStr,IF(spacePos=11,"",MID(E${row},spacePos+1,99)),hourVal,IF(hourStr="",NA(),VALUE(hourStr)),daysTxt,IF(dateVal>TODAY(),(dateVal-TODAY())&" days left",IF(dateVal<TODAY(),ABS(dateVal-TODAY())&" days overdue","Due today")),hoursTxt,IF(ISNA(hourVal),"",IF(hourVal>B$1,(hourVal-B$1)&" hours left",ABS(hourVal-B$1)&" hours overdue")),IF(hoursTxt="",daysTxt,daysTxt&CHAR(10)&hoursTxt))))`;
    }

    // Main export function
    function exportToExcel() {
        const currentHoursInput = document.getElementById('current-hours');
        const currentHours = currentHoursInput ? parseInt(currentHoursInput.value) || 0 : 0;

        // Build array of arrays (aoa) for the sheet
        let aoa = [
            ["Current Hours", currentHours], // Row 1: Reference for hour calcs (user can update B1 in Excel)
            ["Item", "Description", "Cycle", "Last Done", "Due Date", "Time Left"] // Row 2: Headers
        ];

        let dataRowIndices = []; // Track 0-based indices in aoa for data rows (to set formulas later)

        // Loop over table rows (skip add-row)
        document.querySelectorAll('.sortable tr:not(.add-row)').forEach(row => {
            if (row.classList.contains('title-row')) {
                // Title row: Flatten to Item column
                const title = row.querySelector('.title-cell').textContent.trim();
                aoa.push([title, "", "", "", "", ""]);
            } else {
                // Data row: Extract values (similar to autoSave)
                const item = row.querySelector('textarea[name="item"]')?.value || '';
                const desc = row.querySelector('input[name="description"]')?.value || '';
                const cycle = row.querySelector('textarea[name="cycle"]')?.value || '';
                let lastDone = '';
                let dueDate = '';

                ['lastDone', 'dueDate'].forEach((field, index) => {
                    const tdIndex = index + 5; // td 5=lastDone, 6=dueDate (1-based, grip=1)
                    const container = row.querySelector(`td:nth-child(${tdIndex}) .input-with-dropdown`);
                    const dateInput = container?.querySelector('input[type="date"]');
                    const textInput = container?.querySelector('input[type="text"].extra-input');
                    let value = '';
                    if (dateInput) value += dateInput.value;
                    if (textInput) value += value ? ` ${textInput.value}` : textInput.value;
                    if (field === 'lastDone') lastDone = value.trim();
                    else dueDate = value.trim();
                });

                // Compute initial Time Left for display (using your function)
                const initialTimeLeft = calculateTimeLeft(dueDate, currentHours);

                aoa.push([item, desc, cycle, lastDone, dueDate, initialTimeLeft]);
                dataRowIndices.push(aoa.length - 1); // Track for formula
            }
        });

        // Create worksheet from aoa
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Set formulas on Time Left column (F, col 5) for data rows
        dataRowIndices.forEach(rowIdx => {
            const excelRow = rowIdx + 1; // 1-based for formula
            const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: 5 }); // F column
            ws[cellRef].f = getTimeLeftFormula(excelRow);
        });

        // Optional: Set column widths for better readability
        const colWidths = [
            { wch: 20 }, // Item
            { wch: 15 }, // Description
            { wch: 10 }, // Cycle
            { wch: 15 }, // Last Done
            { wch: 20 }, // Due Date
            { wch: 25 }  // Time Left (multi-line)
        ];
        ws['!cols'] = colWidths;

        // Add sheet and download
        XLSX.utils.book_append_sheet(wb, ws, "Service Timeline");
        XLSX.writeFile(wb, `Aircraft_Service_Timeline_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    // NEW: Print button listener
    const printBtn = document.getElementById('print-dashboard');
    if (printBtn) {
        printBtn.addEventListener('click', printDashboard);
    }

    // NEW: Function to handle printing
    function printDashboard() {
        // Update all time left values (assuming you have updateAllTimeLeft() from existing code)
        updateAllTimeLeft();
        updateAddRowTimeLeft();  // If applicable, though add-row is hidden

        // Update My Hours print-only span
        const currentHours = document.getElementById('current-hours').value || '0';
        document.getElementById('current-hours-display').textContent = `Current Hours: ${currentHours}`;

        // Update print-only spans in table rows with current values
        document.querySelectorAll('.sortable tr:not(.title-row)').forEach(row => {
            // Item
            const itemTextarea = row.querySelector('textarea[name="item"]');
            const itemPrint = row.querySelector('td:nth-child(2) .print-only');
            if (itemTextarea && itemPrint) itemPrint.textContent = itemTextarea.value;

            // Description (from hidden input)
            const descInput = row.querySelector('input[name="description"]');
            const descPrint = row.querySelector('td:nth-child(3) .print-only');
            if (descInput && descPrint) descPrint.textContent = descInput.value;

            // Cycle
            const cycleTextarea = row.querySelector('textarea[name="cycle"]');
            const cyclePrint = row.querySelector('td:nth-child(4) .print-only');
            if (cycleTextarea && cyclePrint) cyclePrint.textContent = cycleTextarea.value;

            // Last Done (construct from inputs)
            const lastDoneContainer = row.querySelector('td:nth-child(5) .input-with-dropdown');
            const lastDoneDate = lastDoneContainer?.querySelector('input[type="date"]')?.value || '';
            const lastDoneText = lastDoneContainer?.querySelector('input[type="text"].extra-input')?.value || '';
            const lastDonePrint = row.querySelector('td:nth-child(5) .print-only');
            if (lastDonePrint) lastDonePrint.textContent = `${lastDoneDate} ${lastDoneText}`.trim();

            // Due Date (similar)
            const dueDateContainer = row.querySelector('td:nth-child(6) .input-with-dropdown');
            const dueDateDate = dueDateContainer?.querySelector('input[type="date"]')?.value || '';
            const dueDateText = dueDateContainer?.querySelector('input[type="text"].extra-input')?.value || '';
            const dueDatePrint = row.querySelector('td:nth-child(6) .print-only');
            if (dueDatePrint) dueDatePrint.textContent = `${dueDateDate} ${dueDateText}`.trim();
        });

        // Trigger browser print dialog
        window.print();
    }


});