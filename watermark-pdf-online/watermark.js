document.addEventListener('DOMContentLoaded', function () {
    // UI Elements
    const watermarkType = document.getElementById('watermarkType');
    const textSettings = document.getElementById('textSettings');
    const imageSettings = document.getElementById('imageSettings');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityValue = document.getElementById('opacityValue');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const watermarkBtn = document.getElementById('watermarkBtn');
    const errorMessage = document.getElementById('errorMessage');
    const resultsArea = document.getElementById('resultsArea');
    const downloadBtn = document.getElementById('downloadBtn');

    // State
    let currentPdfBytes = null;
    let watermarkedPdfBytes = null;
    let currentPdfName = null;
    let uploadedImageBytes = null;

    // Toggle Settings
    watermarkType.addEventListener('change', () => {
        if (watermarkType.value === 'text') {
            textSettings.style.display = 'block';
            imageSettings.style.display = 'none';
        } else {
            textSettings.style.display = 'none';
            imageSettings.style.display = 'block';
        }
    });

    opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = opacitySlider.value + '%';
    });

    // Image Upload
    const watermarkImageInput = document.getElementById('watermarkImageInput');
    watermarkImageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedImageBytes = await file.arrayBuffer();
        } else {
            uploadedImageBytes = null;
        }
    });

    // PDF Upload Handlers
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
            handlePdfFile(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handlePdfFile(e.target.files[0]);
        }
    });

    async function handlePdfFile(file) {
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showError('Please select a valid PDF file.');
            return;
        }
        hideError();
        try {
            currentPdfBytes = await file.arrayBuffer();
            currentPdfName = file.name;
            fileName.textContent = file.name;
            dropzone.style.display = 'none';
            fileInfo.style.display = 'flex';
            watermarkBtn.style.display = 'block';
            resultsArea.style.display = 'none';
            watermarkedPdfBytes = null;
        } catch(e) {
            showError('Error reading file.');
        }
    }

    removeFileBtn.addEventListener('click', () => {
        currentPdfBytes = null;
        fileInput.value = '';
        dropzone.style.display = 'flex';
        fileInfo.style.display = 'none';
        watermarkBtn.style.display = 'none';
        resultsArea.style.display = 'none';
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
    }
    function hideError() {
        errorMessage.style.display = 'none';
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    // Process Watermark
    watermarkBtn.addEventListener('click', async () => {
        if (!currentPdfBytes) return;
        hideError();
        
        if (watermarkType.value === 'image' && !uploadedImageBytes) {
            showError('Please upload an image for the watermark.');
            return;
        }

        watermarkBtn.textContent = 'Processing...';
        watermarkBtn.disabled = true;

        try {
            const { PDFDocument, rgb, degrees } = PDFLib;
            const pdfDoc = await PDFDocument.load(currentPdfBytes);
            const pages = pdfDoc.getPages();
            const opacity = parseInt(opacitySlider.value) / 100;

            if (watermarkType.value === 'text') {
                const text = document.getElementById('watermarkText').value || 'CONFIDENTIAL';
                const colorHex = document.getElementById('watermarkColor').value;
                const rgbColor = hexToRgb(colorHex);
                const font = await pdfDoc.embedStandardFont(PDFLib.StandardFonts.HelveticaBold);
                
                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const textSize = Math.min(width, height) / 10;
                    const textWidth = font.widthOfTextAtSize(text, textSize);
                    const textHeight = font.heightAtSize(textSize);
                    
                    page.drawText(text, {
                        x: width / 2 - textWidth / 2,
                        y: height / 2 - textHeight / 2,
                        size: textSize,
                        font: font,
                        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
                        opacity: opacity,
                        rotate: degrees(45)
                    });
                });
            } else {
                // Image watermark
                let image;
                const fileType = watermarkImageInput.files[0].type;
                if (fileType === 'image/png') {
                    image = await pdfDoc.embedPng(uploadedImageBytes);
                } else if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
                    image = await pdfDoc.embedJpg(uploadedImageBytes);
                } else {
                    throw new Error('Unsupported image format. Please use PNG or JPG.');
                }

                pages.forEach(page => {
                    const { width, height } = page.getSize();
                    const imgDims = image.scale(0.5); // scale down if huge
                    const finalScale = Math.min(width / imgDims.width, height / imgDims.height) * 0.8;
                    const finalWidth = imgDims.width * finalScale;
                    const finalHeight = imgDims.height * finalScale;

                    page.drawImage(image, {
                        x: width / 2 - finalWidth / 2,
                        y: height / 2 - finalHeight / 2,
                        width: finalWidth,
                        height: finalHeight,
                        opacity: opacity
                    });
                });
            }

            watermarkedPdfBytes = await pdfDoc.save();
            resultsArea.style.display = 'block';
            
        } catch (error) {
            console.error(error);
            showError('Failed to add watermark: ' + error.message);
        } finally {
            watermarkBtn.textContent = 'Add Watermark';
            watermarkBtn.disabled = false;
        }
    });

    // Download Handler
    downloadBtn.addEventListener('click', () => {
        if (!watermarkedPdfBytes) return;
        const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentPdfName.replace('.pdf', '-watermarked.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
