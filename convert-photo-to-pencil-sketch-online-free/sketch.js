document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const convertBtn = document.getElementById('convertBtn');
    const errorMessage = document.getElementById('errorMessage');
    const resultsArea = document.getElementById('resultsArea');
    const downloadBtn = document.getElementById('downloadBtn');
    const intensitySlider = document.getElementById('intensitySlider');
    const intensityValue = document.getElementById('intensityValue');
    const previewContainer = document.getElementById('previewContainer');

    let currentFile = null;
    let originalImageObj = null;
    let finalCanvas = null;

    intensitySlider.addEventListener('input', () => {
        intensityValue.textContent = intensitySlider.value + 'px';
    });

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
            handleImageFile(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });

    function handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file.');
            return;
        }
        hideError();
        currentFile = file;
        fileName.textContent = file.name;
        dropzone.style.display = 'none';
        fileInfo.style.display = 'flex';
        convertBtn.style.display = 'block';
        resultsArea.style.display = 'none';
        
        // Preload image
        const url = URL.createObjectURL(file);
        originalImageObj = new Image();
        originalImageObj.src = url;
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        originalImageObj = null;
        fileInput.value = '';
        dropzone.style.display = 'flex';
        fileInfo.style.display = 'none';
        convertBtn.style.display = 'none';
        resultsArea.style.display = 'none';
        previewContainer.innerHTML = '';
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    function hideError() {
        errorMessage.style.display = 'none';
    }

    // Fast Box Blur implementation
    function boxBlur(scl, tcl, w, h, r) {
        for(let i=0; i<scl.length; i++) tcl[i] = scl[i];
        boxBlurH(tcl, scl, w, h, r);
        boxBlurT(scl, tcl, w, h, r);
    }
    function boxBlurH(scl, tcl, w, h, r) {
        let iarr = 1 / (r+r+1);
        for(let i=0; i<h; i++) {
            let ti = i*w, li = ti, ri = ti+r;
            let fv = scl[ti], lv = scl[ti+w-1], val = (r+1)*fv;
            for(let j=0; j<r; j++) val += scl[ti+j];
            for(let j=0  ; j<=r ; j++) { val += scl[ri++] - fv       ;   tcl[ti++] = Math.round(val*iarr); }
            for(let j=r+1; j<w-r; j++) { val += scl[ri++] - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
            for(let j=w-r; j<w  ; j++) { val += lv        - scl[li++];   tcl[ti++] = Math.round(val*iarr); }
        }
    }
    function boxBlurT(scl, tcl, w, h, r) {
        let iarr = 1 / (r+r+1);
        for(let i=0; i<w; i++) {
            let ti = i, li = ti, ri = ti+r*w;
            let fv = scl[ti], lv = scl[ti+w*(h-1)], val = (r+1)*fv;
            for(let j=0; j<r; j++) val += scl[ti+j*w];
            for(let j=0  ; j<=r ; j++) { val += scl[ri] - fv     ;  tcl[ti] = Math.round(val*iarr);  ri+=w; ti+=w; }
            for(let j=r+1; j<h-r; j++) { val += scl[ri] - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ri+=w; ti+=w; }
            for(let j=h-r; j<h  ; j++) { val += lv      - scl[li];  tcl[ti] = Math.round(val*iarr);  li+=w; ti+=w; }
        }
    }

    convertBtn.addEventListener('click', () => {
        if (!originalImageObj) return;
        convertBtn.textContent = 'Processing...';
        convertBtn.disabled = true;
        hideError();

        // Use a small timeout to allow UI to update to "Processing..." before freezing main thread
        setTimeout(() => {
            try {
                const blurRadius = parseInt(intensitySlider.value);
                const width = originalImageObj.width;
                const height = originalImageObj.height;

                // Max size constraint to prevent memory crash
                const MAX_DIM = 2500;
                let scale = 1;
                if (width > MAX_DIM || height > MAX_DIM) {
                    scale = Math.min(MAX_DIM / width, MAX_DIM / height);
                }

                const w = Math.floor(width * scale);
                const h = Math.floor(height * scale);

                finalCanvas = document.createElement('canvas');
                finalCanvas.width = w;
                finalCanvas.height = h;
                const ctx = finalCanvas.getContext('2d');
                ctx.drawImage(originalImageObj, 0, 0, w, h);

                const imgData = ctx.getImageData(0, 0, w, h);
                const data = imgData.data;
                const len = data.length;

                // 1. Grayscale & Invert
                const gray = new Uint8Array(w * h);
                const inverted = new Uint8Array(w * h);
                for (let i = 0, j = 0; i < len; i += 4, j++) {
                    // Standard luminance
                    const g = (data[i]*0.299 + data[i+1]*0.587 + data[i+2]*0.114);
                    gray[j] = g;
                    inverted[j] = 255 - g;
                }

                // 2. Blur inverted
                const blurred = new Uint8Array(w * h);
                // Run box blur 3 times to approximate Gaussian blur
                boxBlur(inverted, blurred, w, h, blurRadius);
                boxBlur(blurred, inverted, w, h, blurRadius);
                boxBlur(inverted, blurred, w, h, blurRadius);

                // 3. Color Dodge Blend
                for (let i = 0, j = 0; i < len; i += 4, j++) {
                    const top = blurred[j];
                    const bottom = gray[j];
                    let result;
                    if (top === 255) {
                        result = 255;
                    } else {
                        result = Math.min(255, Math.floor((bottom * 255) / (255 - top)));
                    }
                    data[i] = result;
                    data[i+1] = result;
                    data[i+2] = result;
                    data[i+3] = 255;
                }

                ctx.putImageData(imgData, 0, 0);

                // Display
                previewContainer.innerHTML = '';
                const previewImg = document.createElement('img');
                previewImg.src = finalCanvas.toDataURL('image/jpeg', 0.9);
                previewImg.style.maxWidth = '100%';
                previewImg.style.borderRadius = '8px';
                previewImg.style.border = '1px solid #cbd5e1';
                previewContainer.appendChild(previewImg);

                resultsArea.style.display = 'block';
                resultsArea.scrollIntoView({ behavior: 'smooth' });

            } catch (error) {
                console.error(error);
                showError('Failed to process image. It might be too large or corrupted.');
            } finally {
                convertBtn.textContent = 'Convert to Pencil Sketch';
                convertBtn.disabled = false;
            }
        }, 50);
    });

    downloadBtn.addEventListener('click', () => {
        if (!finalCanvas) return;
        finalCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name.replace(/\.[^/.]+$/, "") + "-sketch.jpg";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.95);
    });
});
