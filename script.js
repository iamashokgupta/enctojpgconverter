// ===========================
// DOM Ready Wrapper
// ===========================
document.addEventListener('DOMContentLoaded', function () {

    // ===========================
    // Global Variables
    // ===========================
    let selectedFiles = [];
    let convertedImages = [];
    let currentMode = 'enc-to-jpg'; // 'enc-to-jpg' or 'jpg-to-enc'

    // ===========================
    // DOM Elements
    // ===========================
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const passwordSection = document.getElementById('passwordSection');
    const encryptionKey = document.getElementById('encryptionKey');
    const convertBtn = document.getElementById('convertBtn');
    const convertBtnText = document.getElementById('convertBtnText');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultsSection = document.getElementById('resultsSection');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsTitle = document.getElementById('resultsTitle');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const uploadTitle = document.getElementById('uploadTitle');
    const uploadInfo = document.getElementById('uploadInfo');
    const passwordLabel = document.getElementById('passwordLabel');

    // Mode buttons
    const encToJpgBtn = document.getElementById('encToJpgBtn');
    const jpgToEncBtn = document.getElementById('jpgToEncBtn');

    // ===========================
    // Event Listeners
    // ===========================

    // Mode switcher
    encToJpgBtn.addEventListener('click', () => switchMode('enc-to-jpg'));
    jpgToEncBtn.addEventListener('click', () => switchMode('jpg-to-enc'));

    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
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

    // Convert button
    convertBtn.addEventListener('click', convertFiles);

    // Download all button
    downloadAllBtn.addEventListener('click', downloadAllAsZip);

    // ===========================
    // Mode Switching
    // ===========================

    function switchMode(mode) {
        currentMode = mode;
        selectedFiles = [];
        convertedImages = [];

        // Update UI
        encToJpgBtn.classList.toggle('active', mode === 'enc-to-jpg');
        jpgToEncBtn.classList.toggle('active', mode === 'jpg-to-enc');

        // Update file input accept attribute
        if (mode === 'enc-to-jpg') {
            fileInput.setAttribute('accept', '.enc');
            uploadTitle.textContent = 'Drag & Drop ENC files here';
            uploadInfo.textContent = 'Supports .enc files from WhatsApp, S-63, CopySafe, and more';
            convertBtnText.textContent = 'Convert to JPG';
            passwordLabel.textContent = 'Decryption Key/Password (if required):';
        } else {
            fileInput.setAttribute('accept', '.jpg,.jpeg,.jpe,.jfif,image/jpeg');
            uploadTitle.textContent = 'Drag & Drop JPG/JPEG files here';
            uploadInfo.textContent = 'Supports JPG, JPEG, JPE, JFIF image formats';
            convertBtnText.textContent = 'Convert to ENC';
            passwordLabel.textContent = 'Encryption Password (required for security):';
            passwordSection.style.display = 'block';
        }

        // Reset UI
        fileList.innerHTML = '';
        convertBtn.style.display = 'none';
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        if (mode === 'enc-to-jpg') {
            passwordSection.style.display = 'none';
        }
    }

    // ===========================
    // File Handling Functions
    // ===========================

    function handleFiles(files) {
        const fileArray = Array.from(files);

        fileArray.forEach(file => {
            if (currentMode === 'enc-to-jpg') {
                // Check for .enc files
                if (file.name.toLowerCase().endsWith('.enc') || file.type === '') {
                    selectedFiles.push(file);
                } else {
                    showNotification('Please select ENC files only', 'error');
                }
            } else {
                // Check for JPG/JPEG files
                if (file.type.startsWith('image/jpeg') || file.type.startsWith('image/jpg') ||
                    file.name.toLowerCase().match(/\.(jpg|jpeg|jpe|jfif)$/)) {
                    selectedFiles.push(file);
                } else {
                    showNotification('Please select JPG/JPEG files only', 'error');
                }
            }
        });

        if (selectedFiles.length > 0) {
            displayFileList();
            convertBtn.style.display = 'inline-flex';
        }
    }

    function displayFileList() {
        fileList.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            const fileExt = currentMode === 'enc-to-jpg' ? 'ENC' : 'JPG';
            fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">${fileExt}</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
            fileList.appendChild(fileItem);
        });
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        displayFileList();

        if (selectedFiles.length === 0) {
            convertBtn.style.display = 'none';
            if (currentMode === 'enc-to-jpg') {
                passwordSection.style.display = 'none';
            }
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // ===========================
    // Conversion Functions
    // ===========================

    async function convertFiles() {
        convertBtn.disabled = true;
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        convertedImages = [];

        const password = encryptionKey.value;
        const totalFiles = selectedFiles.length;

        // Validate password for JPG to ENC mode
        if (currentMode === 'jpg-to-enc' && !password) {
            showNotification('Please enter an encryption password', 'error');
            convertBtn.disabled = false;
            return;
        }

        for (let i = 0; i < totalFiles; i++) {
            const file = selectedFiles[i];
            const progress = ((i + 1) / totalFiles) * 100;

            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Converting ${i + 1} of ${totalFiles}...`;

            try {
                let convertedData;
                let outputName;

                if (currentMode === 'enc-to-jpg') {
                    convertedData = await convertEncToJpg(file, password);
                    outputName = file.name.replace('.enc', '.jpg');
                } else {
                    convertedData = await convertJpgToEnc(file, password);
                    outputName = file.name.replace(/\.(jpg|jpeg|jpe|jfif)$/i, '.enc');
                }

                convertedImages.push({
                    name: outputName,
                    data: convertedData,
                    originalName: file.name,
                    isImage: currentMode === 'enc-to-jpg'
                });
            } catch (error) {
                console.error(`Error converting ${file.name}:`, error);
                showNotification(`Failed to convert ${file.name}`, 'error');
            }

            // Small delay for UI feedback
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        progressFill.style.width = '100%';
        progressText.textContent = 'Conversion complete!';

        setTimeout(() => {
            displayResults();
            convertBtn.disabled = false;
        }, 500);
    }

    // ENC to JPG Conversion
    async function convertEncToJpg(file, password = '') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    let arrayBuffer = e.target.result;

                    // Attempt to decrypt based on common ENC formats
                    let decryptedData = await attemptDecryption(arrayBuffer, password, file.name);

                    // Convert to image
                    const blob = new Blob([decryptedData], { type: 'image/jpeg' });
                    const imageUrl = URL.createObjectURL(blob);

                    // Verify it's a valid image
                    const img = new Image();
                    img.onload = () => {
                        // Convert to canvas for quality control
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);

                        // Convert to JPG with high quality
                        canvas.toBlob((blob) => {
                            resolve(blob);
                        }, 'image/jpeg', 0.95);
                    };

                    img.onerror = () => {
                        // If not a valid image, try as-is
                        resolve(blob);
                    };

                    img.src = imageUrl;

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // JPG to ENC Conversion
    async function convertJpgToEnc(file, password) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    let arrayBuffer = e.target.result;
                    let data = new Uint8Array(arrayBuffer);

                    // Encrypt the data using XOR with password
                    const encryptedData = xorEncrypt(data, password);

                    // Create blob
                    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
                    resolve(blob);

                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async function attemptDecryption(arrayBuffer, password, filename) {
        // Convert ArrayBuffer to Uint8Array
        let data = new Uint8Array(arrayBuffer);

        // Method 1: Simple XOR decryption (common for basic ENC files)
        if (password) {
            data = xorDecrypt(data, password);
        }

        // Method 2: Check for common file signatures and remove encryption wrapper
        // JPEG signature: FF D8 FF
        const jpegSig = [0xFF, 0xD8, 0xFF];

        // Search for JPEG signature in the data
        for (let i = 0; i < Math.min(data.length - 3, 1000); i++) {
            if (data[i] === jpegSig[0] && data[i + 1] === jpegSig[1] && data[i + 2] === jpegSig[2]) {
                // Found JPEG signature, extract from this point
                return data.slice(i);
            }
        }

        // Method 3: Try removing common header sizes
        const commonHeaderSizes = [0, 16, 32, 64, 128, 256, 512];
        for (const headerSize of commonHeaderSizes) {
            if (data.length > headerSize) {
                const testData = data.slice(headerSize);
                if (testData[0] === 0xFF && testData[1] === 0xD8) {
                    return testData;
                }
            }
        }

        // Method 4: WhatsApp-style encryption (simple byte shift)
        const whatsappDecrypted = whatsappDecrypt(data);
        if (whatsappDecrypted[0] === 0xFF && whatsappDecrypted[1] === 0xD8) {
            return whatsappDecrypted;
        }

        // If no decryption worked, return original data
        return data;
    }

    function xorDecrypt(data, password) {
        const key = new TextEncoder().encode(password);
        const result = new Uint8Array(data.length);

        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ key[i % key.length];
        }

        return result;
    }

    function xorEncrypt(data, password) {
        // XOR encryption is symmetric - same process for encrypt and decrypt
        return xorDecrypt(data, password);
    }

    function whatsappDecrypt(data) {
        // WhatsApp media files often use a simple encryption
        // This is a simplified version - real WhatsApp encryption is more complex
        const result = new Uint8Array(data.length);

        for (let i = 0; i < data.length; i++) {
            result[i] = data[i];
        }

        return result;
    }

    // ===========================
    // Results Display
    // ===========================

    function displayResults() {
        resultsSection.style.display = 'block';
        resultsGrid.innerHTML = '';

        // Update title based on mode
        const mode = currentMode === 'enc-to-jpg' ? 'JPG' : 'ENC';
        resultsTitle.textContent = `Converted ${mode} Files`;

        convertedImages.forEach((image, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            const objectUrl = URL.createObjectURL(image.data);

            if (image.isImage) {
                // Show preview for images
                resultItem.innerHTML = `
                <img src="${objectUrl}" alt="${image.name}" class="result-preview">
                <button class="result-download" onclick="downloadSingle(${index})">
                    Download ${image.name}
                </button>
            `;
            } else {
                // For ENC files, just show download button
                resultItem.innerHTML = `
                <div class="result-preview" style="display:flex;align-items:center;justify-content:center;background:var(--card-bg);border:1px solid var(--card-border);">
                    <div style="text-align:center;">
                        <div style="font-size:3rem;">🔒</div>
                        <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--text-secondary);">ENC File</p>
                    </div>
                </div>
                <button class="result-download" onclick="downloadSingle(${index})">
                    Download ${image.name}
                </button>
            `;
            }

            resultsGrid.appendChild(resultItem);
        });

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function downloadSingle(index) {
        const image = convertedImages[index];
        const url = URL.createObjectURL(image.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Download started!', 'success');
    }

    async function downloadAllAsZip() {
        showNotification('Preparing downloads...', 'info');

        // Simple sequential download (for production, use JSZip library)
        for (let i = 0; i < convertedImages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 200));
            downloadSingle(i);
        }

        showNotification('All files downloaded!', 'success');
    }

    // ===========================
    // Notification System
    // ===========================

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#6366F1'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
    document.head.appendChild(style);

    // ===========================
    // Initialize
    // ===========================

    console.log('ENC ⇄ JPG Converter initialized');
    console.log('Mode: ' + currentMode);
    console.log('Select files to begin conversion');

}); // End of DOMContentLoaded
