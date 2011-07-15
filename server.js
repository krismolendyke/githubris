var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var url = require('url');
var querystring = require('querystring');
var jsdom = require('jsdom');

var log = console.log;

var options = {
    host: 'github.com',
    maxLanguageResults: 10
};

var server = http.createServer();
server.listen(1234);
log('Server running at http://localhost:1234');

server.on('request', function (req, res) {
    var urlPath = url.parse(req.url).pathname.split('/').slice(1);

    switch (urlPath[0].toLowerCase()) {
        case 'search':
            var query = urlPath[1] || 'hack';
            search(query, res);
            break;
        case '':
            fs.readFile(process.cwd() + '/index.html', function (err, data) {
                if(err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Yikes- hubristic dreams realized by server fail!');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data);
                }
            });
            break;
        default:
            var contentType = {};
            switch (path.extname(urlPath[0])) {
                case '.html':
                    contentType['Content-Type'] = 'text/html';
                    break;
                case '.js':
                    contentType['Content-Type'] = 'text/javascript';
                    break;
                case '.css':
                    contentType['Content-Type'] = 'text/css';
                    break;
                case '.gif':
                    contentType['Content-Type'] = 'image/gif';
                    break;
                default:
                    contentType['Content-Type'] = 'text/plain';
            }

            fs.readFile(process.cwd() + '/' + urlPath[0], function (err, data) {
                if(err) {
                    res.writeHead(500, contentType);
                    res.end('Ooof. Something went wrong reading ' + urlPath[0]);
                } else {
                    res.writeHead(200, contentType);
                    res.end(data);
                }
            });
    }
});

function search(query, serverRes) {
    query = querystring.unescape(query);
    options.path = '/search?' + querystring.stringify({type: 'Code', q: query});

    https.get(options, function (res) {
        var resBody = '';

        function parseResult(languageItem) {
            var collapsedText;
            var count;
            var countRE = /.*\((\d+)\).*/;
            var language;
            var result;

            if(languageItem.getElementsByTagName('a').length > 0) {
                language = languageItem.getElementsByTagName('a')[0].textContent;
                collapsedText = languageItem.textContent.replace(/\s+/g,'');
                count = parseInt(collapsedText.replace(countRE, '$1'), 10);

                if(!isNaN(count)) {
                    result = { language: language, count: count };
                }
            }

            return result;
        }

        function parseResults(sidebar) {
            var languageItems;
            var languageList = sidebar.getElementsByTagName('ul');
            var len;
            var result;
            var results = [];

            if(languageList.length > 0) {
                languageItems = languageList[0].getElementsByTagName('li');
                len = languageItems.length > options.maxLanguageResults ? options.maxLanguageResults : languageItems.length;

                for(var i = 0; i < len; i += 1) {
                    result = parseResult(languageItems[i]);
                    if(result) {
                        results.push(result);
                    }
                }
            }

            return results;
        };

        res.setEncoding('utf8');

        res.on('data', function(chunk) { resBody += chunk; });

        res.on('end', function () {
            jsdom.env(resBody, function (errors, window) {
                var body;
                var head;
                var results = [];
                var sidebar = window.document.getElementsByClassName('sidebar')[0];

                if(sidebar && sidebar.getElementsByTagName('ul').length > 0) {
                    results = parseResults(sidebar);
                }

                body = JSON.stringify(results);
                head = {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Length': body.length
                };
                serverRes.writeHead(200, head);
                serverRes.end(body);
            });
        });
    });
}
