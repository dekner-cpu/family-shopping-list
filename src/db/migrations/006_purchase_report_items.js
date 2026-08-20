exports.up = function (knex) {
  return knex.schema.createTable('purchase_report_items', (table) => {
    table.increments('id').primary();
    table.integer('cycle_id').unsigned().notNullable().references('id').inTable('shopping_cycles');
    table.string('product_name').notNullable();
    table.string('quantity');
    table.boolean('bought').notNullable().defaultTo(false);
    table.text('note');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['cycle_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('purchase_report_items');
};
