document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const extractBtn = document.getElementById('extractBtn');
    const extractBtnText = document.getElementById('extractBtnText');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const errorMessage = document.getElementById('errorMessage');
    const resultsArea = document.getElementById('resultsArea');
    const extractedText = document.getElementById('extractedText');
    const copyBtn = document.getElementById('copyBtn');
    const downloadTxtBtn = document.getElementById('downloadTxtBtn');
    const copyFeedback = document.getElementById('copyFeedback');
    const langSelect = document.getElementById('langSelect');

    let currentFile = null;
    let currentImageUrl = null;

    // Upload handlers
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#6366F1';
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '';
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
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
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }
        hideError();
        currentFile = file;
        fileName.textContent = file.name;

        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = URL.createObjectURL(file);
        previewImg.src = currentImageUrl;

        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        imagePreview.style.display = 'block';
        extractBtn.style.display = 'flex';
        resultsArea.style.display = 'none';
        progressSection.style.display = 'none';
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;

        dropzone.style.display = '';
        fileInfo.style.display = 'none';
        imagePreview.style.display = 'none';
        extractBtn.style.display = 'none';
        resultsArea.style.display = 'none';
        progressSection.style.display = 'none';
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // OCR Extraction
    extractBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        hideError();
        extractBtn.disabled = true;
        extractBtnText.textContent = 'Extracting...';
        progressSection.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Loading OCR engine...';
        resultsArea.style.display = 'none';

        const lang = langSelect.value;

        try {
            const worker = await Tesseract.createWorker(lang, 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const pct = Math.round(m.progress * 100);
                        progressFill.style.width = pct + '%';
                        progressText.textContent = 'Recognizing text... ' + pct + '%';
                    } else if (m.status === 'loading tesseract core') {
                        progressText.textContent = 'Loading OCR engine...';
                        progressFill.style.width = '10%';
                    } else if (m.status === 'initializing tesseract') {
                        progressText.textContent = 'Initializing OCR...';
                        progressFill.style.width = '20%';
                    } else if (m.status === 'loading language traineddata') {
                        progressText.textContent = 'Loading language data (' + lang + ')...';
                        progressFill.style.width = '30%';
                    } else if (m.status === 'initializing api') {
                        progressText.textContent = 'Preparing scanner...';
                        progressFill.style.width = '40%';
                    }
                }
            });

            const { data: { text } } = await worker.recognize(currentFile);
            await worker.terminate();

            if (text && text.trim().length > 0) {
                extractedText.value = text;
                resultsArea.style.display = 'block';
                progressSection.style.display = 'none';
                resultsArea.scrollIntoView({ behavior: 'smooth' });
            } else {
                showError('No text was found in this image. Make sure the image contains clear, high-contrast text.');
                progressSection.style.display = 'none';
            }
        } catch (err) {
            console.error(err);
            showError('OCR failed: ' + err.message);
            progressSection.style.display = 'none';
        } finally {
            extractBtn.disabled = false;
            extractBtnText.textContent = 'Extract Text';
        }
    });

    // Copy to Clipboard
    copyBtn.addEventListener('click', () => {
        const text = extractedText.value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyFeedback.style.display = 'block';
            setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            extractedText.select();
            document.execCommand('copy');
            copyFeedback.style.display = 'block';
            setTimeout(() => { copyFeedback.style.display = 'none'; }, 2000);
        });
    });

    // Download as TXT
    downloadTxtBtn.addEventListener('click', () => {
        const text = extractedText.value;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (currentFile ? currentFile.name.replace(/\.[^/.]+$/, '') : 'extracted') + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
