const OneSignal = require('onesignal-node');
const mySql = require("mysql")
const csv = require("csv-parser");
const Fs = require("fs");

const client = new OneSignal.Client('b2bd55f4-f3dd-4cf2-b864-addd87e025a9', 'ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh');

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
        console.log("MySQL Connected")
        sendNotification();
        // console.log(pickRandom(0, 15))
    }
})

async function readOfferSheet() {
    return new Promise((resolve, reject) => {
        let totalOffers = [];
        let inputStream = Fs.createReadStream("./data/offers.csv", { encoding: "utf8" });
        inputStream.pipe(csv()).on("data", function (row) {
            const id = Object.values(row)[0];
            const data = {
                id: id,
                name: row.name,
                selling_price: row.sell_price
            }
            totalOffers.push(data)
        }).on("end", () => {
            // console.log("Done")
            resolve(totalOffers)
        });
    })
}

function pickRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

async function sendNotification() {
    const offers = await readOfferSheet();
    let totalSent = 0;
    // console.log(offers.length)
    connection.query(
        "SELECT * FROM users WHERE 1",
        async (err, results, fields) => {

            if (!err && results.length > 0) {
                for (let user of results) {
                    const { fcm_token } = user;
                    const randomIndex = pickRandom(0, (offers.length - 1));
                    const offer = offers[randomIndex];
                    if (fcm_token && fcm_token != "NA") {
                        // const response = await client.createNotification({
                        //     contents: { "en": `Get ${offer.name} just at ₹${offer.selling_price}. It's a limited time offer only for you ${user.first_name} to make your Diwali amazing and fantastic with Sampurna Bazaar.` },
                        //     headings: { "en": `Happy Diwali ${user.first_name} 🪔` },
                        //     priority: 10,
                        //     include_player_ids: [fcm_token]
                        // })
                        const response = await client.createNotification({
                            contents: { "en": `Get ${offer.name} just at ₹${offer.selling_price}. It's a special offer curated only for you ${user.first_name}!` },
                            headings: { "en": `Happy Diwali ${user.first_name} 🪔` },
                            priority: 10,
                            include_player_ids: [fcm_token],
                            data: {
                                productId: offer.id
                            }
                        })
                        const data = response.body;
                        if (data.recipients === 1) {
                            totalSent += 1;
                            console.log("Notificaton Sent Successfully, Total: ", totalSent)
                        }
                    }
                }
            } else {
                console.log(
                    "Hey Buddy!, It's impossible for to send any notification without any user in the list."
                )
            }
        }
    )
}