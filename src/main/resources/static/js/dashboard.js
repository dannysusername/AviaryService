console.log('dashboard.js loaded');

let timeout;

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
    const formData = new FormData();

    row.querySelectorAll('input:not(.extra-input), textarea').forEach(element => {
        formData.append(element.name, element.value);
    });

    ['lastDone', 'dueDate'].forEach((field, index) => {
        const container = row.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`);
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
    console.log('add-row td:nth-child(5) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(5) .input-with-dropdown'));
    console.log('add-row td:nth-child(6) .input-with-dropdown:', document.querySelector('.add-row td:nth-child(6) .input-with-dropdown'));


    document.querySelectorAll('.auto-save-row textarea[name="item"]').forEach(textarea => {
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

    document.querySelectorAll('.auto-save-row').forEach(row => {
        ['lastDone', 'dueDate'].forEach((field, index) => {
            const container = row.querySelector(`td:nth-child(${index === 0 ? 5 : 6}) .input-with-dropdown`);
            const savedValue = row.getAttribute(`data-${field}`) || '';
            if (savedValue) {
                const parts = savedValue.split(' ');
                let datePart = null;
                let textPart = null;
    
                // Check if the first part is a date
                if (parts[0] && parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
                    datePart = parts[0];
                    if (parts.length > 1) {
                        textPart = parts.slice(1).join(' '); // Time follows the date
                    }
                } else {
                    textPart = savedValue; // No date, so treat the whole value as time
                }
    
                // Create date input if there’s a date
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
    
                // Create time input if there’s a time
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
    }

    document.querySelectorAll('.add-type').forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const container = this.closest('.input-with-dropdown');
            const tr = this.closest('tr');
            
            if (!tr || !container) {
                console.error('No tr or container found for add-type button');
                return;
            }
    
            const td = this.closest('td');
            const tdIndex = Array.from(tr.children).indexOf(td);
            const existingDate = container.querySelector('input[type="date"]');
            const existingText = container.querySelector('input[type="text"].extra-input');
            const existingTitle = container.querySelector('input[type="text"].title-input');
            const isAddMode = this.textContent === '+';
            const row = tr.classList.contains('auto-save-row') ? tr : null;
    
            if (tdIndex === 1 && tr.classList.contains('add-row')) {
                // Handle item column in add row
                if (isAddMode) {
                    if (type === 'item' && existingTitle) {
                        existingTitle.remove();
                        container.querySelector('.add-type[data-type="title"]').textContent = '+';
                    } else if (type === 'title' && existingText) {
                        existingText.remove();
                        container.querySelector('.add-type[data-type="item"]').textContent = '+';
                    }
    
                    if (type === 'item' && !existingText) {
                        const newInput = document.createElement('input');
                        newInput.type = 'text';
                        newInput.name = 'item_text';
                        newInput.className = 'extra-input';
                        newInput.placeholder = 'Enter item';
                        newInput.oninput = () => updateItemHiddenInputs();
                        container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                        this.textContent = '-';
                        tr.classList.remove('title-mode');
                        updateItemHiddenInputs();
                    } else if (type === 'title' && !existingTitle) {
                        const newInput = document.createElement('input');
                        newInput.type = 'text';
                        newInput.name = 'title_text';
                        newInput.className = 'title-input';
                        newInput.placeholder = 'Enter title';
                        newInput.oninput = () => updateItemHiddenInputs();
                        container.insertBefore(newInput, container.querySelector('.trigger-dropdown'));
                        this.textContent = '-';
                        tr.classList.add('title-mode');
                        tr.querySelectorAll('td:not(:nth-child(1)):not(:last-child) input, td:not(:nth-child(1)):not(:last-child) textarea').forEach(el => el.value = '');
                        updateItemHiddenInputs();
                    }
                } else {
                    if (type === 'item' && existingText) {
                        existingText.remove();
                        this.textContent = '+';
                        tr.classList.remove('title-mode');
                        updateItemHiddenInputs();
                    } else if (type === 'title' && existingTitle) {
                        existingTitle.remove();
                        this.textContent = '+';
                        tr.classList.remove('title-mode');
                        updateItemHiddenInputs();
                    }
                }
            } else if (tdIndex === 4 || tdIndex === 5) {
                // Handle last done and due date for both add row and existing rows
                const fieldName = tdIndex === 4 ? 'lastDone' : 'dueDate';
    
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
    
                    if (newInput) {
                        const trigger = container.querySelector('.trigger-dropdown');
                        if (trigger) {
                            container.insertBefore(newInput, trigger);
                        } else {
                            container.appendChild(newInput);
                        }
                        this.textContent = '-';
                        if (!row) updateAddRowHiddenInputs();
                    }
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
            }
    
            this.closest('.type-dropdown').style.display = 'none';
        });
    });

    const addForm = document.querySelector('.add-row form');
    if (addForm) {
        addForm.addEventListener('submit', function(event) {
            updateItemHiddenInputs();
            updateAddRowHiddenInputs();
            const item = document.getElementById('itemHidden').value;
            const isTitle = document.getElementById('isTitleHidden').value;
            const description = document.querySelector('.add-row .custom-dropdown input[name="description"]').value;
            const cycle = document.querySelector('.add-row textarea[name="cycle"]').value;
            const lastDone = document.getElementById('lastDoneHidden').value;
            const dueDate = document.getElementById('dueDateHidden').value;
            const timeLeft = document.querySelector('.add-row input[name="timeLeft"]').value;

            document.getElementById('itemHiddenDuplicate').value = item;
            document.getElementById('isTitleHiddenDuplicate').value = isTitle;
            document.getElementById('descriptionHidden').value = description;
            document.getElementById('cycleHidden').value = cycle;
            document.getElementById('lastDoneHiddenDuplicate').value = lastDone;
            document.getElementById('dueDateHiddenDuplicate').value = dueDate;
            document.getElementById('timeLeftHidden').value = timeLeft;
        });
    }

    function closeTypeDropdowns(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            document.querySelectorAll('.type-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    }
});