const { Router } = require("express")

const router = Router()


router.get("/new-users", (req, res) => {
    res.send({
        users: 20
    })
})


module.exports = router