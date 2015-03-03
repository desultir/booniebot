var fs = require('fs');
var getopt = require('node-getopt');
var hipchat = require('node-hipchat');
var moment = require('moment');
var xml2js = require('xml2js');
var lodash = require('lodash');
var http = require('http');
var util = require('util');


var API_KEY = '<setme>';
var MAIN_ROOM_ID = 11;
var TEST_ROOM_ID = 3;
hipchat.prototype.host = 'api.hipchat.com';

var HC = new hipchat(API_KEY);

function postResult(debug) {
  var params = { from: 'BoonieBot', room_id: debug ? TEST_ROOM_ID : MAIN_ROOM_ID };

  getMatches(params);
}

function formatMatch(match) {
    var mdata = match['$'];
    var today = new Date();
    var istStartHrs = mdata['hours']
    var istStartMin = mdata['minutes']
    //convert IST to syd -> + 5.5hr

    today.setHours(istStartHrs);
    today.setMinutes(istStartMin);
    today.setHours(today.getHours()+5); 
    today.setMinutes(today.getMinutes()+30); 

    var formattedMin = today.getMinutes() >= 10 ? ""+today.getMinutes() : "0"+today.getMinutes();

    return mdata["team1"] + " vs " + mdata["team2"] + " at " + today.getHours() + ":" + formattedMin + " AEDT";
}

function getMatches(params) {
    var options = {
      host: 'synd.cricbuzz.com',
      port: 80,  
      path: '/cricbuzz/series/flash_schedule/wc2015.php'
    };

    var hc_options = {
      host: 'synd.criybuzz.com',
      port: 80,  
      path: '/cricbuzz/series/flash_schedule/wc2015.php'
    };

    var today = new Date();
    var month = today.getMonth() + 1;
    if (month < 10) {
       month = "0"+month;
    } else {
       month = ""+month;
    }

    var day = today.getDate() + "";
    if (day < 10) {
       day = "0"+ day;
    } else {
       day = ""+ day;
    }

    var parser = new xml2js.Parser();
    http.get(options, function(res) {
      var chunks = '';
      console.log("Got response: " + res.statusCode);
      res.on('data', function(chunk) {
        chunks += chunk;
      });
      res.on('end', function() {
       body = chunks;

       xdata = parser.parseString(body, function(err, result) {
            matches = result['matches'];
            todaymatches = lodash.filter(matches['cmatch'], function(m) {
                return m['$']['dates'] === day && m['$']['months'] === month;
            });
            params.message = 'Cricket matches today: ' ;
            lodash.each(todaymatches, function (m) {
                params.message += '<br>'+formatMatch(m);
            });


            if (todaymatches.length == 0) {
                params.message += 'None :(';
            }

            params.message+='<br><i>Boonie... dead set legend</i>';

            console.log(util.inspect(params));
            HC.postMessage(params, function(ret, err) {	
                value = ret;
                buff = err;
                console.log('done'+util.inspect(value) + buff);
             });

        });
      }); 
     }).on('error', function(e) {
       console.log("Got error: " + e.message);
    });
}

function main(opts) {
  var now = moment(),
      delay,
      interval,
      start;

  // Set defaults and perform type coersions where needed.
  opts.start = opts.start || '7:00';
  opts.interval = +opts.interval || 24;
  opts.searchquery = opts.searchquery || 'cricket';

  // No need to go on if we're only posting one time.
  if (opts.onetime) {
    postResult(opts.debug);
    return;
  }

  start = opts.start.split(':');
  start = moment({ hours: +start[0], minutes: +start[1] || 0 });
  if (start < now) { start.add(1, 'days'); }
  delay = moment.duration(start - now, 'milliseconds');
  interval = moment.duration(opts.interval, 'hours');

  console.log('Boonie... Dead set legend');
  console.log('Starting in', delay.humanize());
  console.log('Repeating every', interval.humanize().replace(/an* /, ''));
  console.log('Posting to the', opts.debug ? 'test' : 'Sydney', 'chatroom');

  setTimeout(function() {
    postResult(opts.path, opts.debug);
    setInterval(
      postResult.bind(this, opts.debug),
      interval.asMilliseconds());
  }, delay.asMilliseconds());
}

var opts = getopt.create([
    ['h', 'help',         'Display this help'],
    ['s', 'start=ARG',    'Hour to start polling (e.g., 13:00 => 1 PM)'],
    ['i', 'interval=ARG', 'Interval in hours between pollings'],
    ['d', 'debug',        'Debug mode: post to the test room'],
    ['o', 'onetime',      'Skip scheduling. Only post one time, now']
  ])
  .bindHelp()
  .parseSystem();

// Go!
main(opts.options);
