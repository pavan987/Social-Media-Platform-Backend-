var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    router = express.Router();

var port = 8087


app.use(bodyParser.urlencoded({ extended: false }))
  // parse application/json
app.use(bodyParser.json())
app.use('/api/0.1', router);

router.get('/room/create', createRoom)

app.listen(port);

function createRoom(req,res) {
    var port

    var listener = app.listen(0, function(){
        port = listener.address().port; //Listening on port 8888
        listener.close()

        var childProcess = require('child_process'),
            ls;

        console.log('node game.js ' + port);
        ls = childProcess.exec('node game.js ' + port, function (error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
            }
            console.log('Child Process STDOUT: '+stdout);
            console.log('Child Process STDERR: '+stderr);
        });

        ls.on('exit', function (code) {
            console.log('Child process exited with exit code '+code);
        });

        res.json({portnumber:port})

    })
}

console.log('Server started at ' + port)




