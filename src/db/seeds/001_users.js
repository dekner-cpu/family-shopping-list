exports.seed = async function (knex) {
  await knex('users').del();
  await knex('users').insert([
    { name: 'יעל', role: 'parent' },
    { name: 'שחר', role: 'parent' },
    { name: 'נטע', role: 'regular' },
    { name: 'דפנה', role: 'regular' },
  ]);

  const existingOpenCycle = await knex('shopping_cycles').whereIn('status', ['open', 'locked']).first();
  if (!existingOpenCycle) {
    await knex('shopping_cycles').insert({ status: 'open' });
  }
};
