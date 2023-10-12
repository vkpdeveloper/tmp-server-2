const { default: axios } = require('axios');
const PaytmChecksum = require('../PaytmChecksum');
const Refund = require('../models/refunds');
const https = require('https');
const SMSSender = require("../controllers/sms_sender");
var onesignalClient = require('onesignal')('ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh', 'b2bd55f4-f3dd-4cf2-b864-addd87e025a9', true);

const router = require('express').Router();

const MID = "DowWxR60940876436897";
const MKEY = "dDy3XO#jMCQ6IN88";

let dbConnection;

const smsSender = new SMSSender();

const SODEXO_API_KEY = "RZOkQKwfB5AsRog6zF981vHdMr3hMN7aMfHzcdx1lGfLWlXE37gL6DmHXHG5C4Aa";
const SODEXO_API_PRE_PROD_URL = "https://pay.gw.zetapay.in";

function generateNotificationMessage(username, orderId, amount) {
    return `Hey ${username}, Your refund of ${amount} rupees for your order SB-${orderId} has been refunded.`
}

router.post("/paytm", async (req, res) => {
    try {
        const { amount, orderId, mid, id, storeId } = req.body;
        // console.log(req.body)
        if (amount && orderId && mid) {
            if (mid === MID) {
                var paytmParams = {};
                paytmParams.body = {

                    /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
                    "mid": MID,

                    /* Enter your order id which needs to be check status for */
                    "orderId": orderId,
                };

                /**
                * Generate checksum by parameters we have in body
                * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
                */
                PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MKEY).then(function (checksum) {
                    /* head parameters */
                    paytmParams.head = {

                        /* put generated checksum value here */
                        "signature": checksum
                    };

                    /* prepare JSON string for request */
                    var post_data = JSON.stringify(paytmParams);

                    var options = {

                        /* for Staging */
                        hostname: 'securegw.paytm.in',

                        /* for Production */
                        // hostname: 'securegw.paytm.in',

                        port: 443,
                        path: '/v3/order/status',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': post_data.length
                        }
                    };

                    // Set up the request
                    var response = "";
                    var post_req = https.request(options, function (post_res) {
                        post_res.on('data', function (chunk) {
                            response += chunk;
                        });

                        post_res.on('end', function () {
                            response = JSON.parse(response)
                            // console.log("I AM START REPORT: ", response);
                            const requestBody = {
                                mid: MID,
                                txnType: "REFUND",
                                orderId: orderId,
                                txnId: response.body.txnId,
                                refId: `REFUND_${orderId}_${Date.now().toString()}`,
                                refundAmount: amount,
                            };
                            paytmParams.body = requestBody;
                            PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MKEY).then(function (checksum) {

                                paytmParams.head = {
                                    "signature": checksum
                                };

                                var post_data = JSON.stringify(paytmParams);

                                var options = {

                                    /* for Staging */
                                    hostname: 'securegw.paytm.in',

                                    /* for Production */
                                    // hostname: 'securegw.paytm.in',

                                    port: 443,
                                    path: '/refund/apply',
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Content-Length': post_data.length
                                    }
                                };

                                var response = "";
                                var post_req = https.request(options, function (post_res) {
                                    post_res.on('data', function (chunk) {
                                        response += chunk;
                                    });

                                    post_res.on('end', async function () {
                                        response = JSON.parse(response)
                                        // console.log("I AM END REPORT: ", response);
                                        console.log(typeof response.body.resultInfo.resultCode)
                                        if (response.body.resultInfo.resultCode === '601') {
                                            const createRefund = new Refund({
                                                refundId: `REFUNDID_${orderId}`,
                                                orderId: orderId,
                                                amount: amount
                                            }
                                            )
                                            await createRefund.save();
                                            const requestChange = `id=${id}&status=${JSON.stringify([
                                                {
                                                    id: storeId,
                                                    for: "fleet_manager",
                                                    status: "Refunded"
                                                }
                                            ])}`;
                                            // console.log(requestChange)
                                            const updateRes = await axios.post("http://devapi.sampurna-bazaar.com/orders/editList", requestChange, {
                                                headers: {
                                                    "Basic": "123456789",
                                                    "content-type": "application/x-www-form-urlencoded"
                                                }
                                            });
                                            if (updateRes) {
                                                dbConnection.query("SELECT * FROM `orders` WHERE id = ?", [id], async (err, results, fields) => {
                                                    if (!err && results.length > 0) {
                                                        const order = results[0];
                                                        const userId = order['uid'];
                                                        dbConnection.query("SELECT * FROM `users` WHERE id = ?", [userId], async (err, results, fields) => {
                                                            // console.log(err);
                                                            if (!err && results.length > 0) {
                                                                // console.log(results[0]);
                                                                const user = results[0];
                                                                const token = user['fcm_token'];
                                                                const username = user['first_name'];
                                                                const notificationMessage = generateNotificationMessage(username, id, amount);
                                                                const notificationRes = await onesignalClient.createNotification(notificationMessage, {
                                                                    orderId: orderId,
                                                                    username: username
                                                                }, [
                                                                    token
                                                                ]);
                                                                // console.log(notificationRes)
                                                            }
                                                        });

                                                    }
                                                })
                                            }
                                        }

                                        res.send({
                                            success: true,
                                            response: response
                                        })
                                    });
                                });

                                post_req.write(post_data);
                                post_req.end();
                            });
                        });
                    });

                    // post the data
                    post_req.write(post_data);
                    post_req.end();
                });
            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Auth failed"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server fail",
                message: "Your IP is monitored",
                info: "Auth failed"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.toString()
        }).end();
    }
})

router.post("/paytm/status", async (req, res) => {
    // console.log(req.body);
})

router.post("/sodexo", async (req, res) => {
    try {
        const { amount, orderId, mid, id, storeId } = req.body;
        // console.log(req.body)
        if (amount && orderId && mid) {
            if (mid === MID) {
                const head = {
                    "apiKey": SODEXO_API_KEY,
                    "Content-Type": "application/json"
                }
                // console.log(head);
                let transactionId = "";
                const transactionInfo = await axios.get(`${SODEXO_API_PRE_PROD_URL}/v1.0/sodexo/transactions/request_id/${orderId}`, {
                    headers: head
                });
                // console.log(transactionInfo.data);
                if (transactionInfo.status === 200) {
                    transactionId = transactionInfo.data['transactionId']

                    const refId = "ref_sb_" + Date.now();
                    const requestBody = {
                        "requestId": refId,
                        "amount": {
                            "currency": "INR",
                            "value": amount
                        },
                        "transactionId": transactionId,
                        "purposes": [
                            {
                                "purpose": "FOOD",
                                "amount": {
                                    "currency": "INR",
                                    "value": amount
                                }
                            }
                        ]
                    }
                    const response = await axios.post(`https://pay.gw.zetapay.in/v2.0/sodexo/transactions/refund`, requestBody, {
                        headers: head
                    });
                    // console.log(response.data);
                    if (response.data.refundTransactionId) {
                        const createRefund = new Refund({
                            refundId: response.data.purchaseTransactionId,
                            orderId: orderId,
                            amount: amount
                        }
                        )
                        await createRefund.save();
                        const requestChange = `id=${id}&status=${JSON.stringify([
                            {
                                id: storeId,
                                for: "fleet_manager",
                                status: "Refund Initiated"
                            }
                        ])}`;
                        // console.log(requestChange)
                        const updateRes = await axios.post("http://devapi.sampurna-bazaar.com/orders/editList", requestChange, {
                            headers: {
                                "Basic": "123456789",
                                "content-type": "application/x-www-form-urlencoded"
                            }
                        });
                        res.send(
                            {
                                success: true,
                                response: response.data
                            }
                        )
                    } else {
                        res.send(
                            {
                                success: false,
                                response: "response.data.refundTransactionId"
                            }
                        )
                    }
                } else {
                    res.send(
                        {
                            success: false,
                            response: transactionInfo.data
                        }
                    )
                }


            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Auth failed"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server fail",
                message: "Your IP is monitored",
                info: "Auth failed"
            }).end();
        }
    } catch (e) {
        // console.log(e)
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.response.data
        }).end();
    }
})

module.exports = (connection) => {
    dbConnection = connection;
    return router;
};