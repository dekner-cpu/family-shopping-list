exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table
      .integer('last_seen_system_message_id')
      .unsigned()
      .references('id')
      .inTable('system_messages')
      .onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('last_seen_system_message_id');
  });
};
