const express = require("express");
const axios = require("axios");
const { connection } = require("mongoose");
const timeslotParser = require('../parsers/timeslot')
const cron = require('node-cron')
const WeFast = require("../controllers/wefast")
const fs = require("fs");
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path')
var onesignalClient = require('onesignal')('ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh', 'b2bd55f4-f3dd-4cf2-b864-addd87e025a9', true);
const googleMapsClient = require('@googlemaps/google-maps-services-js')
const APIKEY = "AIzaSyC2Yk_n3UroTovF5Zvx_NvWab3C4XoQ7DE";
const client = new googleMapsClient.Client();
const moment = require('moment')

client.geocode({
    params: {
        key: APIKEY,
        address: `272155 Uttar Pradesh`,
        components: "postal_code",
        region: "IN"
    }
}).then(data => {
    // console.log(data.data.results[0].address_components)
})


// googleMapsClient.findPlace({
//     input: "Kumar Princetown",
//     fields: ["formatted_address"]
// }).asPromise()
//     .then(function (r) {
//         console.log(r);
//     })
//     .catch(e => {
//         console.log(e);
//     });

const router = express.Router();

const updaterToken = "c0eae07ce4bd81b4000636dab974769c8a27cd49";

const appToken = "123456789"

const weFastBaseUrl = "https://robot-in.borzodelivery.com/api/business/1.1";
const weFastToken = "3D1B4D88DF78CFAA66E9F479B035ADECE2AE2E83";

// const weFastBaseUrl = "https://robot-in.borzodelivery.com/api/business/1.1";
// const weFastToken = "AD4BE1BC3033673135BD76BD787EB3A9D6B404CA";

const weFast = new WeFast();

let dbConnection;

const generateNotificationMessage = (status, courier, id, delivery_id) => {
    if (status === "courier_assigned") {
        return `Dear Team, Order Id ${id} assigned to ${courier.name} ${courier.surname}. Get his details from the phone. Delivery Id: ${delivery_id}`;
    } else if (status === "courier_departed") {
        return `Dear Team, Delivery boy departed to the pick-up point. Delivery Id: ${delivery_id}.`
    } else if (status === "parcel_picked_up") {
        return `Dear Team, Package picked by the delivery boy. Delivery Id: ${delivery_id}.`
    } else if (status === "completed") {
        return `Dear Team, Order #${id} delivered successfully by ${courier.name} ${courier.surname}. Delivery Id: ${delivery_id}.`
    } else {
        return false;
    }
}

router.post("/calculate-order", async (req, res) => {
    try {
        const endPoint = "/calculate-order";
        const { token } = req.headers;
        if (token === appToken) {
            const response = await axios.default.post(`${weFastBaseUrl}${endPoint}`, req.body, {
                headers: {
                    "X-DV-Auth-Token": weFastToken
                }
            })
            if (response) {
                res.status(response.status).send({
                    success: true,
                    response: response.data
                })
            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Some error occured"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.response.data
        }).end();
    }
})

router.post("/create-order", async (req, res) => {
    try {
        const endPoint = "/create-order";
        const { token } = req.headers;
        if (token === appToken) {
            const response = await axios.default.post(`${weFastBaseUrl}${endPoint}`, req.body, {
                headers: {
                    "X-DV-Auth-Token": weFastToken
                }
            })
            if (response) {
                res.status(response.status).send({
                    success: true,
                    response: response.data
                })
            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Some error occured"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.response.data
        }).end();
    }
})


router.post("/cancel-order", async (req, res) => {
    try {
        const endPoint = "/cancel-order";
        const { token } = req.headers;
        if (token === appToken) {
            const response = await axios.default.post(`${weFastBaseUrl}${endPoint}`, req.body, {
                headers: {
                    "X-DV-Auth-Token": weFastToken
                }
            })
            if (response) {
                res.status(response.status).send({
                    success: true,
                    response: response.data
                })
            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Some error occured"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.response.data
        }).end();
    }
})

router.get("/courier", async (req, res) => {
    try {
        const endPoint = `/courier?order_id=${req.query.order_id}`;
        const { token } = req.headers;
        if (token === appToken) {
            const response = await axios.default.get(`${weFastBaseUrl}${endPoint}`, {
                headers: {
                    "X-DV-Auth-Token": weFastToken
                }
            })
            if (response) {
                res.status(response.status).send({
                    success: true,
                    response: response.data
                })
            } else {
                res.send({
                    success: false,
                    error: "Server fail",
                    message: "Your IP is monitored",
                    info: "Some error occured"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.response.data
        }).end();
    }
})

function toTimeZone(time, zone) {
    var format = 'YYYY/MM/DD HH:mm:ss';
    return moment(time, format).tz(zone).format(format);
}

router.post("/create-delivery", (req, res) => {
    try {
        const { orderId } = req.body;
        console.log(orderId);
        if (orderId) {
            var options = { sql: 'SELECT * FROM orders JOIN users ON orders.uid=users.id WHERE orders.id = ?', nestTables: true, values: orderId };
            dbConnection.query(options, async (err, results, fields) => {
                if (!err) {
                    const { orders, users } = results[0];
                    const address = JSON.parse(orders.address);
                    if (orders.date_time) {
                        let currentDate = toTimeZone(new Date(Date.now()), "Asia/Kolkata");
                        const deliveryDataObject = {
                            delivery_id: 0,
                            provider: "wefast",
                            delivery_boy_name: "",
                            delivery_boy_phone: "",
                            delivery_boy_profile: "",
                            order_status: "created",
                            delivery_status: "created",
                            is_delivered: 0,
                            address: address.address,
                            order_id: orders.id,
                            uid: orders.uid,
                            total_payment: 0,
                            tracking_url: "",
                            created_on: currentDate
                        };
                        dbConnection.query("INSERT INTO deliveries SET ?", deliveryDataObject, async (err, results, fields) => {
                            if (!err) {
                                const response = await weFast.placeOrder(users, orderId, address)
                                if (response.is_successful) {
                                    const { order } = response;
                                    console.log(order);
                                    let trackingUrl = "";
                                    if (order.points.length >= 2) {
                                        trackingUrl = order.points[1].tracking_url;
                                    }
                                    console.log("Tracking URL: ", trackingUrl);
                                    const deliveryData = {
                                        delivery_id: order.order_id,
                                        provider: "wefast",
                                        delivery_boy_name: "",
                                        delivery_boy_phone: "",
                                        delivery_boy_profile: "",
                                        order_status: order.status,
                                        delivery_status: "assigning",
                                        is_delivered: 0,
                                        address: address.address,
                                        order_id: orders.id,
                                        uid: orders.uid,
                                        total_payment: parseFloat(order.payment_amount),
                                        tracking_url: trackingUrl
                                    }
                                    console.log("Delivery Data: ", deliveryData);

                                    dbConnection.query("UPDATE deliveries SET ? WHERE order_id = ?", [deliveryData, orders.id], (err, results, fields) => {
                                        // console.log(err)
                                        if (!err) {
                                            dbConnection.query("SELECT * FROM `users` WHERE id = ?", [49], async (err, results, fields) => {
                                                if (!err) {
                                                    const store = results[0];
                                                    const token = store.fcm_token;
                                                    if (token) {
                                                        await onesignalClient.createNotification(`Order Id ${orders.id} is raised to WeFast for delivery. You will get notification for next order updated also.`, {
                                                            orderId: orders.id,
                                                            username: users.first_name
                                                        }, [
                                                            token
                                                        ]);
                                                    }
                                                }
                                            });
                                        }
                                    })
                                }
                                res.send({
                                    success: true
                                })
                            }
                        });

                    } else {
                        res.send({
                            success: false
                        })
                    }
                } else {
                    res.send({
                        success: false,
                        error: err.toString()
                    })
                }
            });
        } else {
            res.send({
                success: false
            })
        }
    } catch (e) {
        res.status(500).send({
            success: false
        })
    }
})

router.post("/schedule", (req, res) => {
    const { orderId, tempSlot } = req.body;
    res.send({
        success: true
    })
    // console.log(orderId);
    // if (orderId) {
    //     var options = { sql: 'SELECT * FROM orders JOIN users ON orders.uid=users.id WHERE orders.id = ?', nestTables: true, values: orderId };
    //     dbConnection.query(options, async (err, results, fields) => {
    //         if (!err) {
    //             const { orders, users } = results[0];
    //             const address = JSON.parse(orders.address);
    //             if (orders.date_time) {
    //                 const timeslot = orders.date_time;
    //                 let parsedTimeslot = timeslotParser.parseTimeslot(tempSlot || timeslot);
    //                 const currentTime = new Date();
    //                 const currentOffset = currentTime.getTimezoneOffset();
    //                 const ISTOffset = 330;
    //                 const ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);

    //                 // CHECK IF ORDER IS WITHIN ANY TIMESLOT
    //                 if (parsedTimeslot.hour === ISTTime.getHours() && parsedTimeslot.day === ISTTime.getDate()) {
    //                     parsedTimeslot.hour = parsedTimeslot.hour + 1;
    //                 }
    //                 let currentDate = toTimeZone(new Date(Date.now()), "Asia/Kolkata");
    //                 const deliveryDataObject = {
    //                     delivery_id: 0,
    //                     provider: "wefast",
    //                     delivery_boy_name: "",
    //                     delivery_boy_phone: "",
    //                     delivery_boy_profile: "",
    //                     order_status: "created",
    //                     delivery_status: "created",
    //                     is_delivered: 0,
    //                     address: address.address,
    //                     order_id: orders.id,
    //                     uid: orders.uid,
    //                     total_payment: 0,
    //                     tracking_url: "",
    //                     created_on: currentDate
    //                 };
    //                 dbConnection.query("INSERT INTO deliveries SET ?", deliveryDataObject, (err, results, fields) => {
    //                     if (!err) {
    //                         cron.schedule(`${parsedTimeslot.min} ${parsedTimeslot.hour} ${parsedTimeslot.day} ${parsedTimeslot.month} *`, async () => {
    //                             const response = await weFast.placeOrder(users, orderId, address)
    //                             if (response.is_successful) {
    //                                 const { order } = response;
    //                                 console.log(order);
    //                                 let trackingUrl = "";
    //                                 if (order.points.length >= 2) {
    //                                     trackingUrl = order.points[1].tracking_url;
    //                                 }
    //                                 console.log("Tracking URL: ", trackingUrl);
    //                                 const deliveryData = {
    //                                     delivery_id: order.order_id,
    //                                     provider: "wefast",
    //                                     delivery_boy_name: "",
    //                                     delivery_boy_phone: "",
    //                                     delivery_boy_profile: "",
    //                                     order_status: order.status,
    //                                     delivery_status: "assigning",
    //                                     is_delivered: 0,
    //                                     address: address.address,
    //                                     order_id: orders.id,
    //                                     uid: orders.uid,
    //                                     total_payment: parseFloat(order.payment_amount),
    //                                     tracking_url: trackingUrl
    //                                 }
    //                                 console.log("Delivery Data: ", deliveryData);

    //                                 dbConnection.query("UPDATE deliveries SET ? WHERE order_id = ?", [deliveryData, orders.id], (err, results, fields) => {
    //                                     // console.log(err)
    //                                     if (!err) {
    //                                         dbConnection.query("SELECT * FROM `users` WHERE id = ?", [49], async (err, results, fields) => {
    //                                             if (!err) {
    //                                                 const store = results[0];
    //                                                 const token = store.fcm_token;
    //                                                 if (token) {
    //                                                     await onesignalClient.createNotification(`Order Id ${orders.id} is raised to WeFast for delivery. You will get notification for next order updated also.`, {
    //                                                         orderId: orders.id,
    //                                                         username: users.first_name
    //                                                     }, [
    //                                                         token
    //                                                     ]);
    //                                                 }
    //                                             }
    //                                         });
    //                                     }
    //                                 })
    //                             }
    //                         }, {
    //                             timezone: "Asia/Kolkata"
    //                         })
    //                         res.send({
    //                             success: true
    //                         })
    //                     }
    //                 });

    //             } else {
    //                 let root = __dirname.replace("routes", "");
    //                 let fileName = path.resolve(root, "orders_sb", `${Date.now()}.csv`)
    //                 const csvWriter = createCsvWriter({
    //                     path: fileName,
    //                     header: [
    //                         { id: 'order_id', title: 'order_id' },
    //                         { id: 'partner_system_order', title: 'partner_system_order' },
    //                         { id: 'order_date', title: 'order_date' },
    //                         { id: 'user_id', title: 'user_id' },
    //                         { id: 'first_name', title: 'first_name' },
    //                         { id: 'middle_name', title: 'middle_name' },
    //                         { id: 'last_name', title: 'last_name' },
    //                         { id: 'phone', title: 'phone' },
    //                         { id: 'email', title: 'email' },
    //                         { id: 'address_1', title: 'address_1' },
    //                         { id: 'address_2', title: 'address_2' },
    //                         { id: 'address_3', title: 'address_3' },
    //                         { id: 'address_2', title: 'address_2' },
    //                         { id: 'pincode', title: 'pincode' },
    //                         { id: 'city', title: 'city' },
    //                         { id: 'state', title: 'state' },
    //                         { id: 'country', title: 'country' },
    //                         { id: 'item_code', title: 'item_code' },
    //                         { id: 'item_description', title: 'item_description' },
    //                         { id: 'quantity', title: 'quantity' },
    //                         { id: 'date_processed', title: 'date_processed' },
    //                         { id: 'quantity_shipped', title: 'quantity_shipped' },
    //                     ]
    //                 });
    //                 const productOrders = JSON.parse(orders.orders);
    //                 const viplOrders = [];
    //                 let count = 1;
    //                 for (var order of productOrders) {
    //                     const data = {
    //                         order_id: `${orders.id}-${count}`,
    //                         partner_system_order: orders.id,
    //                         order_date: new Date(Date.now()).toLocaleDateString(),
    //                         user_id: orders.uid,
    //                         first_name: users.first_name,
    //                         middle_name: "",
    //                         last_name: users.last_name,
    //                         phone: users.mobile,
    //                         email: users.email,
    //                         address_1: address.address,
    //                         address_2: address.address,
    //                         address_3: address.address,
    //                         pincode: address.pincode,
    //                         city: "",
    //                         state: address.state,
    //                         country: "India",
    //                         item_code: order.id,
    //                         item_description: order.name,
    //                         quantity: order.quantiy,
    //                         date_processed: "",
    //                         quantity_shipped: ""
    //                     }
    //                     viplOrders.push(data);
    //                     count++;
    //                 }
    //                 const isDone = await csvWriter.writeRecords(viplOrders)
    //                 res.send({
    //                     success: true
    //                 })
    //             }
    //         } else {
    //             res.send({
    //                 success: false,
    //                 error: err.toString()
    //             })
    //         }
    //     });
    // } else {
    //     res.send({
    //         success: false
    //     })
    // }
})

router.post("/update/status", (req, res) => {
    console.log("GOT A CALL");
    console.log(req.body);
    const { delivery, order } = req.body;
    if (delivery || order) {
        let deliveryId = delivery ? delivery.order_id : order.order_id;
        dbConnection.query("SELECT * FROM `deliveries` WHERE delivery_id = ?", [deliveryId], async (err, results, fields) => {
            if (!err && results.length > 0) {
                const deliveryData = results[0];
                const storeOrderId = deliveryData.order_id;
                dbConnection.query("SELECT * FROM `orders` WHERE id = ?", [storeOrderId], async (err, results, fields) => {
                    if (!err && results.length > 0) {
                        const storeOrder = results[0];
                        if (delivery) {
                            const { courier } = delivery;
                            if (courier) {
                                let orderId = delivery.order_id;
                                let query = 'UPDATE deliveries SET ? WHERE delivery_id = ';
                                query += orderId;
                                // console.log(query)
                                const updateData = {
                                    delivery_boy_name: `${courier.name || ""} ${courier.surname || ""}`,
                                    delivery_boy_phone: courier.phone,
                                    delivery_boy_profile: courier.photo_url,
                                    delivery_status: delivery.status,
                                    total_payment: parseFloat(delivery.delivery_price_amount),
                                    is_delivered: delivery.status === "finished" ? 1 : 0,
                                }
                                dbConnection.query(query, updateData, async (err, results, fields) => {
                                    if (!err) {
                                        const notificationMessage = generateNotificationMessage(delivery.status, courier, storeOrderId, orderId);
                                        if (notificationMessage) {
                                            dbConnection.query("SELECT * FROM `users` WHERE id = ?", [49], async (err, results, fields) => {
                                                if (!err) {
                                                    const store = results[0];
                                                    const token = store.fcm_token;
                                                    if (token) {
                                                        await onesignalClient.createNotification(notificationMessage, {
                                                            orderId: orderId,
                                                            delivery_id: delivery.order_id
                                                        }, [
                                                            token
                                                        ]);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                })
                            }
                        } else if (order) {
                            const { courier } = order;
                            if (courier) {
                                let orderId = order.order_id;
                                let query = 'UPDATE deliveries SET ? WHERE delivery_id = ';
                                query += orderId;
                                const updateData = {
                                    delivery_boy_name: `${courier.name} ${courier.surname}`,
                                    delivery_boy_phone: courier.phone,
                                    delivery_boy_profile: courier.photo_url,
                                    order_status: order.status,
                                    total_payment: parseFloat(order.delivery_fee_amount),
                                    is_delivered: order.status === "completed" ? 1 : 0,
                                }
                                if (order.status === "completed") {
                                    let response = await axios.default.post("https://server.sampurna-bazaar.com/api/notification/send_status_update", {
                                        status: "Delivered",
                                        orderId: storeOrderId,
                                        userId: storeOrder.uid

                                    })
                                    const requestChange = `id=${storeOrderId}&status=${JSON.stringify([
                                        {
                                            id: "49",
                                            for: "delivery_boy",
                                            status: "Delivered"
                                        }
                                    ])}`;
                                    await axios.post("http://devapi.sampurna-bazaar.com/orders/editList", requestChange, {
                                        headers: {
                                            "Basic": "123456789",
                                            "content-type": "application/x-www-form-urlencoded"
                                        }
                                    });
                                    dbConnection.query("SELECT * FROM `users` WHERE id = ?", [storeOrder.uid], async (err, results, fields) => {
                                        if (!err && results.length > 0) {
                                            const userInfo = results[0];
                                            const response = await axios.default.post("https://server.sampurna-bazaar.com/api/order/update_order_status", {
                                                email: userInfo.email,
                                                status: "Delivered",
                                                name: userInfo.first_name,
                                                orderId: storeOrderId
                                            })
                                        }
                                    })
                                }
                                dbConnection.query(query, updateData, async (err, results, fields) => {
                                    if (!err) {
                                        const notificationMessage = generateNotificationMessage(order.status, courier, storeOrderId, orderId);
                                        if (notificationMessage) {
                                            dbConnection.query("SELECT * FROM `users` WHERE id = ?", [49], async (err, results, fields) => {
                                                if (!err) {
                                                    const store = results[0];
                                                    const token = store.fcm_token;
                                                    if (token) {
                                                        await onesignalClient.createNotification(notificationMessage, {
                                                            orderId: orderId,
                                                            delivery_id: order.order_id
                                                        }, [
                                                            token
                                                        ]);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                })
                            }
                        } else {
                            res.send({
                                success: true
                            })
                        }
                    }
                })
            }
        })
    }
    res.send({
        success: true
    })
})

async function rescheduler(deliveryData) {
    return new Promise((resolve, reject) => {
        var options = { sql: 'SELECT * FROM orders JOIN users ON orders.uid=users.id WHERE orders.id = ?', nestTables: true, values: deliveryData.order_id };
        dbConnection.query(options, (err, results, fields) => {
            if (!err && results.length > 0) {
                const { orders, users } = results[0];
                const orderId = orders.id;
                const address = JSON.parse(orders.address);
                if (orders.date_time) {
                    const timeslot = orders.date_time;
                    const parsedTimeslot = timeslotParser.parseTimeslot(timeslot);
                    const currentTime = new Date();
                    const currentOffset = currentTime.getTimezoneOffset();
                    const ISTOffset = 330;
                    const ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
                    if (parsedTimeslot.hour === ISTTime.getHours() && parsedTimeslot.day === ISTTime.getDate()) {
                        parsedTimeslot.hour = parsedTimeslot.hour + 1;
                    }
                    console.log(parsedTimeslot);
                    console.log(`${parsedTimeslot.min} ${parsedTimeslot.hour} ${parsedTimeslot.day} ${parsedTimeslot.month} *`)
                    let cornValidator = cron.validate(`${parsedTimeslot.min} ${parsedTimeslot.hour} ${parsedTimeslot.day} ${parsedTimeslot.month} *`)
                    if(cornValidator) {
                        cron.schedule(`${parsedTimeslot.min} ${parsedTimeslot.hour} ${parsedTimeslot.day} ${parsedTimeslot.month} *`, async () => {
                            console.log("i AM RUNNING")
                            const response = await weFast.placeOrder(users, orderId, address)
                            console.log(response)
                            if (response.is_successful) {
                                const { order } = response;
                                console.log(order);
                                let trackingUrl = "";
                                if (order.points.length >= 2) {
                                    trackingUrl = order.points[1].tracking_url;
                                }
                                console.log("Tracking URL: ", trackingUrl);
                                const deliveryData = {
                                    delivery_id: order.order_id,
                                    provider: "wefast",
                                    delivery_boy_name: "",
                                    delivery_boy_phone: "",
                                    delivery_boy_profile: "",
                                    order_status: order.status,
                                    delivery_status: "assigning",
                                    is_delivered: 0,
                                    address: address.address,
                                    order_id: orders.id,
                                    uid: orders.uid,
                                    total_payment: parseFloat(order.payment_amount),
                                    tracking_url: trackingUrl
                                }
                                console.log("Delivery Data: ", deliveryData);
    
                                dbConnection.query("UPDATE deliveries SET ? WHERE order_id = ?", [deliveryData, orders.id], (err, results, fields) => {
                                    // console.log(err)
                                    if (!err) {
                                        dbConnection.query("SELECT * FROM `users` WHERE id = ?", [49], async (err, results, fields) => {
                                            if (!err) {
                                                const store = results[0];
                                                const token = store.fcm_token;
                                                if (token) {
                                                    await onesignalClient.createNotification(`Order Id ${orders.id} is raised to WeFast for delivery. You will get notification for next order updated also.`, {
                                                        orderId: orders.id,
                                                        username: users.first_name
                                                    }, [
                                                        token
                                                    ]);
                                                }
    
                                            }
                                        });
                                    } else {
                                        resolve(true)
                                    }
                                })
                            }
                        }, {
                            timezone: "Asia/Kolkata"
                        })
                    }
                    resolve(true)

                } else {
                    reject(false);
                }
            } else {
                reject(false);
            }
        })
    })
}

function checkAndReschedule() {
    dbConnection.query("SELECT * FROM deliveries WHERE is_delivered = ? AND order_status = ?", [0, 'created'], async (err, results, fields) => {
        if (!err && results.length > 0) {
            for (var delivery of results) {
                let response = await rescheduler(delivery);
            }
        } else {
            console.log("Nothing to reschedule")
        }
    })
}

// let currentDate = toTimeZone(new Date(Date.now()), "Asia/Kolkata");




module.exports = (connection) => {
    dbConnection = connection;
    // checkAndReschedule();
    return router;
};