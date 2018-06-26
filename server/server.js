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
    res.send('Welcome to this beautiful webpage !');
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
        //return res.status(400).send();
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
    }).catch((e) => res.send(JSON.stringify({
        code: 500,
        error: e.message
    })));
});

app.delete('/todos/:id', (req, res) => {
   // get the id
    var id = req.params.id;

    if(!ObjectID.isValid(id)){
        return res.send(JSON.stringify({
            code: 404,
            error: 'Incorrect ID'
        }));
    }

    Todo.findByIdAndRemove(id).then((todo) => {
        if(!todo) {
            return res.send(JSON.stringify({
                code: 404,
                error: 'ID not found'
            }));
        }
        return res.send({todo});
    }).catch((e) => res.send(JSON.stringify({
        code: 500,
        error: e.message
    })));
});

/* Update a Todo */
app.patch('/todos/id', (req, res) => {
   var id = req.params.id;
   /* Get args*/
   var body = _.pick(req.body, ['text', 'completed']);

   if(!ObjectID.isValid(id)) {
       return res.send(JSON.stringify({
           code: 404,
           error: 'Incorrect ID'
       }));
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
           return res.send(JSON.stringify({
               code: 404,
               error: 'ID not found'
           }));
       }

       res.send({todo});
   }).catch((e) => res.send(JSON.stringify({
       code: 500,
       error: e.message
   })));
});

/* Run Express on port 3000 */
app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
});

/* Export the Express application*/
module.exports = {app};