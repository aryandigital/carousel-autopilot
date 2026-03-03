// ============================================
// PDF Assembler — Combine Slides into Carousel PDF
// ============================================
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Assemble slide images into a single PDF for LinkedIn carousel
 * @param {string[]} imagePaths - Paths to slide images
 * @param {string} outputPath - Path for the output PDF
 * @returns {Promise<string>} Path to generated PDF
 */
async function assemblePDF(imagePaths, outputPath) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 PDF ASSEMBLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const pdfDoc = await PDFDocument.create();

    // LinkedIn carousel optimal dimensions: 1080 × 1350 (4:5 portrait)
    const PAGE_WIDTH = 1080;
    const PAGE_HEIGHT = 1350;

    for (let i = 0; i < imagePaths.length; i++) {
        const imgPath = imagePaths[i];
        console.log(`   Adding slide ${i + 1}/${imagePaths.length}...`);

        // Ensure image is PNG and correct dimensions
        const resizedBuffer = await sharp(imgPath)
            .resize(PAGE_WIDTH, PAGE_HEIGHT, { fit: 'cover' })
            .png()
            .toBuffer();

        const pngImage = await pdfDoc.embedPng(resizedBuffer);
        const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
        });
    }

    const pdfBytes = await pdfDoc.save();

    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBytes);

    const sizeMB = (pdfBytes.length / (1024 * 1024)).toFixed(2);
    console.log(`\n   ✅ PDF created: ${outputPath}`);
    console.log(`   📏 Size: ${sizeMB} MB (${imagePaths.length} slides)`);

    return outputPath;
}

module.exports = { assemblePDF };
