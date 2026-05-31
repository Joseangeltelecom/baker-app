import { db, initializeDB } from './db';

export async function seedRecipes() {
  await initializeDB();

  // Verificar si ya hay recetas
  const count = await db.execute('SELECT COUNT(*) as count FROM recipes');
  const row = count.rows[0] as any;
  if (row && row.count > 0) {
    console.log('Ya existen recetas en la base de datos');
    return;
  }

  // Datos de recetas predefinidas
  const seedRecipes = [
    {
      name: 'Bizcocho básico',
      ingredients: [
        { name: 'Harina de trigo', quantity: 250, unit: 'g' },
        { name: 'Azúcar', quantity: 200, unit: 'g' },
        { name: 'Huevos', quantity: 4, unit: 'unidades' },
        { name: 'Mantequilla', quantity: 100, unit: 'g' },
        { name: 'Leche', quantity: 120, unit: 'ml' },
        { name: 'Polvo de hornear', quantity: 10, unit: 'g' },
        { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
      ],
    },
    {
      name: 'Galletas de mantequilla',
      ingredients: [
        { name: 'Harina de trigo', quantity: 300, unit: 'g' },
        { name: 'Mantequilla', quantity: 200, unit: 'g' },
        { name: 'Azúcar glass', quantity: 100, unit: 'g' },
        { name: 'Huevo', quantity: 1, unit: 'unidades' },
        { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
      ],
    },
    {
      name: 'Brownies de chocolate',
      ingredients: [
        { name: 'Chocolate negro', quantity: 200, unit: 'g' },
        { name: 'Mantequilla', quantity: 150, unit: 'g' },
        { name: 'Azúcar', quantity: 200, unit: 'g' },
        { name: 'Huevos', quantity: 3, unit: 'unidades' },
        { name: 'Harina de trigo', quantity: 100, unit: 'g' },
        { name: 'Nueces', quantity: 80, unit: 'g' },
      ],
    },
    {
      name: 'Crema pastelera',
      ingredients: [
        { name: 'Leche', quantity: 500, unit: 'ml' },
        { name: 'Yemas de huevo', quantity: 4, unit: 'unidades' },
        { name: 'Azúcar', quantity: 100, unit: 'g' },
        { name: 'Maicena', quantity: 40, unit: 'g' },
        { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
      ],
    },
    {
      name: 'Cupcakes de vainilla',
      ingredients: [
        { name: 'Harina de trigo', quantity: 200, unit: 'g' },
        { name: 'Azúcar', quantity: 150, unit: 'g' },
        { name: 'Mantequilla', quantity: 120, unit: 'g' },
        { name: 'Huevos', quantity: 2, unit: 'unidades' },
        { name: 'Leche', quantity: 100, unit: 'ml' },
        { name: 'Polvo de hornear', quantity: 8, unit: 'g' },
        { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
      ],
    },
  ];

  // Insertar recetas
  for (const recipe of seedRecipes) {
    const recipeResult = await db.execute({
      sql: 'INSERT INTO recipes (name) VALUES (?)',
      args: [recipe.name],
    });
    
    const recipeId = Number(recipeResult.lastInsertRowid);
    
    if (recipeId) {
      for (const ing of recipe.ingredients) {
        await db.execute({
          sql: 'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
          args: [recipeId, ing.name, ing.quantity, ing.unit],
        });
      }
    }
  }

  console.log('Recetas iniciales creadas exitosamente');
}