document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const decryptBtn = document.getElementById('decryptBtn');
    const decryptionKey = document.getElementById('decryptionKey');
    const errorMessage = document.getElementById('errorMessage');
    const resultsArea = document.getElementById('resultsArea');
    const previewTab = document.getElementById('previewTab');
    const downloadTab = document.getElementById('downloadTab');
    const decryptedTextPreview = document.getElementById('decryptedTextPreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let currentFile = null;
    let decryptedDataBlob = null;
    let decryptedDataName = null;

    // Tabs logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            document.getElementById(target + 'Tab').classList.add('active');
        });
    });

    // File Selection
    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#2563eb';
        dropzone.style.backgroundColor = '#eff6ff';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#cbd5e1';
        dropzone.style.backgroundColor = '#f8fafc';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#cbd5e1';
        dropzone.style.backgroundColor = '#f8fafc';
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.enc')) {
            showError('Please select a valid .enc file.');
            return;
        }
        hideError();
        currentFile = file;
        fileName.textContent = file.name;
        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        fileInfo.style.justifyContent = 'space-between';
        fileInfo.style.alignItems = 'center';
        fileInfo.style.padding = '15px';
        fileInfo.style.background = '#f1f5f9';
        fileInfo.style.borderRadius = '8px';
        decryptBtn.disabled = false;
        resultsArea.style.display = 'none';
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        dropzone.style.display = 'flex';
        fileInfo.style.display = 'none';
        decryptBtn.disabled = true;
        resultsArea.style.display = 'none';
        decryptedDataBlob = null;
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Decryption Logic
    decryptBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        hideError();
        decryptBtn.textContent = 'Decrypting...';
        decryptBtn.disabled = true;

        try {
            const password = decryptionKey.value;
            const arrayBuffer = await currentFile.arrayBuffer();
            let data = new Uint8Array(arrayBuffer);

            // Attempt decryption
            let decryptedData = data;
            
            // Method 1: XOR
            if (password) {
                const key = new TextEncoder().encode(password);
                decryptedData = new Uint8Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    decryptedData[i] = data[i] ^ key[i % key.length];
                }
            } else {
                // Method 2: Header removal heuristics (JPEG)
                const jpegSig = [0xFF, 0xD8, 0xFF];
                let found = false;
                for (let i = 0; i < Math.min(data.length - 3, 1000); i++) {
                    if (data[i] === jpegSig[0] && data[i + 1] === jpegSig[1] && data[i + 2] === jpegSig[2]) {
                        decryptedData = data.slice(i);
                        found = true;
                        break;
                    }
                }
                if(!found) {
                    // Try PDF signature
                    const pdfSig = [0x25, 0x50, 0x44, 0x46]; // %PDF
                    for (let i = 0; i < Math.min(data.length - 4, 1000); i++) {
                        if (data[i] === pdfSig[0] && data[i + 1] === pdfSig[1] && data[i + 2] === pdfSig[2] && data[i + 3] === pdfSig[3]) {
                            decryptedData = data.slice(i);
                            break;
                        }
                    }
                }
            }

            // Figure out file type
            let isText = true;
            for(let i=0; i<Math.min(decryptedData.length, 100); i++) {
                if(decryptedData[i] === 0) {
                    isText = false;
                    break;
                }
            }

            // Clean up old preview if exists
            const oldImg = previewTab.querySelector('img');
            if(oldImg) oldImg.remove();
            const oldPdf = previewTab.querySelector('iframe');
            if(oldPdf) oldPdf.remove();
            const oldMsg = previewTab.querySelector('p.unknown-msg');
            if(oldMsg) oldMsg.remove();

            function finishDecryption() {
                resultsArea.style.display = 'block';
                resultsArea.scrollIntoView({ behavior: 'smooth' });
                decryptBtn.textContent = 'View / Decrypt File';
                decryptBtn.disabled = false;
            }

            if (isText) {
                const text = new TextDecoder().decode(decryptedData);
                decryptedTextPreview.value = text;
                decryptedTextPreview.style.display = 'block';
                decryptedDataBlob = new Blob([decryptedData], { type: 'text/plain' });
                decryptedDataName = currentFile.name.replace(/\.enc$/i, '.txt');
                finishDecryption();
            } else {
                decryptedTextPreview.style.display = 'none';
                
                // Try to load as an image first
                const testBlob = new Blob([decryptedData]);
                const testUrl = URL.createObjectURL(testBlob);
                const img = new Image();
                img.onload = () => {
                    // It's a valid image! Render it to canvas to export as pure JPG
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        decryptedDataBlob = blob;
                        decryptedDataName = currentFile.name.replace(/\.enc$/i, '.jpg');
                        
                        const displayImg = document.createElement('img');
                        displayImg.src = URL.createObjectURL(blob);
                        displayImg.style.maxWidth = '100%';
                        displayImg.style.borderRadius = '8px';
                        displayImg.style.marginTop = '15px';
                        previewTab.appendChild(displayImg);
                        
                        finishDecryption();
                    }, 'image/jpeg', 0.95);
                };
                
                img.onerror = () => {
                    // Not an image, check if PDF
                    if (decryptedData[0] === 0x25 && decryptedData[1] === 0x50 && decryptedData[2] === 0x44 && decryptedData[3] === 0x46) {
                        decryptedDataBlob = new Blob([decryptedData], { type: 'application/pdf' });
                        decryptedDataName = currentFile.name.replace(/\.enc$/i, '.pdf');
                        
                        const iframe = document.createElement('iframe');
                        iframe.src = URL.createObjectURL(decryptedDataBlob);
                        iframe.style.width = '100%';
                        iframe.style.height = '500px';
                        iframe.style.border = 'none';
                        iframe.style.marginTop = '15px';
                        previewTab.appendChild(iframe);
                    } else {
                        // Unknown binary
                        decryptedDataBlob = new Blob([decryptedData], { type: 'application/octet-stream' });
                        decryptedDataName = currentFile.name.replace(/\.enc$/i, '.bin');
                        
                        const msg = document.createElement('p');
                        msg.className = 'unknown-msg';
                        msg.textContent = "Binary file decrypted. Preview not available for this file type. Please download to view.";
                        msg.style.padding = "20px";
                        msg.style.textAlign = "center";
                        msg.style.color = "var(--text-secondary)";
                        previewTab.appendChild(msg);
                    }
                    finishDecryption();
                };
                
                img.src = testUrl;
                return; // Wait for onload/onerror to call finishDecryption()
            }
        } catch (error) {
            showError('Decryption failed: ' + error.message);
            decryptBtn.textContent = 'View / Decrypt File';
            decryptBtn.disabled = false;
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!decryptedDataBlob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(decryptedDataBlob);
        a.download = decryptedDataName || 'decrypted_file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
