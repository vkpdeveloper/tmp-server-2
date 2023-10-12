const express = require("express");
const Setting = require("./models/settings");
const PaytmChecksum = require("./PaytmChecksum");
const https = require('https')

const router = express.Router();

const MID = "aRDnGA97365343429931";
const MKEY = "UX3CASx9VdwU7PEh";

router.post("/generate_checksum", async (req, res) => {
    try {
        const { orderId } = req.body;
        var paytmParams = {};

        paytmParams.body = {
            "requestType": "Payment",
            "mid": MID,
            "websiteName": "WEBSTAGING",
            "orderId": orderId,
            "callbackUrl": `https://securegw-stage.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`,
            "txnAmount": {
                "value": "50000.00",
                "currency": "INR",
            },
            "userInfo": {
                "custId": "CUST_001",
            },
        };
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), MKEY).then(function (checksum) {

            paytmParams.head = {
                "signature": checksum
            };

            var post_data = JSON.stringify(paytmParams);

            var options = {
                hostname: 'securegw-stage.paytm.in',
                port: 443,
                path: `/theia/api/v1/initiateTransaction?mid=${MID}&orderId=${orderId}`,
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

                post_res.on('end', function () {
                    res.send({
                        success: true,
                        data: JSON.parse(response),
                    }).end();
                });
            });

            post_req.write(post_data);
            post_req.end();
        });

    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.toString()
        }).end();
    }
});

module.exports = router;