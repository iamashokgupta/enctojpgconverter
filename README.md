# ENC to JPG Converter

A modern, free online tool to convert encrypted .enc files to high-quality JPG images. Features client-side processing for maximum privacy and security.

## Features

- 🔒 **100% Secure** - All conversion happens in your browser
- ⚡ **Fast Conversion** - Convert files in seconds
- 📦 **Batch Processing** - Convert multiple files at once
- 📱 **Cross-Platform** - Works on all devices and browsers
- 🎨 **Quality Preservation** - Maintains original image quality
- 💰 **Completely Free** - No limits or subscriptions

## Supported File Types

- WhatsApp encrypted backups (.enc)
- S-63 maritime charts
- CopySafe protected media
- Generic encrypted image files

## How to Use

1. **Upload Files**: Drag and drop your .enc files or click to browse
2. **Enter Password** (if required): Some files need a decryption key
3. **Convert**: Click the convert button
4. **Download**: Download individual files or all as a batch

## Technical Details

### Decryption Methods

The tool attempts multiple decryption approaches:

1. **XOR Decryption** with password
2. **File Signature Detection** - Searches for JPEG headers
3. **Header Removal** - Removes common encryption wrappers
4. **WhatsApp-style Decryption** - For WhatsApp backup files

### Privacy & Security

- **Client-side Processing**: All operations happen in your browser
- **No Upload**: Files never leave your device
- **No Storage**: Files are not stored anywhere
- **No Tracking**: We don't track your usage

## Technologies Used

- HTML5 Canvas API for image processing
- FileReader API for file handling
- Vanilla JavaScript (no dependencies)
- Modern CSS with glassmorphism effects

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

To run locally:

1. Clone the repository
2. Open `index.html` in a modern browser
3. No build process required!

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, please contact support or open an issue on GitHub.

---

**Made with ❤️ for converting encrypted files to images**
