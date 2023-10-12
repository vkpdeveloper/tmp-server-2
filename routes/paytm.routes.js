const { Router } = require('express');
const Paytm = require('paytm-pg-node-sdk');

const router = Router()

const environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;

const mid = process.env.PAYTM_MID;
const key = process.env.PAYTM_MKEY;
const website = "DEFAULT";
Paytm.MerchantProperties.initialize(environment, mid, key, website);

router.post('/', async (req, res) => {
    const { userId, amount } = req.body

    const orderId = `SBO-${new Date(Date.now()).getTime().toString().substring(6, 12)}`

    const callbackUrl = `https://securegw.paytm.in/theia/paytmCallback?ORDER_ID=${orderId}`;

    Paytm.MerchantProperties.setCallbackUrl(callbackUrl);

    const channelId = Paytm.EChannelId.WAP;
    const txnAmount = Paytm.Money.constructWithCurrencyAndValue(Paytm.EnumCurrency.INR, amount);
    const userInfo = new Paytm.UserInfo(userId);
    const paymentDetailBuilder = new Paytm.PaymentDetailBuilder(channelId, orderId, txnAmount, userInfo);
    const paymentDetail = paymentDetailBuilder.build();

    try {
        const response = await Paytm.Payment.createTxnToken(paymentDetail);
        if (response) {
            const txnToken = response.responseObject.body.txnToken
            return res.status(201).send({
                success: true,
                info: {
                    orderId: orderId,
                    txnToken: txnToken
                }
            })
        } else {
            return res.status(500).send({
                status: false
            })
        }
    } catch (e) {
        return res.status(500).send({
            status: false
        })
    }

})

module.exports = router