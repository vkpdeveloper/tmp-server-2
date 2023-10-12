const axios = require('axios');
const mySql = require("mysql")
const createCsvWriter = require('csv-writer').createObjectCsvWriter;


const connection = mySql.createConnection({
    host: 'localhost',
    user: 'mwsampur_app',
    password: 'mwsampur_app',
    database: 'mwsampur_app'
})
connection.connect();

connection.on("connect", async (err) => {
    if (err) {
        // console.log(err)
    } else {
        console.log("MySQL Connected")
        checkIfAvailable();
        // axios.default.get("https://api.sampurna-bazaar.com/uploads/100012.jpg").then(res => {
        //     console.log(res)
        // }
        // )
        // .catch(err => {
        //     console.log(err)
        // // })
        // let imageData = await isAvailableOnServer("100012.jpg")
        // console.log(imageData)

    }
})

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

async function isAvailableOnServer(fileName) {
    try {
        let image = await axios.default.get(`https://api.sampurna-bazaar.com/uploads/${fileName}`)
        if(image.status === 200) {
            return true
        }else {
            return false
        }
    } catch (e) {
        return false;
    }
}

async function checkIfAvailable() {

    // const res = await axios.default.get("http://api.sampurna-bazaar.com/uploads/424938.jpg")
    const fileName = 'exports/image_issue_sheet_' + new Date(Date.now()) + ".csv";
    const possibleRecords = [];
    const csvWriter = createCsvWriter({
        path: fileName,
        header: [
            { id: 'id', title: 'SKU' },
            { id: "cover", title: "Cover" },
            { id: "cover_name", title: "Cover Name" },
            { id: "images", title: "Images" },
            { id: "images_name", title: "Images Name" },
        ]
    });
    connection.query("SELECT * FROM products WHERE 1", async (err, results, fields) => {
        if (!err) {
            try {
                const lastProduct = results[results.length - 1];
                for (var result of results) {
                    console.log(result.id)
                    const coverImage = result.cover;
                    let images = [];
                    if (IsJsonString(result.images)) {
                        images = JSON.parse(result.images)
                    }
                    const isAvailable = await isAvailableOnServer(coverImage);
                    possibleRecords.push({
                        id: result.id,
                        cover: isAvailable ? "yes" : "no",
                        cover_name: coverImage,
                        images: [],
                        images_name: []
                    })
                    let lastRecord = possibleRecords[possibleRecords.length - 1];
                    if (images.length > 0) {
                        for (var image of images) {
                            const isAvailable = await isAvailableOnServer(image);
                            lastRecord.images.push(isAvailable ? "yes" : "no")
                            lastRecord.images_name.push(image)
                        }
                    }
                    possibleRecords[possibleRecords.length - 1] = lastRecord
                    if (result.id === lastProduct.id) {
                        csvWriter.writeRecords(possibleRecords)
                            .then(() => {
                                console.log("Issue Sheet Generated")
                            });
                    }
                }
            } catch (e) {
                console.log(e)
            }
            // setTimeout(() => {
            //     csvWriter.writeRecords(possibleRecords)
            //         .then(() => {
            //             console.log("Issue Sheet Generated")
            //         });
            // }, 600000)
        }
    })

}

// checkIfAvailable();