const express = require("express");
const Paytm = require('paytm-pg-node-sdk');

const enviornment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT

const mid = "DowWxR60940876436897";
const key = "dDy3XO#jMCQ6IN88";
const website = "https://sampurna-bazaar.com";
// const clientId = "YOUR_CLIENT_ID_HERE";

Paytm.MerchantProperties.initialize(enviornment, mid, key, website)
// const Connection = require("mysql2/lib/");

const router = express.Router();
let db

const updaterToken = "c0eae07ce4bd81b4000636dab974769c8a27cd49";

function generateRandom(min = 10000, max = 99999) {

    // find diff
    let difference = max - min;

    // generate random number 
    let rand = Math.random();

    // multiply with difference 
    rand = Math.floor(rand * difference);

    // add with min value 
    rand = rand + min;

    return rand;
}

router.post("/create-pending-order", async (req, res) => {

    try {
        const { uid, store_id, date_time, paid_method, order_to, orders, notes, address, gst_type, total, tax, grand_total, delivery_charge, coupon_code, discount, product_order_status, pay_key } = req.body

        if (uid && store_id) {

            let todaysDate = new Date(Date.now())
            let currentYear = todaysDate.getFullYear()
            let currentMonth = todaysDate.getMonth() + 1

            let orderId;

            if (pay_key) {
                orderId = pay_key
            } else {
                while (!orderId) {
                    let possibleOrderId = `OID-SB/${currentMonth}/${currentYear}/${generateRandom()}`
                    let [rows, fields] = await db.execute("SELECT id FROM orders WHERE pay_key = ?", possibleOrderId)
                    if (rows.length === 0) {
                        orderId = possibleOrderId
                    } else {
                        continue
                    }
                }
            }

            const status = [
                {
                    id: store_id,
                    status: "Payment Processing"
                }
            ]

            const order_data = {
                uid: uid,
                store_id: store_id,
                date_time: date_time,
                paid_method: paid_method,
                order_to: order_to,
                inv_no: 0,
                orders: orders,
                notes: notes,
                address: address,
                driver_id: "",
                gst_type: gst_type,
                total: total,
                tax: tax,
                grand_total: grand_total,
                delivery_charge: delivery_charge,
                coupon_code: coupon_code,
                discount: discount,
                pay_key: orderId,
                status: JSON.stringify(status),
                assignee: "",
                product_order_status: product_order_status,
            };

            const response = await db.execute("INSERT INTO orders SET ?", [order_data])

            if (response) {

                return res.status(201).send({
                    message: "Pending Order Created",
                    orderId: orderId
                })
            } else {
                return res.status(400).send({
                    error: "Bad request"
                })
            }
        } else {
            return res.status(400).send({
                error: "Bad request"
            })
        }

    } catch (e) {
        return res.status(500).send({
            message: e.toString()
        })
    }

})

router.post('/process-order', async (req, res) => {
    try {
        const { orderId } = req.body
        if (orderId) {
            const [orders, _] = await db.execute("SELECT * FROM orders WHERE pay_key = ? LIMIT 1", [orderId])
            if (orders.length != 0) {
                const order = orders[0]
                if (order) {
                    const payKey = order['pay_key']
                    const acutalOrderId = order['id']
                    const paymentStatusBuilder = new Paytm.PaymentStatusDetailBuilder(payKey)
                    const paymentStatusDetail = paymentStatusBuilder.setReadTimeout(80000).build()
                    const paymentStatusResponse = await Paytm.Payment.getPaymentStatus(paymentStatusDetail)
                    if (paymentStatusResponse) {
                        const { responseObject } = paymentStatusResponse
                        const { resultInfo: {
                            resultStatus: TXN_STATUS
                        }, paymentMode } = responseObject['body']
                        if (TXN_STATUS === Paytm.LibraryConstants.TXN_SUCCESS_STATUS) {
                            const newOrderStatus = [{ id: order.store_id, status: "New Order", for: "fleet_manager" }]
                            const updateableValues = {
                                paid_method: `${order['paid_method']}-${paymentMode}`,
                                status: JSON.stringify(newOrderStatus)
                            }
                            const [response] = await db.execute("UPDATE orders SET paid_method = ?, status = ? WHERE id = ?", [updateableValues.paid_method, updateableValues.status, acutalOrderId])
                            if (response) {
                                return res.status(201).send({
                                    message: "order created successfully"
                                })
                            } else {
                                return res.status(500).send({
                                    message: "order creation failed"
                                })
                            }
                        } else {
                            const paymentFailedStatus = [{ id: order.store_id, status: "Payment failed" }]
                            const updateableValues = {
                                status: JSON.stringify(paymentFailedStatus)
                            }
                            const [response] = await db.execute("UPDATE orders SET status = ? WHERE id = ?", [updateableValues.status, acutalOrderId])
                            if (response) {
                                return res.status(402).send({
                                    message: "payment failed"
                                })
                            } else {
                                return res.status(402).send({
                                    message: "payment failed"
                                })
                            }
                        }

                    } else {
                        return res.status(404).send({
                            error: "Order ID not found"
                        })
                    }
                } else {
                    return res.status(404).send({
                        error: "Order ID not found"
                    })
                }
            } else {
                return res.status(404).send({
                    error: "Order ID not found"
                })
            }
        } else {
            return res.status(404).send({
                error: "Order ID not found"
            })
        }
    } catch (e) {
        return res.status(500).send({
            message: e.toString()
        })
    }
})

router.post('/payment-success-hook', async (req, res) => {

    console.log(req.body)
    console.log(req.query)
    console.log(req.params)

    return res.status(200).send({
        message: "We are done"
    })

})

module.exports = (connection) => {
    db = connection
    return router
}