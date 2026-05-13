/**
 * ENC to PDF Converter - Client-side Logic
 * Handles file reading, simulated decryption, maritime chart mapping, and jsPDF integration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const fileTypeRadios = document.querySelectorAll('input[name="fileType"]');
    const passwordSection = document.getElementById('passwordSection');
    
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileNameDisplay = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const passwordInput = document.getElementById('decryptionKey');
    const convertBtn = document.getElementById('convertBtn');
    const convertBtnText = document.getElementById('convertBtnText');
    const errorMessage = document.getElementById('errorMessage');
    
    const chartCanvas = document.getElementById('chartCanvas');

    // UI elements to toggle visibility
    const uploadIcon = dropzone.querySelector('.upload-icon');
    const uploadTitle = dropzone.querySelector('.upload-title');
    const uploadSubtitle = dropzone.querySelector('.upload-subtitle');

    // === Application State ===
    let currentFile = null;
    let currentFileType = 'standard'; // 'standard' or 'maritime'

    // --- 0. UI Toggle Logic ---

    fileTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentFileType = e.target.value;
            if (currentFileType === 'maritime') {
                passwordSection.style.display = 'none';
                // Trigger form check (maritime doesn't need password)
                checkFormValidity();
            } else {
                passwordSection.style.display = 'block';
                checkFormValidity();
            }
        });
    });

    // --- 1. Drag and Drop Handling ---

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

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

    dropzone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            
            if (!file.name.toLowerCase().endsWith('.enc')) {
                showError("Please select a valid .enc file.");
                return;
            }
            
            currentFile = file;
            fileNameDisplay.textContent = file.name;
            
            uploadIcon.style.display = 'none';
            uploadTitle.style.display = 'none';
            uploadSubtitle.style.display = 'none';
            fileInfo.style.display = 'flex';
            
            hideError();
            checkFormValidity();
        }
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = ''; 
        
        uploadIcon.style.display = 'block';
        uploadTitle.style.display = 'block';
        uploadSubtitle.style.display = 'block';
        fileInfo.style.display = 'none';
        
        convertBtn.disabled = true;
    });

    // --- 2. Input Validation ---

    passwordInput.addEventListener('input', checkFormValidity);

    function checkFormValidity() {
        if (!currentFile) {
            convertBtn.disabled = true;
            return;
        }

        if (currentFileType === 'standard') {
            // Require password for standard
            if (passwordInput.value.trim() !== '') {
                convertBtn.disabled = false;
            } else {
                convertBtn.disabled = true;
            }
        } else {
            // Maritime doesn't need password
            convertBtn.disabled = false;
        }
    }

    // --- 3. Core Conversion & Routing Logic ---

    convertBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        convertBtnText.textContent = 'Processing...';
        convertBtn.disabled = true;
        hideError();

        try {
            if (currentFileType === 'standard') {
                await processStandardEnc();
            } else {
                await processMaritimeEnc();
            }
        } catch (error) {
            console.error("Conversion failed:", error);
            showError("Conversion failed: " + error.message);
        } finally {
            convertBtnText.textContent = 'Convert to PDF';
            convertBtn.disabled = false;
        }
    });

    // === STANDARD ENC LOGIC ===
    async function processStandardEnc() {
        const password = passwordInput.value;
        if (!password) throw new Error("Password is required for standard encrypted data.");

        // Read file
        const arrayBuffer = await readFileAsArrayBuffer(currentFile);
        
        try {
            // Simulated Decryption (Web Crypto API logic here as needed)
            const decryptedData = await decryptData(arrayBuffer, password);
            
            // Convert to text
            const text = new TextDecoder().decode(decryptedData);
            
            if (!isPrintableText(text)) {
                throw new Error("Decrypted data is not printable text. Cannot generate PDF.");
            }

            // Generate PDF using jsPDF
            generateTextPDF(text, currentFile.name.replace('.enc', '.pdf'));
            
        } catch (e) {
            throw new Error("Decryption failed. Invalid password or format unsupported.");
        }
    }

    // === MARITIME CHART LOGIC ===
    async function processMaritimeEnc() {
        // Read the file structure
        const arrayBuffer = await readFileAsArrayBuffer(currentFile);
        
        // 1. Placeholder logic: Parse S-57 / Maritime vector data 
        // 2. Render to an HTML5 Canvas
        renderMaritimeToCanvas(chartCanvas);

        // 3. Capture Canvas and create PDF
        generateCanvasPDF(chartCanvas, currentFile.name.replace('.enc', '.pdf'));
    }

    // --- 4. Web Crypto Implementation (Standard) ---
    async function decryptData(encryptedBuffer, password) {
        // Standard AES-GCM decryption simulation
        if (encryptedBuffer.byteLength < 12) {
            throw new Error("File too small.");
        }
        const iv = encryptedBuffer.slice(0, 12);
        const data = encryptedBuffer.slice(12);

        const encoder = new TextEncoder();
        const keyHash = await crypto.subtle.digest("SHA-256", encoder.encode(password));
        
        const cryptoKey = await crypto.subtle.importKey(
            "raw", keyHash, { name: "AES-GCM" }, false, ["decrypt"]
        );

        return await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            cryptoKey,
            data
        );
    }

    // --- 5. PDF Generation via jsPDF ---
    function generateTextPDF(text, filename) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Split text to fit page width
        const lines = doc.splitTextToSize(text, 180);
        
        let yOffset = 10;
        const pageHeight = doc.internal.pageSize.height;
        
        // Add title
        doc.setFontSize(16);
        doc.text("Decrypted ENC File Content", 10, yOffset);
        yOffset += 10;
        
        doc.setFontSize(10);
        for(let i=0; i<lines.length; i++){
            if(yOffset > pageHeight - 10) {
                doc.addPage();
                yOffset = 10;
            }
            doc.text(lines[i], 10, yOffset);
            yOffset += 5;
        }

        doc.save(filename);
    }

    function generateCanvasPDF(canvas, filename) {
        const { jsPDF } = window.jspdf;
        // A4 landscape for charts
        const doc = new jsPDF('landscape');
        
        // Get image data
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Fit to page
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        doc.save(filename);
    }

    // --- 6. Helper Functions ---
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    function isPrintableText(str) {
        if (!str || str.length === 0) return true;
        let nonPrintableCount = 0;
        const limit = Math.min(str.length, 1000); 
        for (let i = 0; i < limit; i++) {
            const charCode = str.charCodeAt(i);
            if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
                nonPrintableCount++;
            }
        }
        return (nonPrintableCount / limit) < 0.1;
    }

    function renderMaritimeToCanvas(canvas) {
        // Placeholder simulation for parsing vector data to canvas
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');
        
        // Fill ocean background
        ctx.fillStyle = "#A3C1E0"; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw some "landmasses"
        ctx.fillStyle = "#E4DDA3";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(300, 50);
        ctx.lineTo(400, 200);
        ctx.lineTo(200, 400);
        ctx.lineTo(0, 300);
        ctx.fill();

        // Draw "depth contours"
        ctx.strokeStyle = "#4B82B5";
        ctx.beginPath();
        ctx.moveTo(350, 100);
        ctx.bezierCurveTo(400, 150, 500, 100, 600, 200);
        ctx.stroke();

        // Text label
        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText("Simulated Maritime Chart (S-57)", 50, 50);
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

});
