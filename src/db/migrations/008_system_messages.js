exports.up = function (knex) {
  return knex.schema.createTable('system_messages', (table) => {
    table.increments('id').primary();
    table.integer('sender_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('text').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('system_messages');
};
