console.log('dashboard.js loaded');

let timeout;

function autoSave(input) {
    const row = input.closest('.auto-save-row');
    if (!row) return;

    const id = row.getAttribute('data-id');
    const status = row.querySelector('.save-status');
    const formData = new FormData();

    // Handle regular inputs (item, cycle, timeLeft, description)
    row.querySelectorAll('input:not(.extra-input)').forEach(input => {
        formData.append(input.name, input.value);
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

    // Add or remove date picker or text input when plus/minus is clicked
    document.querySelectorAll('.add-type').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const container = this.closest('.input-with-dropdown');
            const fieldName = container.closest('td').contains(container.closest('tr').querySelector('input[name="lastDone"]')) ? 'lastDone' : 'dueDate';
            const existingDate = container.querySelector('input[type="date"]');
            const existingText = container.querySelector('input[type="text"].extra-input');
            const isAddMode = this.textContent === '+';

            if (isAddMode) {
                // Add mode: check limits and add input
                if (type === 'calendar' && existingDate) return;
                if (type === 'clock' && existingText) return;

                let newInput;
                if (type === 'calendar') {
                    newInput = document.createElement('input');
                    newInput.type = 'date';
                    newInput.name = `${fieldName}_date`;
                    newInput.className = 'extra-input';
                    newInput.oninput = () => autoSave(newInput);
                } else if (type === 'clock') {
                    newInput = document.createElement('input');
                    newInput.type = 'text';
                    newInput.name = `${fieldName}_text`;
                    newInput.className = 'extra-input';
                    newInput.placeholder = 'Enter time';
                    newInput.oninput = () => autoSave(newInput);
                }

                // Insert before the trigger-dropdown and change to minus
                container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                this.textContent = '-';
            } else {
                // Remove mode: delete the input and change back to plus
                if (type === 'calendar' && existingDate) {
                    existingDate.remove();
                    this.textContent = '+';
                    if (row) autoSave(this); // Trigger autosave to update empty value
                } else if (type === 'clock' && existingText) {
                    existingText.remove();
                    this.textContent = '+';
                    if (row) autoSave(this); // Trigger autosave to update empty value
                }
            }

            this.closest('.type-dropdown').style.display = 'none';
        });
    });

    function closeTypeDropdowns(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            document.querySelectorAll('.type-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    }
});