// src/utils/utils.js
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const crypto = require('crypto');
const API = process.env.API_URL || 'http://localhost:3001';
const axios = require('axios');

//const fs = require('fs')
//const imaginary = require('..')
const imaginary = require('imaginary')
// function to get image and document URLs
var serverUrl=('http://localhost:4000')
var watermark = require('jimp-watermark');
async function getFileUrl(filePath) {
  const fileExists = await fs.pathExists(filePath);
  if (fileExists) {
    const backend_url = process.env.BACKEND_URL
    //   const fileUrl = `http://64.225.104.189:3000/${filePath}`;

    const fileUrl = `${backend_url}/${filePath}`;
    
    return fileUrl;
  }
  return null;
}

const getProperties = async () => {
  try {
    const response = await axios.get(`${API}/property/list`);
    return response.data;
  } catch (err) {
    console.error('Error fetching properties:', err);
    throw err;
  }
};

async function handleUploadedFilesImages(files, folderName, userId, object, append = false) {
  // console.log("files===="+files)
  // console.log("Geo tagging===="+JSON.stringify(object))
  if (files.length > 0) {
    const geo_tagging = object.geo_tagging;
   
    let i = 0 ;
    
    const destination = path.join('uploads', folderName, userId.toString());
    await fs.ensureDir(destination);
    let filePaths = [];
    if (append) {
      if (folderName === 'images' || folderName === 'task_images') {
        filePaths = JSON.parse(object.images)
      } else if (folderName === 'documents' || folderName === 'task_documents') {
        filePaths = JSON.parse(object.documents)
      } else if (folderName === 'invoices') {
        filePaths = JSON.parse(object.invoice)
      }
    }
    // console.log("Object===="+JSON.parse(object.images))
    // console.log("filePaths========"+filePaths)
    for (const file of files) {
      // console.log("geo_tagging:: ",geo_tagging[i])
      const lat = geo_tagging[i]["lat"]
      const long = geo_tagging[i]["long"]
      // console.log("lat===",lat)
      // console.log("long===",long)
      // console.log("originalname File Name==="+file.originalname)
      let fileExt = path.extname(file.originalname) || mime.extension(file.mimetype);
      if (fileExt.startsWith('.')) {
        fileExt = fileExt.substring(1);
      }
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
      const filePath = path.join(destination, uniqueFilename);
      await fs.writeFile(filePath, file.buffer);
      filePaths.push(filePath);
      // console.log("filePaths before 2========"+filePath)
      let date_time = new Date();
      let date = ("0" + date_time.getDate()).slice(-2);
      let month = ("0" + (date_time.getMonth() + 1)).slice(-2); 
      let year = date_time.getFullYear();
      let hours = date_time.getHours();
      let minutes = date_time.getMinutes();
      let seconds = date_time.getSeconds();
      let current_date=date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;
     // const water_mark_text="Bhuvi water mark "+current_date+"\n"+"Lat:17.4776478 Log:78.4726618";
     const water_mark_text="Bhuvi RealTech "+current_date+"\n"+"Lat: "+ lat + ", Long: " + long;
       //Should be 'top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'
      const position='top-center';
       watermark.addTextWatermark(filePath, { 'text': water_mark_text ,'dstPath':filePath,'textSize':'8','position' : position});
      //watermark.addWatermark(filePath, { 'text': water_mark_text ,'dstPath':filePath,'textSize':'5','position' : 'bottom-center'});
      i += 1;
    }
    // console.log("filePaths after========"+filePaths)
    if (folderName === 'images' || folderName === 'task_images') {
      object.images = JSON.stringify(filePaths);
    } else if (folderName === 'documents' || folderName === 'task_documents') {
      object.documents = JSON.stringify(filePaths);
    } else if (folderName === 'invoices') {
      object.invoice = JSON.stringify(filePaths);
    }
  }
}
async function handleUploadedFiles(files, folderName, userId, object, append = false) {
  if (files.length > 0) {
    const destination = path.join('uploads', folderName, userId.toString());
    await fs.ensureDir(destination);
    let filePaths = [];
    if (append) {
      if (folderName === 'images' || folderName === 'task_images') {
        filePaths = JSON.parse(object.images)
      } else if (folderName === 'documents' || folderName === 'task_documents') {
        filePaths = JSON.parse(object.documents)
      } else if (folderName === 'invoices') {
        filePaths = JSON.parse(object.invoice)
      } else if (folderName === 'profile_image') {
        filePaths = JSON.parse(object.image)
      }
    }
    // console.log("filePaths========"+filePaths)
    for (const file of files) {
      let fileExt = path.extname(file.originalname) || mime.extension(file.mimetype);
      if (fileExt.startsWith('.')) {
        fileExt = fileExt.substring(1);
      }
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
      const filePath = path.join(destination, uniqueFilename);
      // console.log("filePaths before 1========"+filePath)
      await fs.writeFileSync(filePath, file.buffer);

      filePaths.push(filePath);
    }
    if (folderName === 'images' || folderName === 'task_images') {
      object.images = JSON.stringify(filePaths);
    } else if (folderName === 'documents' || folderName === 'task_documents') {
      object.documents = JSON.stringify(filePaths);
    } else if (folderName === 'invoices') {
      object.invoice = JSON.stringify(filePaths);
    } else if (folderName === 'profile_image') {
      object.image = JSON.stringify(filePaths);
    }
  }
};


function generateUniqueReferenceCode() {
  // Generate a timestamp in milliseconds
  const timestamp = Date.now().toString();

  // Generate a random component using a cryptographic random source
  const randomBytes = crypto.randomBytes(6);
  const randomComponent = randomBytes.toString('hex');

  // Combine the timestamp and random component
  const referenceCode = timestamp + randomComponent;

  // Hash the combined code to ensure it's a fixed length and alphanumeric
  const hash = crypto.createHash('sha256');
  hash.update(referenceCode);
  const finalReferenceCode = hash.digest('hex').substring(0, 12).toUpperCase();

  return finalReferenceCode;
}


function generateReferralCode(customerId) {
  // Create a unique code by combining the customer's ID with additional characters
  const additionalCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const uniquePart = customerId.toString(); // Use customer ID as part of the code

  // Calculate the length of the additional characters needed
  const additionalLength = 8 - uniquePart.length;

  if (additionalLength <= 0) {
    // Customer ID is long enough, return it as is
    return uniquePart;
  } else {
    // Generate additional random characters to complete the code
    let additionalCode = '';
    for (let i = 0; i < additionalLength; i++) {
      const randomIndex = Math.floor(Math.random() * additionalCharacters.length);
      additionalCode += additionalCharacters.charAt(randomIndex);
    }
    return uniquePart + additionalCode;
  }
}
 function getDDYY() {
  let date_time = new Date();
  let date = ("0" + date_time.getDate()).slice(-2);
  let month = ("0" + (date_time.getMonth() + 1)).slice(-2);
  let year = date_time.getFullYear();
  
  const YY = year.toString().slice(-2);
  console.log("YY=="+YY);
  return `${month}${YY}`;
}

module.exports = {
  getFileUrl,
  handleUploadedFiles,
  handleUploadedFilesImages,
  getDDYY,
  generateUniqueReferenceCode,
  generateReferralCode
}