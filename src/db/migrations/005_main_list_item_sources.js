exports.up = function (knex) {
  return knex.schema.createTable('main_list_item_sources', (table) => {
    table.increments('id').primary();
    table.integer('main_list_item_id').unsigned().notNullable().references('id').inTable('main_list_items').onDelete('CASCADE');
    table.integer('personal_list_item_id').unsigned().notNullable().references('id').inTable('personal_list_items').onDelete('CASCADE');
    table.integer('contributed_by_user_id').unsigned().notNullable().references('id').inTable('users');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('main_list_item_sources');
};
