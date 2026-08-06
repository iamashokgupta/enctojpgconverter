document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const originalSizeStr = document.getElementById('originalSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const increaseMethod = document.getElementById('increaseMethod');
    const processBtn = document.getElementById('processBtn');
    const processingUi = document.getElementById('processingUi');
    const errorMessage = document.getElementById('errorMessage');
    
    const resultsArea = document.getElementById('resultsArea');
    const resOriginal = document.getElementById('resOriginal');
    const resNew = document.getElementById('resNew');
    const previewEnlarged = document.getElementById('previewEnlarged');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let originalImage = new Image();
    let processedBlobUrl = null;
    let processedFormat = 'image/png';

    // Upload handlers
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#6366F1'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }
        hideError();
        currentFile = file;
        fileName.textContent = file.name;
        originalSizeStr.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.onload = () => {
                dropzone.style.display = 'none';
                fileInfo.style.display = 'flex';
                resultsArea.style.display = 'none';
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        if (processedBlobUrl) URL.revokeObjectURL(processedBlobUrl);
        dropzone.style.display = '';
        fileInfo.style.display = 'none';
        resultsArea.style.display = 'none';
    });

    function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
    function hideError() { errorMessage.style.display = 'none'; }

    // Process Action
    processBtn.addEventListener('click', () => {
        if (!currentFile) return;
        hideError();
        
        processBtn.style.display = 'none';
        processingUi.style.display = 'block';
        resultsArea.style.display = 'none';

        // Add slight delay so UI can update before heavy canvas operations
        setTimeout(async () => {
            try {
                const method = increaseMethod.value;
                let scale = 1.0;
                let mimeType = 'image/jpeg';
                let quality = 1.0;

                if (method === 'png_convert') {
                    mimeType = 'image/png';
                } else if (method === 'scale_1_5') {
                    scale = 1.5;
                    mimeType = 'image/jpeg'; // or png depending on how heavy we want it
                } else if (method === 'scale_2_0') {
                    scale = 2.0;
                    mimeType = 'image/png'; // force PNG on 2.0 scale for MASSIVE increase (e.g. going from KB to MB)
                }

                processedFormat = mimeType;

                let canvas = document.createElement('canvas');
                let ctx = canvas.getContext('2d');
                canvas.width = originalImage.width * scale;
                canvas.height = originalImage.height * scale;
                
                // Draw background white just in case transparent PNG to JPG
                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                // High quality image smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);

                const resultBlob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

                if (!resultBlob) {
                    throw new Error("Could not process image.");
                }

                if (processedBlobUrl) URL.revokeObjectURL(processedBlobUrl);
                processedBlobUrl = URL.createObjectURL(resultBlob);

                // Update UI
                resOriginal.textContent = formatBytes(currentFile.size);
                resNew.textContent = formatBytes(resultBlob.size);
                
                previewEnlarged.src = processedBlobUrl;

                processingUi.style.display = 'none';
                processBtn.style.display = 'block';
                resultsArea.style.display = 'block';
                resultsArea.scrollIntoView({ behavior: 'smooth' });

            } catch (err) {
                console.error(err);
                showError("Processing failed. Please try a different image.");
                processingUi.style.display = 'none';
                processBtn.style.display = 'block';
            }
        }, 100);
    });

    downloadBtn.addEventListener('click', () => {
        if (!processedBlobUrl) return;
        const link = document.createElement('a');
        
        let baseName = currentFile.name.replace(/\.[^/.]+$/, "");
        let ext = processedFormat === 'image/png' ? 'png' : 'jpg';
        link.download = `${baseName}_enlarged.${ext}`;
        
        link.href = processedBlobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
