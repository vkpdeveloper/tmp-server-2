const express = require("express");
const Setting = require("./models/settings");
const Timeslot = require("./models/timeslot");
const HomePage = require("./models/homepage");
const { generateTimeslots, getIndianTime } = require("./parsers/timeslot");
const e = require("express");

const router = express.Router();

const updaterToken = "c0eae07ce4bd81b4000636dab974769c8a27cd49";

const appToken = "123456789"

router.post("/update_migration_info", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === updaterToken) {
            const checkIfExists = await Setting.findOne({
                current: true
            });
            if (checkIfExists) {
                const updateData = await Setting.updateOne({
                    current: true
                }, req.body);
                if (updateData) {
                    res.send({
                        success: true,
                        message: "Data updated successfully"
                    }).end();
                } else {
                    res.send({
                        success: false,
                        error: "Server auth failed",
                        message: "Your IP is monitored"
                    }).end();
                }
            } else {
                const createNewSettings = new Setting(req.body);
                const response = await createNewSettings.save();
                if (response) {
                    res.send({
                        success: true,
                        message: "New Setting created successfully"
                    }).end();
                }
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.toString()
        }).end();
    }
})

router.get("/get_current_migration_info", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === appToken) {
            const data = await Setting.findOne({
                current: true
            });
            if (data) {
                res.send({
                    success: true,
                    settings: data,
                    message: "Your IP is monitored"
                }).end();
            } else {
                res.send({
                    success: false,
                    settings: [],
                    message: "Your IP is monitored"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored"
        }).end();
    }
})

router.post("/update_timeslot", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === updaterToken) {
            const checkIfExists = await Timeslot.findOne({
                current: true
            });
            if (checkIfExists) {
                const updateData = await Timeslot.updateOne({
                    current: true
                }, req.body);
                if (updateData) {
                    res.send({
                        success: true,
                        message: "Data updated successfully"
                    }).end();
                } else {
                    res.send({
                        success: false,
                        error: "Server auth failed",
                        message: "Your IP is monitored"
                    }).end();
                }
            } else {
                const createNewSettings = new Timeslot(req.body);
                const response = await createNewSettings.save();
                if (response) {
                    res.send({
                        success: true,
                        message: "New Timeslot created successfully"
                    }).end();
                }
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.toString()
        }).end();
    }
})

router.get("/get_timeslot", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === appToken) {
            const data = await Timeslot.findOne({
                current: true
            });
            if (data) {
                res.send({
                    success: true,
                    settings: data,
                    message: "Your IP is monitored"
                }).end();
            } else {
                res.send({
                    success: false,
                    settings: [],
                    message: "Your IP is monitored"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored"
        }).end();
    }
})


router.post("/update_homepage", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === updaterToken) {
            const checkIfExists = await HomePage.findOne({
                current: true
            });
            if (checkIfExists) {
                const updateData = await HomePage.updateOne({
                    current: true
                }, req.body);
                if (updateData) {
                    res.send({
                        success: true,
                        message: "Data updated successfully"
                    }).end();
                } else {
                    res.send({
                        success: false,
                        error: "Server auth failed",
                        message: "Your IP is monitored"
                    }).end();
                }
            } else {
                const createNewSettings = new HomePage(req.body);
                const response = await createNewSettings.save();
                if (response) {
                    res.send({
                        success: true,
                        message: "New HomePage created successfully"
                    }).end();
                }
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored",
            info: e.toString()
        }).end();
    }
})

router.get("/get_homepage", async (req, res) => {
    try {
        const { token } = req.headers;
        if (token === appToken) {
            const data = await HomePage.findOne({
                current: true
            });
            if (data) {
                res.send({
                    success: true,
                    settings: data,
                    message: "Your IP is monitored"
                }).end();
            } else {
                res.send({
                    success: false,
                    settings: [],
                    message: "Your IP is monitored"
                }).end();
            }
        } else {
            res.send({
                success: false,
                error: "Server auth failed",
                message: "Your IP is monitored"
            }).end();
        }
    } catch (e) {
        res.send({
            success: false,
            error: "Server fail",
            message: "Your IP is monitored"
        }).end();
    }
})

router.post("/generate-timeslots", (req, res) => {
    let { distance } = req.body;
    distance = parseInt(distance)
    try {
        let parsedTimeslots = [];
        const currentTime = getIndianTime();
        if (currentTime.getHours() >= 6 && currentTime.getHours() <= 17) {
            if (distance >= 15) {
                parsedTimeslots.push({
                    slot: "Immediately ( 2 to 4 hours )"
                })
            } else {
                parsedTimeslots.push({
                    slot: "Immediately ( 1 to 2 hours )"
                })
            }
        }
        const prefixes = [
            "Today",
            "Tomorrow"
        ];

        for (let prefix of prefixes) {
            const slotsObject = generateTimeslots(prefix);
            parsedTimeslots.push(...slotsObject);
        }

        // TODO: REMOVE AFTER EVENT

        // parsedTimeslots = []

        // parsedTimeslots.push({
        //     slot: "Today 4:00 PM to 7:00 PM"
        // })

        res.send({
            timeslots: parsedTimeslots
        })
    } catch (e) {
        console.log(e)
        res.send({
            timeslots: []
        })
    }
})


// router.get("/generate_timeslot", async (req, res) => {
//     try {
//         const { token } = req.headers;
//         if (token === appToken) {
//             const timeslots = generateTimeslot(

//             )
//         } else {
//             res.send({
//                 success: false,
//                 error: "Server auth failed",
//                 message: "Your IP is monitored"
//             }).end();
//         }
//     } catch (e) {
//         res.send({
//             success: false,
//             error: "Server fail",
//             message: "Your IP is monitored"
//         }).end();
//     }
// })

module.exports = router;