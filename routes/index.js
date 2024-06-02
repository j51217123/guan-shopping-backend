const express = require("express")
const router = express.Router()
const cors = require("cors")
const crypto = require("crypto")
const axios = require("axios")

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
    res.render("index", { title: "Express" })
})

const data = [
    {
        user: "ovis",
        age: 22,
    },
    {
        user: "jenny",
        age: 24,
    },
]

// router.get("/test", (req, res) => {
//     res.send(data)
// })

////////////////////////改以下參數即可////////////////////////
//一、選擇帳號，是否為測試環境
const MerchantID = "3002607" //必填
const HashKey = "pwFHCqoQZGmho4w6" //3002607
const HashIV = "EkRm7iFT261dpevs" //3002607
let isStage = true // 測試環境： true；正式環境：false

//二、輸入參數
const TotalAmount = "100"
const TradeDesc = "測試敘述"
const ItemName = "測試名稱"
const ReturnURL = "https://www.ecpay.com.tw"
const ChoosePayment = "ALL"

////////////////////////以下參數不用改////////////////////////
const stage = isStage ? "-stage" : ""
const algorithm = "sha256"
const digest = "hex"
const APIURL = `https://payment${isStage ? "-stage" : ""}.ecpay.com.tw/Cashier/AioCheckOut/V5`
const MerchantTradeNo = `od${Date.now()}`

const MerchantTradeDate = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
})

//三、計算 CheckMacValue 之前
let ParamsBeforeCMV = {
    MerchantID: MerchantID,
    MerchantTradeNo: MerchantTradeNo,
    MerchantTradeDate: MerchantTradeDate.toString(),
    PaymentType: "aio",
    EncryptType: 1,
    TotalAmount: TotalAmount,
    TradeDesc: TradeDesc,
    ItemName: ItemName,
    ReturnURL: ReturnURL,
    ChoosePayment: ChoosePayment,
}

//四、計算 CheckMacValue
function CheckMacValueGen(parameters, algorithm, digest) {
    const crypto = require("crypto")
    let Step0

    Step0 = Object.entries(parameters)
        .map(([key, value]) => `${key}=${value}`)
        .join("&")

    function DotNETURLEncode(string) {
        const list = {
            "%2D": "-",
            "%5F": "_",
            "%2E": ".",
            "%21": "!",
            "%2A": "*",
            "%28": "(",
            "%29": ")",
            "%20": "+",
        }

        Object.entries(list).forEach(([encoded, decoded]) => {
            const regex = new RegExp(encoded, "g")
            string = string.replace(regex, decoded)
        })

        return string
    }

    const Step1 = Step0.split("&")
        .sort((a, b) => {
            const keyA = a.split("=")[0]
            const keyB = b.split("=")[0]
            return keyA.localeCompare(keyB)
        })
        .join("&")
    const Step2 = `HashKey=${HashKey}&${Step1}&HashIV=${HashIV}`
    const Step3 = DotNETURLEncode(encodeURIComponent(Step2))
    const Step4 = Step3.toLowerCase()
    const Step5 = crypto.createHash(algorithm).update(Step4).digest(digest)
    const Step6 = Step5.toUpperCase()
    return Step6
}
const CheckMacValue = CheckMacValueGen(ParamsBeforeCMV, algorithm, digest)

//五、將所有的參數製作成 payload
const AllParams = { ...ParamsBeforeCMV, CheckMacValue }

router.get("/test", async (req, res) => {
    try {
        const response = await axios.post(APIURL, new URLSearchParams(AllParams), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        res.send(response.data)
    } catch (error) {
        console.error(error)
        res.status(500).send("Error processing payment")
    }
})

module.exports = router
