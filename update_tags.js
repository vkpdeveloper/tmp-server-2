const mySql = require("mysql");
const { exists } = require("./models/tag");

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
    }
})

const automate_tags_update = async () => {
    connection.query("SELECT * FROM tags", (error, results, fields) => {
        for (let r of results) {
            let query = "SELECT * FROM products WHERE FIND_IN_SET("
            query += "?, "
            query += "replace(products.tags, '|', ',') )"
            connection.query(query, r['id'], (productError, productResults, productFields) => {
                if (!productError) {
                    // console.log("WORKING ON TAG ID : ", r['id'])
                    if (productResults.length == 0) {
                        // console.log("WORKING ON TAG ID : ", r['id'])
                        connection.query("UPDATE tags SET status = ? WHERE id = ?", [0, r['id']], (updateError, updateResults, updateFields) => {
                            if(!updateError) {
                                // console.log("TAG ID: ", r['id'], "is updated with 0 status");
                            }
                        })
                    }else {
                        // console.log("WORKING ON TAG ID : ", r['id'])
                        connection.query("UPDATE tags SET status = ? WHERE id = ?", [1, r['id']], (updateError, updateResults, updateFields) => {
                            if(!updateError) {
                                // console.log("TAG ID: ", r['id'], "is updated with 1 status");
                            }
                        })
                    }
                }
                // for(let product of productResults) {
                //     console.log("data: ", product);
                // }
            })
        }
    })
}

automate_tags_update();