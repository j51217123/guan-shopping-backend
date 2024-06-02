const express = require("express")
const bodyParser = require("body-parser")
const crypto = require("crypto-js")
const app = express()
var router = express.Router()

app.use(bodyParser.json())

const MerchantID = "3002607" //必填
const HashKey = "pwFHCqoQZGmho4w6" //3002607
const HashIV = "EkRm7iFT261dpevs" //3002607
const isStage = true // 測試環境： true；正式環境：false

const stage = isStage ? "-stage" : ""
const algorithm = "sha256"
const digest = "hex"
const APIURL = `https://payment${stage}.ecpay.com.tw//Cashier/AioCheckOut/V5`

function CheckMacValueGen(parameters, algorithm, digest) {
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

app.post("/generatePaymentForm", (req, res) => {
    const { TotalAmount, TradeDesc, ItemName, ReturnURL, ChoosePayment } = req.body

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

    const CheckMacValue = CheckMacValueGen(ParamsBeforeCMV, algorithm, digest)

    const AllParams = { ...ParamsBeforeCMV, CheckMacValue }
    const inputs = Object.entries(AllParams)
        .map(function (param) {
            return `<input name="${param[0]}" value="${param[1].toString()}"><br/>`
        })
        .join("")

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>全方位金流測試</title>
</head>
<body>
    <form method="post" action="${APIURL}">
${inputs}
<input type="submit" value="送出參數">
    </form>
</body>
</html>
`

    res.send(htmlContent)
})

module.exports = router
