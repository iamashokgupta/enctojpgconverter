document.addEventListener('DOMContentLoaded', function () {
    const fileFront = document.getElementById('fileFront');
    const fileBack = document.getElementById('fileBack');
    const imgFront = document.getElementById('imgFront');
    const imgBack = document.getElementById('imgBack');
    
    const dropFront = document.getElementById('dropFront');
    const dropBack = document.getElementById('dropBack');
    const placeholderFront = document.getElementById('placeholderFront');
    const placeholderBack = document.getElementById('placeholderBack');
    
    const layoutRadios = document.querySelectorAll('input[name="layout"]');
    const generateBtn = document.getElementById('generateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    const previewSection = document.getElementById('previewSection');
    const canvas = document.getElementById('a4Canvas');
    const ctx = canvas.getContext('2d');
    
    const downloadJpgBtn = document.getElementById('downloadJpgBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    let frontLoaded = false;
    let backLoaded = false;
    
    const A4_WIDTH = 2480;  // 300 DPI A4
    const A4_HEIGHT = 3508;
    
    // Aadhar Card standard size 8.5 cm x 5.5 cm
    // At 300 DPI: (8.5 / 2.54) * 300 = 1004 px
    // (5.5 / 2.54) * 300 = 650 px
    const CARD_WIDTH = 1004;
    const CARD_HEIGHT = 650;

    // Upload Handlers
    function setupUploader(dropzone, input, imgEl, placeholderEl, isFront) {
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#6366F1'; });
        dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = ''; });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '';
            if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0], imgEl, placeholderEl, isFront);
        });
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFile(e.target.files[0], imgEl, placeholderEl, isFront);
        });
    }

    setupUploader(dropFront, fileFront, imgFront, placeholderFront, true);
    setupUploader(dropBack, fileBack, imgBack, placeholderBack, false);

    function handleFile(file, imgEl, placeholderEl, isFront) {
        if (!file.type.startsWith('image/')) {
            showError('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }
        hideError();
        const reader = new FileReader();
        reader.onload = (e) => {
            imgEl.onload = () => {
                placeholderEl.style.display = 'none';
                imgEl.style.display = 'block';
                if (isFront) frontLoaded = true;
                else backLoaded = true;
            };
            imgEl.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function showError(msg) { errorMessage.textContent = msg; errorMessage.style.display = 'block'; }
    function hideError() { errorMessage.style.display = 'none'; }

    // Generate Layout
    generateBtn.addEventListener('click', () => {
        if (!frontLoaded || !backLoaded) {
            showError('Please upload both Front and Back images of the Aadhar card.');
            return;
        }
        hideError();
        
        generateBtn.textContent = 'Generating...';
        
        setTimeout(() => {
            canvas.width = A4_WIDTH;
            canvas.height = A4_HEIGHT;
            
            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
            
            // High quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Get selected layout
            let layout = 'vertical';
            layoutRadios.forEach(r => { if(r.checked) layout = r.value; });

            // Layout math
            let startX, startY;
            const margin = 200; // top margin
            
            if (layout === 'vertical') {
                // Centered stacked
                startX = (A4_WIDTH - CARD_WIDTH) / 2;
                startY = margin;
                
                ctx.drawImage(imgFront, startX, startY, CARD_WIDTH, CARD_HEIGHT);
                ctx.drawImage(imgBack, startX, startY + CARD_HEIGHT + 100, CARD_WIDTH, CARD_HEIGHT);
                
            } else {
                // Side by side
                const gap = 150;
                const totalWidth = (CARD_WIDTH * 2) + gap;
                startX = (A4_WIDTH - totalWidth) / 2;
                startY = margin;
                
                ctx.drawImage(imgFront, startX, startY, CARD_WIDTH, CARD_HEIGHT);
                ctx.drawImage(imgBack, startX + CARD_WIDTH + gap, startY, CARD_WIDTH, CARD_HEIGHT);
            }

            // Draw faint cut lines (border) around the cards to help with scissors later
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            
            if (layout === 'vertical') {
                ctx.strokeRect(startX, startY, CARD_WIDTH, CARD_HEIGHT);
                ctx.strokeRect(startX, startY + CARD_HEIGHT + 100, CARD_WIDTH, CARD_HEIGHT);
            } else {
                ctx.strokeRect(startX, startY, CARD_WIDTH, CARD_HEIGHT);
                ctx.strokeRect(startX + CARD_WIDTH + gap, startY, CARD_WIDTH, CARD_HEIGHT);
            }

            previewSection.style.display = 'block';
            generateBtn.textContent = 'Generate A4 Print Layout';
            previewSection.scrollIntoView({ behavior: 'smooth' });
            
        }, 100);
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        fileFront.value = '';
        fileBack.value = '';
        imgFront.src = '';
        imgBack.src = '';
        imgFront.style.display = 'none';
        imgBack.style.display = 'none';
        placeholderFront.style.display = 'block';
        placeholderBack.style.display = 'block';
        frontLoaded = false;
        backLoaded = false;
        previewSection.style.display = 'none';
        hideError();
    });

    // Download JPG
    downloadJpgBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'aadhar_a4_print.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // Download PDF (requires jsPDF)
    downloadPdfBtn.addEventListener('click', () => {
        if (!window.jspdf) {
            showError("PDF library failed to load. Please check your internet connection and try again.");
            return;
        }
        
        const { jsPDF } = window.jspdf;
        // Create A4 PDF (210 x 297 mm)
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add canvas as image
        // 210mm wide, 297mm high is exactly A4
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        
        pdf.save('aadhar_a4_print.pdf');
    });

});
