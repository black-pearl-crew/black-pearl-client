const knex = require('knex');
const config = require('../knexfile');
console.log(process.env.NODE_ENV,"Node ENV")
const database = knex(config[process.env.NODE_ENV]);

module.exports = database;