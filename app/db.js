const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('dff', 'root', '5561', {
    host: 'localhost',
    dialect: 'mysql',
});

module.exports = sequelize;
