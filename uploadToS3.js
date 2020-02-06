const fs = require("fs");
const AWS = require('aws-sdk');
const config = require('./config/s3');

const BUCKET_NAME = "bombayshirtco";
const IAM_USER_KEY = config.ACCESS_KEY_ID;
const IAM_USER_SECRET = config.ACCESS_KEY_SECRET;

const s3bucket = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET
});

function uploadToS3(fileName) {
  const readStream = fs.createReadStream(fileName);
  const params = {
    Bucket: BUCKET_NAME,
    Key: "shirt-visual" + "/" + fileName.split("/").pop(),
    Body: readStream
  };

  return new Promise((resolve, reject) => {
    if(config.ACCESS_KEY_ID==""){
      reject({error:"Enter S3 credentials in conifg/s3.js"});
    }
    s3bucket.upload(params, function(err, data) {
      readStream.destroy();
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

function checkIfPresentInS3(fileName){
  const params = {
    Bucket: BUCKET_NAME,
    Key: "shirt-visual" + "/" + fileName.split("/").pop(),
  };
  return new Promise((resolve, reject)=>{
    s3bucket.headObject(params, function (err, metadata) {
      if (err && err.code === 'NotFound') {  
        // Handle no object on cloud here 
        resolve(null);
      } else {  
        s3bucket.getSignedUrl('getObject', params, (err, signedUrl)=>{
          if(err){
            reject(null);
          }else{
            resolve(signedUrl);
          }
        });
      }
    });
  });
}

module.exports = {
  uploadToS3,
  checkIfPresentInS3
}