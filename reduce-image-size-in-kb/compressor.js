document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const originalSizeStr = document.getElementById('originalSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const targetKbInput = document.getElementById('targetKb');
    const resizeDimensions = document.getElementById('resizeDimensions');
    const compressBtn = document.getElementById('compressBtn');
    const processingUi = document.getElementById('processingUi');
    const errorMessage = document.getElementById('errorMessage');
    
    const resultsArea = document.getElementById('resultsArea');
    const resOriginal = document.getElementById('resOriginal');
    const resNew = document.getElementById('resNew');
    const resPct = document.getElementById('resPct');
    const previewOriginal = document.getElementById('previewOriginal');
    const previewCompressed = document.getElementById('previewCompressed');
    const downloadBtn = document.getElementById('downloadBtn');

    // Cropping elements
    const cropImage = document.getElementById('cropImage');
    const applyCropBtn = document.getElementById('applyCropBtn');
    const cropSuccessMsg = document.getElementById('cropSuccessMsg');
    const ratioBtns = document.querySelectorAll('.crop-ratio');

    let currentFile = null;
    let originalImage = new Image();
    let compressedBlobUrl = null;
    
    let cropper = null;
    let croppedCanvas = null;

    // Presets
    document.querySelectorAll('.preset-kb').forEach(btn => {
        btn.addEventListener('click', () => {
            targetKbInput.value = btn.dataset.kb;
        });
    });

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
                previewOriginal.src = e.target.result;
                dropzone.style.display = 'none';
                fileInfo.style.display = 'flex';
                resultsArea.style.display = 'none';
                cropSuccessMsg.style.display = 'none';
                
                // Initialize cropper
                cropImage.src = e.target.result;
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(cropImage, {
                    viewMode: 1,
                    autoCropArea: 0.8,
                    background: false
                });
                
                // Reset cropped canvas
                croppedCanvas = null;
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Cropper aspect ratio buttons
    ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (cropper) {
                cropper.setAspectRatio(parseFloat(btn.dataset.ratio));
            }
        });
    });

    // Apply Crop
    applyCropBtn.addEventListener('click', () => {
        if (!cropper) return;
        croppedCanvas = cropper.getCroppedCanvas({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        // Update original image visually (optional, but good for feedback)
        originalImage.src = croppedCanvas.toDataURL('image/jpeg');
        
        cropSuccessMsg.style.display = 'block';
        setTimeout(() => { cropSuccessMsg.style.display = 'none'; }, 3000);
    });

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
        if (cropper) cropper.destroy();
        cropper = null;
        croppedCanvas = null;
        
        dropzone.style.display = '';
        fileInfo.style.display = 'none';
        resultsArea.style.display = 'none';
    });

    function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
    function hideError() { errorMessage.style.display = 'none'; }

    // Compress Action
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        hideError();
        
        const targetKb = parseFloat(targetKbInput.value);
        if (isNaN(targetKb) || targetKb < 1) {
            showError('Please enter a valid target size (e.g. 50).');
            return;
        }

        const targetBytes = targetKb * 1024;
        
        if (currentFile.size <= targetBytes && currentFile.type === 'image/jpeg') {
            showError(`This file is already smaller than ${targetKb}KB!`);
            return;
        }

        compressBtn.style.display = 'none';
        processingUi.style.display = 'block';
        resultsArea.style.display = 'none';

        // Add slight delay so UI can update before heavy canvas operations lock the thread
        setTimeout(async () => {
            try {
                // Determine source for compression: Cropped canvas OR original image
                let sourceElement = croppedCanvas ? croppedCanvas : originalImage;
                let startSize = currentFile.size;
                
                // If we cropped, we need to estimate the starting size of the cropped image
                if (croppedCanvas) {
                    const tempBlob = await new Promise(res => croppedCanvas.toBlob(res, 'image/jpeg', 0.95));
                    startSize = tempBlob.size;
                    previewOriginal.src = URL.createObjectURL(tempBlob); // update preview
                }

                if (startSize <= targetBytes) {
                    showError(`The image (or cropped area) is already smaller than ${targetKb}KB!`);
                    processingUi.style.display = 'none';
                    compressBtn.style.display = 'block';
                    return;
                }

                const resultBlob = await findOptimalCompression(sourceElement, targetBytes, resizeDimensions.checked, startSize);
                
                if (!resultBlob) {
                    throw new Error("Could not compress to target size.");
                }

                if (compressedBlobUrl) URL.revokeObjectURL(compressedBlobUrl);
                compressedBlobUrl = URL.createObjectURL(resultBlob);

                // Update UI
                resOriginal.textContent = formatBytes(startSize);
                resNew.textContent = formatBytes(resultBlob.size);
                
                const pct = ((startSize - resultBlob.size) / startSize) * 100;
                resPct.textContent = `${pct.toFixed(1)}% Smaller`;
                
                previewCompressed.src = compressedBlobUrl;

                processingUi.style.display = 'none';
                compressBtn.style.display = 'block';
                resultsArea.style.display = 'block';
                resultsArea.scrollIntoView({ behavior: 'smooth' });

            } catch (err) {
                console.error(err);
                showError("Compression failed. Try allowing dimension resizing or increasing the target KB.");
                processingUi.style.display = 'none';
                compressBtn.style.display = 'block';
            }
        }, 100);
    });

    // Smart compression using binary search
    async function findOptimalCompression(sourceImg, targetBytes, allowResize, estimatedStartSize) {
        let minQ = 0.01;
        let maxQ = 1.0;
        let bestBlob = null;
        let bestQ = null;
        let iterations = 0;
        
        // Setup initial canvas
        let scale = 1.0;
        
        // If image is huge and target is tiny, we MUST resize first or JPG quality 0.01 will still be too big.
        if (allowResize) {
            // Use provided estimated size or rough guess
            const initialGuessSize = estimatedStartSize || (sourceImg.width * sourceImg.height * 0.3);
            if (initialGuessSize > targetBytes * 10) {
                scale = Math.sqrt((targetBytes * 10) / initialGuessSize);
            }
        }

        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = sourceImg.width * scale;
        canvas.height = sourceImg.height * scale;
        
        // Fill white background to prevent black background on transparent PNGs converting to JPG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);

        // Binary search for quality
        while (iterations < 7) {
            const midQ = (minQ + maxQ) / 2;
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', midQ));
            
            if (blob.size <= targetBytes) {
                bestBlob = blob;
                bestQ = midQ;
                minQ = midQ; // try to get better quality
            } else {
                maxQ = midQ; // need smaller size
            }
            iterations++;
        }

        // If we still didn't hit the target and resize is allowed, aggressively scale down and try again
        if (!bestBlob && allowResize) {
            // Shrink dimensions by 30% and do one aggressive pass
            canvas.width *= 0.7;
            canvas.height *= 0.7;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);
            
            bestBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.5));
            if (bestBlob.size > targetBytes) {
                // Extreme shrink
                canvas.width *= 0.5;
                canvas.height *= 0.5;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);
                bestBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.3));
            }
        }

        return bestBlob;
    }

    downloadBtn.addEventListener('click', () => {
        if (!compressedBlobUrl) return;
        const link = document.createElement('a');
        
        // Keep original name but add suffix and force .jpg since we convert to JPEG
        let baseName = currentFile.name.replace(/\.[^/.]+$/, "");
        link.download = `${baseName}_${targetKbInput.value}kb.jpg`;
        
        link.href = compressedBlobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
