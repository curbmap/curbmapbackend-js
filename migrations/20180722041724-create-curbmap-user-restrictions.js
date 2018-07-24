"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("curbmap_user_restrictions", {
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
      restrictions: {
          type: Sequelize.ARRAY(Sequelize.JSONB),
          default: []
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
    return queryInterface.dropTable("curbmap_user_restrictions");
  }
};
