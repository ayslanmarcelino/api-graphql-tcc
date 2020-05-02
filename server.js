const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const graphqlHTTP = require('express-graphql');
const graphqlTools = require('graphql-tools');
const cors = require('cors');

let db = null;
const url = 'mongodb://localhost:27017';
const dbName = 'GraphQLdb';
const door = 3000;

app.use(cors());

MongoClient.connect(url, {useNewUrlParser: true}, function(error, client) {
  if(error) console.log('ERRO de conexão:', error);
  else console.log('banco de dados conectado com sucesso.');

  db = client.db(dbName);
});

app.listen(door);
console.log(`servidor rodando em: localhost:${door}`);

function getCode() {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    const values = year+''+month+''+day+''+hours+''+minutes+''+seconds+''+milliseconds;
    const result = Number(parseFloat(Number(values)/2).toFixed(0));
    return result;
  }catch(error) {
    console.log({erro: error});
    return 0;
  }
}

const typeDefs = `
  type Person {
    _id: ID,
    code: Float,
    name: String,
    age: Int,
    email: String
  }

  input inputPerson {
    code: Float,
    name: String,
    age: Int,
    email: String
  }

  type Query {
    findPersonOne(code: Float): Person
    findPerson(input: inputPerson): [Person]
  }

  type Mutation {
    insertPerson(input: inputPerson): Person
    updatePerson(code: Float, input: inputPerson): String,
    deletePerson(code:Float): String
  }
`;

const resolvers = {
  Query: {
    findPersonOne: function(_, {code}) {
      return db.collection('people').findOne({code: code}).then(function(result) {
        return result;
      })
    },
    findPerson: function(_, {input}) {
      return db.collection('people').find(input).toArray().then(function(result) {
        return result
      });
    }
  },
  Mutation: {
    insertPerson: function(_, {input}) {
      input.code = getCode();
      return db.collection('people').insertOne(input).then(function(result) {
        return result.ops[0];
      });
    },
    updatePerson: function(_, args){
      return db.collection('people').updateOne({code: args.code}, {$set: args.input}).then(function(result) {
        if (result.result.n>0) return 'Editado com Sucesso';
        else return 'Erro ao Editar'
      })
    },
    deletePerson: function(_, {code}) {
      return db.collection('people').deleteOne({code: code}).then(function(result) {
        if (result.result.n>0) return 'Apagado com Sucesso';
        else return 'Erro ao Apagar'
      })
    }
  }
};

const schema = graphqlTools.makeExecutableSchema({
  typeDefs: typeDefs,
  resolvers: resolvers
});

app.use('/', graphqlHTTP({
  graphiql: true,
  schema: schema
}))
