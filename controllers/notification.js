var onesignalClient = require("onesignal")(
    "ZTVhNzgyODctMjk4Yi00YjE0LWI3YzktYTYxZGNmZmIwNTZh",
    "b2bd55f4-f3dd-4cf2-b864-addd87e025a9",
    true
);

module.exports.NotificationController = class NotificationController {

    connection;

    constructor(_connection) {
        this.connection = _connection

    }

    async sendNotification(body, userId, tokens, data) {
        const notificationRes = await onesignalClient.createNotification(
            body,
            data,
            tokens
        );
        await this.__logNotification(body, userId)
        return notificationRes
    }

    __logNotification(body, userId) {
        return new Promise((resolve, reject) => {
            const data = {
                user_id: userId,
                title: "",
                body: body,
                added_on: new Date(Date.now())
            }
            this.connection.query("INSERT INTO notification_logs SET ?", data, (error, result, field) => {
                resolve(true)
            })
        })
    }

}