const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto-js');
const app = express();

app.use(bodyParser.json());
/* GET home page. */
router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" })
})

/* GET hello world */
router.get("/hello", function (req, res, next) {
    res.send("Hello World")
})

//綠界全方位金流技術文件： https://developers.ecpay.com.tw/?p=2509

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
const APIURL = `https://payment${stage}.ecpay.com.tw//Cashier/AioCheckOut/V5`
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
console.log("🚀 - CheckMacValue:", CheckMacValue)

//五、將所有的參數製作成 payload
const AllParams = { ...ParamsBeforeCMV, CheckMacValue }
const inputs = Object.entries(AllParams)
    .map(function (param) {
        return `<input name=${param[0]} value="${param[1].toString()}"><br/>`
    })
    .join("")

//六、製作送出畫面
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>全方位金流測試</title>
</head>
<body>
    <form method="post" action="${APIURL}">
${inputs}
<input type ="submit" value = "送出參數">
    </form>
</body>
</html>
`

//七、製作出 index.html
const fs = require("fs")

fs.writeFile("index.html", htmlContent, err => {
    if (err) {
        console.error("寫入檔案時發生錯誤:", err)
    } else {
        console.log("已建立 index.html")
        import("open")
            .then(open => {
                open.default("index.html")
            })
            .catch(error => {
                console.error("錯誤！", error)
            })
    }
})

module.exports = router
