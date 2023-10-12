const mySql = require("mysql");
const csv = require("csv-parser");
const fs = require("fs");

const connection = mySql.createConnection({
  host: "localhost",
  user: "mwsampur_app",
  password: "mwsampur_app",
  database: "mwsampur_app",
});
connection.connect();

connection.on("connect", (err) => {
  if (err) {
    console.log(err);
  } else {
    // console.log("MySQL Connected")
    fillRatingInProduct();
  }
});

function random(min, max) {
  return min + Math.random() * (max - min);
}

const fillRatingInProduct = () => {
  connection.query("SELECT * FROM products WHERE 1", (err, results, _) => {
    if (!err) {
      for (let product of results) {
        const rating = random(1, 5);
        const ratingData = {
          total_rating: rating,
          rating: rating,
        };
        connection.query(
          "UPDATE products SET ? WHERE id = ?",
          [ratingData, product.id],
          (err, results, _) => {
            console.log(`Rating is updated for ${product.id}`);
          }
        );
      }
    }
  });
};
