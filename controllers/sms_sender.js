const { default: axios } = require('axios');


class SMSSender {

    SENDER_NAME = "SMPBZR";
    BASE_URL = "https://api.textlocal.in"
    API_KEY = "NDU2NTY4NjI2YjZlNTE2NDYxNDE2MTU5NzU2YTcxNDM=";
    IS_DEBUG = false;

    POSSIBLE_VALUES = {
        customerName: "",
        orderId: "",
        otp: "",
        totalPrice: ""
    }

    SMS_TEMPLATES = {
        refund_request: "Hello {customerName}, refund request of your order #{orderId} with Sampurna-Bazaar has initiated and will be credited back to your bank account with in 5 to 7 working days.",
        new_order_alert: "Sampurna-Bazaar: You have a new order #{orderId} for order value Rs. {totalPrice}. Please check your admin dashboard for complete details.",
        picked_and_packed: "Hello {customerName}, Your order of order #{orderId} has been packed and will be delivered to you shortly. Thanks for choosing Sampurna-Bazaar!",
        forget_password: "{otp} is your otp for password reset request for Sampurna-Bazaar .",
        order_delivered: "Hello {customerName}, Your order #{orderId} has been delivered successfully. Thanks for shopping at Sampurna-Bazaar. Have a lovely day!",
        order_placed: "Dear {customerName}, Thank you for placing your order # {orderId} with Sampurna-Bazaar . Your order will be delivered to you shortly.",
        order_accepted: "Hello {customerName}, Your order #{orderId} has been accepted. Thank you for shopping at Sampurna-Bazaar.",
        out_for_delivery: "Hello {customerName}, Your Order #{orderId} is out for delivery and will be arriving Today. Thanks for shopping with Sampurna-Bazaar!",
        registration_confirm: "Welcome to Sampurna-Bazaar. Thanks for registering with us. Have a nice day!",
    };

    constructor() {
        axios.defaults.baseURL = this.BASE_URL;
        axios.defaults.params = {
            apikey: this.API_KEY,
            test: this.IS_DEBUG
        }
    }

    async sendSms(mobileNumber, message) {
        const response = await axios.get("/send", {
            params: {
                numbers: mobileNumber,
                message: message,
                sender: this.SENDER_NAME,
                
            }
        })
        return response.data;
    }

    generateSmsTemplate(templateName, values = this.POSSIBLE_VALUES) {
        let messageTemplate = this.SMS_TEMPLATES[templateName];
        messageTemplate = messageTemplate.replace("{customerName}", values.customerName);
        messageTemplate = messageTemplate.replace("{orderId}", values.orderId);
        messageTemplate = messageTemplate.replace("{otp}", values.otp);
        messageTemplate = messageTemplate.replace("{totalPrice}", values.totalPrice);
        return messageTemplate;
    }

    generateKeyForStatus(status, values = this.POSSIBLE_VALUES) {
        if(status === "Accepted") {
            return this.generateSmsTemplate("order_accepted", values);
        }else if(status === "Picked and Packed") {
            return this.generateSmsTemplate("picked_and_packed", values);
        }else if(status === "Dispatched") {
            return this.generateSmsTemplate("out_for_delivery", values);
        }else if(status === "Refund") {
            return this.generateSmsTemplate("refund_request", values);
        }else {
            return false;
        }
    }

}

module.exports = SMSSender;