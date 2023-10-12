const mySql = require("mysql")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const connection = mySql.createConnection({
    host: 'localhost',
    user: 'mwsampur_app',
    password: 'mwsampur_app',
    database: 'mwsampur_app'
})
connection.connect();

connection.on("connect", (err) => {
    if (err) {
        // console.log(err)
    } else {
        // console.log("MySQL Connected")
    }
})

const generateWholeInvoiceFormat = (invNumber) => {
    let inv = "AI22";
    invNumber = invNumber.toString();
    if(invNumber.length == 1) {
        inv = `AI22000000${invNumber}`
    }else if(invNumber.length == 2) {
        inv = `AI2200000${invNumber}`
    }else if(invNumber.length == 3) {
        inv = `AI220000${invNumber}`
    }else if(invNumber.length == 4) {
        inv = `AI22000${invNumber}`
    }else if(invNumber.length == 5) {
        inv = `AI2200${invNumber}`
    }else if(invNumber.length == 6) {
        inv = `AI220${invNumber}`
    }else if(invNumber.length == 7) {
        inv = `AI22${invNumber}`
    }
    return inv;
}

async function generate_sales_report() {
    var options = { sql: 'SELECT * FROM orders JOIN users ON orders.uid=users.id', nestTables: true };
    const ordersRecords = [];
    const fileName = 'exports/sales_report_' + new Date(Date.now()) + ".csv";
    const csvWriter = createCsvWriter({
        path: fileName,
        header: [
            { id: 'order_id', title: 'Order ID' },
            { id: 'inv_no', title: 'Invoice Number' },
            { id: 'user_id', title: 'User ID' },
            { id: 'user_name', title: 'User Name' },
            { id: 'email', title: 'User Email' },
            { id: 'phone', title: 'User Phone' },
            { id: 'paid_method', title: 'Payment Method' },
            { id: 'address', title: 'Address' },
            { id: 'grand_total', title: 'Grand total' },
            { id: 'delivery_charge', title: 'Delivery charge' },
            { id: 'coupon_code', title: 'Coupon code' },
            { id: 'order_status', title: 'Order status' },
            { id: 'order_date', title: 'Orderd Date' },
            { id: 'order_accepted_date', title: 'Order Accepted Date' },
            // { id: 'delivery_cost', title: 'Delivery Cost' },
        ]
    });
    connection.query(options, function (error, results, fields) {
        for (var info of results) {
            const { orders, users } = info;
            const addressInfo = JSON.parse(orders.address);
            const couponInfo = orders.coupon_code != "" ? JSON.parse(orders.coupon_code) : { code: "Not Used" };
            const orderStatusInfo = JSON.parse(orders.status);
            const notesInfo = JSON.parse(orders.notes);
            const orderAcceptedInfo = notesInfo.filter(e => e.value == "Order Accepted");
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
                order_accepted_date: orderAcceptedInfo.length > 0 ? orderAcceptedInfo[0].time : "No date",
                // delivery_cost: deliveries.total_payment || "0"
            }
            ordersRecords.push(record);
        }
        csvWriter.writeRecords(ordersRecords)
            .then(() => {
                console.log("Report Generated")
            });
    });
}

generate_sales_report();