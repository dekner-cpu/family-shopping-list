exports.up = function (knex) {
  return knex.schema.createTable('shopping_cycles', (table) => {
    table.increments('id').primary();
    table.enu('status', ['open', 'locked', 'completed']).notNullable().defaultTo('open');
    table.timestamp('locked_at');
    table.integer('locked_by_user_id').unsigned().references('id').inTable('users');
    table.timestamp('completed_at');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('shopping_cycles');
};
