const express = require("express");
const AlgoliaController = require('../controllers/algolia')
const multer = require('multer')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require("csv-parser")
const Fs = require('fs');

var rootDir = __dirname.replace("routes", "");

// console.log(rootDir)

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `${rootDir}uploads/`)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + file.originalname)
    }
})

var upload = multer({ storage: storage })

const algoliaController = new AlgoliaController();

const router = express.Router();

let dbConnection;

function generateRandomIndex(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

router.post("/add-tag", async (req, res) => {
    try {
        let { tag, sub_cate_id } = req.body;
        if (tag && sub_cate_id) {
            tag = tag
            const possibleTags = await algoliaController.findByObjectId(`id_sb_custom_${tag}`)
            // console.log(possibleTags);
            if (!possibleTags) {
                const updateRes = await algoliaController.updateObject(possibleTags.id, {
                    ...possibleTags,
                    click: possibleTags.click ? possibleTags.click + 1 : 1
                })
                console.log(updateRes)
                const response = await algoliaController.addNewObject({
                    id: generateRandomIndex(15000, 100000),
                    objectID: `id_sb_custom_${tag}`,
                    name: tag,
                    status: 1,
                    click: 0,
                    sub_cate_id: parseInt(sub_cate_id)
                })
                // console.log(response)
                if (response) {
                    res.send({
                        success: true
                    })
                } else {
                    res.send({
                        success: false
                    })
                }
            } else {
                res.send({
                    success: false
                })
            }
        } else {
            res.send({
                success: false
            })
        }

    } catch (e) {
        // console.log(e)
        res.send({
            success: false
        })

    }
})

router.post("/map-product", async (req, res) => {
    try {
        let { productId, tag } = req.body;
        // console.log(productId, tag);
        if (productId && tag) {
            tag = tag.split(" ").join("_")
            const possibleTags = await algoliaController.findByObjectId(`id_sb_custom_${tag}`)
            if (possibleTags) {
                const { id } = possibleTags;
                dbConnection.query("SELECT * FROM products WHERE id = ?", [productId], async (err, results, fields) => {
                    try {
                        if (!err && results.length > 0) {
                            const product = results[0];
                            let allMapsTags = product.tags;
                            // console.log(allMapsTags)
                            if (!allMapsTags.includes(id)) {
                                allMapsTags += `|${id}`;
                                dbConnection.query("UPDATE products SET tags = ? WHERE id = ?", [allMapsTags, productId], (err, results, fields) => {
                                    // console.log(err, results, fields)
                                    res.send({
                                        success: true
                                    })
                                })
                            } else {
                                res.send({
                                    success: false
                                })
                            }
                        } else {
                            res.send({
                                success: true
                            })
                        }
                    } catch (e) {
                        throw e;
                    }
                })
            } else {
                res.send({
                    success: false
                })
            }
        } else {
            res.send({
                success: false
            })
        }
    } catch (e) {
        console.log(e)
        res.send({
            success: false
        })
    }
})

router.post("/clicked", async (req, res) => {
    try {
        const { tagId, tag } = req.body;
        let tagData;
        if (tagId) {
            tagData = await algoliaController.search({
                id: tagId,
            })
        } else {
            tagData = await algoliaController.findByObjectId(`id_sb_custom_${tag}`)
        }
        console.log(tagData)
        if (tagData) {
            if (tagData.click) {
                const updateRes = await algoliaController.updateObject(tagId, {
                    ...tagData,
                    click: tagData.click ? tagData.click + 1 : 1
                })
                console.log(updateRes)
            } else {
                const updateRes = await algoliaController.updateObject(tagId, {
                    ...tagData,
                    click: 1
                })
                console.log(updateRes)
            }
            res.send({
                success: true
            })
        } else {
            res.send({
                success: false,
            })
        }
    } catch (e) {
        console.log(e)
        res.send({
            success: false,
        })
    }
})

router.post("/upload-tags", upload.single("file"), async (req, res) => {
    let listOfUpdates = [];
    let listOfErrors = [];
    try {
        const totalRecords = [];
        let inputStream = Fs.createReadStream(req.file.path, { encoding: 'utf8' });
        inputStream
            .pipe(csv())
            .on('data', function (row) {
                let data = {};
                let id = parseInt(Object.values(row)[0]);
                if (id) {
                    data['id'] = id;
                }
                if (row.name) {
                    data['name'] = row.name;
                }
                if (row.status) {
                    data['status'] = parseInt(row.status);
                }
                if (row.sub_cate_id) {
                    data['sub_cate_id'] = parseInt(row.sub_cate_id);
                }
                if (row.click) {
                    data['click'] = parseInt(row.click);
                } else {
                    data['click'] = 0;
                }
                totalRecords.push(data);
                // return;
            }).on("end", async () => {
                if (totalRecords.length > 0) {
                    for (let record of totalRecords) {
                        console.log(record)
                        const id = Object.values(record)[0]
                        console.log(id);
                        if (id) {
                            const possibleAvailableTag = await algoliaController.search({
                                id: id
                            })
                            if (possibleAvailableTag) {
                                console.log(possibleAvailableTag);
                                const updaetRes = await algoliaController.updateObject(possibleAvailableTag.id, {
                                    ...possibleAvailableTag,
                                    ...record
                                })
                                if (!updaetRes) {
                                    listOfErrors.push({
                                        id
                                    })
                                } else {
                                    listOfUpdates.push({
                                        id: `UPDATED(${id})`
                                    })
                                }
                            } else {
                                const creationResponse = await algoliaController.addNewObject({
                                    ...record,
                                    id: parseInt(record.id)
                                }, true);
                                if (!creationResponse) {
                                    listOfErrors.push({
                                        id
                                    })
                                } else {
                                    listOfUpdates.push({
                                        id: `CREATED(${id})`
                                    })
                                }
                            }
                        } else {
                            console.log("logged here else");
                            listOfErrors.push({
                                id
                            })
                            res.send({
                                success: false,
                                updates: listOfUpdates,
                                errors: listOfErrors
                            })
                        }
                    }
                    res.send({
                        success: true,
                        updates: listOfUpdates,
                        errors: listOfErrors
                    })
                } else {
                    res.send({
                        success: false,
                        updates: listOfUpdates,
                        errors: listOfErrors
                    })
                }
            })
    } catch (e) {
        res.send({
            success: false,
            updates: listOfUpdates,
            errors: listOfErrors
        })
    }
})

async function runAndAdd() {
    const allTags = await algoliaController.findByStatus();
    let tags = allTags.hits;
    let total = 0;
    for (var tag of tags) {
        total++;
        console.log(total)
        await algoliaController.updateObject(tag.id, {
            ...tag,
            click: 0

        })
    }
}

async function getAll() {
    const allTags = await algoliaController.browseObjects();
    const tags = allTags.map(e => {
        return {
            id: e.id,
            name: e.name,
            status: e.status,
            click: e.click
        }
    })
    Fs.writeFileSync("./tags.json", JSON.stringify(tags))
}

getAll();

module.exports = (connection) => {
    dbConnection = connection;
    return router;
};