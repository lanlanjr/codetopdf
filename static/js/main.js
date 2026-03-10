document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const scanForm = document.getElementById('scan-form');
    const dirPathInput = document.getElementById('dir-path');
    const scanBtn = document.getElementById('scan-btn');
    const scanText = document.getElementById('scan-text');
    const scanSpinner = document.getElementById('scan-spinner');
    
    // File List DOM
    const fileControls = document.getElementById('file-controls');
    const fileList = document.getElementById('file-list');
    const emptyState = document.getElementById('empty-state');
    const scanStats = document.getElementById('scan-stats');
    const selectionStats = document.getElementById('selection-stats');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const expandTreeBtn = document.getElementById('expand-tree-btn');
    
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    const generateText = document.getElementById('generate-text');
    const generateSpinner = document.getElementById('generate-spinner');

    // Modals
    const errorModal = document.getElementById('error-modal');
    const modalErrorText = document.getElementById('modal-error-text');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const scanAlert = document.getElementById('scan-alert');
    
    const treeModal = document.getElementById('tree-modal');
    const closeTreeModalBtn = document.getElementById('close-tree-modal-btn');
    const treeModalContent = document.getElementById('tree-modal-content');
    const originalTreeContainer = document.getElementById('original-tree-container');

    // Settings DOM Elements
    const settingTitle = document.getElementById('setting-title');
    const settingTheme = document.getElementById('setting-theme');
    const settingFont = document.getElementById('setting-font');
    const settingSize = document.getElementById('setting-size');
    const settingPaper = document.getElementById('setting-paper');
    const customPaperInputs = document.getElementById('custom-paper-inputs');
    const settingPaperWidth = document.getElementById('setting-paper-width');
    const settingPaperHeight = document.getElementById('setting-paper-height');
    const settingLinenos = document.getElementById('setting-linenos');

    // State
    let scannedFiles = [];
    let selectedFiles = new Set();

    // Helper: Show Modal Error
    const showError = (message) => {
        modalErrorText.textContent = message;
        errorModal.classList.remove('hidden');
    };

    closeModalBtn.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });

    // UI Interaction for Custom Paper
    settingPaper.addEventListener('change', (e) => {
        if (e.target.value === 'Custom') {
            customPaperInputs.classList.remove('hidden');
            customPaperInputs.parentElement.classList.remove('md:grid-cols-5');
            customPaperInputs.parentElement.classList.add('md:grid-cols-6');
        } else {
            customPaperInputs.classList.add('hidden');
            customPaperInputs.parentElement.classList.remove('md:grid-cols-6');
            customPaperInputs.parentElement.classList.add('md:grid-cols-5');
        }
    });

    // Helper: Build Tree Structure from Flat List
    const buildTree = (files) => {
        const root = { name: 'root', type: 'dir', children: {}, absolute_path: '' };
        
        files.forEach(file => {
            const parts = file.relative_path.split('/');
            let current = root;
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (!current.children[part]) {
                    const isFile = (i === parts.length - 1);
                    current.children[part] = {
                        name: part,
                        type: isFile ? 'file' : 'dir',
                        children: {},
                        file_data: isFile ? file : null,
                        path: parts.slice(0, i + 1).join('/'),
                        absolute_path: isFile ? file.absolute_path : current.absolute_path + '/' + part // pseudo absolute for dirs
                    };
                }
                current = current.children[part];
            }
        });
        
        return root;
    };

    // Helper: Update Parent Checkboxes based on children
    const updateParentCheckboxes = () => {
        const parents = Array.from(document.querySelectorAll('.dir-checkbox')).reverse(); // Bottom up
        
        parents.forEach(parentCheckbox => {
            const dirLi = parentCheckbox.closest('li');
            const childCheckboxes = Array.from(dirLi.querySelectorAll('.tree-indent .file-checkbox, .tree-indent .dir-checkbox'));
            
            if (childCheckboxes.length > 0) {
                const allChecked = childCheckboxes.every(cb => cb.checked);
                const someChecked = childCheckboxes.some(cb => cb.checked || cb.indeterminate);
                
                parentCheckbox.checked = allChecked;
                parentCheckbox.indeterminate = !allChecked && someChecked;
            }
        });
    };

    // Helper: Render Tree HTMLElement
    const renderNode = (node, level = 0) => {
        const li = document.createElement('li');
        
        if (node.type === 'file') {
            const file = node.file_data;
            li.className = "hover:bg-gray-50 transition-colors group";
            
            let iconColor = "text-gray-400";
            if (['.py'].includes(file.extension)) iconColor = "text-blue-500";
            else if (['.js', '.ts', '.jsx', '.tsx'].includes(file.extension)) iconColor = "text-yellow-500";
            else if (['.html'].includes(file.extension)) iconColor = "text-orange-500";
            else if (['.css'].includes(file.extension)) iconColor = "text-blue-400";
            else if (['.json', '.md'].includes(file.extension)) iconColor = "text-green-500";
            else if (['.sh', '.bat'].includes(file.extension)) iconColor = "text-gray-800";

            li.innerHTML = `
                <label class="flex items-center gap-3 p-2 cursor-pointer select-none">
                    <input type="checkbox" value="${file.absolute_path}" class="file-checkbox w-4 h-4 text-gray-800 rounded border-gray-300 focus:ring-indigo-500 ml-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 ${iconColor}">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span class="text-sm font-medium text-gray-700">${node.name}</span>
                </label>
            `;

            const checkbox = li.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) selectedFiles.add(file.absolute_path);
                else selectedFiles.delete(file.absolute_path);
                updateSelectionStats();
                updateParentCheckboxes();
            });
            
            // Re-check if it was previously checked in state
            if (selectedFiles.has(file.absolute_path)) {
                checkbox.checked = true;
            }

        } else if (node.type === 'dir') {
            li.className = "flex flex-col";
            
            li.innerHTML = `
                <div class="flex items-center gap-2 p-2 hover:bg-gray-100 transition-colors group">
                    <button class="toggle-dir p-1 text-gray-500 hover:text-gray-800 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 transform transition-transform duration-200 rotate-90">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                    <label class="flex items-center gap-2 cursor-pointer select-none flex-grow">
                        <input type="checkbox" class="dir-checkbox w-4 h-4 text-gray-800 rounded border-gray-300 focus:ring-indigo-500 ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-indigo-400">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        <span class="text-sm font-semibold text-gray-800">${node.name}</span>
                    </label>
                </div>
                <ul class="tree-indent children-container"></ul>
            `;
            
            const ul = li.querySelector('ul.children-container');
            const toggleBtn = li.querySelector('.toggle-dir');
            const chevron = toggleBtn.querySelector('svg');
            const dirCheckbox = li.querySelector('.dir-checkbox');
            
            // Sort children: dirs first, then files alphabetically
            const sortedChildren = Object.values(node.children).sort((a, b) => {
                if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                return a.name.localeCompare(b.name);
            });
            
            sortedChildren.forEach(child => {
                ul.appendChild(renderNode(child, level + 1));
            });

            // Toggle collapse
            toggleBtn.addEventListener('click', () => {
                const isHidden = ul.classList.contains('hidden');
                if (isHidden) {
                    ul.classList.remove('hidden');
                    chevron.classList.add('rotate-90');
                } else {
                    ul.classList.add('hidden');
                    chevron.classList.remove('rotate-90');
                }
            });

            // Directory Checkbox logic (cascade down)
            dirCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const childFileCheckboxes = ul.querySelectorAll('.file-checkbox');
                const childDirCheckboxes = ul.querySelectorAll('.dir-checkbox');
                
                // Update file checkboxes visually and in selectedFiles state
                childFileCheckboxes.forEach(cb => {
                    cb.checked = isChecked;
                    // Trigger synthetic change event to update underlying files Set
                    if (isChecked) selectedFiles.add(cb.value);
                    else selectedFiles.delete(cb.value);
                });
                
                // Update dir checkboxes visually
                childDirCheckboxes.forEach(cb => {
                    cb.checked = isChecked;
                    cb.indeterminate = false;
                });
                
                updateSelectionStats();
                updateParentCheckboxes(); // cascade up in case this directory is nested
            });
        }
        
        return li;
    };

    // Helper: Update bottom bar
    const updateSelectionStats = () => {
        const count = selectedFiles.size;
        selectionStats.textContent = `${count} file${count !== 1 ? 's' : ''} selected`;
        
        if (count > 0) {
            generatePdfBtn.removeAttribute('disabled');
        } else {
            generatePdfBtn.setAttribute('disabled', 'true');
        }
    };

    // Scan Directory Form Submit
    scanForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dirPath = dirPathInput.value.trim();
        
        if (!dirPath) {
            dirPathInput.focus();
            return;
        }

        // Setup loading state
        scanBtn.disabled = true;
        scanText.textContent = "Scanning...";
        scanSpinner.classList.remove('hidden');
        scanAlert.classList.add('hidden');
        
        try {
            const response = await fetch('/api/scan-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: dirPath })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to scan directory');
            }

            // Success
            scannedFiles = data.files;
            selectedFiles.clear(); // reset
            updateSelectionStats();
            
            // Render UI
            emptyState.classList.add('hidden');
            fileControls.classList.remove('hidden');
            fileList.classList.remove('hidden');
            fileList.innerHTML = '';
            
            scanStats.textContent = `Found ${scannedFiles.length} readable text/code files in ${data.scanned_path}`;
            
            if (scannedFiles.length === 0) {
                fileList.innerHTML = '<li class="p-4 text-center text-gray-500 text-sm">No code files found in this directory.</li>';
            } else {
                const tree = buildTree(scannedFiles);
                // Render root children directly
                const sortedChildren = Object.values(tree.children).sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                
                sortedChildren.forEach(child => {
                    fileList.appendChild(renderNode(child));
                });
            }

        } catch (error) {
            scanAlert.textContent = error.message;
            scanAlert.className = "mt-3 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200 block";
            
            // Reset UI
            emptyState.classList.remove('hidden');
            fileControls.classList.add('hidden');
            fileList.classList.add('hidden');
        } finally {
            // Revert loading state
            scanBtn.disabled = false;
            scanText.textContent = "Scan Directory";
            scanSpinner.classList.add('hidden');
        }
    });

    selectAllBtn.addEventListener('click', () => {
        const fileCheckboxes = document.querySelectorAll('.file-checkbox');
        const dirCheckboxes = document.querySelectorAll('.dir-checkbox');
        
        fileCheckboxes.forEach(cb => {
            cb.checked = true;
            selectedFiles.add(cb.value);
        });
        
        dirCheckboxes.forEach(cb => {
            cb.checked = true;
            cb.indeterminate = false;
        });
        
        updateSelectionStats();
    });

    deselectAllBtn.addEventListener('click', () => {
        const fileCheckboxes = document.querySelectorAll('.file-checkbox');
        const dirCheckboxes = document.querySelectorAll('.dir-checkbox');
        
        fileCheckboxes.forEach(cb => {
            cb.checked = false;
        });
        
        dirCheckboxes.forEach(cb => {
            cb.checked = false;
            cb.indeterminate = false;
        });
        
        selectedFiles.clear();
        updateSelectionStats();
    });

    // Expand Tree Modal Handlers
    expandTreeBtn.addEventListener('click', () => {
        // Move lists to modal
        treeModalContent.appendChild(emptyState);
        treeModalContent.appendChild(fileList);
        treeModal.classList.remove('hidden');
    });

    closeTreeModalBtn.addEventListener('click', () => {
        // Move lists back to main layout
        originalTreeContainer.appendChild(emptyState);
        originalTreeContainer.appendChild(fileList);
        treeModal.classList.add('hidden');
    });

    // Generate PDF Submit
    generatePdfBtn.addEventListener('click', async () => {
        if (selectedFiles.size === 0) return;

        // Loading state
        generatePdfBtn.disabled = true;
        generateText.textContent = "Generating...";
        generateSpinner.classList.remove('hidden');

        try {
            const filesArray = Array.from(selectedFiles);
            
            // Collect settings
            let finalPaper = settingPaper.value;
            let customW = settingPaperWidth.value.trim();
            let customH = settingPaperHeight.value.trim();
            
            const settings = {
                title: settingTitle.value.trim() || 'Code Export',
                theme: settingTheme.value,
                font: settingFont.value,
                size: settingSize.value,
                paper: finalPaper,
                customWidth: customW,
                customHeight: customH,
                linenos: settingLinenos.checked
            };
            
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filesArray, settings: settings })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate PDF');
            }

            // Handle file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'code_export.pdf';
            document.body.appendChild(a);
            a.click();
            
            // Cleanup UI
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            showError(error.message);
        } finally {
            // Revert loading state
            generatePdfBtn.disabled = false;
            generateText.textContent = "Generate & Download PDF";
            generateSpinner.classList.add('hidden');
        }
    });
});
