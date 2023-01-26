// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
var http = require('http');

var options = {
  // to be changed once we migrate to a proper domain name. It's normal to not use host with http or https
  host: 'gomez-metering-scraper.herokuapp.com',
  path: '/extract/yesterday',
};

console.log('CRON WAKE UP START');

http
  .get(options, function (res) {
    res.on('data', function (response) {
      const { data } = JSON.parse(response);

      // console.log(message);
      try {
        console.log('CRON nb of measures read from cron', data.length);
        console.log(
          `CRON measure[0]: deviceSerialNumber=${data[0].deviceSerialNumber} measure=${data[0].measure} consumption=${data[0].consumption} measureDate=${data[0].measureDate}`
        );
      } catch (err) {
        console.log(err.message);
      }
    });
  })
  .on('error', function (err) {
    console.log('CRON - Error: ' + err.message);
  });
