"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("curbmap_user_photos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userid: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "curbmap_users",
          key: "id"
        },
        onUpdate: "cascade",
        onDelete: "cascade"
      },
      photos: {
        type: Sequelize.ARRAY({ type: Sequelize.STRING }),
        defaultValue: [],
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
    return queryInterface.dropTable("curbmap_user_photos");
  }
};
