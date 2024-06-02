const express = require("express")
const router = express.Router()
const cors = require("cors")
const crypto = require("crypto")
const axios = require("axios")
const ecpay_payment = require("ecpay_aio_nodejs")

const { MERCHANTID, HASHKEY, HASHIV, HOST } = process.env

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
let TradeNo
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
const AllParams = { ...ParamsBeforeCMV, CheckMacValue }

//五、將所有的參數製作成 payload
const options = {
    OperationMode: "Test", //Test or Production
    MercProfile: {
        MerchantID: MERCHANTID,
        HashKey: HASHKEY,
        HashIV: HASHIV,
    },
    IgnorePayment: [
        //    "Credit",
        //    "WebATM",
        //    "ATM",
        //    "CVS",
        //    "BARCODE",
        //    "AndroidPay"
    ],
    IsProjectContractor: false,
}

router.get("/test", async (req, res) => {
    const MerchantTradeDate = new Date().toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "UTC",
    })
    TradeNo = "test" + new Date().getTime()
    let base_param = {
        MerchantTradeNo: TradeNo, //請帶20碼uid, ex: f0a0d7e9fae1bb72bc93
        MerchantTradeDate,
        TotalAmount: "100",
        TradeDesc: "測試交易描述",
        ItemName: "測試商品等",
        ReturnURL: `${HOST}/return`,
        ClientBackURL: `${HOST}/clientReturn`,
    }
    TradeNo = "test" + new Date().getTime()

    // try {
    //     const response = await axios.post(APIURL, new URLSearchParams(AllParams), {
    //         headers: {
    //             "Content-Type": "application/x-www-form-urlencoded",
    //         },
    //     })
    //     console.log("🚀 - response.data:", response.data)
    //     res.send(response.data)
    // } catch (error) {
    //     console.error(error)
    //     res.status(500).send("Error processing payment")
    // }
    const create = new ecpay_payment(options)

    // 注意：在此事直接提供 html + js 直接觸發的範例，直接從前端觸發付款行為
    const htm = create.payment_client.aio_check_out_all(base_param)
    console.log(htm)

    res.render("index", {
        title: "Express",
        htm,
    })
})

// router.post("/payment/callback", (req, res) => {
//     // 處理綠界金流的回調通知
//     console.log(req.body)
//     // 根據回調通知的內容更新訂單狀態等操作
//     res.send("OK")
// })

// 後端接收綠界回傳的資料
router.post("/return", async (req, res) => {
    console.log("req.body:", req.body)

    const { CheckMacValue } = req.body
    const data = { ...req.body }
    delete data.CheckMacValue // 此段不驗證

    const create = new ecpay_payment(options)
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data)

    console.log("確認交易正確性：", CheckMacValue === checkValue, CheckMacValue, checkValue)

    // 交易成功後，需要回傳 1|OK 給綠界
    res.send("1|OK")
})

// 用戶交易完成後的轉址
router.get("/clientReturn", (req, res) => {
    console.log("clientReturn:", req.body, req.query)
    res.render("return", { query: req.query })
})

module.exports = router
