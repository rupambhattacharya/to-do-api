const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const TODO_TABLE = process.env.TODO_TABLE;

const dynamoDb = new AWS.DynamoDB.DocumentClient();


app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('You should probably make use of the To Do API for all the exciting things!')
})

// Get all To-Do Objects
app.get('/v1/todo', async function (req, res) {
  const params = {
    TableName: TODO_TABLE
  }
  dynamoDb.scan(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Error retrieving Todos' });
      return;
    }
    const { Items: response } = result;
    res.status(200).json({ response });
  });
});

// Get To Do Object by ID
app.get('/v1/todo/:todo_id', function (req, res) {
  const params = {
    TableName: TODO_TABLE,
    Key: {
      id: req.params.todo_id,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'There was an error loading the To-Do objects.' });
    }
    if (result.Item) {
      const { id, title, description } = result.Item;
      res.status(200).json({ id, title, description });
    } else {
      res.status(400).json({ error: "There was an error loading the To-Do objects." });
    }
  });
})

// Create To Do endpoint
app.post('/v1/todo', function (req, res) {
  const { id, title, description } = req.body;
  if (typeof id !== 'string') {
    res.status(400).json({ error: '"id" must be a string' });
  } else if (typeof title !== 'string') {
    res.status(400).json({ error: '"title" must be a string' });
  } else if (typeof description !== 'string') {
    res.status(400).json({ error: '"description" must be a string' });
  }

  const params = {
    TableName: TODO_TABLE,
    Item: {
      id: id,
      title: title,
      description: description
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'There was an error while creating the To-Do object.' });
    }
    res.status(200).json({ message: 'To-Do object created successfully.' });
  });
})

// Update To Do endpoint
app.put('/v1/todo/:todo_id', (req, res) => {
  const { id, title, description } = req.body;

  var params = {
    TableName : TODO_TABLE,
    Key: { id },
    UpdateExpression : 'set #a = :title, #b = :description',
    ExpressionAttributeNames: { '#a' : 'title', '#b': 'description' },
    ExpressionAttributeValues : { ':title' : title, ':description': description },
  };

  dynamoDb.update(params, (error) => {
    if (error) {
      res.status(400).json({ error: 'There was an error while updating the To-Do object.' });
    }

    res.status(200).json({ message: 'To-Do object updated successfully.' });
  })
});

// Delete To Do endpoint
app.delete('/v1/todo/:todo_id', (req, res) => {

  const params = {
    TableName: TODO_TABLE,
    Key: { id: req.params.todo_id },
  };

  dynamoDb.delete(params, (error) => {
    if (error) {
      res.status(400).json({ error: 'There has been an error while deleting the To-Do object.' });
    }
    res.status(200).json({ message: "To-Do object deleted successfully." });
  });
});


module.exports.handler = serverless(app);