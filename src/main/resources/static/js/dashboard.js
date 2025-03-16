console.log('dashboard.js loaded');

let timeout;

function setTextareaMinHeight(textarea) {
    // Reset both height and min-height to measure true scrollHeight
    textarea.style.height = 'auto';
    textarea.style.minHeight = '0'; // Reset min-height to allow full shrinkage
    const scrollHeight = textarea.scrollHeight;

    // Set min-height to content height, capped at 120px
    textarea.style.minHeight = `${Math.min(scrollHeight, 120)}px`;
    textarea.style.height = 'auto'; // Let height adjust naturally

    // If content exceeds 120px, truncate it
    if (scrollHeight > 120) {
        const currentValue = textarea.value;
        let truncatedValue = currentValue;
        textarea.style.height = 'auto'; // Reset for measurement
        textarea.style.minHeight = '0'; // Reset min-height again for accurate truncation
        while (textarea.scrollHeight > 120 && truncatedValue.length > 0) {
            truncatedValue = truncatedValue.slice(0, -1); // Remove last character
            textarea.value = truncatedValue;
        }
        // Restore cursor position to end
        textarea.setSelectionRange(truncatedValue.length, truncatedValue.length);
        textarea.style.minHeight = '120px'; // Lock min-height at max when truncated
    }
}


function autoSave(input) {
    const row = input.closest('.auto-save-row');
    if (!row) return;

    const id = row.getAttribute('data-id');
    const status = row.querySelector('.save-status');
    const formData = new FormData();

    // Handle regular inputs (item, cycle, timeLeft, description)
    row.querySelectorAll('input:not(.extra-input), textarea').forEach(element => {
        formData.append(element.name, element.value);
    });

    // Handle lastDone and dueDate from extra inputs only
    ['lastDone', 'dueDate'].forEach(field => {
        const container = row.querySelector(`td:nth-child(${field === 'lastDone' ? 4 : 5}) .input-with-dropdown`);
        const dateInput = container.querySelector('input[type="date"]');
        const textInput = container.querySelector('input[type="text"].extra-input');
        let value = '';
        if (dateInput) value += dateInput.value;
        if (textInput) value += value ? ` ${textInput.value}` : textInput.value;
        formData.append(field, value.trim());
    });

    clearTimeout(timeout);
    status.textContent = 'Saving...';
    status.className = 'save-status saving';

    timeout = setTimeout(() => {
        const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
        axios.post(`/update/${id}`, formData, {
            headers: { [csrfHeader]: csrfToken }
        })
            .then(response => {
                status.textContent = 'Saved';
                status.className = 'save-status saved';
                const description = formData.get('description');
                if (description && !isDefaultOption(description)) {
                    updateAllDropdowns(description);
                }
            })
            .catch(error => {
                status.textContent = 'Error';
                status.className = 'save-status error';
                console.error('Error saving:', error.response ? error.response.data : error);
            });
    }, 500);
}

function deleteRow(icon) {
    const row = icon.closest('.auto-save-row');
    if (!row) return;
    const id = row.getAttribute('data-id');
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    if (confirm('Are you sure you want to delete this entry?')) {
        axios.delete(`/delete/${id}`, { headers: { [csrfHeader]: csrfToken } })
            .then(() => row.remove())
            .catch(error => console.error('Error deleting:', error.response ? error.response.data : error));
    }
}

function toggleDropdown(selected) {
    const dropdown = selected.nextElementSibling.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    setTimeout(() => document.addEventListener('click', closeDropdownOutside, { once: true }), 0);
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
    return ['inspect', 'test', 'replace', 'overhaul'].includes(value);
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

document.addEventListener('DOMContentLoaded', () => {

    console.log('add-row td:nth-child(4) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(4) .input-with-dropdown'));
    console.log('add-row td:nth-child(5) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(5) .input-with-dropdown'));
    
    // Initialize custom dropdowns (unchanged)
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const selected = dropdown.querySelector('.selected-option');
        const options = dropdown.querySelectorAll('.option');
        const value = hiddenInput.value || '';
        const matchingOption = Array.from(options).find(opt => opt.getAttribute('data-value') === value);
        selected.textContent = value === '' ? '' : (matchingOption ? matchingOption.textContent : value);
        options.forEach(option => option.onclick = () => selectOption(option));
    });

    const addRowDropdown = document.querySelector('.add-row .custom-dropdown');
    if (addRowDropdown) {
        const hiddenInput = addRowDropdown.querySelector('input[type="hidden"]');
        const selected = addRowDropdown.querySelector('.selected-option');
        if (!hiddenInput.value) {
            hiddenInput.value = '';
            selected.textContent = '';
        }
    }

    // Initialize lastDone, dueDate, and cycle inputs from database values
    document.querySelectorAll('.auto-save-row').forEach(row => {
        // Initialize Cycle textarea
        const cycleTextarea = row.querySelector('textarea[name="cycle"]');
        const savedCycle = row.getAttribute('data-cycle') || '';
        if (cycleTextarea) {
            if (savedCycle) {
                cycleTextarea.value = savedCycle;
            }
            // Set min-height on load and enforce 120px limit
            setTextareaMinHeight(cycleTextarea);
            // Update min-height, limit content, and autosave on input
            cycleTextarea.addEventListener('input', () => {
                setTextareaMinHeight(cycleTextarea);
                autoSave(cycleTextarea);
            });
        }

        // Initialize lastDone and dueDate (unchanged)
        ['lastDone', 'dueDate'].forEach((field, index) => {
            const container = row.querySelector(`td:nth-child(${index === 0 ? 4 : 5}) .input-with-dropdown`);
            const savedValue = row.getAttribute(`data-${field}`) || '';
            if (savedValue) {
                const parts = savedValue.split(' ');
                const datePart = parts[0] && parts[0].match(/^\d{4}-\d{2}-\d{2}$/) ? parts[0] : null;
                const textPart = parts.length > 1 ? parts.slice(1).join(' ') : null;

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
                    textInput.placeholder = 'Enter time';
                    textInput.value = textPart;
                    textInput.oninput = () => autoSave(textInput);
                    container.insertBefore(textInput, container.querySelector('.trigger-dropdown'));
                    container.querySelector('.add-type[data-type="clock"]').textContent = '-';
                }
            }
        });
    });

    // Toggle dropdown visibility
    document.querySelectorAll('.trigger-dropdown').forEach(button => {
        button.addEventListener('click', function() {
            const dropdown = this.nextElementSibling;
            const isOpen = dropdown.style.display === 'block';
            document.querySelectorAll('.type-dropdown').forEach(d => d.style.display = 'none');
            if (!isOpen) {
                dropdown.style.display = 'block';
                setTimeout(() => document.addEventListener('click', closeTypeDropdowns, { once: true }), 0);
            }
        });
    });

    const addRowCycleTextarea = document.querySelector('.add-row textarea[name="cycle"]');
    if (addRowCycleTextarea) {
        setTextareaMinHeight(addRowCycleTextarea); // Initial adjustment
        addRowCycleTextarea.addEventListener('input', () => {
            setTextareaMinHeight(addRowCycleTextarea); // Adjust on input
        });
    }

    // Add or remove date picker or text input when plus/minus is clicked
    // Update function to accept a container context
// Update function to accept a container context
// Update function to accept a container context
function updateAddRowHiddenInputs() {
    const lastDoneTd = document.getElementById('lastDoneHidden').parentElement;
    const dueDateTd = document.getElementById('dueDateHidden').parentElement;

    console.log('lastDoneTd:', lastDoneTd);
    console.log('dueDateTd:', dueDateTd);

    const lastDoneContainer = lastDoneTd.querySelector('.input-with-dropdown');
    const dueDateContainer = dueDateTd.querySelector('.input-with-dropdown');

    if (!lastDoneContainer) {
        console.warn('lastDoneContainer not found in lastDoneTd');
    } else {
        const lastDoneDate = lastDoneContainer.querySelector('input[type="date"]');
        const lastDoneText = lastDoneContainer.querySelector('input[type="text"].extra-input');
        let lastDoneValue = '';
        if (lastDoneDate) lastDoneValue += lastDoneDate.value;
        if (lastDoneText) lastDoneValue += lastDoneValue ? ` ${lastDoneText.value}` : lastDoneText.value;
        document.getElementById('lastDoneHidden').value = lastDoneValue.trim();
        console.log('Updated lastDone:', lastDoneValue);
    }

    if (!dueDateContainer) {
        console.warn('dueDateContainer not found in dueDateTd');
    } else {
        const dueDateDate = dueDateContainer.querySelector('input[type="date"]');
        const dueDateText = dueDateContainer.querySelector('input[type="text"].extra-input');
        let dueDateValue = '';
        if (dueDateDate) dueDateValue += dueDateDate.value;
        if (dueDateText) dueDateValue += dueDateValue ? ` ${dueDateText.value}` : dueDateText.value;
        document.getElementById('dueDateHidden').value = dueDateValue.trim();
        console.log('Updated dueDate:', dueDateValue);
    }
}

document.querySelectorAll('.add-type').forEach(button => {
    button.addEventListener('click', function() {
        const type = this.getAttribute('data-type');
        const container = this.closest('.input-with-dropdown');
        const tdIndex = Array.from(container.closest('tr').children).indexOf(container.closest('td'));
        const fieldName = tdIndex === 3 ? 'lastDone' : 'dueDate';
        const existingDate = container.querySelector('input[type="date"]');
        const existingText = container.querySelector('input[type="text"].extra-input');
        const isAddMode = this.textContent === '+';
        const row = container.closest('.auto-save-row');

        if (isAddMode) {
            if (type === 'calendar' && existingDate) return;
            if (type === 'clock' && existingText) return;

            let newInput;
            if (type === 'calendar') {
                newInput = document.createElement('input');
                newInput.type = 'date';
                newInput.name = `${fieldName}_date`;
                newInput.className = 'extra-input';
                newInput.oninput = () => {
                    if (row) autoSave(newInput);
                    else updateAddRowHiddenInputs();
                };
            } else if (type === 'clock') {
                newInput = document.createElement('input');
                newInput.type = 'text';
                newInput.name = `${fieldName}_text`;
                newInput.className = 'extra-input';
                newInput.placeholder = 'Enter time';
                newInput.oninput = () => {
                    if (row) autoSave(newInput);
                    else updateAddRowHiddenInputs();
                };
            }

            container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
            this.textContent = '-';
            if (!row) updateAddRowHiddenInputs();
        } else {
            if (type === 'calendar' && existingDate) {
                existingDate.remove();
                this.textContent = '+';
                if (row) autoSave(this);
                else updateAddRowHiddenInputs();
            } else if (type === 'clock' && existingText) {
                existingText.remove();
                this.textContent = '+';
                if (row) autoSave(this);
                else updateAddRowHiddenInputs();
            }
        }

        this.closest('.type-dropdown').style.display = 'none';
    });
});

// Submit listener
const addForm = document.querySelector('.add-row form');
if (addForm) {
    addForm.addEventListener('submit', function(event) {
        updateAddRowHiddenInputs();
        console.log('Submitting - lastDoneHidden:', document.getElementById('lastDoneHidden').value, 'dueDateHidden:', document.getElementById('dueDateHidden').value);
    });
}

    function closeTypeDropdowns(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            document.querySelectorAll('.type-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    }

        // Handle add-row form submission
        
        // *** END OF UPDATED CODE ***

});