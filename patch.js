const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// Replace the Mode buttons and Event Listeners initialization
code = code.replace(/    \/\/ Mode buttons[\s\S]*?    \/\/ ===========================\n    \/\/ Mode Switching/g, `    // Mode buttons
    const modeBtns = document.querySelectorAll('.mode-btn');

    // ===========================
    // Event Listeners
    // ===========================

    // Mode switcher
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.getAttribute('data-mode')));
    });

    // Set default mode based on the active button, otherwise default to enc-to-jpg
    const activeBtn = document.querySelector('.mode-btn.active');
    if (activeBtn) {
        currentMode = activeBtn.getAttribute('data-mode');
    }

    // Click to upload
    if(uploadArea) {
        uploadArea.addEventListener('click', () => {
            if(fileInput) fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });
    }

    // File input change
    if(fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    }

    // Convert button
    if(convertBtn) convertBtn.addEventListener('click', convertFiles);

    // Download all button
    if(downloadAllBtn) downloadAllBtn.addEventListener('click', downloadAllAsZip);

    // ===========================
    // Mode Switching`);

// Replace switchMode
code = code.replace(/    function switchMode\(mode\) {[\s\S]*?    }\n\n    \/\/ ===========================\n    \/\/ File Handling Functions/g, `    function switchMode(mode) {
        currentMode = mode;
        selectedFiles = [];
        convertedImages = [];

        // Update UI
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });

        // Update specific text based on mode mapping
        if (mode === 'enc-to-jpg' || mode === 'enc-to-png') {
            if(fileInput) fileInput.setAttribute('accept', '.enc');
            if(uploadTitle) uploadTitle.textContent = 'Drag & Drop ENC files here';
            if(uploadInfo) uploadInfo.textContent = 'Supports .enc files from WhatsApp, S-63, CopySafe, and more';
            if(convertBtnText) convertBtnText.textContent = mode === 'enc-to-png' ? 'Convert to PNG' : 'Convert to JPG';
            if(passwordLabel) passwordLabel.textContent = 'Decryption Key/Password (if required):';
            if(passwordSection) passwordSection.style.display = 'none';
        } else if (mode === 'jpg-to-enc' || mode === 'png-to-enc') {
            if(fileInput) fileInput.setAttribute('accept', '.jpg,.jpeg,.png,image/*');
            if(uploadTitle) uploadTitle.textContent = 'Drag & Drop Images here';
            if(uploadInfo) uploadInfo.textContent = 'Supports JPG, PNG image formats';
            if(convertBtnText) convertBtnText.textContent = 'Convert to ENC';
            if(passwordLabel) passwordLabel.textContent = 'Encryption Password (required for security):';
            if(passwordSection) passwordSection.style.display = 'block';
        } else if (mode === 'compress-image') {
            if(fileInput) fileInput.setAttribute('accept', 'image/*');
            if(uploadTitle) uploadTitle.textContent = 'Drag & Drop images here';
            if(uploadInfo) uploadInfo.textContent = 'Local compression ensures zero data leaves your device';
            if(convertBtnText) convertBtnText.textContent = 'Compress Images';
            if(passwordLabel) passwordLabel.textContent = '';
            if(passwordSection) passwordSection.style.display = 'none';
        } else {
            // For HEIC, AVIF, WebP, etc.
            let fromType = mode.split('-to-')[0];
            let toType = mode.split('-to-')[1];
            if(fromType) fromType = fromType.toUpperCase();
            if(toType) toType = toType.toUpperCase();
            if(fileInput) fileInput.setAttribute('accept', \`.\${fromType.toLowerCase()},image/*\`);
            if(uploadTitle) uploadTitle.textContent = \`Drag & Drop \${fromType} files here\`;
            if(uploadInfo) uploadInfo.textContent = \`Convert \${fromType} to \${toType} securely on your device\`;
            if(convertBtnText) convertBtnText.textContent = \`Convert to \${toType}\`;
            if(passwordLabel) passwordLabel.textContent = '';
            if(passwordSection) passwordSection.style.display = 'none';
        }

        // Reset UI
        if(fileList) fileList.innerHTML = '';
        if(convertBtn) convertBtn.style.display = 'none';
        if(progressSection) progressSection.style.display = 'none';
        if(resultsSection) resultsSection.style.display = 'none';
    }

    // ===========================
    // File Handling Functions`);

// Replace handleFiles
code = code.replace(/    function handleFiles\(files\) {[\s\S]*?    function displayFileList\(\)/g, `    function handleFiles(files) {
        const fileArray = Array.from(files);

        fileArray.forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            if (currentMode === 'compress-image') {
                if (file.type.startsWith('image/')) {
                    selectedFiles.push(file);
                } else {
                    showNotification('Please select image files only', 'error');
                }
            } else if (currentMode && currentMode.startsWith('enc-')) {
                // Check for .enc files
                if (ext === 'enc' || file.type === '') {
                    selectedFiles.push(file);
                } else {
                    showNotification('Please select ENC files only', 'error');
                }
            } else if (currentMode && currentMode.endsWith('-enc')) {
                if (file.type.startsWith('image/') || ext.match(/(jpg|jpeg|png)$/)) {
                    selectedFiles.push(file);
                } else {
                    showNotification('Please select image files only', 'error');
                }
            } else {
                // Universal mode (heic-to-jpg, webp-to-png, etc)
                selectedFiles.push(file); // allow any image file for generic converter tools
            }
        });

        if (selectedFiles.length > 0) {
            displayFileList();
            if(convertBtn) convertBtn.style.display = 'inline-flex';
        }
    }

    function displayFileList()`);

// Replace convertFiles
code = code.replace(/    async function convertFiles\(\) {[\s\S]*?    async function compressImageLocally/g, `    async function convertFiles() {
        if(convertBtn) convertBtn.disabled = true;
        if(progressSection) progressSection.style.display = 'block';
        if(resultsSection) resultsSection.style.display = 'none';
        convertedImages = [];

        const password = encryptionKey ? encryptionKey.value : '';
        const totalFiles = selectedFiles.length;

        // Validate password for JPG to ENC mode
        if (currentMode && currentMode.endsWith('-enc') && !password) {
            showNotification('Please enter an encryption password', 'error');
            if(convertBtn) convertBtn.disabled = false;
            return;
        }

        for (let i = 0; i < totalFiles; i++) {
            const file = selectedFiles[i];
            const progress = ((i + 1) / totalFiles) * 100;

            if(progressFill) progressFill.style.width = \`\${progress}%\`;
            if(progressText) progressText.textContent = \`Converting \${i + 1} of \${totalFiles}...\`;

            try {
                let convertedData;
                let outputName;
                const toType = currentMode ? currentMode.split('-to-')[1] : null;

                if (currentMode === 'compress-image') {
                    const slider = document.getElementById('compressionSlider');
                    const quality = slider ? parseInt(slider.value) / 100 : 0.6;
                    convertedData = await compressImageLocally(file, quality);
                    outputName = file.name.replace(/\\.[^/.]+$/, "") + "-compressed.jpg";
                } else if (currentMode && currentMode.endsWith('-enc')) {
                    convertedData = await convertJpgToEnc(file, password);
                    outputName = file.name.replace(/\\.[^/.]+$/, ".enc");
                } else {
                    const formatSelect = document.getElementById('outputFormat');
                    let outputMimeType = 'image/jpeg';
                    if (toType === 'png' || (formatSelect && formatSelect.value === 'image/png')) {
                        outputMimeType = 'image/png';
                    }
                    const ext = outputMimeType === 'image/png' ? '.png' : '.jpg';
                    
                    if (file.name.toLowerCase().match(/\\.(heic|heif)$/)) {
                        if (typeof heic2any !== 'undefined') {
                            const convertedBlob = await heic2any({
                                blob: file,
                                toType: outputMimeType,
                                quality: outputMimeType === 'image/jpeg' ? 0.95 : undefined
                            });
                            convertedData = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                            outputName = file.name.replace(/\\.(heic|heif)$/i, ext);
                        } else {
                            throw new Error("HEIC conversion library is not loaded.");
                        }
                    } else {
                        convertedData = await convertEncToJpg(file, password, outputMimeType);
                        outputName = file.name.replace(/\\.[^/.]+$/, ext);
                    }
                }

                convertedImages.push({
                    name: outputName,
                    data: convertedData,
                    originalName: file.name,
                    isImage: currentMode && !currentMode.endsWith('-enc')
                });
            } catch (error) {
                console.error(\`Error converting \${file.name}:\`, error);
                showNotification(\`Failed to convert \${file.name}\`, 'error');
            }

            await new Promise(resolve => setTimeout(resolve, 300));
        }

        if(progressFill) progressFill.style.width = '100%';
        if(progressText) progressText.textContent = 'Conversion complete!';

        setTimeout(() => {
            displayResults();
            if(convertBtn) convertBtn.disabled = false;
        }, 500);
    }

    async function compressImageLocally`);

fs.writeFileSync('script.js', code);
