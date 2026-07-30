document.addEventListener('DOMContentLoaded', function () {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const editorWorkspace = document.getElementById('editorWorkspace');
    const errorMessage = document.getElementById('errorMessage');
    const canvas = document.getElementById('photoCanvas');
    const ctx = canvas.getContext('2d');

    // Controls
    const nameInput = document.getElementById('nameInput');
    const dateInput = document.getElementById('dateInput');
    const customText = document.getElementById('customText');
    const fontSizeSlider = document.getElementById('fontSizeSlider');
    const textColor = document.getElementById('textColor');
    const fontFamily = document.getElementById('fontFamily');
    const textPosition = document.getElementById('textPosition');
    const addShadow = document.getElementById('addShadow');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalImage = new Image();
    let currentCrop = 'none';

    // Set today's date as default
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];

    // Crop aspect ratios (width:height)
    const cropRatios = {
        'none': null,
        'passport-35x45': 3.5 / 4.5,
        'passport-2x2': 1,
        'square': 1,
        '4x6': 4 / 6
    };

    // Upload handlers
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#6366F1'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '';
        if (e.dataTransfer.files.length > 0) loadImage(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) loadImage(e.target.files[0]);
    });

    function loadImage(file) {
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }
        hideError();
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage.onload = () => {
                dropzone.style.display = 'none';
                editorWorkspace.style.display = 'grid';
                renderCanvas();
            };
            originalImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Live updates — re-render on every change
    [nameInput, dateInput, customText].forEach(el => el.addEventListener('input', renderCanvas));
    [fontSizeSlider, textColor, fontFamily, textPosition].forEach(el => el.addEventListener('input', renderCanvas));
    addShadow.addEventListener('change', renderCanvas);

    // Crop preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCrop = btn.dataset.crop;
            renderCanvas();
        });
    });

    function getCroppedDimensions() {
        const ratio = cropRatios[currentCrop];
        if (!ratio) return { sx: 0, sy: 0, sw: originalImage.width, sh: originalImage.height };

        let imgW = originalImage.width;
        let imgH = originalImage.height;
        let imgRatio = imgW / imgH;

        let sx, sy, sw, sh;

        if (imgRatio > ratio) {
            // Image is wider than target — crop sides
            sh = imgH;
            sw = imgH * ratio;
            sx = (imgW - sw) / 2;
            sy = 0;
        } else {
            // Image is taller than target — crop top/bottom
            sw = imgW;
            sh = imgW / ratio;
            sx = 0;
            sy = (imgH - sh) / 2;
        }

        return { sx: Math.round(sx), sy: Math.round(sy), sw: Math.round(sw), sh: Math.round(sh) };
    }

    function renderCanvas() {
        const crop = getCroppedDimensions();

        // Canvas dimensions based on cropped source
        canvas.width = crop.sw;
        canvas.height = crop.sh;

        // Draw cropped image
        ctx.drawImage(originalImage, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, crop.sw, crop.sh);

        // Build text lines
        const lines = [];
        const name = nameInput.value.trim();
        const date = dateInput.value;
        const custom = customText.value.trim();

        if (name) lines.push(name);
        if (date) {
            // Format date nicely
            const d = new Date(date);
            const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            lines.push(formatted);
        }
        if (custom) lines.push(custom);

        if (lines.length === 0) return;

        // Text styling
        const fontSize = parseInt(fontSizeSlider.value);
        const font = fontFamily.value;
        const color = textColor.value;
        const shadow = addShadow.checked;
        const position = textPosition.value;
        const lineHeight = fontSize * 1.4;
        const padding = fontSize * 0.8;

        ctx.font = `bold ${fontSize}px '${font}', sans-serif`;
        ctx.fillStyle = color;

        // Text alignment based on position
        let textAlign = 'left';
        if (position.includes('center')) textAlign = 'center';
        if (position.includes('right')) textAlign = 'right';
        ctx.textAlign = textAlign;

        // Calculate x position
        let x;
        if (textAlign === 'left') x = padding;
        else if (textAlign === 'center') x = canvas.width / 2;
        else x = canvas.width - padding;

        // Calculate y position
        let startY;
        const totalTextHeight = lines.length * lineHeight;

        if (position.startsWith('top')) {
            startY = padding + fontSize;
        } else if (position === 'center') {
            startY = (canvas.height - totalTextHeight) / 2 + fontSize;
        } else {
            // bottom
            startY = canvas.height - totalTextHeight - padding + fontSize;
        }

        // Draw semi-transparent background bar behind text for readability
        const bgPadding = 8;
        let maxTextWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxTextWidth) maxTextWidth = metrics.width;
        });

        const bgX = textAlign === 'left' ? padding - bgPadding :
                     textAlign === 'center' ? (canvas.width - maxTextWidth) / 2 - bgPadding :
                     canvas.width - padding - maxTextWidth - bgPadding;
        const bgY = startY - fontSize - bgPadding / 2;
        const bgW = maxTextWidth + bgPadding * 2;
        const bgH = totalTextHeight + bgPadding;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        roundRect(ctx, bgX, bgY, bgW, bgH, 6);
        ctx.fill();
        ctx.restore();

        // Draw each text line
        ctx.fillStyle = color;
        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            if (shadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.7)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            ctx.fillText(line, x, y);
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Helper: rounded rectangle
    function roundRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    // Download
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'photo_with_name_date.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        nameInput.value = '';
        customText.value = '';
        dateInput.value = today.toISOString().split('T')[0];
        currentCrop = 'none';
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-crop="none"]').classList.add('active');

        editorWorkspace.style.display = 'none';
        dropzone.style.display = '';
    });

    function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
    function hideError() { errorMessage.style.display = 'none'; }
});
