document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const originalSize = document.getElementById('originalSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const resizeSettings = document.getElementById('resizeSettings');
    const unitSelect = document.getElementById('unitSelect');
    const dpiSelect = document.getElementById('dpiSelect');
    const inputWidth = document.getElementById('inputWidth');
    const inputHeight = document.getElementById('inputHeight');
    const lockRatio = document.getElementById('lockRatio');
    const formatSelect = document.getElementById('formatSelect');
    
    const resizeBtn = document.getElementById('resizeBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    const resultsArea = document.getElementById('resultsArea');
    const finalPxSize = document.getElementById('finalPxSize');
    const previewOutput = document.getElementById('previewOutput');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let originalImage = new Image();
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 1;
    let resizedBlobUrl = null;

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

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.onload = () => {
                originalWidth = originalImage.width;
                originalHeight = originalImage.height;
                aspectRatio = originalWidth / originalHeight;
                originalSize.textContent = `${originalWidth} × ${originalHeight}`;
                
                dropzone.style.display = 'none';
                fileInfo.style.display = 'flex';
                resizeSettings.style.display = 'block';
                resizeBtn.style.display = 'block';
                resultsArea.style.display = 'none';
                
                // Initialize default values based on selected unit
                updateDefaultInputs();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        if (resizedBlobUrl) URL.revokeObjectURL(resizedBlobUrl);
        
        dropzone.style.display = '';
        fileInfo.style.display = 'none';
        resizeSettings.style.display = 'none';
        resizeBtn.style.display = 'none';
        resultsArea.style.display = 'none';
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Input constraints & Aspect Ratio locking
    inputWidth.addEventListener('input', () => {
        if (lockRatio.checked && originalWidth > 0) {
            let targetPxWidth = getPxFromUnit(parseFloat(inputWidth.value) || 0, unitSelect.value);
            let targetPxHeight = targetPxWidth / aspectRatio;
            inputHeight.value = getUnitFromPx(targetPxHeight, unitSelect.value).toFixed(2);
        }
    });

    inputHeight.addEventListener('input', () => {
        if (lockRatio.checked && originalHeight > 0) {
            let targetPxHeight = getPxFromUnit(parseFloat(inputHeight.value) || 0, unitSelect.value);
            let targetPxWidth = targetPxHeight * aspectRatio;
            inputWidth.value = getUnitFromPx(targetPxWidth, unitSelect.value).toFixed(2);
        }
    });

    unitSelect.addEventListener('change', () => {
        // Toggle DPI select visibility based on unit
        if(unitSelect.value === 'px') {
            dpiSelect.parentElement.style.opacity = '0.5';
            dpiSelect.disabled = true;
        } else {
            dpiSelect.parentElement.style.opacity = '1';
            dpiSelect.disabled = false;
        }
        updateDefaultInputs();
    });
    
    dpiSelect.addEventListener('change', () => {
        updateDefaultInputs();
    });

    function updateDefaultInputs() {
        if (!originalImage.src) return;
        
        let unit = unitSelect.value;
        if (unit === 'cm') {
            inputWidth.value = "3.5";
            inputHeight.value = "4.5";
        } else if (unit === 'mm') {
            inputWidth.value = "35";
            inputHeight.value = "45";
        } else if (unit === 'in') {
            inputWidth.value = "1.37";
            inputHeight.value = "1.77";
        } else if (unit === 'px') {
            inputWidth.value = originalWidth;
            inputHeight.value = originalHeight;
        }
        
        // Force ratio calculation if locked
        if (lockRatio.checked && inputWidth.value) {
            let targetPxWidth = getPxFromUnit(parseFloat(inputWidth.value) || 0, unitSelect.value);
            let targetPxHeight = targetPxWidth / aspectRatio;
            inputHeight.value = getUnitFromPx(targetPxHeight, unitSelect.value).toFixed(unit === 'px' ? 0 : 2);
        }
    }

    // Conversion Math
    function getPxFromUnit(val, unit) {
        if (!val) return 0;
        let dpi = parseFloat(dpiSelect.value) || 300;
        
        if (unit === 'px') return val;
        if (unit === 'in') return val * dpi;
        if (unit === 'cm') return (val / 2.54) * dpi;
        if (unit === 'mm') return (val / 25.4) * dpi;
        return 0;
    }

    function getUnitFromPx(px, unit) {
        if (!px) return 0;
        let dpi = parseFloat(dpiSelect.value) || 300;
        
        if (unit === 'px') return px;
        if (unit === 'in') return px / dpi;
        if (unit === 'cm') return (px / dpi) * 2.54;
        if (unit === 'mm') return (px / dpi) * 25.4;
        return 0;
    }

    // Resizing Action
    resizeBtn.addEventListener('click', () => {
        hideError();
        
        let targetPxW = Math.round(getPxFromUnit(parseFloat(inputWidth.value), unitSelect.value));
        let targetPxH = Math.round(getPxFromUnit(parseFloat(inputHeight.value), unitSelect.value));

        if (!targetPxW || !targetPxH || targetPxW <= 0 || targetPxH <= 0) {
            showError("Invalid dimensions.");
            return;
        }
        if (targetPxW > 8000 || targetPxH > 8000) {
            showError("Dimensions are too large. Maximum supported size is 8000x8000 pixels.");
            return;
        }

        resizeBtn.disabled = true;
        resizeBtn.textContent = "Processing...";

        // Process in canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = targetPxW;
        canvas.height = targetPxH;

        // If format is JPG, fill background with white (removes transparent artifacts)
        if (formatSelect.value === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw image (Stretches if ratio is unlocked)
        ctx.drawImage(originalImage, 0, 0, targetPxW, targetPxH);

        canvas.toBlob((blob) => {
            if (resizedBlobUrl) URL.revokeObjectURL(resizedBlobUrl);
            resizedBlobUrl = URL.createObjectURL(blob);
            
            previewOutput.src = resizedBlobUrl;
            finalPxSize.textContent = `${targetPxW} × ${targetPxH}`;
            
            resultsArea.style.display = 'block';
            resultsArea.scrollIntoView({ behavior: 'smooth' });
            
            resizeBtn.disabled = false;
            resizeBtn.textContent = "Resize Image";
        }, formatSelect.value, 0.95);
    });

    downloadBtn.addEventListener('click', () => {
        if (!resizedBlobUrl) return;
        const a = document.createElement('a');
        a.href = resizedBlobUrl;
        
        const ext = formatSelect.value === 'image/png' ? '.png' : '.jpg';
        const baseName = currentFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${baseName}_resized${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
