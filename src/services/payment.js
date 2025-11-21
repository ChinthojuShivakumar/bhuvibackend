// var ccavenue = require('ccavenue');
 

// exports.make_payment = async (req, res) => {
//     //required
//     ccavenue.setMerchant("1734948");
//     ccavenue.setWorkingKey("E11870CB9779F73A0DE1383B76FDBFFC");
//     ccavenue.setOrderId(1);
//     ccavenue.setRedirectUrl("http://127.0.0.1/property/properties");
//     ccavenue.setOrderAmount(1);
     
//     var param = {
//       billing_cust_address: 'Hyderabad', 
//       billing_cust_name: 'Ramesh Shivaramakrishnan'
//     };
//     ccavenue.setOtherParams(param); //Set Customer Info

//     ccavenue.makePayment(res);

// }
const crypto = require('crypto');
const axios = require('axios');
const workingKey = 'E11870CB9779F73A0DE1383B76FDBFFC'; // Replace with your working key
const accessCode = 'AVKX05KI22BT31XKTB'

// Original working key from CCAvenue
// const originalKey = 'E11870CB9779F73A0DE1383B76FDBFFC'; // Replace with your actual working key

// Create a hash of the key and use the first 16 bytes
// const hash = crypto.createHash('sha256');
// hash.update(originalKey);
// const workingKey = hash.digest().slice(0, 16);

// const iv = Buffer.alloc(16, 0); // 16 bytes initialization vector, typically a random number

// const encrypt = (plainText) => {
//     const cipher = crypto.createCipheriv('aes-128-cbc', workingKey, iv);
//     let encrypted = cipher.update(plainText, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return encrypted;
// };

// const decrypt = (encryptedText) => {
//     const decipher = crypto.createDecipheriv('aes-128-cbc', workingKey, iv);
//     let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
// };

const encrypt = (plainText) => {
	var m = crypto.createHash('md5');
    	m.update(workingKey);
   	var key = m.digest('binary');
      	var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';	
	var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
	var encoded = cipher.update(plainText,'utf8','hex');
	encoded += cipher.final('hex');
    	return encoded;
};


const decrypt = (encText) => {
    	var m = crypto.createHash('md5');
    	m.update(workingKey)
    	var key = m.digest('binary');
	var iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';	
	var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    	var decoded = decipher.update(encText,'hex','utf8');
	decoded += decipher.final('utf8');
    	return decoded;
};

// Function to handle payment processing
const processPayment = async (order_id, amount) => {
    const backend_url = process.env.BACKEND_URL
    const data = {
        merchant_id: '1734948',
        // order_id: paymentDetails.order_id,
        order_id,
        currency: 'INR',
        // amount: paymentDetails.amount.toString(),
        amount: amount.toString(),
        redirect_url: `${backend_url}/response`,
        cancel_url: `${backend_url}/response`,
        // Add other required fields based on your requirement
    };

    const formData = Object.keys(data).map(key => `${key}=${encodeURIComponent(data[key])}`).join('&');
    const encryptedData = encrypt(formData);

    // Making a server-side POST request to CCAvenue
    try {
        const response = await axios.post('https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction', null, {
            params: {
                encRequest: encryptedData,
                access_code: accessCode
            }
        });

        // Return the response body (HTML form) which needs to be rendered on the frontend
        return response.data;
    } catch (error) {
        console.error('Error in processing payment:', error);
        throw new Error('Error in processing payment');
    }

    return `https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction&encRequest=${encryptedData}&access_code=${accessCode}`;
};


module.exports = {
    decrypt,
    processPayment
};