const cron = require('node-cron');
const OneSignal = require('onesignal-node');

const client = new OneSignal.Client('b2bd55f4-f3dd-4cf2-b864-addd87e025a9', 'ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh');

// const connection = mySql.createConnection({
//     host: 'localhost',
//     user: 'mwsampur_app',
//     password: 'mwsampur_app',
//     database: 'mwsampur_app'
// })
// connection.connect();

// connection.on("connect", (err) => {
//     if (err) {
//         console.log(err)
//     } else {
//         startCronJob();
//     }
// })

const startCronJob = (connection) => {
    // Morning Every Day 7:00 AM
    cron.schedule("0 7 * * *", () => {
        connection.query('SELECT * FROM `notifications` WHERE `time` = ?', ['700'], async (err, results, fields) => {
            const randomNotification = results[Math.floor(Math.random() * results.length)]
            let title = randomNotification.title;
            let body = randomNotification.body.trim();
            const response = await client.createNotification({
                included_segments: ["Subscribed Users"],
                contents: { "en": body },
                headings: { "en": title },
                priority: 10
            })
            // console.log(response)
        })
    }, {
        timezone: "Asia/Kolkata"
    });
    // Afternoon Every Day 1:00 PM
    cron.schedule("0 13 * * *", () => {
        connection.query('SELECT * FROM `notifications` WHERE `time` = ?', ['100'], async (err, results, fields) => {
            const randomNotification = results[Math.floor(Math.random() * results.length)]
            let title = randomNotification.title;
            let body = randomNotification.body.trim();
            if (body[0] === " ") {
                body[0] = "";
            }
            const response = await client.createNotification({
                included_segments: ["Subscribed Users"],
                contents: { "en": body },
                headings: { "en": title },
                priority: 10
            })
            // console.log(response)
        })
    }, {
        timezone: "Asia/Kolkata"
    })


    // Evening Every Day 4:30 PM
    cron.schedule("30 16 * * *", () => {
        connection.query('SELECT * FROM `notifications` WHERE `time` = ?', ['430'], async (err, results, fields) => {
            const randomNotification = results[Math.floor(Math.random() * results.length)]
            let title = randomNotification.title;
            let body = randomNotification.body.trim();
            if (body[0] === " ") {
                body[0] = "";
            }
            const response = await client.createNotification({
                included_segments: ["Subscribed Users"],
                contents: { "en": body },
                headings: { "en": title },
                priority: 10
            })
            // console.log(response)
        })
    }, {
        timezone: "Asia/Kolkata"
    })

    // Night Every Day 8:00 PM
    cron.schedule("0 20 * * *", () => {
        connection.query('SELECT * FROM `notifications` WHERE `time` = ?', ['800'], async (err, results, fields) => {
            const randomNotification = results[Math.floor(Math.random() * results.length)]
            let title = randomNotification.title;
            let body = randomNotification.body.trim();
            if (body[0] === " ") {
                body[0] = "";
            }
            const response = await client.createNotification({
                included_segments: ["Subscribed Users"],
                contents: { "en": body },
                headings: { "en": title },
                priority: 10
            })
            // console.log(response)
        })
    }, {
        timezone: "Asia/Kolkata"
    })
    // console.log("ALL THE NOTIFICATIONS SCHEDULED")
}



module.exports.cronJob = startCronJob;