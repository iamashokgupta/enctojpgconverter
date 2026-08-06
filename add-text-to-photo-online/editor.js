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
    const addBgBar = document.getElementById('addBgBar');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let originalImage = new Image();

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
    addBgBar.addEventListener('change', renderCanvas);

    function renderCanvas() {
        if (!originalImage.src) return;

        // Canvas dimensions exactly match source
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;

        // Draw image
        ctx.drawImage(originalImage, 0, 0);

        // Build text lines
        const lines = [];
        const name = nameInput.value.trim();
        const date = dateInput.value;
        const custom = customText.value.trim();

        if (name) lines.push(name);
        if (date) {
            const d = new Date(date);
            // Format to something readable, e.g. "15 Aug 2026"
            const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            lines.push(formatted);
        }
        if (custom) lines.push(custom);

        if (lines.length === 0) return;

        // Scaling text size relative to image width for a responsive default feel,
        // but letting slider heavily influence it.
        const baseRatio = canvas.width / 1000;
        let fontSize = parseInt(fontSizeSlider.value) * Math.max(0.5, baseRatio);
        
        const font = fontFamily.value;
        const color = textColor.value;
        const shadow = addShadow.checked;
        const bgBar = addBgBar.checked;
        const position = textPosition.value;
        const lineHeight = fontSize * 1.4;
        const padding = fontSize;

        ctx.font = `bold ${fontSize}px '${font}', sans-serif`;
        
        // Alignment
        let textAlign = 'left';
        if (position.includes('center')) textAlign = 'center';
        if (position.includes('right')) textAlign = 'right';
        ctx.textAlign = textAlign;

        // X position
        let x;
        if (textAlign === 'left') x = padding;
        else if (textAlign === 'center') x = canvas.width / 2;
        else x = canvas.width - padding;

        // Y position
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

        // Draw Solid Background Bar if requested
        if (bgBar) {
            const bgPadding = fontSize * 0.5;
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Dark semi-transparent
            ctx.beginPath();
            roundRect(ctx, bgX, bgY, bgW, bgH, 8);
            ctx.fill();
            ctx.restore();
        }

        // Draw each text line
        ctx.fillStyle = color;
        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            if (shadow && !bgBar) {
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = Math.max(4, fontSize * 0.1);
                ctx.shadowOffsetX = Math.max(2, fontSize * 0.05);
                ctx.shadowOffsetY = Math.max(2, fontSize * 0.05);
            }
            ctx.fillText(line, x, y);
        });

        // Reset shadow state
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
        if (!originalImage.src) return;
        const link = document.createElement('a');
        link.download = 'photo_with_text.jpg';
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
        dateInput.value = '';
        editorWorkspace.style.display = 'none';
        dropzone.style.display = '';
    });

    function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
    function hideError() { errorMessage.style.display = 'none'; }
});
