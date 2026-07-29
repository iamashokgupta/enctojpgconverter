document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    const workspace = document.getElementById('workspace');
    const htmlCodeEditor = document.getElementById('htmlCodeEditor');
    const htmlPreview = document.getElementById('htmlPreview');
    
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const downloadImgBtn = document.getElementById('downloadImgBtn');

    let currentFileName = 'document';
    let updateTimeout;

    // Load file handlers
    browseBtn.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
    });
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#2563eb';
    });
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#cbd5e1';
    });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#cbd5e1';
        if (e.dataTransfer.files.length > 0) {
            handleHtmlFile(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleHtmlFile(e.target.files[0]);
        }
    });

    function handleHtmlFile(file) {
        if (!file.name.toLowerCase().match(/\.(html|htm)$/i) && file.type !== 'text/html') {
            showError('Please select a valid HTML file (.html or .htm).');
            return;
        }
        hideError();
        
        currentFileName = file.name.replace(/\.[^/.]+$/, "");
        fileName.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            htmlCodeEditor.value = content;
            
            dropzone.style.display = 'none';
            fileInfo.style.display = 'flex';
            workspace.style.display = 'grid';
            
            updatePreview();
        };
        reader.onerror = function() {
            showError('Failed to read the file.');
        };
        reader.readAsText(file);
    }

    // Live update preview
    htmlCodeEditor.addEventListener('input', () => {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updatePreview, 500); // 500ms debounce
    });

    function updatePreview() {
        const code = htmlCodeEditor.value;
        const iframeDoc = htmlPreview.contentDocument || htmlPreview.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(code);
        iframeDoc.close();
    }

    removeFileBtn.addEventListener('click', () => {
        fileInput.value = '';
        htmlCodeEditor.value = '';
        const iframeDoc = htmlPreview.contentDocument || htmlPreview.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write('');
        iframeDoc.close();
        
        dropzone.style.display = 'flex';
        fileInfo.style.display = 'none';
        workspace.style.display = 'none';
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Export functions
    async function captureIframe() {
        // html2canvas requires the iframe content body
        const iframeBody = htmlPreview.contentDocument.body;
        // Temporarily adjust height if it's scrollable to capture everything
        const origHeight = iframeBody.style.height;
        const origOverflow = iframeBody.style.overflow;
        
        // Wait for images to load ideally, but we'll just try to capture immediately
        return await html2canvas(iframeBody, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
        });
    }

    downloadImgBtn.addEventListener('click', async () => {
        try {
            downloadImgBtn.textContent = 'Processing...';
            downloadImgBtn.disabled = true;
            
            const canvas = await captureIframe();
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            const a = document.createElement('a');
            a.href = imgData;
            a.download = currentFileName + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            showError('Failed to generate image. The HTML might contain cross-origin restricted content.');
        } finally {
            downloadImgBtn.textContent = 'Download as JPG';
            downloadImgBtn.disabled = false;
        }
    });

    downloadPdfBtn.addEventListener('click', async () => {
        try {
            downloadPdfBtn.textContent = 'Processing...';
            downloadPdfBtn.disabled = true;
            
            const canvas = await captureIframe();
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Calculate PDF dimensions (A4 size ratio)
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(currentFileName + '.pdf');
            
        } catch (error) {
            console.error(error);
            showError('Failed to generate PDF. The HTML might contain cross-origin restricted content.');
        } finally {
            downloadPdfBtn.textContent = 'Download as PDF';
            downloadPdfBtn.disabled = false;
        }
    });
});
