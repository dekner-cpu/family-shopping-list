exports.up = async function (knex) {
  await knex.schema.createTable('main_list_items', (table) => {
    table.increments('id').primary();
    table.integer('cycle_id').unsigned().notNullable().references('id').inTable('shopping_cycles');
    table.string('product_name').notNullable();
    table.string('product_name_normalized').notNullable();
    table.string('quantity');
    table.text('notes');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.unique(['cycle_id', 'product_name_normalized']);
  });

  await knex.schema.alterTable('personal_list_items', (table) => {
    table.foreign('main_list_item_id').references('id').inTable('main_list_items');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('personal_list_items', (table) => {
    table.dropForeign('main_list_item_id');
  });
  await knex.schema.dropTableIfExists('main_list_items');
};
