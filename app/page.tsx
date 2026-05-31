'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Recipe {
  id: number;
  name: string;
  created_at: string;
}

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recetas');
      const data = await res.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error al cargar recetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${name}"?`)) {
      try {
        const res = await fetch(`/api/recetas/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchRecipes(); // Recargar lista
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Recetas</h2>
        <Link
          href="/crear"
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors shadow-md"
        >
          + Nueva Receta
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl">⏳</div>
          <p className="mt-2 text-gray-600">Cargando recetas...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-6xl mb-4">📖</p>
          <p className="text-gray-600 text-lg">No hay recetas todavía</p>
          <Link href="/crear" className="text-pink-500 underline mt-2 inline-block">
            Crea tu primera receta
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border border-pink-100"
            >
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg text-gray-800">{recipe.name}</h3>
            <div className="flex gap-1">
              <Link
                href={`/editar/${recipe.id}`}
                className="text-blue-400 hover:text-blue-600 transition-colors p-1"
                title="Editar receta"
              >
                ✏️
              </Link>
              <button
                onClick={() => handleDelete(recipe.id, recipe.name)}
                className="text-red-400 hover:text-red-600 transition-colors p-1"
                title="Eliminar receta"
              >
                🗑️
              </button>
            </div>
          </div>
              <Link
                href={`/receta/${recipe.id}`}
                className="bg-pink-500 text-white px-4 py-2 rounded text-center block hover:bg-pink-600 transition-colors"
              >
                Escalar Ingredientes
              </Link>
              <Link
              href={`/escalar-dimensiones/${recipe.id}`}
              className="bg-purple-500 text-white px-4 py-2 rounded text-center block hover:bg-purple-600 transition-colors mt-2"
            >
              📐 Escalar por tamaño
            </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}