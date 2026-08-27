exports.up = function (knex) {
  return knex.schema.createTable('product_category_learned', (table) => {
    table.increments('id').primary();
    table.string('product_name_normalized').notNullable().unique();
    table.string('category').notNullable();
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('product_category_learned');
};
