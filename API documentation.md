2bored2wait is controlled through a small webserver, hosted on the port specified in config.json.

this webserver, as well as serving the webpage and its css, exposes multiple "endpoints" for controlling the tool. these endpoints can be accessed by making an HTTP GET request at their url.

note that the only content available without a password is the webpage and its css. If a password is specified in config.json, all other endpoints will respond with HTTP response code 403 (forbidden) unless the correct password is used.

to use a password, your request must include it as the content of the `XPassword` header.

the following control endpoints are available:
- /start : starts queuing. the proxy crashes if it is already started.
- /stop : stops queuing. probably won't crash if called twice, but I would'nt bank on that.
- /togglerestart: toogles whether the proxy starts queuing again when at the end of the queue if no client is connected. default: false.

for control endpoints, the server will respond with HTTP response code 200 (ok).

the following information endpoints are available:
- /update: the server will respond with HTTP response code 200 (ok) and the response text will be a JSON-formatted object with the following attributes:  
    - username: legacy, always "undefined"  
    - place: a string containing the current place in queue reported by 2b2t
    - ETA: a string containing an ETA calculated by 2b2t. Format is not guaranteed but usually `xxh xxm`.
    - inQueue: a boolean, true if the proxy is currently queuing, false otherwise
    - restartQueue: a boolean, true if the proxy is set to restart   queuing if it reaches position 0 without a client connected, false otherwise.

If any other url is tried, the server will answer with HTTP response code 404 (Not Found)
