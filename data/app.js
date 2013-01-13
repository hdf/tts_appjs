var fs = require('fs'),
    http = require('http'),
    crypto = require('crypto'),
    app = module.exports = require('appjs');

process.on('uncaughtException', function (err) {
  fs.writeFile('error.log', err);
});

function md5(str) {
  return crypto.createHash('md5').update(str).digest("hex");
}

function download(hash, lang, str) {
  http.get('http://translate.google.com/translate_tts?ie=UTF-8&tl=' + lang + '&q=' + str,
    function (res) {
      var stream = fs.createWriteStream(__dirname + '/content/mp3/' + hash + '_' + lang + '.mp3');
      stream.on('close', function() {
        window.mp3s.push('mp3/' + hash + '_' + lang + '.mp3');
        window.dispatchEvent(new window.Event('rdy'));
      });
    res.pipe(stream);
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

app.serveFilesFrom(__dirname + '/content');

var window = app.createWindow({
  width: 640,
  height: 460,
  icons: __dirname + '/content/icons',
  resizable: false
});

window.on('create', function() {
  window.frame.show().center();
});

window.on('ready', function() {
  window.require = require;
  window.process = process;
  window.module = module;

  window.addEventListener('keydown', function(e) {
    // show chrome devtools on f12 or commmand+option+j
    if (e.keyIdentifier === 'F12' || e.keyCode === 74 && e.metaKey && e.altKey) {
      window.frame.openDevTools();
    }
  });

  window.addEventListener('str', function() {
    var txt = window.document.getElementById('txt').value,
        lang = window.document.getElementById('lang').value;
    if (txt.length < 1 || lang.length < 2 || lang.length > 5) return;
    var hashes = {}, space = 0, i = 0;
    while (true) {
      if (i + 100 >= txt.length) {
        hashes[md5(txt.substring(i))] = txt.substring(i);
        break;
      }
      space = txt.substr(i, 100).lastIndexOf(' ');
      if (space < 0) {
        if (txt.length > i)
          hashes[md5(txt.substring(i))] = txt.substring(i);
        break;
      }
      hashes[md5(txt.substr(i, space))] = txt.substr(i, space);
      i += space + 1;
    }
    for (var hash in hashes)
      if (!fs.existsSync(__dirname + '/content/mp3/' + hash + '_' + lang + '.mp3')) {
        download(hash, lang, hashes[hash]);
      } else {
        window.mp3s.push('mp3/' + hash + '_' + lang + '.mp3');
        window.dispatchEvent(new window.Event('rdy'));
      }
  });
});

window.on('close', function() {
  
});
