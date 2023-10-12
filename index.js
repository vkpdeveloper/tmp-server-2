require('dotenv').config()

const express = require("express");
const axios = require("axios").default;
const app = express();
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const QrCode = require('qrcode')
const {
  symbolFilter,
  removeSpaces,
  getGoogleSearchCorrection,
} = require("./functions");
const mongoose = require("mongoose");
const Fs = require("fs");
const CsvReadableStream = require("csv-reader");
let inputStream = Fs.createReadStream("wphs_terms.csv", "utf8");
const Tag = require("./models/tag");
const mySql = require("mysql");
const mysql2 = require('mysql2/promise')
const multer = require("multer");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csv = require("csv-parser");
const mailer = require("nodemailer");
const KEY_ID = "rzp_live_1TuAnTyy3P4hL6";
const SECRET_KEY = "QOpmdLHHenVL0fr75C0ErFHI";
const SODEXO_API_KEY =
  "RZOkQKwfB5AsRog6zF981vHdMr3hMN7aMfHzcdx1lGfLWlXE37gL6DmHXHG5C4Aa";
const SODEXO_API_PRE_PROD_URL = "https://pay.gw.zetapay.in";
const SMS = require("smsalert");
const cors = require("cors");
const schedule = require("node-schedule");
var XLSX = require("xlsx");
const puppeteer = require("puppeteer");
const sms = new SMS("marsweb", "Varada@25");
const PaytmChecksum = require("./PaytmChecksum");
const migrationRouter = require("./migration_manager");
const weFastRouter = require("./routes/wefast.routes");
const appRouter = require("./routes/app.routes");
const tagRouter = require("./routes/tag.routes");
const searchRouter = require("./routes/search.routes");
const refundRouter = require("./routes/refund.routes");
const varadaRouter = require("./routes/varada.routes");
const kentRouter = require("./routes/kent.routes");
const slackRouter = require("./routes/slack.routes");
const paytmRouter = require("./routes/paytm.routes");
var onesignalClient = require("onesignal")(
  "ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh",
  "b2bd55f4-f3dd-4cf2-b864-addd87e025a9",
  true
);
const { cronJob } = require("./functions/cron");
const SMSSender = require("./controllers/sms_sender");
const { NotificationController } = require('./controllers/notification');
const ordersRouter = require("./routes/orders.routes");

let port = 4565;

if (process.argv.length > 2) {
  let arg = process.argv[2];
  let detectedPort = arg.split("=")[1];
  port = parseInt(detectedPort);
}

app.use(
  cors({
    origin: "*",
  })
);

let notificationSender;

const transporter = mailer.createTransport({
  service: "gmail",
  auth: {
    user: "no-reply@sampurna-bazaar.com",
    pass: "tackojqsvzineqzq",
  },
});

const smsSender = new SMSSender();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + file.originalname);
  },
});

var instance = new Razorpay({
  key_id: KEY_ID,
  key_secret: SECRET_KEY,
});

function generateNotificationMessage(status, username, orderId, amount) {
  if (status === "Accepted") {
    return `Hey ${username}, Your order SB-${orderId} has been accepted. Thank you for shopping at sampurna-bazaar.com.`;
  } else if (status === "Picked and Packed") {
    return `Hey ${username}, Your order SB-${orderId} has been packed and will be delivered to you shortly. Thanks for choosing sampurna-bazaar.com!`;
  } else if (status === "Dispatched") {
    return `Hey ${username}, Your Order SB-${orderId} is out for delivery and will be arriving Today. Thanks for shopping with Sampurna-Bazaar.com!`;
  } else if (status === "On Hold") {
    return `Hey ${username}, Your partial order SB-${orderId} with sampurna-bazaar.com has been put on hold.`;
  } else if (status === "Delivered") {
    return `Hey ${username}, Your package SB-${orderId} has been successfully delivered. Thanks for doing shopping at sampurna-bazaar.com. Have a lovely day!`;
  } else if (status === "Refund") {
    return `Hey ${username}, Your refund of ${amount} for your order SB-${orderId} has been initiated.`;
  } else {
    return false;
  }
}

mongoose.connect("mongodb://localhost:27017/smapurna", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.once("connected", () => {
  console.log("MongoDB is connected");
});

var upload = multer({ storage: storage });

const connection = mySql.createConnection({
  host: "localhost",
  user: "mwsampur_app",
  password: "mwsampur_app",
  database: "mwsampur_app",
});
connection.connect();

app.use((req, res, next) => {
  console.log(req.path)
  next();
})

app.get("/", (req, res) => {
  res.send("WELCOME TO SB SERVER")
})

connection.on("connect", async (err) => {
  if (err) {
    // console.log(err)
  } else {
    console.log("MySQL Connected")
    cronJob(connection);
    const promiseDB = await mysql2.createConnection({
      host: "localhost",
      user: "mwsampur_app",
      password: "mwsampur_app",
      database: "mwsampur_app",
    })
    app.use("/wefast", weFastRouter(connection));
    app.use("/app", appRouter(connection));
    app.use("/refund", refundRouter(connection));
    app.use("/tag", tagRouter(connection));
    app.use("/search", searchRouter(promiseDB));
    app.use("/orders", ordersRouter(promiseDB));
    app.use("/kent", kentRouter)
    app.use("/paytm", paytmRouter)
    notificationSender = new NotificationController(connection)
  }
});

const portTagsFromMySQL = () => {
  inputStream
    .pipe(
      new CsvReadableStream({
        parseNumbers: true,
        parseBooleans: true,
        trim: true,
      })
    )
    .on("data", async function (row) {
      let createTag = new Tag({
        id: row[0],
        name: row[1],
        slug: row[2],
        term_group: row[3],
      });
      await createTag.save();
    })
    .on("end", function (data) {
      // console.log('No more rows!');
    });
};

// deleteTags();
// portTagsFromMySQL();

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static("public"));


// app.use((req, res, next) => {
//     console.log(req.body);
//     next();
// })

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/sbmm", migrationRouter);
app.use("/varada", varadaRouter)
app.use("/slack", slackRouter)

app.get("/public/ip", (req, res) => {
  res.send(req.headers['x-forwarded-for'])
})

app.get("/maps/distance_from_metro", async (req, res) => {
  const { destination } = req.query;
  const data = await axios.get(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=12.972442, 77.580643&destinations=${destination}&key=AIzaSyC2Yk_n3UroTovF5Zvx_NvWab3C4XoQ7DE`
  );
  // console.log(data.status);
  if (data.status == 200) {
    res.send(data.data);
  } else {
    res.send({
      status: 500,
      result: [],
    });
  }
});

app.post("/mobile/api/create-order", async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    const options = {
      amount: amount,
      receipt: receipt,
      currency: "INR",
    };
    instance.orders.create(options, (err, order) => {
      if (!err) {
        res.send({
          order: order,
          success: true,
        });
      } else {
        res.send({
          sucess: false,
        });
      }
    });
  } catch (e) {
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.post("/mobile/api/search", async (req, res) => {
  try {
    let searchQuery = removeSpaces(req.body.sentence);
    searchQuery = symbolFilter(searchQuery);
    let JSONString = JSON.stringify({
      sentence: searchQuery,
    });
    let response = await axios.post(
      "http://127.0.0.1:6789/spell-check",
      JSONString,
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    res.send({
      success: true,
      data: response.data,
      searchQuery: response.data.correct_word.join(" "),
    });
  } catch (e) {
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.post("/mobile/api/smart-search", async (req, res) => {
  try {
    const { searchQuery } = req.body;
    if (searchQuery) {
      const smartSearchQuery = await getGoogleSearchCorrection(
        searchQuery,
        "hi"
      );
      // console.log(smartSearchQuery);
      if (smartSearchQuery) {
        res.send({
          success: true,
          searchQuery: smartSearchQuery,
        });
      } else {
        res.statusCode(500).send({
          success: false,
          error: "please pass a search query",
        });
      }
    } else {
      res.statusCode(500).send({
        success: false,
        error: "please pass a search query",
      });
    }
  } catch (e) {
    res.statusCode(500).send({
      success: false,
      error: e.message,
    });
  }
});

app.get("/tag/search", async (req, res) => {
  let smartQuery = removeSpaces(req.query.search);
  smartQuery = smartQuery.replace(" ", "-");
  let tags1 = await Tag.find({
    slug: {
      $regex: smartQuery.toLowerCase(),
      $options: 1,
    },
  }).limit(parseInt(req.query.per_page));
  res.send([...tags1]);
});

app.post("/categories/import", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id, name, cover, status, category_type } = row;
      const data = {
        id,
        name,
        cover,
        status,
        category_type,
      };
      connection.query(
        "INSERT INTO category SET ?",
        data,
        function (error, results, fields) {
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
              name,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.post("/subcategories/import", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id, name, cover, status, cate_id } = row;
      const data = {
        id,
        name,
        cover,
        status,
        cate_id,
      };
      connection.query(
        "INSERT INTO sub_category SET ?",
        data,
        function (error, results, fields) {
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
              name,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.post("/brand/import", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id, brand_name, status } = row;
      const data = {
        id,
        brand_name,
        status,
      };
      connection.query(
        "INSERT INTO brand SET ?",
        data,
        function (error, results, fields) {
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.post("/subcategories/update", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id } = row;
      const data = {
        ...row,
      };
      console.log(id);
      delete data.id;
      connection.query(
        "UPDATE sub_category SET ? WHERE id = ?",
        [data, id],
        function (error, results, fields) {
          console.log(error);
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.post("/brand/update", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id } = row;
      const data = {
        ...row,
      };
      delete data.id;
      connection.query(
        "UPDATE brand SET ? WHERE id = ?",
        [data, id],
        function (error, results, fields) {
          console.log(error);
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.post("/categories/update", upload.single("file"), (req, res) => {
  const listOfErrors = [];
  const listOfUpdates = [];
  try {
    let { items } = req.body;
    items = parseInt(items);
    inputStream = Fs.createReadStream(req.file.path, { encoding: "utf8" });
    inputStream.pipe(csv()).on("data", function (row) {
      const { id } = row;
      const data = {
        ...row,
      };
      console.log(id);
      delete data.id;
      connection.query(
        "UPDATE category SET ? WHERE id = ?",
        [data, id],
        function (error, results, fields) {
          console.log(error);
          if (error) {
            listOfErrors.push({
              id: id,
              error: error.message,
            });
          } else {
            listOfUpdates.push({
              id: id,
            });
          }

          if (listOfErrors.length + listOfUpdates.length == items) {
            res.send({
              success: true,
              updates: listOfUpdates,
              errors: listOfErrors,
            });
          }
        }
      );
    });
  } catch (e) {
    res.send({
      success: false,
      updates: listOfUpdates,
      errors: listOfErrors,
    });
  }
});

app.get("/categories/export", async (req, res) => {
  const fileName = "exports/" + Date.now() + ".csv";
  let elementIndex = 0;
  const stream = Fs.createWriteStream(fileName);
  stream.end();
  const records = [];
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "id", title: "id" },
      { id: "name", title: "name" },
      { id: "cover", title: "cover" },
      { id: "category_type", title: "category_type" },
      { id: "status", title: "status" },
    ],
  });
  connection.query(
    "SELECT * FROM `category` WHERE 1",
    (err, result, fields) => {
      for (let rowRecord of result) {
        const record = {
          id: rowRecord.id,
          name: rowRecord.name,
          status: rowRecord.status,
          cover: rowRecord.cover,
          category_type: rowRecord.category_type,
        };
        records.push(record);
      }
      csvWriter.writeRecords(records).then(() => {
        res.download(`${__dirname}/${fileName}`, "category_exports.csv");
      });
    }
  );
});

app.get("/subcategories/export", async (req, res) => {
  const fileName = "exports/" + Date.now() + ".csv";
  let elementIndex = 0;
  const stream = Fs.createWriteStream(fileName);
  stream.end();
  const records = [];
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "id", title: "id" },
      { id: "name", title: "name" },
      { id: "cover", title: "cover" },
      { id: "status", title: "status" },
      { id: "cate_id", title: "cate_id" },
    ],
  });
  connection.query(
    "SELECT * FROM `sub_category` WHERE 1",
    (err, result, fields) => {
      for (let rowRecord of result) {
        const record = {
          id: rowRecord.id,
          name: rowRecord.name,
          status: rowRecord.status,
          cover: rowRecord.cover,
          cate_id: rowRecord.cate_id,
        };
        records.push(record);
      }
      csvWriter.writeRecords(records).then(() => {
        res.download(`${__dirname}/${fileName}`, "sub_category_exports.csv");
      });
    }
  );
});

app.get("/brand/export", async (req, res) => {
  const fileName = "exports/" + Date.now() + ".csv";
  let elementIndex = 0;
  const stream = Fs.createWriteStream(fileName);
  stream.end();
  const records = [];
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "id", title: "id" },
      { id: "brand_name", title: "brand_name" },
      { id: "status", title: "status" },
    ],
  });
  connection.query("SELECT * FROM `brand` WHERE 1", (err, result, fields) => {
    for (let rowRecord of result) {
      const record = {
        id: rowRecord.id,
        brand_name: rowRecord.brand_name,
        status: rowRecord.status,
      };
      records.push(record);
    }
    csvWriter.writeRecords(records).then(() => {
      res.download(`${__dirname}/${fileName}`, "brand_exports.csv");
    });
  });
});

app.get("/orders/sales_report", async (req, res) => {
  try {
    var options = {
      sql: "SELECT * FROM orders JOIN users ON orders.uid=users.id",
      nestTables: true,
    };
    const ordersRecords = [];
    const fileName = "exports/sales_report_" + new Date(Date.now()) + ".csv";
    const csvWriter = createCsvWriter({
      path: fileName,
      header: [
        { id: "order_id", title: "Order ID" },
        { id: "inv_no", title: "Invoice Number" },
        { id: "user_id", title: "User ID" },
        { id: "user_name", title: "User Name" },
        { id: "email", title: "User Email" },
        { id: "phone", title: "User Phone" },
        { id: "paid_method", title: "Payment Method" },
        { id: "address", title: "Address" },
        { id: "grand_total", title: "Grand total" },
        { id: "delivery_charge", title: "Delivery charge" },
        { id: "coupon_code", title: "Coupon code" },
        { id: "order_status", title: "Order status" },
        { id: "order_date", title: "Orderd Date" },
        { id: "order_accepted_date", title: "Order Accepted Date" },
        // { id: 'delivery_cost', title: 'Delivery Cost' },
      ],
    });
    connection.query(options, function (error, results, fields) {
      for (var info of results) {
        const { orders, users } = info;
        const addressInfo = JSON.parse(orders.address);
        const couponInfo =
          orders.coupon_code != ""
            ? JSON.parse(orders.coupon_code)
            : { code: "Not Used" };
        const orderStatusInfo = JSON.parse(orders.status);
        const notesInfo = JSON.parse(orders.notes);
        const orderAcceptedInfo = notesInfo.filter(
          (e) => e.value == "Order Accepted"
        );
        const record = {
          order_id: orders.id,
          inv_no: orders.inv_no,
          user_id: users.id,
          user_name: `${users.first_name} ${users.last_name}`,
          email: users.email,
          phone: users.mobile.replace("+91", "").toString(),
          paid_method: orders.paid_method,
          address: addressInfo.address,
          grand_total: orders.grand_total,
          delivery_charge: orders.delivery_charge,
          coupon_code: couponInfo.code,
          order_status: orderStatusInfo[0].status,
          order_date: notesInfo[0].time,
          order_accepted_date:
            orderAcceptedInfo.length > 0
              ? orderAcceptedInfo[0].time
              : "No date",
          // delivery_cost: deliveries.total_payment || "0"
        };
        ordersRecords.push(record);
      }
      csvWriter.writeRecords(ordersRecords).then(() => {
        res.download(`${__dirname}/${fileName}`, "sales_report.csv");
      });
    });
  } catch (e) {
    res.send({
      success: false,
    });
  }
});

app.post("/products/import", upload.single("attachment"), (req, res) => {
  if (req.file) {
    let inputStream = Fs.createReadStream(req.file.path, "utf8");
    inputStream
      .pipe(
        new CsvReadableStream({
          parseNumbers: true,
          parseBooleans: true,
          trim: true,
          multiline: true,
        })
      )
      .on("data", function (row) {
        const [
          id,
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date,
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations,
          size,
          tax_class,
          tags,
        ] = row;
        let date = new Date(exp_date);
        const data = {
          id,
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date: date,
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations,
          size,
          tax_class,
          tags,
        };

        // connection.query("SELECT STR_TO_DATE(?, %m/%d/%Y)", exp_date)
        connection.query(
          "INSERT INTO products SET ?",
          data,
          function (error, results, fields) {
            if (error) throw error;
          }
        );
      })
      .on("end", function (data) {
        // console.log('No more rows!');
      });
    res.send({
      result: "Upload successful",
    });
  } else {
    res.send("plese send a file");
  }
});

app.get("/products/export", async (req, res) => {
  const fileName = "exports/" + Date.now() + ".csv";
  const stream = Fs.createWriteStream(fileName);
  stream.end();
  const records = [];
  const csvWriter = createCsvWriter({
    path: fileName,
    header: [
      { id: "id", title: "id" },
      { id: "store_id", title: "store_id" },
      { id: "cover", title: "cover" },
      { id: "name", title: "name" },
      { id: "images", title: "images" },
      { id: "original_price", title: "original_price" },
      { id: "sell_price", title: "sell_price" },
      { id: "discount", title: "discount" },
      { id: "kind", title: "kind" },
      { id: "cate_id", title: "cate_id" },
      { id: "in_home", title: "in_home" },
      { id: "is_single", title: "is_single" },
      { id: "have_gram", title: "have_gram" },
      { id: "gram", title: "gram" },
      { id: "have_kg", title: "have_kg" },
      { id: "kg", title: "kg" },
      { id: "have_pcs", title: "have_pcs" },
      { id: "have_liter", title: "have_liter" },
      { id: "liter", title: "liter" },
      { id: "have_ml", title: "have_ml" },
      { id: "ml", title: "ml" },
      { id: "descriptions", title: "descriptions" },
      { id: "disclaimer", title: "disclaimer" },
      { id: "exp_date", title: "exp_date" },
      { id: "type_of", title: "type_of" },
      { id: "in_stoke", title: "in_stoke" },
      { id: "rating", title: "rating" },
      { id: "total_rating", title: "total_rating" },
      { id: "status", title: "status" },
      { id: "in_offer", title: "in_offer" },
      { id: "variations", title: "variations" },
      { id: "size", title: "size" },
    ],
  });
  connection.query(
    "SELECT * FROM `products` WHERE 1",
    (err, result, fields) => {
      for (let rowRecord of result) {
        // console.log(rowRecord);
        const {
          id,
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date,
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations,
          size,
        } = rowRecord;
        const record = {
          id,
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date,
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations,
          size,
        };
        records.push(record);
      }
      csvWriter.writeRecords(records).then(() => {
        res.download(`${__dirname}/${fileName}`, "products_exports.csv");
      });
    }
  );
});

// app.get("/categories/import", (req, res) => {
//     res.sendFile(`${__dirname}/pages/category.html`)
// })

// app.get("/products/import", (req, res) => {
//     res.sendFile(`${__dirname}/pages/product.html`)
// })

// app.get("/products/update", (req, res) => {
//     res.sendFile(`${__dirname}/pages/product_update.html`)
// })

app.post("/products/update", upload.single("attachment"), (req, res) => {
  const sqlQuery = "UPDATE `products` SET ";
  const {
    name,
    description,
    sell_price,
    original_price,
    in_stoke,
    variations,
  } = req.body;
  const rows = [];
  let inputStream = Fs.createReadStream(req.file.path, "utf8");
  const successfulUpdates = [];
  inputStream
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", () => {
      for (let productUpdate of rows) {
        let sqlQuery = "UPDATE `products` SET ";
        const dataForRows = [];
        if (name == "on") {
          dataForRows.push(productUpdate.name);
          sqlQuery += "name = ?";
        }
        if (description == "on") {
          dataForRows.push(productUpdate.description);
          sqlQuery += ", description = ?";
        }
        if (sell_price == "on") {
          dataForRows.push(productUpdate.sell_price);
          sqlQuery += ", sell_price = ?";
        }
        if (original_price == "on") {
          dataForRows.push(productUpdate.original_price);
          sqlQuery += ", original_price = ?";
        }
        if (in_stoke == "on") {
          dataForRows.push(productUpdate.in_stoke);
          sqlQuery += ", in_stoke = ?";
        }
        if (variations == "on") {
          dataForRows.push(productUpdate.variations);
          sqlQuery += ", variations = ?";
        }
        sqlQuery += " WHERE id = ?";
        dataForRows.push(productUpdate.id);
        connection.query(sqlQuery, dataForRows, (err, field, result) => {
          if (!err) {
            successfulUpdates.push(productUpdate.id);
          }
        });
      }
      res.send({
        success: successfulUpdates,
      });
    });
});

app.post("/upload_with_variations", upload.single("file"), (req, res) => {
  try {
    let listOfUpdates = [];
    let listOfErrors = [];
    let { items } = req.body;
    Fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // console.log(row)
        let {
          id,
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date,
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations_types,
          size,
          tax_class,
          tags,
          hsn_code,
          brand_id,
        } = row;
        if (parseInt(sell_price) == 0 || parseInt(original_price) == 0) {
          listOfErrors.push({
            id: id,
            error: "Sell price or orginal price can't be 0",
          });
          return;
        }
        let stringifiedRow = JSON.stringify(row);
        let parsedRow = JSON.parse(stringifiedRow);
        // console.log(parsedRow);
        let variationsItems = [];
        let variations = [
          { title: "size", type: "radio", items: variationsItems },
        ];
        let variationsTypes = variations_types.split("|");
        if (variationsTypes != "[]" || variationsTypes != "");
        {
          variationsTypes.forEach((value) => {
            if (variationsTypes.length > 1) {
              let variationTitle = "";
              let variationPrice = 0;
              let variationDiscount = 0;
              let parsedValue = parseInt(value);
              let parsedSellPrice = parseInt(sell_price);
              let parsedOrginalPrice = parseInt(original_price);
              if (value.length == 4) {
                variationTitle = `${value[0]} KG`;
              } else {
                variationTitle = `${value}g`;
              }
              variationPrice = (parsedOrginalPrice / 1000) * parsedValue;
              // variationDiscount = variationPrice - (variationPrice * (parseInt(discount) / 100));
              variationDiscount = (parsedSellPrice / 1000) * parsedValue;
              const variationData = {
                title: variationTitle,
                price: Math.round(parseInt(variationPrice)),
                discount: Math.round(parseInt(variationDiscount)),
              };
              variationsItems.push(variationData);
            }
          });
        }
        variations = JSON.stringify(variations);
        const data = {
          id: parsedRow["id"],
          store_id,
          cover,
          name,
          images,
          original_price,
          sell_price,
          discount,
          kind,
          cate_id,
          sub_cate_id,
          in_home,
          is_single,
          have_gram,
          gram,
          have_kg,
          kg,
          have_pcs,
          pcs,
          have_liter,
          liter,
          have_ml,
          ml,
          descriptions,
          key_features,
          disclaimer,
          exp_date: new Date("2050-12-20"),
          type_of,
          in_stoke,
          rating,
          total_rating,
          status,
          in_offer,
          variations,
          size,
          tax_class,
          tags,
          hsn_code,
          brand_id,
        };
        connection.query(
          "INSERT INTO products SET ?",
          data,
          function (error, _results, _fields) {
            // console.log("I AM RUNNING");
            if (error) {
              listOfErrors.push({
                id: parsedRow["id"],
                error: error.message,
              });
            } else {
              listOfUpdates.push({
                id: parsedRow["id"],
                name,
              });
            }

            if (listOfErrors.length + listOfUpdates.length == items) {
              // console.log(listOfErrors)
              res.send({
                success: true,
                updates: listOfUpdates,
                errors: listOfErrors,
              });
            }
          }
        );
      });
  } catch (e) {
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.post("/update_with_variations", upload.single("file"), (req, res) => {
  try {
    let listOfUpdates = [];
    const { items } = req.body;
    let currentIndex = -1;
    let listOfErrors = [];
    // var workbook = XLSX.readFile(req.file.path);
    // var sheet_name_list = workbook.SheetNames;
    // let count = [];
    // for (var sheetIndex = 0; sheetIndex < sheet_name_list.length; sheetIndex++) {
    //     var worksheet = workbook.Sheets[sheet_name_list[sheetIndex]];
    //     var range = XLSX.utils.decode_range(worksheet['!fullref']);
    //     var num_rows = range.e.r - range.s.r + 1;

    //     count.push({
    //         data_count: num_rows
    //     });
    // }
    Fs.createReadStream(req.file.path)
      .pipe(
        csv({
          //   headers: false,
          mapHeaders: ({ header, index }) => {
            if (header.includes("nothing")) {
              return "no_value";
            } else if (header.includes("id")) {
              return "id";
            } else {
              return header;
            }
          },
          quote: '"',
        })
      )
      .on("data", (row) => {
        try {
          console.log(row);
          currentIndex++;
          let { id, original_price, sell_price, variations_types, stocks } =
            row;
          //   id = Object.values(row)[0];
          if (parseInt(sell_price) == 0 || parseInt(original_price) == 0) {
            listOfErrors.push({
              id: id,
              error: "Sell price or orginal price can't be 0",
            });
            return;
          }
          let variationsItems = [];
          let variations = [
            { title: "size", type: "radio", items: variationsItems },
          ];
          let variationsTypes = variations_types.split("|");
          variationsTypes.forEach((value) => {
            if (variationsTypes.length > 1) {
              let variationTitle = "";
              let variationPrice = 0;
              let variationDiscount = 0;
              let parsedValue = parseInt(value);
              let parsedSellPrice = parseInt(sell_price);
              let parsedOrginalPrice = parseInt(original_price);
              if (value.length == 4) {
                variationTitle = `${value[0]} KG`;
              } else {
                variationTitle = `${value}g`;
              }
              variationPrice = (parsedOrginalPrice / 1000) * parsedValue;
              // variationDiscount = variationPrice - (variationPrice * (parseInt(discount) / 100));
              variationDiscount = (parsedSellPrice / 1000) * parsedValue;
              const variationData = {
                title: variationTitle,
                price: Math.round(parseInt(variationPrice)),
                discount: Math.round(parseInt(variationDiscount)),
              };

              variationsItems.push(variationData);
            }
          });
          if (variationsItems.length == 0) {
            variations = [];
          }
          row["size"] = variations.length == 0 ? 0 : 1;
          variations = JSON.stringify(variations);

          const data = {
            ...row,
            variations: variations,
          };
          data["in_stoke"] = parseInt(stocks) > 25 ? 1 : 0;
          delete data.variations_types;
          delete data.id;
          delete data.nothing;
          delete data.no_value;
          delete data.stocks;
          console.log(data);
          console.log(id);
          connection.query(
            "UPDATE `products` SET ? WHERE id = ?",
            [data, id],
            function (error, _results, _fields) {
              //   console.log(listOfUpdates.length + listOfErrors.length)
              if (error) {
                // console.log(error);
                listOfErrors.push({
                  id,
                });
                return;
              }
              if (_results.affectedRows > 0) {
                listOfUpdates.push({
                  id,
                });
              } else {
                listOfErrors.push({
                  id,
                });
              }

              if (
                listOfErrors.length + listOfUpdates.length ==
                parseInt(items)
              ) {
                res.send({
                  success: true,
                  updates: listOfUpdates,
                  errors: listOfErrors,
                });
              }

              //   console.log(
              //     "Updated ",
              //     listOfUpdates.length,
              //     "Variations: ",
              //     variations
              //   );
            }
          );
        } catch (e) {
          console.log(e);
        }
      });
  } catch (e) {
    console.log(e);
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.post("/update_product/:type", upload.single("file"), (req, res) => {
  try {
    let listOfUpdates = [];
    const { items } = req.body;
    let currentIndex = 0;
    let listOfErrors = [];
    Fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // console.log(row);
        currentIndex++;
        let { id } = row;
        const data = {
          ...row,
        };

        delete data.id;
        delete data.nothing;
        console.log(data);
        try {
          connection.query(
            "UPDATE `products` SET ? WHERE id = ?",
            [data, id],
            function (error, _results, _fields) {
              if (error) {
                listOfErrors.push(error);
                return;
              }
              if (_results.affectedRows > 0) {
                listOfUpdates.push({
                  id,
                });
              } else {
                listOfErrors.push({
                  id,
                });
              }
              if (
                listOfErrors.length + listOfUpdates.length ==
                parseInt(items)
              ) {
                res.send({
                  success: true,
                  updates: listOfUpdates,
                  errors: listOfErrors,
                });
              }
            }
          );
        } catch (e) {
          throw e;
        }
      });
  } catch (e) {
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.post("/update_tags", upload.single("file"), (req, res) => {
  try {
    let listOfUpdates = [];
    const { items } = req.body;
    let currentIndex = -1;
    let listOfErrors = [];
    // var workbook = XLSX.readFile(req.file.path);
    // var sheet_name_list = workbook.SheetNames;
    // let count = [];
    // for (var sheetIndex = 0; sheetIndex < sheet_name_list.length; sheetIndex++) {
    //     var worksheet = workbook.Sheets[sheet_name_list[sheetIndex]];
    //     var range = XLSX.utils.decode_range(worksheet['!fullref']);
    //     var num_rows = range.e.r - range.s.r + 1;

    //     count.push({
    //         data_count: num_rows
    //     });
    // }
    Fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // console.log(row);
        currentIndex++;
        let { id, name, status, sub_cate_id } = row;
        const data = {
          ...row,
        };
        delete data.id;
        delete data.nothing;
        connection.query(
          "UPDATE `tags` SET ? WHERE id = ?",
          [data, id],
          function (error, _results, _fields) {
            if (error) {
              listOfErrors.push(error);
              return;
            }
            listOfUpdates.push({
              id,
              name,
            });
            if (listOfErrors.length + listOfUpdates.length == items) {
              res.send({
                success: true,
                updates: listOfUpdates,
                errors: listOfErrors,
              });
            }
          }
        );
      });
  } catch (e) {
    res.send({
      success: false,
      error: e.message,
    });
  }
});

const generateInvoiceNumber = () => {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM `invoice_series` WHERE `id` = ?",
      ["1"],
      (err, results, fields) => {
        // console.log(err)
        if (err) {
          reject("Failed to fetch last invoice details");
        } else {
          if (results.length != 0) {
            const lastInvoiceNumber = results[0]["last_invoice"];
            if (lastInvoiceNumber) {
              let nextInvoiceNumber = parseInt(lastInvoiceNumber) + 1;
              if (isFinite(nextInvoiceNumber)) {
                connection.query(
                  "UPDATE `invoice_series` SET `last_invoice` = ? WHERE `id` = 1",
                  [nextInvoiceNumber],
                  (err2, results2, fields2) => {
                    if (err2) {
                      reject("Failed to update last invoice details");
                    } else {
                      resolve(nextInvoiceNumber);
                    }
                  }
                );
                resolve(nextInvoiceNumber);
              }
            } else {
              reject("Can't able to get last invoice number");
            }
          } else {
            reject("No last invoice details found");
          }
        }
      }
    );
  });
};

app.post("/order/update_order_status", async (req, res) => {
  const { email, status, name, orderId } = req.body;
  let subject = "";
  let message = "";
  let orderInfo;
  let userInfo;
  // let query = "SELECT * FROM `orders` WHERE `id` = ";
  // query += orderId;
  var options = {
    sql: "SELECT * FROM orders JOIN users ON orders.uid=users.id WHERE orders.id = ?",
    nestTables: true,
    values: orderId,
  };
  connection.query(options, async (error, results, fields) => {
    const { orders, users } = results[0];
    orderInfo = orders;
    userInfo = users;
    if (status == "New Order") {
      let generatedMessage = smsSender.generateSmsTemplate("order_placed", {
        customerName: name,
        orderId: orderId,
      });
      let mobileNumber = userInfo.mobile;
      mobileNumber = mobileNumber.replace("+91", "");
      let smsRes = await smsSender.sendSms(mobileNumber, generatedMessage);
      subject = `Your Sampurna-Bazaar order has been received!`;
      let orderString = "";
      let orders = JSON.parse(orderInfo.orders);
      let notes = JSON.parse(orderInfo.notes);
      let index = 0;
      for (let order of orders) {
        // // console.log(order);
        let price = 0;
        const variations = order.variations;
        if (variations.length == 0) {
          price = order.sell_price;
        } else {
          price = variations[0].items[order.variant].discount;
        }
        orderString += `<tr>
                <td style="color:#636363;border:1px solid #e5e5e5;padding:12px;text-align:left;vertical-align:middle;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif;word-wrap:break-word">
               ${order.name}	</td>
                <td style="color:#636363;border:1px solid #e5e5e5;padding:12px;text-align:left;vertical-align:middle;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif">
                    ${order.quantiy}		</td>
                <td style="color:#636363;border:1px solid #e5e5e5;padding:12px;text-align:left;vertical-align:middle;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif">
                    <span><span>₹</span>${price}</span>		</td>
            </tr>`;
      }
      // // console.log("loop end successfully")
      message = `<div marginwidth="0" marginheight="0" style="padding:0">
            <div id="m_2788942578956430254m_6065570267667005374wrapper" dir="ltr" style="background-color:#f7f7f7;margin:0;padding:70px 0;width:100%">
                <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                    <tbody><tr>
                        <td align="center" valign="top">
                            <div id="m_2788942578956430254m_6065570267667005374template_header_image">
                                                        </div>
                            <table border="0" cellpadding="0" cellspacing="0" width="600" id="m_2788942578956430254m_6065570267667005374template_container" style="background-color:#ffffff;border:1px solid #dedede;border-radius:3px">
                                <tbody><tr>
                                    <td align="center" valign="top">
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" id="m_2788942578956430254m_6065570267667005374template_header" style="background-color:#ff8836;color:#202020;border-bottom:0;font-weight:bold;line-height:100%;vertical-align:middle;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;border-radius:3px 3px 0 0">
                                            <tbody><tr>
                                                <td id="m_2788942578956430254m_6065570267667005374header_wrapper" style="padding:36px 48px;display:block">
                                                    <h1 style="font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:30px;font-weight:300;line-height:150%;margin:0;text-align:left;color:#202020">Thank you for placing your order at Sampurna Bazaar</h1>
                                                </td>
                                            </tr>
                                        </tbody></table>
                                        
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" valign="top">
                                        
                                        <table border="0" cellpadding="0" cellspacing="0" width="600" id="m_2788942578956430254m_6065570267667005374template_body">
                                            <tbody><tr>
                                                <td valign="top" id="m_2788942578956430254m_6065570267667005374body_content" style="background-color:#ffffff">
                                                    
                                                    <table border="0" cellpadding="20" cellspacing="0" width="100%">
                                                        <tbody><tr>
                                                            <td valign="top" style="padding:48px 48px 32px">
                                                                <div id="m_2788942578956430254m_6065570267667005374body_content_inner" style="color:#636363;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:14px;line-height:150%;text-align:left">
    
    <p style="margin:0 0 16px">Dear Customer,</p>
    
    
    <h2 style="color:#ff8836;display:block;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:18px;font-weight:bold;line-height:130%;margin:0 0 18px;text-align:left">
        [Order #${orderId}] ${notes[0].time}</h2>
    
    <div style="margin-bottom:40px">
        <table cellspacing="0" cellpadding="6" border="1" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;width:100%;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif">
            <thead>
                <tr>
                    <th scope="col" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Product</th>
                    <th scope="col" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Quantity</th>
                    <th scope="col" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Price</th>
                </tr>
            </thead>
            <tbody>
                ${orderString}
        
            </tbody>
            <tfoot>
                                    <tr>
                            <th scope="row" colspan="2" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left;border-top-width:4px">Subtotal:</th>
                            <td style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left;border-top-width:4px"><span><span>₹</span>${orderInfo.total
        }</span></td>
                        </tr>
                                            <tr>
                            <th scope="row" colspan="2" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Shipping:</th>
                            <td style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">
    <span><span>₹</span>${orderInfo.delivery_charge
        }</span>&nbsp;<small>via Flat rate</small>
    </td>
                        </tr>
                                            <tr>
                            <th scope="row" colspan="2" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Payment method:</th>
                            <td style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">${orderInfo.paid_method.toUpperCase()}</td>
                        </tr>
                                            <tr>
                            <th scope="row" colspan="2" style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">Total:</th>
                            <td style="color:#636363;border:1px solid #e5e5e5;vertical-align:middle;padding:12px;text-align:left">
    <span><span>₹</span>${orderInfo.grand_total}</span>
    </td>
                        </tr>
                                </tfoot>
        </table>
    </div>
    
    
    <table id="m_2788942578956430254m_6065570267667005374addresses" cellspacing="0" cellpadding="0" border="0" style="width:100%;vertical-align:top;margin-bottom:40px;padding:0">
        <tbody><tr>
            <td valign="top" width="50%" style="text-align:left;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif;border:0;padding:0">
                <h2 style="color:#ff8836;display:block;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:18px;font-weight:bold;line-height:130%;margin:0 0 18px;text-align:left">Billing address</h2>
    
                <address style="padding:12px;color:#636363;border:1px solid #e5e5e5">
                ${JSON.parse(orderInfo.address).address}</address>
            </td>
                        <td valign="top" width="50%" style="text-align:left;font-family:'Helvetica Neue',Helvetica,Roboto,Arial,sans-serif;padding:0">
                    <h2 style="color:#ff8836;display:block;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:18px;font-weight:bold;line-height:130%;margin:0 0 18px;text-align:left">Shipping address</h2>
    
                    <address style="padding:12px;color:#636363;border:1px solid #e5e5e5">${JSON.parse(orderInfo.address).address
        }</address>
                </td>
                </tr>
    </tbody></table>
    <p style="margin:0 0 16px">Thanks for using <a href="http://sampurna-bazaar.com" target="_blank" data-saferedirecturl="https://www.google.com/url?q=http://sampurna-bazaar.com&amp;source=gmail&amp;ust=1612065106496000&amp;usg=AFQjCNEqn930pHeZjiMqQ6CglT8uGISxlw">sampurna-bazaar.com</a>!</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </tbody></table>
                                                    
                                                </td>
                                            </tr>
                                        </tbody></table>
                                        
                                    </td>
                                </tr>
                            </tbody></table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" valign="top">
                            
                            <table border="0" cellpadding="10" cellspacing="0" width="600" id="m_2788942578956430254m_6065570267667005374template_footer">
                                <tbody><tr>
                                    <td valign="top" style="padding:0;border-radius:6px">
                                        <table border="0" cellpadding="10" cellspacing="0" width="100%">
                                            <tbody><tr>
                                                <td colspan="2" valign="middle" id="m_2788942578956430254m_6065570267667005374credit" style="border-radius:6px;border:0;color:#8a8a8a;font-family:&quot;Helvetica Neue&quot;,Helvetica,Roboto,Arial,sans-serif;font-size:12px;line-height:150%;text-align:center;padding:24px 0">
                                                    <p style="margin:0 0 16px">Thank you for choosing Sampurna Bazaar</p>
                                                </td>
                                            </tr>
                                        </tbody></table>
                                    </td>
                                </tr>
                            </tbody></table>
                            
                        </td>
                    </tr>
                </tbody></table><div class="yj6qo"></div><div class="adL">
            </div></div><div class="adL">
        </div></div>`;
      // // console.log("message creation done")
      transporter
        .sendMail({
          from: "no-reply@sampurna-bazaar.com",
          to: `${email},delivery@sampurna-bazaar.com`,
          subject: subject,
          html: message,
        })
        .then((data) => {
          // // console.log(data)
          res.send(data);
        })
        .catch((e) => {
          res.send(e);
        });
    } else if (status == "Delivered") {
      const invoiceNumber = await generateInvoiceNumber();
      let generatedMessage = smsSender.generateSmsTemplate("order_delivered", {
        customerName: name,
        orderId: orderId,
      });
      let mobileNumber = userInfo.mobile;
      mobileNumber = mobileNumber.replace("+91", "");
      await smsSender.sendSms(mobileNumber, generatedMessage);
      connection.query(
        "UPDATE `orders` SET `inv_no` = ? WHERE `id` = ?",
        [invoiceNumber, orderId],
        async (err, results, fields) => {
          // console.log(err);
          // console.log(results);
          if (!err) {
            subject = "Your order is delivered, on time!";
            message = `<table width="500" border="0" align="center" cellpadding="0" cellspacing="0" style="table-layout:fixed"
            bgcolor="#f7f7f7">
            <tbody>
                <tr>
                    <td align="center" valign="top"
                        background="https://ci4.googleusercontent.com/proxy/eHkishhHO3baOBKUCkUCBP3qwrUXdfQjjIR3IDQl8g3TXHCyPys-krJGQl_iip6IIHyGv4wTOqElHtvf54z3c0-LyKmGzPK1u2tk2jxweFLKlm2S=s0-d-e1-ft#http://https://www.bbassets.com/static/images/n_email/pattern.png">
                        <table width="500" border="0" cellspacing="0" cellpadding="0" align="center" style="width:500px">
                            <tbody>
                                <tr>
                                    <td height="20" style="line-height:0px;font-size:0px">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td align="center" valign="top">
                                        <table width="460" border="0" cellspacing="0" cellpadding="0" align="center"
                                            style="width:460px">
                                            <tbody>
                                                <tr>
                                                    <td width="143" style="width:143px" valign="middle">
                                                        <a href="https://www.sampurna-bazaar.com?utm_source=sampurna-bazaar&amp;utm_medium=emailer&amp;utm_campaign=order_delivered"
                                                            target="_blank"
                                                            data-saferedirecturl="https://res.cloudinary.com/gsasac/image/upload/v1611923329/sampurna-flat-logo_fvaekl.jpg"
                                                            width="178" height="40" style="display:block" border="0"
                                                            class="CToWUd">
                                                        </a>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td height="20" style="line-height:0px;font-size:0px">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td align="center" valign="top">
                        <table width="500" border="0" align="center" cellpadding="0" cellspacing="0">
                            <tbody>
                                <tr>
                                    <td width="20" style="width:20px">&nbsp;</td>
                                    <td align="center" valign="top">
                                        <table width="460" border="0" cellspacing="0" cellpadding="0" align="center"
                                            style="width:460px">
                                            <tbody>
                                                <tr>
                                                    <td align="center" valign="top">
                                                        <table width="460" border="0" cellspacing="0" cellpadding="0"
                                                            style="width:460px">
                                                            <tbody>
                                                                <tr>
                                                                    <td bgcolor="#ededed" width="1" style="width:1px">
                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                            width="1" height="1" style="display:block"
                                                                            border="0" class="CToWUd">
                                                                    </td>
                                                                    <td align="center" valign="top">
                                                                        <table width="458" border="0" cellspacing="0"
                                                                            cellpadding="0" style="width:458px">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td bgcolor="#ededed" height="1"
                                                                                        style="height:1px;line-height:0px;font-size:0px">
                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                            width="1" height="1"
                                                                                            style="display:block" border="0"
                                                                                            class="CToWUd">
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td bgcolor="#ffffff"
                                                                                        style="padding:12px 0px">
                                                                                        <table width="458" border="0"
                                                                                            cellspacing="0" cellpadding="0"
                                                                                            style="width:458px">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td width="15"
                                                                                                        style="width:15px"></td>
                                                                                                    <td align="left"
                                                                                                        valign="top"
                                                                                                        style="font-family:Arial,sans-serif;font-size:18px;color:#222222;font-weight:bold;vertical-align:middle">
                                                                                                        Your order is delivered,
                                                                                                        on time!</td>
                                                                                                    <td width="22"
                                                                                                        style="width:22px">
                                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                                            width="30"
                                                                                                            height="30"
                                                                                                            style="display:block"
                                                                                                            border="0"
                                                                                                            class="CToWUd">
                                                                                                    </td>
                                                                                                    <td width="30"
                                                                                                        style="width:30px"></td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </td>
                                                                                </tr>
                                                                                <tr>
                                                                                    <td bgcolor="#ededed" height="1"
                                                                                        style="height:1px;line-height:0px;font-size:0px">
                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                            width="1" height="1"
                                                                                            style="display:block" border="0"
                                                                                            class="CToWUd">
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                    <td bgcolor="#ededed" width="1" style="width:1px">
                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                            width="1" height="1" style="display:block"
                                                                            border="0" class="CToWUd">
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="8" style="line-height:0px;font-size:0px">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td align="center" valign="top" bgcolor="#fff">
                                                        <table width="460" border="0" cellspacing="0" cellpadding="0"
                                                            style="width:460px">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <table style="width:460px" width="460" cellspacing="0"
                                                                            cellpadding="0" border="0">
                                                                            <tbody>
                                                                                <tr>
                                                                                    <td bgcolor="#ededed" width="1"
                                                                                        style="width:1px">
                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                            width="1" height="1"
                                                                                            style="display:block" border="0"
                                                                                            class="CToWUd">
                                                                                    </td>
                                                                                    <td align="center" valign="top">
                                                                                        <table style="width:458px" width="458px"
                                                                                            cellspacing="0" cellpadding="0"
                                                                                            border="0" bgcolor="#ffffff">
                                                                                            <tbody>
                                                                                                <tr>
                                                                                                    <td bgcolor="#ededed"
                                                                                                        height="1"
                                                                                                        style="height:1px;line-height:0px;font-size:0px">
                                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                                            width="1" height="1"
                                                                                                            style="display:block"
                                                                                                            border="0"
                                                                                                            class="CToWUd">
                                                                                                    </td>
                                                                                                </tr>
                                                                                                <tr>
                                                                                                    <td style="font-family:Arial,sans-serif;font-size:16px;color:#444444;line-height:24px;padding:16px"
                                                                                                        valign="top"
                                                                                                        align="left">Hi ${name},
                                                                                                        <br> As promised, your
                                                                                                        order
                                                                                                        <a href="https://www.sampurna-bazaar.com/"
                                                                                                            style="color:#1a13c8;text-decoration:underline;white-space:nowrap"
                                                                                                            target="_blank"
                                                                                                            data-saferedirecturl="https://www.google.com/url?q=https://www.sampurna-bazaar.com/order/MBO-129640080-090720/details/?utm_source%3Dsampurna-bazaar%26utm_medium%3Demailer%26utm_campaign%3Dorder_delivered&amp;source=gmail&amp;ust=1611989543783000&amp;usg=AFQjCNEA3_ITsqch9UWpmxKjW95ur6PBug">SB-${orderId}</a>
                                                                                                        is delivered on time.
                                                                                                        <br> Feel free to contact us if you have any further issues.
                                                                                                        <br> You may review your order history at any time by logging in to the app.
                                                                                                        <br><br>Note: This email will serve as an official receipt for this payment.
                                                                                                      </td>
                                                                                                </tr>
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </td>
                                                                                    <td bgcolor="#ededed" width="1"
                                                                                        style="width:1px">
                                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                                            width="1" height="1"
                                                                                            style="display:block" border="0"
                                                                                            class="CToWUd">
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td bgcolor="#ededed" height="1"
                                                                        style="height:1px;line-height:0px;font-size:0px">
                                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                                            width="1" height="1" style="display:block"
                                                                            border="0" class="CToWUd">
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="8" style="line-height:0px;font-size:0px">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td background="https://ci4.googleusercontent.com/proxy/eHkishhHO3baOBKUCkUCBP3qwrUXdfQjjIR3IDQl8g3TXHCyPys-krJGQl_iip6IIHyGv4wTOqElHtvf54z3c0-LyKmGzPK1u2tk2jxweFLKlm2S=s0-d-e1-ft#http://https://www.bbassets.com/static/images/n_email/pattern.png"
                                                        align="left" valign="top"
                                                        style="font-family:Arial,sans-serif;font-size:16px;padding:16px 0px 13px 8px;color:#444444;line-height:24px">
                                                        Cheers,
                                                        <br> Team Sampurna-Bazaar
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#ededed" style="height:1px;line-height:0px;font-size:0px">
                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                            width="1" height="1" style="display:block" border="0"
                                                            class="CToWUd">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td height="10" style="height:10px">&nbsp;</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <table width="460" border="0" cellspacing="0" cellpadding="0" align="center"
                                            style="width:460px">
                                            <tbody>
                                                <tr>
                                                    <td align="center" valign="top"
                                                        style="font-family:Arial,sans-serif;padding-bottom:14px;font-weight:bold;font-size:14px;color:#333333;line-height:22px">
                                                        Need any help?</td>
                                                </tr>
                                                <tr>
                                                    <td align="center" valign="top"
                                                        style="font-family:Arial,sans-serif;padding-bottom:10px;font-size:14px;color:#333333;line-height:22px">
                                                        Contact us any day between 9:30 AM to 6:30 PM. We are happy to help.</td>
                                                </tr>
                                                <tr>
                                                    <td align="center" valign="top"
                                                        style="font-family:Arial,sans-serif;padding-bottom:11px;font-size:14px;color:#333333;line-height:26px">
                                                        <a href="mailto:customerservice@sampurna-bazaar.com"
                                                            style="color:#1a13c8;text-decoration:none" target="_blank">Email
                                                            Us</a> &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; +916366574291
                                                        &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
                                                        <a href="https://sampurna-bazaar.com"
                                                            style="color:#1a13c8;text-decoration:none" target="_blank"
                                                            data-saferedirecturl="https://www.google.com/url?q=https://l.sampurna-bazaar.com/PtH9uS0mmQ&amp;source=gmail&amp;ust=1611989543783000&amp;usg=AFQjCNGLqGMGQ_8jNOTzpfToILWAP6GUGg">Ask
                                                            Us</a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#e1e1e6" style="height:1px;line-height:0px;font-size:0px">
                                                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                                                            width="1" height="1" style="display:block" border="0"
                                                            class="CToWUd">
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:15px 0px 25px 0px" align="center">
        
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td width="20" style="width:20px">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td bgcolor="#f7f7f7" style="line-height:1px;font-size:1px" width="500">
                        <img src="https://res.cloudinary.com/gsasac/image/upload/v1611923330/sampurna-flat-logo-big_sakcqf.jpg"
                            height="1" width="500"
                            style="max-height:1px;min-height:1px;display:block;width:500px;min-width:500px" border="0"
                            class="CToWUd">
                    </td>
                </tr>
            </tbody>
        </table>`;
            const browser = await puppeteer.launch({
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            const page = await browser.newPage();
            await page.goto(
              `https://server.sampurna-bazaar.com/api/generate-invoice/${orderId}`,
              {
                waitUntil: "networkidle2",
              }
            );
            await page.setViewport({ width: 1680, height: 1050 });
            await page.pdf({
              path: `generated_invoice/${orderId}.pdf`,
              format: "A4",
            });

            await browser.close();
            transporter
              .sendMail({
                from: "no-reply@sampurna-bazaar.com",
                to: email,
                subject: subject,
                html: message,
                attachments: [
                  {
                    filename: "invoice.pdf",
                    path: `${__dirname}/generated_invoice/${orderId}.pdf`,
                    contentType: "application/pdf",
                  },
                ],
              })
              .then((data) => {
                // console.log(data)
                res.send(data);
              })
              .catch((e) => {
                res.send(e);
              });
          }
        }
      );
    } else if (status == "Payment Successful") {
      subject = "SampurnaBazaar - Payment was successful";
    }
  });
});

const generateWholeInvoiceFormat = (invNumber) => {
  let inv = "AI22";
  invNumber = invNumber.toString();
  if (invNumber.length == 1) {
    inv = `AI22000000${invNumber}`;
  } else if (invNumber.length == 2) {
    inv = `AI2200000${invNumber}`;
  } else if (invNumber.length == 3) {
    inv = `AI220000${invNumber}`;
  } else if (invNumber.length == 4) {
    inv = `AI22000${invNumber}`;
  } else if (invNumber.length == 5) {
    inv = `AI2200${invNumber}`;
  } else if (invNumber.length == 6) {
    inv = `AI220${invNumber}`;
  } else if (invNumber.length == 7) {
    inv = `AI22${invNumber}`;
  }
  return inv;
};

app.post("/orders/new_order", async (req, res) => {
  const adminPhone = "9740894141";
  const customerServicePhone = "6366574291";
  const fleetManagerPhone = "6366574287";
  const cataloguePhoneNumber = "6366574285";
  const itTeam = "8318045008";
  const { id, amount } = req.body;
  let generatedMessage = smsSender.generateSmsTemplate("new_order_alert", {
    orderId: id,
    totalPrice: amount,
  });
  const smsRes = await smsSender.sendSms(
    `${adminPhone},${customerServicePhone},${fleetManagerPhone},${cataloguePhoneNumber},${itTeam}`,
    generatedMessage
  );
  // console.log(smsRes);
  res.send({
    status: "success",
  })
});

app.get("/generate-invoice/:invoiceId", async (req, res) => {
  try {
    const id = req.params.invoiceId;
    let query = "SELECT * FROM `orders` WHERE `id` = ?";

    if (id) {
      // query += ;
      connection.query(query, [id], function (error, results, fields) {
        try {
          if (error) {
            res.send({
              success: false,
              result: "Wrong Order id",
            });
            return;
          }
          let userQuery = "SELECT * FROM `users` WHERE `id` = ?";

          const result = results[0];
          // console.log(result);
          // // console.log(result.coupon);
          // userQuery += result.uid;
          connection.query(
            userQuery,
            [result.uid],
            function (error, users, fields) {
              if (error) {
                res.send({
                  success: false,
                  result: "Wrong Order id",
                });
                return;
              }

              const user = users[0];
              let invoiceId = 0;
              result.orders = JSON.parse(result.orders);
              result.inv_no = generateWholeInvoiceFormat(result.inv_no);
              result.address = JSON.parse(result.address);
              result.notes = JSON.parse(result.notes);
              result.status = JSON.parse(result.status);
              result.grand_total = Math.round(result.grand_total);
              if (result.coupon_code != "") {
                result.coupon_code = JSON.parse(result.coupon_code);
              }
              result.orders.forEach((data, index) => {
                if (data.variations.length == 0) {
                  // // console.log(data.sell_price);
                } else {
                  // // console.log(data.variations[0].items[data.variant].discount);
                }
              });
              result.product_order_status = JSON.parse(
                result.product_order_status
              );
              res.render("invoice.ejs", {
                order: result,
                user: user,
              });
            }
          );
        } catch (e) {
          res.send({
            success: false,
            error: "Wrong Order ID",
          });
        }
      });
    } else {
      res.send({
        success: false,
        result: "Wrong Order id",
      });
    }
  } catch (e) {
    res.send({
      success: false,
      error: "May be user is not in the database",
    });
  }
});

function checkIsAvailable(idsSupportedBySodexo, allCartIds) {
  let sodexoPaymentType = "";
  let isSupportedIds = new Set();
  allCartIds.forEach((e) => {
    let isIncludes = idsSupportedBySodexo.includes(parseInt(e));
    isSupportedIds.add(isIncludes);
  });
  isSupportedIds = Array(...isSupportedIds.values());
  // // console.log(isSupportedIds)
  if (isSupportedIds.includes(false)) {
    // // console.log("Sodexo is only available for food products")
    return null;
  } else {
    sodexoPaymentType = "FOOD";
    return sodexoPaymentType;
  }
}

app.post("/sodexo/create", async (req, res) => {
  try {
    let { amount, allCartIds, sourceType, apiKey } = req.body;
    // console.log(req.body);
    if (apiKey === SODEXO_API_KEY) {
      if (amount && allCartIds && sourceType) {
        let idsSupportedBySodexo = [1, 2, 3, 4, 5, 9, 10];
        const sodexoPaymentType = checkIsAvailable(
          idsSupportedBySodexo,
          allCartIds
        );
        // console.log(sodexoPaymentType);
        // // console.log(sodexoPaymentType);
        if (sodexoPaymentType != null) {
          const reqId = "req_sb_" + Date.now();
          const url = `${SODEXO_API_PRE_PROD_URL}/v1.0/sodexo/transactions`;
          const response = await axios.post(
            url,
            {
              requestId: reqId,
              sourceType: sourceType,
              amount: {
                currency: "INR",
                value: amount,
              },
              merchantInfo: {
                aid: "201712",
                mid: "092010001132441",
                tid: "94219300",
              },
              purposes: [
                {
                  purpose: sodexoPaymentType,
                  amount: {
                    currency: "INR",
                    value: amount,
                  },
                },
              ],
              failureUrl: "https://server.sampurna-bazaar.com/api/failure_page.html",
              successUrl: "https://server.sampurna-bazaar.com/api/success_page.html",
            },
            {
              headers: {
                apiKey: SODEXO_API_KEY,
                "Content-Type": "application/json",
              },
            }
          );
          // console.log(response.data)
          if (response) {
            res.send({
              success: true,
              response: response.data,
            });
          } else {
            res.send({
              success: false,
              error: "awesome error occured",
            });
          }
        } else {
          res.send({
            success: false,
            error: "All cats are not related to food item",
          });
        }
      } else {
        res.send({
          success: false,
          error: "Please pass all the fields",
        });
      }
    } else {
      res.send({
        success: false,
        error: "Wrong API key",
      });
    }
  } catch (e) {
    // console.log(e.message)
    res.send({
      success: false,
      error: e.message,
    });
  }
});

app.get("/sodexo/get_payment_info", async (req, res) => {
  const { id, apiKey } = req.query;
  if (apiKey === SODEXO_API_KEY) {
    if (id) {
      const endPoint = `/v1.0/sodexo/transactions/request_id/${id}`;
      const url = `${SODEXO_API_PRE_PROD_URL}${endPoint}`;
      const response = await axios.get(url);
      if (response) {
        res.send({
          success: true,
          response: response,
        });
      } else {
        res.send({
          success: false,
          error: "Fail to fetch the payment details",
        });
      }
    } else {
      res.send({
        success: false,
        error: "Please pass all the fields",
      });
    }
  } else {
    res.send({
      success: false,
      error: "Wrong API key",
    });
  }
});

app.post("/notification/send_status_update", async (req, res) => {
  const { status, orderId, userId } = req.body;
  connection.query(
    "SELECT * FROM `users` WHERE id = ?",
    [userId],
    async (err, results, fields) => {
      if (!err && results.length > 0) {
        const user = results[0];
        const token = user["fcm_token"];
        const username = user["first_name"];
        let mobile = user.mobile;
        mobile = mobile.replace("+91", "");
        const notificationMessage = generateNotificationMessage(
          status,
          username,
          orderId
        );
        if (notificationMessage) {
          const notificationData = {
            orderId: orderId,
            username: username,
          };
          const notificationRes = await notificationSender.sendNotification(notificationMessage, user.id, [token], notificationData);
          if (notificationRes) {
            const message = smsSender.generateKeyForStatus(status, {
              customerName: username,
              orderId: orderId,
            });
            const smsRes = await smsSender.sendSms(mobile, message);
            res.send({
              data: "notification sent",
              res: notificationRes,
              sms: smsRes,
            });
          } else {
            res.send({
              error: "failed",
            });
          }
        } else {
          res.send({
            error: "no possible notification",
          });
        }
      } else {
        res.send({
          error: "no possible notification",
        });
      }
    }
  );
});

app.get("/varada/dc/qrcode", (req, res) => {
  console.log("i TRIED CALLING");
  try {
    const { id } = req.query;
    if (id) {
      QrCode.toDataURL(`https://erp.sampurnabazaar.in/invoice/${id}`).then(url => {
        res.send({
          url: url
        })
      })
    } else {
      res.send({
        url: ""
      })
    }
  } catch (e) {
    console.log(e)
    res.send({
      url: ""
    })
  }
})

app.listen(port, () => console.log("Server Started"));
