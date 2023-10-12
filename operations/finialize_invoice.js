const mySql = require("mysql")
const csv = require('csv-parser')
const fs = require('fs')

const connection = mySql.createConnection({
    host: 'localhost',
    user: 'mwsampur_app',
    password: 'mwsampur_app',
    database: 'mwsampur_app'
})
connection.connect();

connection.on("connect", (err) => {
    if (err) {
        console.log(err)
    } else {
        // console.log("MySQL Connected")
        finilize_invoice_number();
    }
})

async function finilize_invoice_number() {
    fs.createReadStream('SalesReport.csv')
        .pipe(csv())
        .on('data', (data) => {
            const { id, invoice } = data;
            connection.query("UPDATE orders SET inv_no = ? WHERE id = ?", [invoice, id], (error, results, fields) => {
                // console.log(results)
            })
        })
        .on('end', () => {
            // console.log("DONE")
        });
}