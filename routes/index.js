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
const ReturnURL = "https://guan-shopping-backend.zeabur.app/payment/callback"
const ChoosePayment = "ALL"

////////////////////////以下參數不用改////////////////////////
const stage = isStage ? "-stage" : ""
const algorithm = "sha256"
const digest = "hex"
const APIURL = `https://payment${isStage ? "-stage" : ""}.ecpay.com.tw/Cashier/AioCheckOut/V5`
const MerchantTradeNo = `od${new Date().getFullYear()}${(new Date().getMonth() + 1)
    .toString()
    .padStart(2, "0")}${new Date().getDate().toString().padStart(2, "0")}${new Date()
    .getHours()
    .toString()
    .padStart(2, "0")}${new Date().getMinutes().toString().padStart(2, "0")}${new Date()
    .getSeconds()
    .toString()
    .padStart(2, "0")}${new Date().getMilliseconds().toString().padStart(2, "0")}`

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
// let ParamsBeforeCMV = {
//     MerchantID: MerchantID,
//     MerchantTradeNo: MerchantTradeNo,
//     MerchantTradeDate: MerchantTradeDate.toString(),
//     PaymentType: "aio",
//     EncryptType: 1,
//     TotalAmount: TotalAmount,
//     TradeDesc: TradeDesc,
//     ItemName: ItemName,
//     ReturnURL: ReturnURL,
//     ChoosePayment: ChoosePayment,
// }

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
// const CheckMacValue = CheckMacValueGen(ParamsBeforeCMV, algorithm, digest)

//五、將所有的參數製作成 payload
// const AllParams = { ...ParamsBeforeCMV, CheckMacValue }
// const inputs = Object.entries(AllParams)
//     .map(function (param) {
//         return `<input name=${param[0]} value="${param[1].toString()}"><br/>`
//     })
//     .join("")

// router.get("/test", async (req, res) => {
//     try {
//         const response = await axios.post(APIURL, new URLSearchParams(AllParams), {
//             headers: {
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//         })
//         res.send(response.data)
//         console.log("🚀 - response.data:", response.data)
//     } catch (error) {
//         console.error(error)
//         res.status(500).send("Error processing payment")
//     }
// })

//六、製作送出畫面
// const htmlContent = `
// <!DOCTYPE html>
// <html>
// <head>
//     <title>全方位金流測試</title>
// </head>
// <body>
//     <form method="post" action="${APIURL}">
// ${inputs}
// <input type ="submit" value = "送出參數">
//     </form>
// </body>
// </html>
// `

router.get("/test", async (req, res) => {
    const { totalAmount, tradeDesc, itemName } = req.query
    let ParamsBeforeCMV = {
        MerchantID: MerchantID,
        MerchantTradeNo: MerchantTradeNo,
        MerchantTradeDate: MerchantTradeDate.toString(),
        PaymentType: "aio",
        EncryptType: 1,
        TotalAmount: totalAmount,
        TradeDesc: tradeDesc,
        ItemName: itemName,
        ReturnURL: ReturnURL,
        ChoosePayment: ChoosePayment,
        ClientBackURL: "https://guan-shopping-web.web.app/payment-result",
    }

    const CheckMacValue = CheckMacValueGen(ParamsBeforeCMV, algorithm, digest)
    const AllParams = { ...ParamsBeforeCMV, CheckMacValue }
    const inputs = Object.entries(AllParams)
    .map(function (param) {
        return `<input name=${param[0]} value="${param[1].toString()}"><br/>`
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
        <input type ="submit" value = "送出參數">
            </form>
        </body>
        </html>
    `

    try {
        res.set('Access-Control-Allow-Origin', '*')
        res.set('Content-Type', 'text/html; charset=utf-8')
        console.log("🚀 - htmlContent:", htmlContent)
        res.send(htmlContent)
    } catch (error) {
        console.error(error)
        res.status(500).send("Error processing payment")
    }
})



// //七、製作出 index.html
// const fs = require("fs")

// fs.writeFile("index.html", htmlContent, err => {
//     if (err) {
//         console.error("寫入檔案時發生錯誤:", err)
//     } else {
//         console.log("已建立 index.html")
//         import("open")
//             .then(open => {
//                 open.default("index.html")
//             })
//             .catch(error => {
//                 console.error("錯誤！", error)
//             })
//     }
// })



router.post("/payment/callback", (req, res) => {
    // 處理綠界金流的回調通知
    console.log(req.body)
    // 根據回調通知的內容更新訂單狀態等操作
    res.send("OK")
})

module.exports = router
