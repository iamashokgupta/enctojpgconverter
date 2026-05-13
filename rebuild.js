const fs = require('fs');
const path = require('path');

const jpegFile = path.join(__dirname, 'enc-to-jpeg-converter', 'index.html');
const imageFile = path.join(__dirname, 'enc-to-image-converter', 'index.html');

if (fs.existsSync(jpegFile)) {
    let content = fs.readFileSync(jpegFile, 'utf8');
    
    // Replace specific terms
    content = content.replace(/JPEG/g, 'Image');
    content = content.replace(/jpeg/g, 'image');
    content = content.replace(/\.image/g, 'image'); // Fix weird extensions like .image to just image
    content = content.replace(/jpg/g, 'image');
    content = content.replace(/Jpg/g, 'Image');
    content = content.replace(/enc-to-image-converter\/index\.html/g, 'enc-to-image-converter/');
    
    // Fix the canonical link
    content = content.replace(/https:\/\/enctoimageconverter\.online\/enc-to-image-converter\//g, 'https://enctojpgconverter.online/enc-to-image-converter/');
    
    // Fix specific IDs or mode-switchers
    content = content.replace(/encToImageBtn/g, 'encToImageBtn'); // Should be same
    content = content.replace(/imageToEncBtn/g, 'imageToEncBtn'); // Should be same

    // Fix the mode button data-modes to match previous script.js
    // Assuming script.js uses "enc-to-jpg" and "jpg-to-enc" because the JS was shared or similar
    // Actually, let's keep data-mode="enc-to-jpg" just in case script.js relies on it
    content = content.replace(/data-mode="enc-to-image"/g, 'data-mode="enc-to-jpg"');
    content = content.replace(/data-mode="image-to-enc"/g, 'data-mode="jpg-to-enc"');

    // Fix the Related Tools cross-linking URL
    content = content.replace(/enc-to-image-converter\//g, 'enc-to-image-converter/');
    // Wait, the related tools block in JPEG had PNG, PDF, Viewer, Universal. 
    // If I just copy JPEG to Image, it will have PNG, PDF, Viewer, Universal. Which is perfect.

    fs.writeFileSync(imageFile, content, 'utf8');
    console.log("Successfully rebuilt enc-to-image-converter/index.html");
} else {
    console.log("Source JPEG file not found");
}
