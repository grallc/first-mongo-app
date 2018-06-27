require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();

const port = process.env.PORT || 3000;

/* Define the page renderer to Body Parser */
app.use(bodyParser.json());

/* Create a new todo from request's text */
app.post('/todos', (req, res) => {
    var todo = new Todo({
       text: req.body.text
    });

    todo.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

/* Home */
app.get('/', (req, res) => {

    var information = {
        port,
        environment: process.env.NODE_ENV,
        current_commit: "undefined",
        mongo_hostname: mongoose.connection.host,
        mongo_database: mongoose.connection.db.name
    }

    if(process.env.MONGODB_ADDON_DB){
        information.mongo_database = process.env.MONGODB_ADDON_DB;
    } else if(!mongoose.connection.db.name){
        information.mongo_database = "undefined";
    }

    if(process.env.COMMIT_ID){
        information.current_commit = process.env.COMMIT_ID;
    }

    res.send(JSON.stringify({information}));
});

/* Return every todos */
app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    });
});

/* GET /todos/1234 */
app.get('/todos/:id', (req, res) => {
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        //return res.status(404).send();
        return res.send(JSON.stringify({
            code: 404,
            error: 'Incorrect ID'
        }));
    }

    Todo.findById(id).then((todo) => {
        if(!todo) {
            return res.send(JSON.stringify({
                code: 404,
                error: 'ID not found'
            }));
        }
        return res.send({todo});
    }).catch((e) => {
        res.status(400).send();
    });
});

app.delete('/todos/:id', (req, res) => {
   // get the id
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.status(404).send();

    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if(!todo) {
            return  res.status(404).send();

        }
        return res.send({todo});
    }).catch((e) => {
        res.status(400).send();
    });
});

/* Update a Todo */
app.patch('/todos/:id', (req, res) => {
   var id = req.params.id;
   /* Get args*/
   var body = _.pick(req.body, ['text', 'completed']);

   if(!ObjectID.isValid(id)) {
       return res.status(404).send();
   }

   /* Check args*/
   if(_.isBoolean(body.completed) && body.completed){
       body.completedAt = new Date().getTime();
   } else{
       body.completed = false;
       body.completedAt = null;
   }

   Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then((todo) => {
       if(!todo) {
           return res.status(404).send();

       }

       res.send({todo});
   }).catch((e) => {
       res.status(400).send();
   });
});

/* Run Express on port 3000 */
app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
});

/* Export the Express application*/
module.exports = {app};