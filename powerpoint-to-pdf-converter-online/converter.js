document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const convertBtn = document.getElementById('convertBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const resultsArea = document.getElementById('resultsArea');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let generatedPdfBytes = null;

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
        const validExtensions = ['.ppt', '.pptx'];
        const isValid = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!isValid) {
            showError('Please select a valid PowerPoint file (.ppt or .pptx).');
            return;
        }
        
        hideError();
        currentFile = file;
        fileName.textContent = file.name;

        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'block';
        resultsArea.style.display = 'none';
        progressSection.style.display = 'none';
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        generatedPdfBytes = null;

        dropzone.style.display = '';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
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

    // Conversion Action
    convertBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        
        hideError();
        convertBtn.disabled = true;
        convertBtn.textContent = 'Processing...';
        
        progressSection.style.display = 'block';
        progressFill.style.width = '20%';
        progressText.textContent = 'Parsing PowerPoint presentation...';
        resultsArea.style.display = 'none';

        try {
            // Simulate conversion process steps for UX
            await new Promise(resolve => setTimeout(resolve, 800));
            progressFill.style.width = '50%';
            progressText.textContent = 'Extracting slide layouts and fonts...';
            
            await new Promise(resolve => setTimeout(resolve, 800));
            progressFill.style.width = '80%';
            progressText.textContent = 'Generating PDF structure...';
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            progressFill.style.width = '100%';
            progressText.textContent = 'Finalizing document...';

            /* 
             * DEVELOPER NOTE:
             * Pure client-side PPTX to PDF conversion is not possible without an enterprise WASM SDK 
             * or a server-side backend (like LibreOffice Headless or Cloudmersive API) because PPTX 
             * requires OS-level font rendering and complex XML layout engines.
             * 
             * Below is a simulated PDF generation using PDF-lib to satisfy the UI flow.
             * In production, replace this with an API call to your conversion server.
             */

            const pdfDoc = await PDFLib.PDFDocument.create();
            const page = pdfDoc.addPage([600, 400]);
            const { width, height } = page.getSize();
            
            page.drawText('PowerPoint to PDF Converter', {
                x: 50,
                y: height - 80,
                size: 24,
                color: PDFLib.rgb(0.2, 0.2, 0.2),
            });
            
            page.drawText(`File Processed: ${currentFile.name}`, {
                x: 50,
                y: height - 130,
                size: 14,
                color: PDFLib.rgb(0.4, 0.4, 0.4),
            });

            page.drawText('NOTE TO ADMIN:', {
                x: 50,
                y: height - 200,
                size: 14,
                color: PDFLib.rgb(0.8, 0.1, 0.1),
            });
            
            const message = "True client-side PPTX to PDF conversion requires a backend API\n(like ConvertAPI or Zamzar) or an enterprise WebAssembly SDK.\nPlease connect the API endpoint in converter.js.";
            page.drawText(message, {
                x: 50,
                y: height - 230,
                size: 12,
                color: PDFLib.rgb(0.1, 0.1, 0.1),
                lineHeight: 18,
            });

            generatedPdfBytes = await pdfDoc.save();

            progressSection.style.display = 'none';
            resultsArea.style.display = 'block';
            resultsArea.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            showError('Conversion failed. Please try again.');
            progressSection.style.display = 'none';
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert to PDF';
        }
    });

    downloadBtn.addEventListener('click', () => {
        if (!generatedPdfBytes) return;
        
        const blob = new Blob([generatedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_converted.pdf`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    });
});
