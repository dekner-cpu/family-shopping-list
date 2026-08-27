exports.up = function (knex) {
  return knex.schema.alterTable('main_list_items', (table) => {
    table.string('category');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('main_list_items', (table) => {
    table.dropColumn('category');
  });
};
