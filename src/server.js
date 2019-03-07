/*
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const http = require('http');
const PORT = process.env.PORT || 8080;
const hook = require('./hooks/hook.js');

//Start the server
const server = http.createServer();
let now = new Date();
server.listen(PORT, function(){
    console.log("%s [server.js] Server listening on: %s", now, PORT);
});

server.on('error', function(error) {
    let now = new Date();
    console.log("%s [server.js] - Server Error", now);
    response.writeHead(500, {'Content-Type': 'application/json'});
    response.end(error.toString());
});

server.on('request', function(request,response){
    let now = new Date();
    console.log("%s [server.js] - Got a request", now);
    if (request.headers['content-type'] === 'application/json') {
        let body = [];
        request.on('error', (error) => {
            response.writeHead(400, {'Content-Type': 'text/plain'});
            response.end(error.toString());
            console.log("%s [server.js] - Sent the response 400", now);
        });
        request.on('data', (chunk) => {
            body.push(chunk);
        });
        request.on('end', () => {
            body = Buffer.concat(body).toString();
            let observed = JSON.parse(body)
            hook(observed).then((desired) => {
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(desired));
                console.log("%s [server.js] - Sent the response 200", now);
              }, (error) => {
                response.writeHead(500, {'Content-Type': 'text/plain'});
                response.end(error.toString());
                console.log("%s [server.js] - Sent the response 500", now);
              });
        });
    } else {
        response.writeHead(415, {'Content-Type': 'text/plain'});
        response.end('Unsupported Media Type');
        console.log("%s [server.js] - Sent the response 415", now);
    }  
});

