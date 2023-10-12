const express = require('express')
const puppeteer = require("puppeteer");
var pdf = require('html-pdf');
var options = { format: 'Letter' };

const router = express.Router()

const root = __dirname.replace("/routes", "")

console.log(root)

router.post("/generate", async (req, res) => {
    const { view, url } = req.body

    if (view) {
        const fileName = `pdf_${Date.now()}`
        pdf.create(view, options).toFile(`varada_pdfs/${fileName}.pdf`, function (err, pdfData) {
            if (err) {
                return res.status(500).send({
                    error: "Fail to generate pdf for this view"
                }).end()
            }
            return res.status(201).download(`${root}/varada_pdfs/${fileName}.pdf`)
        });
    }
    else if (url) {
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = await browser.newPage();
        await page.goto(
            url,
            {
                waitUntil: "networkidle2",
            }
        );
        const fileName = `pdf_${Date.now()}`
        await page.setViewport({ width: 1680, height: 1050 });
        await page.pdf({
            path: `varada_pdfs/${fileName}.pdf`,
            format: "A4",
        });

        await browser.close();
        return res.status(201).download(`${root}/varada_pdfs/${fileName}.pdf`)
    } else {
        return res.status(404).send({
            "error": "Invalid request"
        }).end()
    }
})

module.exports = router;