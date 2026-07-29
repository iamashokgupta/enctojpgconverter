$files = Get-ChildItem -Path "." -Recurse -Filter "*.html"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match '<div class="tools-grid"') {
        $isRoot = ($file.Directory.Name -eq "enctojpg")
        $prefix = if ($isRoot) { "" } else { "../" }
        
        $newGrid = @"
            <div class="tools-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                                                                <a href="${prefix}html-file-opener-online/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">HTML File Opener</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Open HTML files, edit code, and convert Webpages to PDF/JPG instantly.</p>
                    </div>
                </a>
                <a href="${prefix}convert-photo-to-pencil-sketch-online-free/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Photo to Sketch</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Turn your photo into a beautiful pencil sketch online instantly.</p>
                    </div>
                </a>
                <a href="${prefix}watermark-pdf-online/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Watermark PDF</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Add text or image watermarks to your PDFs online for free.</p>
                    </div>
                </a>
                <a href="${prefix}image-compress-online-reduce-image-size/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Image Compressor</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Reduce image size to 20KB or 50KB free online.</p>
                    </div>
                </a>
                <a href="${prefix}browser-based-heic-converter-fast/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Browser Based HEIC</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Unlimited fast browser based HEIC converter.</p>
                    </div>
                </a>
                <a href="${prefix}convert-avif-to-jpg-online-no-upload/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">AVIF to JPG Converter</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert AVIF to JPG online with no upload free.</p>
                    </div>
                </a>
                <a href="${prefix}pdf-to-jpg-300dpi/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">High Res PDF to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert high-resolution PDFs to 300 DPI JPGs for free.</p>
                    </div>
                </a>
                <a href="${prefix}safe-online-enc-to-jpg-converter-free/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Safe ENC to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">100% safe client-side converter with 50 KB compression.</p>
                    </div>
                </a>
                <a href="${prefix}convert-webp-to-jpg-without-losing-quality-online/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Lossless WebP to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert WebP and AVIF to JPG without losing quality.</p>
                    </div>
                </a>
                <a href="${prefix}heic-to-jpg-offline/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Offline HEIC to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Browser-based offline extension to convert HEIC.</p>
                    </div>
                </a>
                <a href="${prefix}live-photo-to-jpg/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Live Photo Batch to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert iPhone Live Photos to JPG in batch instantly.</p>
                    </div>
                </a>
                <a href="${prefix}iphone-photo-enc-extension-fix/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">iPhone Photo ENC Fix</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Fix iPhone photo ENC extension issues and convert HEIC to JPG easily.</p>
                    </div>
                </a>
                <a href="${prefix}batch-webp-to-jpg-converter-online-no-limit/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Batch WebP to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert WebP and AVIF to JPG online with absolutely no limits.</p>
                    </div>
                </a>
                <a href="${prefix}convert-jfif-to-jpg-bulk-free/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Bulk JFIF to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert JFIF to JPG in bulk instantly. No upload required.</p>
                    </div>
                </a>
                <a href="${prefix}convert-heic-to-jpg-client-side-no-upload/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">HEIC Client-Side Converter</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert HEIC to JPG securely in your browser with no uploads.</p>
                    </div>
                </a>
                <a href="${prefix}samsung-heic-to-jpg-converter/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: 8px; font-size: 1.25rem;">Samsung HEIC to JPG</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert Samsung HEIC photos directly to JPG format.</p>
                    </div>
                </a>
                <a href="${prefix}enc-to-png-converter/" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: var(--spacing-xs); font-size: 1.25rem;">ENC to PNG Converter</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert your encrypted files directly to high-quality PNG images.</p>
                    </div>
                </a>
                <a href="${prefix}index.html" style="text-decoration: none; color: inherit;">
                    <div class="feature-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                        <h3 style="color: var(--text-primary); margin-bottom: var(--spacing-xs); font-size: 1.25rem;">ENC to JPG Converter</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">Convert .enc files to compressed JPG photos. Smaller files, ideal for photographs.</p>
                    </div>
                </a>
            </div>
"@
        
        $content = $content -replace '(?s)<div class="tools-grid".*?</div>(?=\s*</div>\s*</section>)', $newGrid
        
        Set-Content -Path $file.FullName -Value $content
    }
}



