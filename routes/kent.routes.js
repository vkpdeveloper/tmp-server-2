const express = require("express");

const router = express.Router();

router.post("/recognition", (req, res) => {

    console.log(req.body)
    console.log(req.headers)
    res.status(200).send({})

})


module.exports = router;