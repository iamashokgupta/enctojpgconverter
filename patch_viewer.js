const fs = require('fs');
let code = fs.readFileSync('enc-file-viewer/viewer.js', 'utf8');

const oldLogic = `            // Clean up old preview if exists
            const oldImg = previewTab.querySelector('img');
            if(oldImg) oldImg.remove();
            const oldPdf = previewTab.querySelector('iframe');
            if(oldPdf) oldPdf.remove();

            if (isText) {
                const text = new TextDecoder().decode(decryptedData);
                decryptedTextPreview.value = text;
                decryptedTextPreview.style.display = 'block';
                decryptedDataBlob = new Blob([decryptedData], { type: 'text/plain' });
                decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.txt');
            } else {
                decryptedTextPreview.style.display = 'none';
                
                // Is it an image?
                if(decryptedData[0] === 0xFF && decryptedData[1] === 0xD8) {
                    decryptedDataBlob = new Blob([decryptedData], { type: 'image/jpeg' });
                    decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.jpg');
                    
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(decryptedDataBlob);
                    img.style.maxWidth = '100%';
                    img.style.borderRadius = '8px';
                    img.style.marginTop = '15px';
                    previewTab.appendChild(img);
                } 
                // Is it a PDF?
                else if (decryptedData[0] === 0x25 && decryptedData[1] === 0x50 && decryptedData[2] === 0x44 && decryptedData[3] === 0x46) {
                    decryptedDataBlob = new Blob([decryptedData], { type: 'application/pdf' });
                    decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.pdf');
                    
                    const iframe = document.createElement('iframe');
                    iframe.src = URL.createObjectURL(decryptedDataBlob);
                    iframe.style.width = '100%';
                    iframe.style.height = '500px';
                    iframe.style.border = 'none';
                    iframe.style.marginTop = '15px';
                    previewTab.appendChild(iframe);
                }
                else {
                    // Unknown binary
                    decryptedDataBlob = new Blob([decryptedData], { type: 'application/octet-stream' });
                    decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.bin');
                    
                    const msg = document.createElement('p');
                    msg.textContent = "Binary file decrypted. Preview not available for this file type. Please download to view.";
                    msg.style.padding = "20px";
                    msg.style.textAlign = "center";
                    msg.style.color = "var(--text-secondary)";
                    previewTab.appendChild(msg);
                }
            }

            resultsArea.style.display = 'block';
            resultsArea.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            showError('Decryption failed: ' + error.message);
        } finally {
            decryptBtn.textContent = 'View / Decrypt File';
            decryptBtn.disabled = false;
        }`;

const newLogic = `            // Clean up old preview if exists
            const oldImg = previewTab.querySelector('img');
            if(oldImg) oldImg.remove();
            const oldPdf = previewTab.querySelector('iframe');
            if(oldPdf) oldPdf.remove();
            const oldMsg = previewTab.querySelector('p.unknown-msg');
            if(oldMsg) oldMsg.remove();

            function finishDecryption() {
                resultsArea.style.display = 'block';
                resultsArea.scrollIntoView({ behavior: 'smooth' });
                decryptBtn.textContent = 'View / Decrypt File';
                decryptBtn.disabled = false;
            }

            if (isText) {
                const text = new TextDecoder().decode(decryptedData);
                decryptedTextPreview.value = text;
                decryptedTextPreview.style.display = 'block';
                decryptedDataBlob = new Blob([decryptedData], { type: 'text/plain' });
                decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.txt');
                finishDecryption();
            } else {
                decryptedTextPreview.style.display = 'none';
                
                // Try to load as an image first
                const testBlob = new Blob([decryptedData]);
                const testUrl = URL.createObjectURL(testBlob);
                const img = new Image();
                img.onload = () => {
                    // It's a valid image! Render it to canvas to export as pure JPG
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    canvas.toBlob((blob) => {
                        decryptedDataBlob = blob;
                        decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.jpg');
                        
                        const displayImg = document.createElement('img');
                        displayImg.src = URL.createObjectURL(blob);
                        displayImg.style.maxWidth = '100%';
                        displayImg.style.borderRadius = '8px';
                        displayImg.style.marginTop = '15px';
                        previewTab.appendChild(displayImg);
                        
                        finishDecryption();
                    }, 'image/jpeg', 0.95);
                };
                
                img.onerror = () => {
                    // Not an image, check if PDF
                    if (decryptedData[0] === 0x25 && decryptedData[1] === 0x50 && decryptedData[2] === 0x44 && decryptedData[3] === 0x46) {
                        decryptedDataBlob = new Blob([decryptedData], { type: 'application/pdf' });
                        decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.pdf');
                        
                        const iframe = document.createElement('iframe');
                        iframe.src = URL.createObjectURL(decryptedDataBlob);
                        iframe.style.width = '100%';
                        iframe.style.height = '500px';
                        iframe.style.border = 'none';
                        iframe.style.marginTop = '15px';
                        previewTab.appendChild(iframe);
                    } else {
                        // Unknown binary
                        decryptedDataBlob = new Blob([decryptedData], { type: 'application/octet-stream' });
                        decryptedDataName = currentFile.name.replace(/\\.enc$/i, '.bin');
                        
                        const msg = document.createElement('p');
                        msg.className = 'unknown-msg';
                        msg.textContent = "Binary file decrypted. Preview not available for this file type. Please download to view.";
                        msg.style.padding = "20px";
                        msg.style.textAlign = "center";
                        msg.style.color = "var(--text-secondary)";
                        previewTab.appendChild(msg);
                    }
                    finishDecryption();
                };
                
                img.src = testUrl;
                return; // Wait for onload/onerror to call finishDecryption()
            }
        } catch (error) {
            showError('Decryption failed: ' + error.message);
            decryptBtn.textContent = 'View / Decrypt File';
            decryptBtn.disabled = false;
        }`;

if (code.includes('if(decryptedData[0] === 0xFF && decryptedData[1] === 0xD8)')) {
    code = code.replace(oldLogic, newLogic);
    fs.writeFileSync('enc-file-viewer/viewer.js', code);
    console.log('Successfully updated viewer.js image logic');
} else {
    console.log('Could not find the target code to replace.');
}
