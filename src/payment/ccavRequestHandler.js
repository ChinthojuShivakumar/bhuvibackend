var http = require('http'),
    fs = require('fs'),
    ccav = require('./ccavutil.js'),
    qs = require('querystring');

const nodeCCAvenue = require('node-ccavenue');

// const workingKey = 'E11870CB9779F73A0DE1383B76FDBFFC';	//Put in the 32-Bit key shared by CCAvenues.
// const accessCode = 'AVKX05KI22BT31XKTB';			//Put in the Access Code shared by CCAvenues.
// const merchantId = '1734948';
const working_key = '4C4D49E48527F90D73F343CE0F12D102';
const access_code = 'AVEK05KL39AW57KEWA';
const merchant_id = '1734948';

const node_ccav = new nodeCCAvenue.Configure({
  merchant_id: merchant_id,
  working_key: working_key,
});

exports.postReq = async function (request, response) {
    // console.error('ccavRequestHandler ENTRY')
    var body = '',
        workingKey = working_key,	//Put in the 32-Bit key shared by CCAvenues.
        accessCode = access_code,			//Put in the Access Code shared by CCAvenues.
        merchantId = merchant_id,
        encRequest = '',
        formbody = '';

    console.error(request.body)

    // await request.on('data', function (data) {
        // body += data;
        body += request.body;
        // encRequest = node_ccav.getEncryptedOrder(body);
        encRequest = ccav.encrypt(body, workingKey);
        const encryptedOrderData = node_ccav.getEncryptedOrder(body);
        // formbody = '<form id="nonseamless" method="post" name="redirect" action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' + encRequest + '"><input type="hidden" name="access_code" id="access_code" value="' + accessCode + '"><script language="javascript">document.redirect.submit();</script></form>';
        formbody = '<form id="nonseamless" method="post" name="redirect" action="https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction&encRequest='+encRequest+'&access_code='+accessCode+'"/><script language="javascript">document.redirect.submit();</script></form>';
    // });

    // // request.on('end', function () {
    // //     response.writeHeader(200, { "Content-Type": "text/html" });
    // //     response.write(formbody);
    // //     response.end();
    // // });
    // // console.error('ccavRequestHandler EXIT')
    // // return render(formbody);
    // // const enc_request = ccav.encrypt(body, workingKey);
    // response.status(201).json({ encryptedOrderData, encRequest, formbody });
    response.send(formbody);

    // const ccav = new nodeCCAvenue.Configure({
    //     working_key: "E11870CB9779F73A0DE1383B76FDBFFC",
    //     access_code: "AVKX05KI22BT31XKTB",
    //     merchant_id: "1734948",
    //   });
    //   const orderParams = {
    //     redirect_url: encodeURIComponent(
    //       `https://DOMAIN/api/response?access_code=${accessCode}&working_key=${workingKey}`
    //     ),
    //     cancel_url: encodeURIComponent(
    //       `https://DOMAIN/api/response?access_code=${accessCode}&working_key=${workingKey}`
    //     ),
    //     billing_name: "TEST",
    //     currency: "INR",
    //     order_id: 1,
    //     amount: 100,
    //     language: "en"
    //   };
    //   const encryptedOrderData = ccav.getEncryptedOrder(orderParams);
    //   res.setHeader("content-type", "application/json");
    //   res.status(200).json({
    //     payLink: `https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction&access_code=${accessCode}&encRequest=${encryptedOrderData}`,
    //   });
};
