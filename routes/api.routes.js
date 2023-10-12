const express = require("express");
const multer = require("multer");
const path = require("path")

const router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads"));
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + file.originalname);
    },
});

var upload = multer({ storage: storage });

router.post("/upload-tags", upload("file"), async (req, res) => {

})

export default router;