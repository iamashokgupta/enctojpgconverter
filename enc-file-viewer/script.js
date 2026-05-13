/**
 * ENC File Viewer Online - Client-side Logic
 * Handles drag-and-drop, file reading, and decryption simulation using the native Web Crypto API.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameDisplay = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const passwordInput = document.getElementById('decryptionKey');
    const decryptBtn = document.getElementById('decryptBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    const resultsArea = document.getElementById('resultsArea');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const textPreview = document.getElementById('decryptedTextPreview');
    const downloadBtn = document.getElementById('downloadBtn');

    // Hide icon/text inside dropzone when a file is selected
    const uploadIcon = dropzone.querySelector('.upload-icon');
    const uploadTitle = dropzone.querySelector('.upload-title');
    const uploadSubtitle = dropzone.querySelector('.upload-subtitle');

    // === Application State ===
    let currentFile = null;
    let decryptedBlob = null;

    // --- 1. Drag and Drop Handling ---

    // Prevent default drag behaviors to avoid opening the file in the browser
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight dropzone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    });

    // Browse button click triggers hidden file input
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Process the selected file
    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            // Basic validation to enforce .enc files
            if (!file.name.toLowerCase().endsWith('.enc')) {
                showError("Please select a valid .enc file.");
                return;
            }
            
            currentFile = file;
            fileNameDisplay.textContent = file.name;
            
            // Toggle visibility
            uploadIcon.style.display = 'none';
            uploadTitle.style.display = 'none';
            uploadSubtitle.style.display = 'none';
            fileInfo.style.display = 'flex';
            
            hideError();
            checkFormValidity();
        }
    }

    // Remove selected file and reset UI
    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = ''; 
        
        // Toggle visibility back
        uploadIcon.style.display = 'block';
        uploadTitle.style.display = 'block';
        uploadSubtitle.style.display = 'block';
        fileInfo.style.display = 'none';
        
        resultsArea.style.display = 'none';
        decryptBtn.disabled = true;
    });

    // --- 2. Input Validation ---

    passwordInput.addEventListener('input', checkFormValidity);

    function checkFormValidity() {
        // Only enable the decrypt button if a file is present and password is typed
        if (currentFile && passwordInput.value.trim() !== '') {
            decryptBtn.disabled = false;
        } else {
            decryptBtn.disabled = true;
        }
    }

    // --- 3. Primary Decryption Logic ---

    decryptBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        if (!currentFile || !password) return;

        const originalBtnText = document.getElementById('convertBtnText').textContent;
        document.getElementById('convertBtnText').textContent = 'Decrypting...';
        decryptBtn.disabled = true;
        hideError();
        resultsArea.style.display = 'none';

        try {
            // Read file into memory via FileReader API
            const arrayBuffer = await readFileAsArrayBuffer(currentFile);
            
            // Execute decryption logic
            const decryptedData = await decryptData(arrayBuffer, password);
            
            // Pack decrypted ArrayBuffer into a Blob for download/reading
            decryptedBlob = new Blob([decryptedData]);
            
            // Try reading blob as UTF-8 text to populate the preview
            try {
                const text = await readFileAsText(decryptedBlob);
                
                // Heuristic: Check if the text is human readable or just binary junk
                if (isPrintableText(text)) {
                    textPreview.value = text;
                    switchTab('preview');
                } else {
                    switchTab('download');
                    textPreview.value = "Binary data cannot be previewed. Please navigate to the 'Download File' tab.";
                }
            } catch(e) {
                switchTab('download');
                textPreview.value = "Preview unavailable. Please navigate to the 'Download File' tab.";
            }

            resultsArea.style.display = 'block';
            
        } catch (error) {
            console.error("Decryption failed:", error);
            showError("Decryption failed. Please check your password or ensure this file uses a compatible AES-GCM encryption format.");
        } finally {
            document.getElementById('convertBtnText').textContent = 'View / Decrypt File';
            decryptBtn.disabled = false;
        }
    });

    // --- 4. Native Web Crypto API Implementation ---
    // Note: This implements standard AES-GCM decryption assuming a file structure of [12 bytes IV] + [Ciphertext]
    // Proprietary .enc formats may require custom salt logic/key derivations.

    async function decryptData(encryptedBuffer, password) {
        if (encryptedBuffer.byteLength < 12) {
            throw new Error("File too small to contain valid encrypted data.");
        }

        // Extract the Initialization Vector (first 12 bytes standard for AES-GCM)
        const iv = encryptedBuffer.slice(0, 12);
        // The remainder is the encrypted data payload
        const data = encryptedBuffer.slice(12);

        const encoder = new TextEncoder();
        
        // Key Derivation: In this implementation we derive a 256-bit key from the password
        // using SHA-256 for demonstration purposes. (PBKDF2 is recommended for production if a salt is embedded).
        const keyHash = await crypto.subtle.digest("SHA-256", encoder.encode(password));
        
        // Import raw key into Web Crypto AES-GCM format
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyHash,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        // Perform the decryption purely client-side
        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: new Uint8Array(iv)
            },
            cryptoKey,
            data
        );

        return decryptedContent;
    }

    // --- 5. Helper Functions ---

    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    function readFileAsText(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(blob);
        });
    }

    // Evaluates string to check if it's readable text (less than 10% non-printable characters)
    function isPrintableText(str) {
        if (!str || str.length === 0) return true;
        let nonPrintableCount = 0;
        const limit = Math.min(str.length, 1000); // Check only the first 1000 chars for efficiency
        
        for (let i = 0; i < limit; i++) {
            const charCode = str.charCodeAt(i);
            // Count characters outside the printable ascii range (ignoring tabs/newlines)
            if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
                nonPrintableCount++;
            }
        }
        return (nonPrintableCount / limit) < 0.1;
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // --- 6. Tab & Download Handling ---

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    function switchTab(tabId) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            if(btn.dataset.tab === tabId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        
        // Update visible content containers
        tabContents.forEach(content => {
            if(content.id === `${tabId}Tab`) content.classList.add('active');
            else content.classList.remove('active');
        });
    }

    // Generate local download URL without server interaction
    downloadBtn.addEventListener('click', () => {
        if (!decryptedBlob || !currentFile) return;
        
        // Remove .enc extension, or fall back to generic name
        let newName = currentFile.name.replace(/\.enc$/i, '');
        if (newName === currentFile.name) newName = "decrypted_file.bin";

        const url = URL.createObjectURL(decryptedBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = newName;
        document.body.appendChild(anchor);
        anchor.click();
        
        // Garbage collection cleanup
        setTimeout(() => {
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        }, 100);
    });

});
