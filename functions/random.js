const sAplhabet = 'abcdefghijklmnopqrstuvwxyz';
const numbers = '0123456789';
const special = '!@#$%^&*()_+-=[]{}|;\':",./<>?';
const cAplhabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const random = (type, length = 0, min = 0, max = 0) => {
    try {
        let result = '';
        if (type === "number" && min != 0 && max != 0) {
            for (let i = 0; i < length; i++) {
                result += numbers[Math.floor(Math.random() * numbers.length)];
            }
            return result;
        } else if (type === "string") {
            for (let i = 0; i < length; i++) {
                result += cAplhabet[Math.floor(Math.random() * cAplhabet.length)];
            }
            return result;
        }else {
            throw new Error("Invalid type or params");
        }
    } catch (e) {
        throw e;
    }
}

exports.random = random;