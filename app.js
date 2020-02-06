var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');
const { cleanOneDayOldFiles } = require('./clean');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var { getScreenShot, createFilePath } = require('./getScreenShot');
var { uploadToS3, checkIfPresentInS3 } = require('./uploadToS3');

const disk = require('diskusage');
const os = require('os');
const rootPath = os.platform() === 'win32' ? 'c:' : '/';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);


app.use('/screenshot', async (req, res)=>{
  let url = req.body.url || req.query.url;
  let width = req.body.width || req.query.width || 1269;
  let height = req.body.height || req.query.height || 944;
  let cache = req.body.cache || req.query.cache || "no";
  if(!url){
    res.status(400).send("Provide proper url!");
    return;
  }
  getScreenShot(url, width, height, cache).then((filePath)=>{
    if(filePath){
      res.sendFile(filePath);
    }else{
      res.status(400).send("Cannot process your request!");
    }
    cleanOneDayOldFiles();
  }).catch((err)=>{
    console.log(err);
  });
});

app.use('/screenshotUrl', async (req, res)=>{
  let url = req.body.url || req.query.url;
  let width = req.body.width || req.query.width || 1269;
  let height = req.body.height || req.query.height || 944;
  let cache = req.body.cache || req.query.cache || "no";
  if(!url){
    res.status(400).send("Provide proper url!");
    return;
  }

  let filePath = createFilePath(url, width, height);
  checkIfPresentInS3(filePath).then((signedUrl)=>{
    if(cache=="yes" && signedUrl){
      res.send(signedUrl);
    }else{
      return getScreenShot(url, width, height, cache);
    }
  }).then((filePath)=>{
    if(filePath)
      return uploadToS3(filePath);
  }).then((data)=>{
    if(data){
      res.send(data.Location);
    }
    cleanOneDayOldFiles();
  }).catch((err)=>{
    console.log(err);
    res.status(400).send("Cannot process your request!");
  });

  try{
    return;
    getScreenShot(width, height).then((filePath)=>{
      if(filePath){
        res.sendFile(filePath);
      }else{
        res.status(400).send("Cannot process your request!");
      }
      cleanOneDayOldFiles();
    }).catch((error)=>{
      res.status(400).send("Cannot process your request!");
    });
  }catch(err){
    console.log(err);
    res.status(400).send("Cannot process your request!");
  }
  cleanOneDayOldFiles();
});

app.use('/disk', async (req, res)=>{
  disk.check(rootPath, function(err, info) {
    if (err) {
      console.log(err);
      res.status(400).send(err);
    } else {
      res.send(info)
      console.log(info.available);
      console.log(info.free);
      console.log(info.total);
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});             

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('uncaughtException', err => {
  console.error("BSC Website face uncaughtException:", err.toString(), err.stack);
});

module.exports = app;
