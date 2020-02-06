const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
var browser = null;

function createFilePath(url, width, height){
  return path.join(__dirname,"screenshots",url.replace(/\//g, '-')+`_${width}_${height}`+'.jpg');
}

async function getScreenShot(url, width, height, cache="yes"){

  if(!browser){
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'] 
    });
  }

  let filePath = createFilePath(url, width, height);

  if(cache=="yes" && fs.existsSync(filePath)){    
    return (filePath);
  }else{
    const page = await browser.newPage();
    await page.goto(url,  {waitUntil: 'networkidle0'});
    await page.setViewport({
      width: Number(width), height: Number(height),
      deviceScaleFactor: 1,
    });
    
    await timeout(3000); //wait till loads complete
    await page.screenshot({path: filePath});
    await page.close();
  
    return (filePath);
  }
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  getScreenShot,
  createFilePath
}