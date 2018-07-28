'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('curbmap_users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      active_account: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      authorized: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      external_auth_key: {
        type: Sequelize.STRING
      },
      external_auth_service: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.STRING,
        defaultValue: "ROLE_USER",
        allowNull: false
      },
      external_auth_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      auth_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      score: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      badge: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [1],
        allowNull: false
      },
      badge_updated: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('curbmap_users');
  }
};