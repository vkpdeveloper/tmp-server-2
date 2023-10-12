const axios = require("axios").default;

class WeFast {

    API_KEY = "3D1B4D88DF78CFAA66E9F479B035ADECE2AE2E83";
    BASE_URL = "https://robot-in.borzodelivery.com/api/business/1.1";

    // API_KEY = "AD4BE1BC3033673135BD76BD787EB3A9D6B404CA";
    // BASE_URL = "https://robotapitest-in.borzodelivery.com/api/business/1.1";


    async placeOrder(user, storeOrderId, addressComponent) {
        const response = await axios.post(`${this.BASE_URL}/create-order`, {
            matter: "Groceries",
            total_weight_kg: 9,
            loaders_count: 1,
            points: [
                {
                    address: "Metro Cash & Carry, Survey No 26/3, A-Block, Ward 9 Industrial Suburbs, Subramanyanagar,2 State, Yeswanthpur, Bengaluru, Karnataka 560091",
                    contact_person: {
                        phone: "+916366574287"
                    },
                },
                {
                    address: addressComponent.address,
                    contact_person: {
                        phone: user.mobile,
                        name: user.first_name
                    },
                    client_order_id: storeOrderId,
                    note: `Landmark: ${addressComponent.landmark}`,
                    apartment_number: addressComponent.house

                }
            ]
        }, {
            headers: {
                "X-DV-Auth-Token": this.API_KEY
            }
        })
        console.log(response.status)
        console.log(response.data)
        if (response.status === 200) {
            return response.data;
        } else {
            return false;
        }
    }

    async calculateOrderPrice(user, storeOrderId, addressComponent) {
        const response = await axios.post(`${this.BASE_URL}/create-order`, {
            matter: "vegetables",
            total_weight_kg: 9,
            loaders_count: 1, 
            points: [
                {
                    address: "Metro Cash & Carry, Survey No 26/3, A-Block, Ward 9 Industrial Suburbs, Subramanyanagar,2 State, Yeswanthpur, Bengaluru, Karnataka 560091",
                    contact_person: {
                        phone: "+916366574287"
                    }
                },
                {
                    address: addressComponent.address,
                    contact_person: {
                        phone: user.mobile,
                        name: user.first_name
                    },
                    client_order_id: storeOrderId,
                    note: `Landmark: ${addressComponent.landmark}`,
                    apartment_number: addressComponent.house,

                }
            ]
        }, {
            headers: {
                "X-DV-Auth-Token": this.API_KEY
            }
        })
        if (response.status === 200) {
            return response.data;
        } else {
            return false;
        }
    }

    async createDelivery(user, storeOrderId, addressComponent) {

        const response = await axios.post(`${this.BASE_URL}/create-deliveries`, {
            deliveries: [
                {
                    delivery_type: "plain",
                    address: addressComponent.address,
                    contact_person: {
                        phone: user.mobile,
                        name: user.first_name
                    },
                    client_order_id: storeOrderId,
                    latitude: addressComponent.latitude,
                    longitude: addressComponent.longitude,
                    note: `Landmark: ${addressComponent.landmark}`,
                    apartment_number: addressComponent.house,
                    is_door_to_door: true,
                    matter: "vegetables",
                    weight_kg: 9

                }
            ]
        }, {
            headers: {
                "X-DV-Auth-Token": this.API_KEY
            }
        })
        if (response.status === 200) {
            return response.data;
        } else {
            return false;
        }


    }


    async deleteDelivery(user, storeOrderId, addressComponent) { }


    async searchDelivery(storeOrderId) { }

}

module.exports = WeFast;