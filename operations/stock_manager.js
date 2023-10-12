const mySql = require("mysql")
const csv = require("csv-parser");
const Fs = require("fs");

const connection = mySql.createConnection({
    host: 'localhost',
    user: 'diago_erp_user1',
    password: '4-3Kqm^jeaz7',
    database: 'diago_app_erp_2'
})
connection.connect();

connection.on("connect", (err) => {
    if (err) {
        console.log(err)
    } else {
        console.log("MySQL Connected")
        // makeEverythingZero();
        refreshStock();
        // console.log(pickRandom(0, 15))
        // checkHolderStock()
        // verifyStockValues()
    }
})


function makeEverythingZero() {
    connection.query("UPDATE `cw_product_stock_maintenance` SET `in_hand` = 0", (err, result) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Everything Zeroed")
        }
    })
    connection.query("UPDATE `purchase_for_product_stock_maintenance` SET `in_hand` = 0", (err, result) => {
        if (err) {
            console.log(err)
        } else {
            console.log("Everything Zeroed")
        }
    })
}

function readStockInfo() {
    return new Promise((resolve, reject) => {
        let inputStream = Fs.createReadStream("./data/stock_sheet_6.csv", { encoding: "utf8" });
        let stock = [];
        inputStream.pipe(csv())
            .on("data", (data) => {
                stock.push(data);
            })
            .on("end", () => {
                resolve(stock);
            })
    })
}

async function refreshStock() {
    const stockData = await readStockInfo();
    const b2bStockHolder = 6
    for (let stock of stockData) {
        connection.query("SELECT product_id FROM cw_product_details WHERE product_code = ? LIMIT 1", [stock.product_code], (err, result) => {
            if (!err) {
                const product_id = result[0].product_id;
                connection.query("SELECT cw_product_stock_maintenance_id FROM cw_product_stock_maintenance WHERE product_id = ?", [product_id], (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        if (result.length === 1) {
                            const cw_product_stock_maintenance_id = result[0].cw_product_stock_maintenance_id;
                            connection.query("UPDATE `cw_product_stock_maintenance` SET `in_hand` = ? WHERE product_id = ?", [stock.in_hand, product_id], (err, result) => {
                                if (!err) {
                                    console.log("Updated ", stock.product_code)
                                    connection.query("SELECT * FROM purchase_for_product_stock_maintenance WHERE product_id = ? AND purchase_for_id = ?", [product_id, b2bStockHolder], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            if (result.length === 1) {
                                                console.log("Updating...")
                                                connection.query("UPDATE `purchase_for_product_stock_maintenance` SET `in_hand` = ? WHERE product_id = ? AND purchase_for_id = ?", [stock.in_hand, product_id, b2bStockHolder], (err, result) => {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        console.log("Updated B2B Stock: ", stock.product_code)
                                                    }
                                                })

                                            } else {
                                                console.log("No B2B Stock for: ", stock.product_code)
                                                const b2bInsertData = {
                                                    cw_product_stock_maintenance_id: cw_product_stock_maintenance_id,
                                                    purchase_for_id: b2bStockHolder,
                                                    product_id: product_id,
                                                    in_hand: stock.in_hand,
                                                    total_sold: 0,
                                                    total_purchase: stock.in_hand,
                                                    total_returned: 0,
                                                    to_receive: 0,
                                                    to_committed: 0,
                                                    sold_return: 0,
                                                    transfer: 0,
                                                    total_sold_price: 0,
                                                    total_purchase_price: 0,
                                                    total_returned_price: 0,
                                                    in_hand_price: 0,
                                                    to_receive_price: 0,
                                                    to_committed_price: 0,
                                                    sold_return_price: 0,
                                                    transfer_price: 0,
                                                    updated_on: new Date(),
                                                    updated_by: 27
                                                }
                                                connection.query("INSERT INTO `purchase_for_product_stock_maintenance` SET ?", [b2bInsertData], (err, result) => {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        console.log("Inserted B2B Stock: ", stock.product_code)
                                                    }
                                                })
                                            }
                                        }
                                    })
                                } else {
                                    console.log(err)
                                    console.log("Got error for: ", stock.product_code)
                                }
                            });
                        } else {
                            console.log("Error in stock maintenance id")
                        }
                    }
                })
            } else {
                console.log("Got error for: ", stock.product_code)
            }
        })
    }
}

async function getAllSKUs() {
    const tempArray = ["AMZNDOT",
        "ACM-11 Plus",
        "LJ1 (0) 09 001",
        "FV6 (0) 01 101",
        "FT6 (0) 41 001",
        "LA7 (0) 11 001",
        "LA7 (0) 08 003",
        "LD1 (0) 01 001",
        "LB9 (0) 41 002",
        "LB9 (0) 00 002",
        "LB9 (0) 08 001",
        "LB7 (0) 01 002",
        "LB7 (0) 09 001",
        "Z19 (0) 98 063",
        "Z19 (0) 41 015",
        "Z19 (0) 01 004",
        "FX1 (0) 09 101",
        "FX1 (0) 00 101",
        "GH5 (0) 09 004",
        "AZZ001M",
        "AZZ003",
        "11003",
        "251166",
        "Airdopes 138",
        "STONE 193",
        "QC3-3",
        "Rockerz 610",
        "Stone 210",
        "BN-021",
        "06019H21L1",
        "06012161F4",
        "06012161FD",
        "Swift Clean",
        "FESCVC",
        "GFCDFCARC00000",
        "GFCDELTVC00000",
        "KS-3",
        "T205BT",
        "KENT_16020",
        "KENT_16067",
        "HDES798078M3",
        "510015",
        "500024",
        "DAC21",
        "AP12WL",
        "BHS397",
        "BG3005",
        "SPK6224",
        "HL7707",
        "GC1015",
        "MMS2625B",
        "HP6306",
        "GC158/02",
        "HI108/01",
        "HD4929/01",
        "HR1351/90",
        "41202",
        "20249",
        "20223",
        "40278",
        "41366",
        "41963",
        "41944",
        "42210",
        "36819",
        "36775",
        "36717",
        "35039",
        "35038",
        "30603",
        "10212",
        "10209",
        "10016",
        "90O (0) 31 014",
        "DA8 (0) 08 002",
        "CX300S-BK",
        "WI-SP510",
        "4122116020NS",
        "WEL007",
        "WH-61017",
        "12228",
        "12162",
        "12152",
        "11894",
        "FQCDX",
        "FTWD",
        "FTNVC",
        "BT-47",
        "LI2 (0) 09 002",
        "56T (0) 09 007",
        "FS6 (0) 09 001",
        "FB0 (0) 01 001",
        "56T (0) 09 008",
        "FS2 (0) 09 002",
        "HB4 (0) 09 001",
        "HD1 (0) 09 003",
        "HB1 (0) 70 002",
        "FH0 (0) 06 001",
        "LE2 (0) 70 001",
        "LE2 (0) 07 001",
        "LD9 (0) 01 001",
        "LA7 (0) 09 001",
        "LA7 (0) 05 003",
        "HB2 (0) 51 003",
        "LC4 (0) 09 001",
        "LC4 (0) 01 002",
        "LC1 (0) 64 102",
        "LC1 (0) 01 001",
        "LB7 (0) 01 003",
        "LB2 (0) 99 003",
        "Z19 (0) 41 067",
        "Z19 (0) 37 019",
        "Z19 (0) 28 063",
        "Z19 (0) 09 006",
        "Z19 (0) 01 013",
        "Z19 (0) 01 012",
        "Z19 (0) 01 009",
        "HD1 (0) 09 002",
        "GI6 (0) 09 002",
        "FN6 (0) 09 002",
        "FJ6 (0) 12 101",
        "FJ4 (0) 61 001",
        "DA1 (0) 00 005",
        "FK6 (0) 09 001",
        "FK6 (0) 08 001",
        "FH3 (0) 08 001",
        "FH3 (0) 01 001",
        "FN8 (0) 41 001",
        "53O (0) 09 001",
        "27O (0) 08 001",
        "FC6 (1) 21 001",
        "29O (0) 01 011",
        "FC1 (0) 08 003",
        "DM4 (0) 80 001",
        "DM3 (0) 00 001",
        "AS4 (0) 09 004",
        "68O (0) 01 002",
        "FC4 (0) 09 001",
        "FK5 (0) 71 001",
        "FO1 (0) 09 002",
        "FN5 (0) 01 002",
        "AZZ002M",
        680017,
        410528,
        410174,
        680014,
        440193,
        440201,
        440154,
        440216,
        680006,
        "934-4001",
        "934-6001",
        "BEN004M",
        "BEN011W",
        "BG-31173",
        "Rockerz 333",
        "Rockerz 238",
        "Airdopes 383",
        "Aavante Bar 4000DA",
        "Aavante Bar 1803",
        "Aavante Bar 1198",
        "Airdopes-173_BLACK",
        "Airdopes-283_BLACK",
        "Airdopes-283_BLUE",
        "ROCK-258",
        "LTG-2",
        "A4-1",
        "MR-1",
        "Rockerz 518",
        "Stone 1401",
        "Stone 1010",
        "06011A95F1",
        "0601072RK0",
        "06019G80F1",
        "06016B30F0",
        "06013931F1",
        "06012171F8",
        "CGKF90L2_XXL",
        "CGKF90L2_XL",
        5218038,
        "ASWH1625",
        "DAV012M",
        "DAV001M",
        "ELI004W",
        "ELI008W",
        "AMUWP",
        "GWPDAMRIT00003",
        "GIL14623",
        "GIV003W",
        "GNM002",
        "Z42",
        "HC000032-CBL",
        "HC000022-CBL",
        "HUG017W",
        "HUG014M",
        "HUG013M",
        "HUG006W",
        "678-104-A",
        "KS-4",
        "TTLX175A",
        "19020B",
        "JAG001M",
        "LIVE 200BT",
        "T205",
        "Live 500BT",
        "JBLENDURDIVEBLK",
        "KCLNIXGY012BMH-ETA",
        "KPTCRU2WPVR0-CCF",
        "KOTG45PCKMR0-CGO",
        "KNFER10W1P-DBM",
        "KMSPI50R3S-DJS",
        "KMTAC50B3S-DJS",
        "KGSSER25WP8VGN-DOM",
        "KGSSTF15WM8VGN-DSE",
        "KGTINS03TP8V3K-DSE",
        "OFKOA15CJ3CPN",
        "KGSFRE25GP8VGNDAG",
        "KGSSTA15WM8VGNDSE",
        "KGTJAN03NP8V3KDSE",
        "KMSLP75B3SDBB",
        "KMMIX50N3SDBB",
        "FNKEFREW5B25SDST",
        "FNKEFREW6B15SDST",
        "FNKWSTIG3B40SDST",
        "FNKTTAVL3H40SDST",
        "FNKTTAVG3B40SDST",
        "LAC006M",
        "HDES798019M3",
        "HEFQ068096M4",
        "HEFQ068083M4",
        "HDER695154M3",
        "A61",
        "L6",
        "L164",
        "K419",
        "L5",
        "B205",
        "LOM001M",
        5200000983,
        5200000697,
        5200100970,
        5200000715,
        "NATLOXY",
        "MIL0224",
        "MIL1268",
        "MIL0728",
        "MIL0727",
        "MIL0678",
        "MIL0677",
        "MIL0582",
        "MIL0568",
        "MIL0499",
        "MIL0376",
        "MIL0232",
        "MIL0226",
        "MIL0213",
        "MIL0193",
        "MIL0192",
        "MIL0188",
        "MIL0180",
        "MIL0175",
        "MIL0167",
        "MIL0143",
        "MIL0086",
        "MIL0067",
        "MIL0036",
        "MIL0015",
        "MIL0010",
        "MIL0009",
        "MIL0006",
        500045,
        "NIN003W",
        "MSM04DS",
        "Air Buds",
        "111104_773",
        "111104_875",
        "111074_437",
        "121009_36",
        "OEP-E10",
        "SPK7403B",
        "TAH4205BK",
        "TAE1205BK",
        "QP210",
        "HC3505",
        "BHD318",
        "TASH402BK",
        "HL7763",
        "HL7760",
        "HX3214-11",
        "TAUT102BK",
        "TAPH805BK",
        "GC360",
        "SHE3555BK",
        "BT3901B",
        "BT2505A",
        "BG3006",
        "SHL3075BK",
        "BT40BK",
        "SCF870",
        "32PHT5813S",
        "SPA5162B",
        "MMS8085B",
        "GC1022/40",
        "GC157/02",
        "HR1887",
        "HD2394/99",
        "HL1661/00",
        "HL7715/00",
        "HL1606/03",
        "HL1643/06",
        "SWV9446A",
        "SWV9443A",
        "SWV9442A",
        "SWV1438BN",
        "SHB1008",
        "PGN14327",
        "PGN114",
        "PGN019",
        "PIG12293",
        "PIG116",
        "PIG103",
        "PIG12093",
        "POR1140",
        "WG-905",
        20514,
        10796,
        10752,
        10170,
        10167,
        40189,
        36158,
        10172,
        10165,
        10164,
        20142,
        20143,
        40361,
        49002,
        42655,
        42209,
        20253,
        20248,
        20230,
        20239,
        10761,
        41360,
        41357,
        40356,
        40271,
        40355,
        41336,
        40081,
        40158,
        42502,
        40150,
        30845,
        30843,
        41353,
        41911,
        41970,
        41949,
        36758,
        42803,
        99532,
        43047,
        "99490-2",
        20330,
        20551,
        20504,
        20354,
        42258,
        42275,
        42250,
        41764,
        41558,
        41112,
        41034,
        36806,
        36805,
        36779,
        36719,
        36023,
        35044,
        30838,
        11653,
        11605,
        11604,
        30730,
        30726,
        30725,
        30720,
        30719,
        30716,
        30713,
        30602,
        30728,
        10726,
        10210,
        10025,
        10024,
        10013,
        36314,
        36310,
        36307,
        36304,
        36301,
        "Z93 (1) 31 019",
        "Z34 (0) 25 701",
        "91D (0) 09 116",
        "91D (0) 09 114",
        "90O (0) 31 015",
        "HC1 (0) 18 024",
        "HC1 (0) 09 035",
        "HC1 (0) 09 036",
        "HC1 (0) 09 018",
        "HC1 (0) 09 017",
        "HC1 (0) 08 007",
        "GE6 (0) 09 001",
        "DX7 (0) 09 001",
        "DA8 (0) 08 004",
        "Z34 (0) 01 049",
        "Z34 (0) 09 235",
        "Z34 (0) 08 049",
        "Z34 (0) 08 235",
        "67Z (0) 09 002",
        "SDSDXXY-256G-GN4IN",
        "SDSQXA1-256G-GN6MN",
        "SDSDXV5-128G-GNCIN",
        "SDDDC4-128G-I35",
        "SDCZ73-128G-I35",
        "SDSQXCY-064G-GN6MN",
        "SDSDXV6-064G-GNCIN",
        "SDSDUNR-064G-GN6IN",
        "SDCZ73-064G-I35",
        "SDDDC4-032G-I35",
        "SDSDUNR-032G-GN6IN",
        "SDCZ71-032G-I35",
        "SDSQUAR-016G-GN6MN",
        "SDCZ48-128G-I35",
        "SDCZ48-016G-I35",
        "SDCZ50-064G-I35",
        "SDCZ50-032G-I35",
        "SDIX40N-064G-GN6NN",
        3488,
        3481,
        3430,
        4409,
        1723,
        1711,
        1506,
        1501,
        "SRS-XB33",
        "WF-SP800N",
        "WI-XB400",
        "WI-1000XM2",
        "WH-CH400",
        "MDR-AS410AP",
        "MDR-EX15AP",
        "A3902J21",
        "SUJ010",
        "SUJ005",
        3555431416,
        2728640417,
        5587111408,
        5617606406,
        3576310405,
        "SGW224.11",
        "SGW219.11",
        "MFF1",
        "412413813C06N",
        "405376040N",
        "40011377502N",
        "40011375338N",
        "VER012M",
        249093.1,
        241725.1,
        241492,
        241675,
        241656,
        241682.1,
        241441,
        241719.1,
        241658,
        241681,
        241683.1,
        241677,
        241540,
        249096.1,
        249094.1,
        241712.1,
        "WEL004",
        "WH-50047",
        "12433_MCH",
        12452,
        12450,
        12235,
        12159,
        12158,
        12157,
        12156,
        11891,
        11867,
        11860,
        11855,
        11550,
        11331,
        11038,
        10533,
        10229,
        10185,
        10008,
        10001,
        63153473,
        63153471,
        60018305,
        63152962,
        "YVE003M",
        "ZEB-RAGA-HP"
    ]
    return tempArray;
    return new Promise((resolve, reject) => {
        connection.query("SELECT product_code, product_id FROM cw_product_details", (err, result) => {
            if (!err) {
                resolve(result);
            } else {
                reject(err);
            }
        })
    })
}

async function checkHolderStock() {
    const skus = await getAllSKUs();
    const b2bStockHolder = 6
    for (let sku of skus) {
        const productCode = sku;
        connection.query("SELECT product_id FROM cw_product_details WHERE product_code = ? LIMIT 1", [productCode], (err, result) => {
            console.log(err)
            console.log(result)
            const productId = result[0].product_id;
            connection.query("SELECT in_hand, cw_product_stock_maintenance_id FROM cw_product_stock_maintenance WHERE product_id = ?", [productId], (err, result) => {
                if (err) {
                    console.log(err)
                } else {
                    if (result.length === 1) {
                        const inHand = result[0].in_hand;
                        const cw_product_stock_maintenance_id = result[0].cw_product_stock_maintenance_id;
                        connection.query("SELECT * FROM purchase_for_product_stock_maintenance WHERE product_id = ? AND purchase_for_id = ?", [productId, b2bStockHolder], (err, result) => {
                            if (err) {
                                console.log(err)
                            } else {
                                if (result.length === 1) {
                                    const b2bInHand = result[0].in_hand;
                                    if (inHand !== b2bInHand) {
                                        console.log("In Hand Mismatch for: ", sku.product_code)
                                        console.log("Updating...")
                                        connection.query("UPDATE `purchase_for_product_stock_maintenance` SET `in_hand` = ? WHERE product_id = ? AND purchase_for_id = ?", [inHand, productId, b2bStockHolder], (err, result) => {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                console.log("Updated B2B Stock: ", sku.product_code)
                                            }
                                        })
                                    }
                                } else {
                                    console.log("No B2B Stock for: ", sku.product_code)
                                    const b2bInsertData = {
                                        cw_product_stock_maintenance_id: cw_product_stock_maintenance_id,
                                        purchase_for_id: b2bStockHolder,
                                        product_id: productId,
                                        in_hand: inHand,
                                        total_sold: 0,
                                        total_purchase: inHand,
                                        total_returned: 0,
                                        to_receive: 0,
                                        to_committed: 0,
                                        sold_return: 0,
                                        transfer: 0,
                                        total_sold_price: 0,
                                        total_purchase_price: 0,
                                        total_returned_price: 0,
                                        in_hand_price: 0,
                                        to_receive_price: 0,
                                        to_committed_price: 0,
                                        sold_return_price: 0,
                                        transfer_price: 0,
                                        updated_on: new Date(),
                                        updated_by: 27
                                    }
                                    connection.query("INSERT INTO `purchase_for_product_stock_maintenance` SET ?", [b2bInsertData], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log("Inserted B2B Stock: ", sku)
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            })
        })

    }
}

async function verifyStockValues() {
    connection.query("SELECT * FROM purchase_for_product_stock_maintenance", [], (err, result) => {
        if (err) {
            console.log(err)
        } else {
            for(let row of result) {
                const b2bInHand = parseInt(row.in_hand);
                const totalPurchase = parseInt(row.total_purchase);
                const totalSold = parseInt(row.total_sold);
                const transfered = parseInt(row.transfer);
                const productId = row.product_id;

                const dataToUpdate = {
                    in_hand: b2bInHand,
                    total_purchase: totalPurchase,
                    total_sold: totalSold,
                    transfer: transfered

                }

                connection.query("UPDATE `purchase_for_product_stock_maintenance` SET ? WHERE product_id = ? AND purchase_for_id = ?", [dataToUpdate, productId, 6], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        console.log("Verified: ", productId)
                    }
                });

            }
        }
    })
}