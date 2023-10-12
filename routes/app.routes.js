const express = require("express");
const cron = require("node-cron");
const OneSignal = require("onesignal-node");
const moment = require("moment");
const { getIndianTime } = require("../parsers/timeslot");
const { random } = require("../functions/random");

const client = new OneSignal.Client(
  "b2bd55f4-f3dd-4cf2-b864-addd87e025a9",
  "ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh"
);

const DIWALI_CATEGORY_ID = 13;
const POSSIBLE_PRICE_RANGE_MIN_ORDERS = [699, 899, 999, 1099];
const POSSIBLE_PRICE_RANGE_MAX_ORDERS = [1099, 1299, 1399, 1499, 1599, 1699, 1799, 1899, 1999];
const LINK_TYPE = "category";

const router = express.Router();

let dbConnection;

const totalCronJobs = [];

function checkIfFeedbackPossible(orderId) {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      "SELECT * FROM feedback WHERE order_id = ?",
      [orderId],
      (err, results, _) => {
        if ((!err, results.length > 0)) {
          reject(false);
        } else {
          resolve(true);
        }
      }
    );
  });
}

function toTimeZone(time, zone) {
  var format = "YYYY/MM/DD HH:mm:ss";
  return moment(time, format).tz(zone).format(format);
}

router.post("/check-rateable", async (req, res) => {
  try {
    const { userId } = req.body;
    dbConnection.query(
      "SELECT * FROM `orders` WHERE uid = ? ORDER BY id DESC LIMIT 3",
      [userId],
      async (err, results, fields) => {
        try {
          if (!err && results.length > 0) {
            let order = results[0];

            if (order) {
              let createdOnDate = order.created_at;
              let currentDate = getIndianTime("Today", createdOnDate);
              if (currentDate) {
                let orderStatus = JSON.parse(order.status);
                if (orderStatus) {
                  orderStatus = orderStatus[0];
                  console.log("i AM HERE 1");
                  if (orderStatus.status === "Delivered") {
                    let check = await checkIfFeedbackPossible(order.id);
                    console.log(check);
                    if (check) {
                      res.send({
                        success: true,
                        order: order,
                      });
                    } else {
                      throw false;
                    }
                  } else {
                    order = results[1];
                    console.log("i AM HERE 2");
                    if (order) {
                      let createdOnDate = order.created_at;
                      let currentDate = getIndianTime("Today", createdOnDate);
                      if (currentDate) {
                        let orderStatus = JSON.parse(order.status);
                        if (orderStatus) {
                          orderStatus = orderStatus[0];
                          console.log(orderStatus);
                          if (orderStatus.status === "Delivered") {
                            let check = await checkIfFeedbackPossible(order.id);
                            console.log(check);
                            if (check) {
                              res.send({
                                success: true,
                                order: order,
                              });
                            } else {
                              throw false;
                            }
                          } else {
                            throw false;
                          }
                        }
                      } else {
                        throw false;
                      }
                    } else {
                      throw false;
                    }
                  }
                }
              } else {
                throw false;
              }
            } else {
              throw false;
            }
          } else {
            res.send({
              success: false,
            });
          }
        } catch (e) {
          res.send({
            success: false,
          });
        }
      }
    );
  } catch (e) {
    res.status(500).send({
      success: false,
    });
  }
});

router.post("/add-feedback", async (req, res) => {
  try {
    const { uid, orderId, feedback, rating } = req.body;
    if (uid && orderId) {
      const dataToAdd = {
        uid: uid,
        order_id: orderId,
        feedback: feedback,
        rating: rating,
      };
      dbConnection.query(
        "INSERT INTO feedback SET ?",
        dataToAdd,
        (err, results, _) => {
          try {
            if (!err) {
              res.send({
                success: false,
              });
            }
          } catch (e) {
            res.send({
              success: false,
            });
          }
        }
      );
    }
  } catch (e) {
    res.send({
      success: false,
    });
  }
});

router.post("/app-closed", async (req, res) => {
  console.log("i AM CALLED");
  try {
    const { userId } = req.body;
    const currentTime = new Date();
    const currentOffset = currentTime.getTimezoneOffset();
    const ISTOffset = 330;
    const ISTTime = new Date(
      currentTime.getTime() + (ISTOffset + currentOffset) * 60000
    );

    dbConnection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId],
      async (err, results, fields) => {
        if (!err && results.length > 0) {
          const user = results[0];
          const token = user.fcm_token;
          let extraHours = ISTTime.getHours() + 4;
          let extraDate = ISTTime.getDate();
          if (ISTTime.getHours() + 4 > 23) {
            extraDate += 1;
            extraHours -= 4;
          }
          const timeToRun = `${ISTTime.getMinutes()} ${extraHours} ${extraDate} ${ISTTime.getMonth() + 1
            } *`;
          dbConnection.query(
            "SELECT * FROM cart WHERE uid = ?",
            [user.id],
            (err, results, fields) => {
              if (!err && results.length === 0) {
                cron.schedule(
                  timeToRun,
                  async () => {
                    const response = await client.createNotification({
                      headings: {
                        en: `Thanks for visiting us today, ${user.first_name} 😀`,
                      },
                      contents: {
                        en: "Couldn't find the product you are looking for? ...",
                      },
                      priority: "high",
                      include_player_ids: [token],
                    });
                    console.log(response);
                  },
                  {
                    timezone: "Asia/Kolkata",
                  }
                );
              }
            }
          );
        }
      }
    );

    res.send({
      success: true,
    });
  } catch (e) {
    // console.log(e);
    res.send({
      success: true,
    });
  }
});

function generateCoupon(userName, phoneNumber, offPercentage, options = {
  startWith: "DWLI"
}) {
  try {
    const phoneSubs = phoneNumber.toString().substr(9, 13);
    const nameSubs = userName.toString().substr(0, 3).toUpperCase();
    if (phoneSubs && nameSubs) {
      return `${options.startWith}${nameSubs}${phoneSubs}${offPercentage}`
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }

}

function pickRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

router.post("/reward-me", async (req, res) => {
  try {
    const { phone } = req.body;
    if (phone && phone.length === 13) {
      dbConnection.query("SELECT * FROM users WHERE mobile = ?", [phone], async (err, users, _) => {
        if (!err && users.length > 0) {
          const user = users[0];
          if (user) {
            dbConnection.query("SELECT * FROM coupon_user WHERE uid = ?", [user.id], async (err, couponUsers, _) => {
              if (!err, couponUsers.length === 0) {
                dbConnection.query("SELECT * FROM orders WHERE uid = ?", [user.id], async (err, orders, _) => {
                  if (!err && orders.length > 0) {
                    const offPercentage = pickRandom(9, 19);
                    const possibleOfferPrice = orders.length <= 2 ? POSSIBLE_PRICE_RANGE_MIN_ORDERS[pickRandom(0, (POSSIBLE_PRICE_RANGE_MIN_ORDERS.length - 1))] : POSSIBLE_PRICE_RANGE_MAX_ORDERS[pickRandom(0, (POSSIBLE_PRICE_RANGE_MAX_ORDERS.length - 1))]
                    const couponCode = generateCoupon(`${user.first_name} ${user.last_name}`, user.mobile, offPercentage);
                    const generatedCouponData = {
                      code: couponCode,
                      uid: 0,
                      status: 0,
                      amount: 0,
                      percentage: offPercentage,
                      delivery_charge: 99,
                      zero_delivery_amount: possibleOfferPrice,
                      type: "app",
                      link_type: LINK_TYPE,
                      link_id: DIWALI_CATEGORY_ID
                    };
                    dbConnection.query("INSERT INTO coupon SET ?", generatedCouponData, (err, couponAdditionResult, _) => {
                      if (!err && couponAdditionResult) {
                        const lastInsertId = couponAdditionResult.insertId;
                        const generatedCouponAndUserData = {
                          cid: lastInsertId,
                          uid: user.id,
                          status: 0
                        }
                        dbConnection.query("INSERT INTO coupon_user SET ?", generatedCouponAndUserData, async (err, couponRelationResult, _) => {
                          if (!err && couponRelationResult) {
                            if (couponRelationResult.insertId) {
                              const response = await client.createNotification({
                                contents: { "en": `Get your coupon code ${user.first_name} and order for more then ${possibleOfferPrice} and get ${offPercentage}% off.` },
                                headings: { "en": `Coupon Code: ${couponCode} 😇` },
                                priority: 10,
                                include_player_ids: [user.fcm_token],
                              })
                              console.log(response);
                              res.status(201).send({
                                status: 201,
                                message: "Code generate successfully",
                                code: couponCode
                              })
                            } else {
                              res.status(406).send({
                                error: "Failed to generate Coupon Code"
                              })
                            }
                          } else {
                            res.status(406).send({
                              error: "Failed to generate Coupon Code"
                            })
                          }
                        });
                      } else {
                        res.status(406).send({
                          error: "Failed to generate Coupon Code"
                        })
                      }
                    })
                  } else {
                    const offPercentage = pickRandom(9, 19);
                    const possibleOfferPrice = POSSIBLE_PRICE_RANGE_MIN_ORDERS[pickRandom(0, (POSSIBLE_PRICE_RANGE_MIN_ORDERS.length - 1))]
                    const couponCode = generateCoupon(`${user.first_name} ${user.last_name}`, user.mobile, offPercentage);
                    const generatedCouponData = {
                      code: couponCode,
                      uid: 0,
                      status: 0,
                      amount: 0,
                      percentage: offPercentage,
                      delivery_charge: 99,
                      zero_delivery_amount: possibleOfferPrice,
                      type: "app",
                      link_type: LINK_TYPE,
                      link_id: DIWALI_CATEGORY_ID
                    };
                    dbConnection.query("INSERT INTO coupon SET ?", generatedCouponData, (err, couponAdditionResult, _) => {
                      if (!err && couponAdditionResult) {
                        const lastInsertId = couponAdditionResult.insertId;
                        const generatedCouponAndUserData = {
                          cid: lastInsertId,
                          uid: user.id,
                          status: 0
                        }
                        dbConnection.query("INSERT INTO coupon_user SET ?", generatedCouponAndUserData, async (err, couponRelationResult, _) => {
                          if (!err && couponRelationResult) {
                            if (couponRelationResult.insertId) {
                              const response = await client.createNotification({
                                contents: { "en": `Get your coupon code ${user.first_name} and order for more then ₹${possibleOfferPrice} and get ${offPercentage}% off.` },
                                headings: { "en": `Coupon Code: ${couponCode} 😇` },
                                priority: 10,
                                include_player_ids: [user.fcm_token],
                              })
                              console.log(response);
                              res.status(201).send({
                                status: 201,
                                message: "Code generate successfully",
                                code: couponCode
                              })
                            } else {
                              res.status(406).send({
                                error: "Failed to generate Coupon Code"
                              })
                            }
                          } else {
                            res.status(406).send({
                              error: "Failed to generate Coupon Code"
                            })
                          }
                        });
                      } else {
                        res.status(406).send({
                          error: "Failed to generate Coupon Code"
                        })
                      }
                    })
                  }
                })
              } else {
                const coupon = couponUsers[0];
                res.status(405).send({
                  error: "Code is already generated"
                })
              }
            })
          } else {
            res.status(401).send({
              error: "User not found"
            })
          }
        } else {
          res.status(401).send({
            error: "User not found"
          })
        }
      })
    } else {
      res.status(406).send({
        error: "Wrong phone number"
      })
    }
  } catch (e) {
    res.send({
      error: "Something went wrong!"
    })
  }
});

router.get("/user/notifications/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    dbConnection.query("SELECT * FROM notification_logs WHERE user_id = ?", [userId], (error, results, _) => {
      console.log(error, results)
      if (error) {
        res.send({
          notifications: []
        })
      } else {
        res.send({
          notifications: results
        })
      }
    })
  } catch (e) {
    console.log(e)
    res.send({
      notifications: []
    })
  }
})

router.post("/coupon/create-bulk", async (req, res) => {
  try {

    const { couponData, count } = req.body;
    const { prefix, amount, percentage, delivery_charge, zero_delivery_amount, type, link_type, link_id } = couponData;
    const totalCouponCodes = []
    const errorCodes = []

    if (count) {
      for (let i = 1; i <= count; i++) {
        const couponCode = `${prefix}${random("string", 5)}`;

        const generatedCouponData = {
          code: couponCode,
          uid: 0,
          status: 0,
          amount: amount,
          percentage: percentage,
          delivery_charge: delivery_charge,
          zero_delivery_amount: zero_delivery_amount,
          type: type,
          link_type: link_type,
          link_id: link_id
        }
        dbConnection.query("INSERT INTO coupon SET ?", generatedCouponData, (err, couponAdditionResult, _) => {
          if (!err && couponAdditionResult) {
            totalCouponCodes.push(couponCode)
          } else {
            console.log(err)
            errorCodes.push(couponCode)
          }
          if (i == count) {
            res.send({
              total: totalCouponCodes,
              error: errorCodes
            })
          }
        });
      }
    }
  } catch (e) {
    console.log(e)
    res.send({
      error: "Something went wrong!"
    })
  }
})

module.exports = (connection) => {
  dbConnection = connection;
  return router;
};
