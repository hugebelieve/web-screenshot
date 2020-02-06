const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const timeLimitForCache = 24 * 3600000; // 24 hours

function cleanOneDayOldFiles(){
  var uploadsDir =  path.join(__dirname, 'screenshots');

  fs.readdir(uploadsDir, function(err, files) {
    files.forEach(function(file, index) {
      if(file!=".gitkeep")
      fs.stat(path.join(uploadsDir, file), function(err, stat) {
        var endTime, now;
        if (err) {
          return console.error(err);
        }
        now = new Date().getTime();
        endTime = new Date(stat.ctime).getTime() + timeLimitForCache;
        if (now > endTime) {
          return rimraf(path.join(uploadsDir, file), function(err) {
            if (err) {
              return console.error(err);
            }
          });
        }
      });
    });
  });
}


module.exports = {
  cleanOneDayOldFiles
}