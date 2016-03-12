var pm2 = require('pm2');

var MACHINE_NAME = 'Gueime Prod';
var PRIVATE_KEY  = 'qsg9ih4gmlfpvv6';   // Keymetrics Private key
var PUBLIC_KEY   = 'pzp1ifgh7tkcwp9';   // Keymetrics Public  key

pm2.connect(function() {
  pm2.start({
    script    : 'server.js',
    name      : 'production-app',     // ----> THESE ATTRIBUTES ARE OPTIONAL:
    exec_mode : 'cluster',            // ----> https://github.com/Unitech/PM2/blob/master/ADVANCED_README.md#schema
    instances : instances,
    max_memory_restart : maxMemory + 'M',   // Auto restart if process taking more than XXmo
    env: {                            // If needed declare some environment variables
      "NODE_ENV": "production",
      "AWESOME_SERVICE_API_TOKEN": "xxx"
    },
    post_update: ["npm install"]       // Commands to execute once we do a pull from Keymetrics
  }, function() {
    pm2.interact(PRIVATE_KEY, PUBLIC_KEY, MACHINE_NAME, function() {

     // Display logs in standard output
     pm2.launchBus(function(err, bus) {
       console.log('[PM2] Log streaming started');

       bus.on('log:out', function(packet) {
        console.log('[App:%s] %s', packet.process.name, packet.data);
       });

       bus.on('log:err', function(packet) {
         console.error('[App:%s][Err] %s', packet.process.name, packet.data);
       });
      });


    });
  });
});
