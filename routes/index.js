const express = require("express")
const router = express.Router()
const cors = require("cors")

const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200,
    header: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
}

router.use(cors(corsOptions))

/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express oviss2" })
})

const data = [
    {
        user: 'ovis',
        age: 22
    },
    {
        user:'jenny',
        age: 24
    }
]

router.get("/test", (req,res) => {
    res.send(data)
})

module.exports = router
