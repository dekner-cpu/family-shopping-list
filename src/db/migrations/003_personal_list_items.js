exports.up = function (knex) {
  return knex.schema.createTable('personal_list_items', (table) => {
    table.increments('id').primary();
    table.integer('cycle_id').unsigned().notNullable().references('id').inTable('shopping_cycles');
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    table.string('product_name').notNullable();
    table.string('quantity');
    table.text('notes');
    table.enu('status', ['pending', 'approved', 'rejected']).notNullable().defaultTo('pending');
    table.integer('reviewed_by_user_id').unsigned().references('id').inTable('users');
    table.timestamp('reviewed_at');
    // FK to main_list_items added in migration 004 (after that table exists) to avoid a circular
    // creation-order dependency between personal_list_items and main_list_items.
    table.integer('main_list_item_id').unsigned();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['cycle_id', 'user_id']);
    table.index(['cycle_id', 'status']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('personal_list_items');
};
