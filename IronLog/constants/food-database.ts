/**
 * Bundled Food Database
 *
 * ~500 common US foods with macro data per serving.
 * Provides instant offline search — no API calls needed for common foods.
 * Data sourced from USDA FoodData Central and common nutrition labels.
 *
 * Categories: Protein, Dairy, Grains, Fruits, Vegetables, Snacks, Beverages,
 *             Fast Food, Condiments, Breakfast, Legumes, Nuts & Seeds, Oils & Fats
 *
 * @module constants/food-database
 */

import type { FoodItem } from '@/types/nutrition'

export const FOOD_DATABASE: FoodItem[] = [
  // ─── Protein ────────────────────────────────────────────────────────────────
  { id: 'b-001', name: 'Chicken Breast', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { id: 'b-002', name: 'Chicken Thigh', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 209, protein: 26, carbs: 0, fat: 10.9, fiber: 0 },
  { id: 'b-003', name: 'Ground Beef (85% lean)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 215, protein: 26, carbs: 0, fat: 11.5, fiber: 0 },
  { id: 'b-004', name: 'Ground Beef (93% lean)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 170, protein: 26, carbs: 0, fat: 7, fiber: 0 },
  { id: 'b-005', name: 'Ground Turkey', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 170, protein: 21, carbs: 0, fat: 9.4, fiber: 0 },
  { id: 'b-006', name: 'Salmon Fillet', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0 },
  { id: 'b-007', name: 'Tuna (canned in water)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 116, protein: 26, carbs: 0, fat: 0.8, fiber: 0 },
  { id: 'b-008', name: 'Shrimp', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0 },
  { id: 'b-009', name: 'Tilapia', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 96, protein: 20, carbs: 0, fat: 1.7, fiber: 0 },
  { id: 'b-010', name: 'Pork Chop', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 231, protein: 25, carbs: 0, fat: 14, fiber: 0 },
  { id: 'b-011', name: 'Pork Tenderloin', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 143, protein: 26, carbs: 0, fat: 3.5, fiber: 0 },
  { id: 'b-012', name: 'Steak (Sirloin)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 206, protein: 26, carbs: 0, fat: 10.6, fiber: 0 },
  { id: 'b-013', name: 'Steak (Ribeye)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 291, protein: 24, carbs: 0, fat: 21, fiber: 0 },
  { id: 'b-014', name: 'Turkey Breast (deli)', brand: null, category: 'Protein', servingSize: 56, servingUnit: 'g', calories: 60, protein: 12, carbs: 2, fat: 0.5, fiber: 0 },
  { id: 'b-015', name: 'Bacon', brand: null, category: 'Protein', servingSize: 2, servingUnit: 'slices', calories: 86, protein: 6, carbs: 0.2, fat: 6.7, fiber: 0 },
  { id: 'b-016', name: 'Ham (deli)', brand: null, category: 'Protein', servingSize: 56, servingUnit: 'g', calories: 60, protein: 10, carbs: 2, fat: 1.5, fiber: 0 },
  { id: 'b-017', name: 'Italian Sausage', brand: null, category: 'Protein', servingSize: 1, servingUnit: 'link', calories: 286, protein: 16, carbs: 3, fat: 23, fiber: 0 },
  { id: 'b-018', name: 'Cod', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 82, protein: 18, carbs: 0, fat: 0.7, fiber: 0 },
  { id: 'b-019', name: 'Lamb Chop', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 258, protein: 25, carbs: 0, fat: 17, fiber: 0 },
  { id: 'b-020', name: 'Bison (ground)', brand: null, category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 146, protein: 20, carbs: 0, fat: 7, fiber: 0 },

  // ─── Eggs ───────────────────────────────────────────────────────────────────
  { id: 'b-021', name: 'Egg (whole, large)', brand: null, category: 'Protein', servingSize: 1, servingUnit: 'egg', calories: 72, protein: 6, carbs: 0.4, fat: 5, fiber: 0 },
  { id: 'b-022', name: 'Egg White', brand: null, category: 'Protein', servingSize: 1, servingUnit: 'white', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1, fiber: 0 },
  { id: 'b-023', name: 'Hard Boiled Egg', brand: null, category: 'Protein', servingSize: 1, servingUnit: 'egg', calories: 78, protein: 6, carbs: 0.6, fat: 5.3, fiber: 0 },

  // ─── Dairy ──────────────────────────────────────────────────────────────────
  { id: 'b-030', name: 'Whole Milk', brand: null, category: 'Dairy', servingSize: 1, servingUnit: 'cup', calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0 },
  { id: 'b-031', name: '2% Milk', brand: null, category: 'Dairy', servingSize: 1, servingUnit: 'cup', calories: 122, protein: 8, carbs: 12, fat: 5, fiber: 0 },
  { id: 'b-032', name: 'Skim Milk', brand: null, category: 'Dairy', servingSize: 1, servingUnit: 'cup', calories: 83, protein: 8, carbs: 12, fat: 0.2, fiber: 0 },
  { id: 'b-033', name: 'Greek Yogurt (plain, nonfat)', brand: null, category: 'Dairy', servingSize: 170, servingUnit: 'g', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0 },
  { id: 'b-034', name: 'Greek Yogurt (plain, whole)', brand: null, category: 'Dairy', servingSize: 170, servingUnit: 'g', calories: 165, protein: 15, carbs: 7, fat: 9, fiber: 0 },
  { id: 'b-035', name: 'Cheddar Cheese', brand: null, category: 'Dairy', servingSize: 28, servingUnit: 'g', calories: 113, protein: 7, carbs: 0.4, fat: 9, fiber: 0 },
  { id: 'b-036', name: 'Mozzarella Cheese', brand: null, category: 'Dairy', servingSize: 28, servingUnit: 'g', calories: 85, protein: 6, carbs: 0.7, fat: 6, fiber: 0 },
  { id: 'b-037', name: 'Cottage Cheese (low fat)', brand: null, category: 'Dairy', servingSize: 113, servingUnit: 'g', calories: 81, protein: 14, carbs: 3, fat: 1, fiber: 0 },
  { id: 'b-038', name: 'Cream Cheese', brand: null, category: 'Dairy', servingSize: 28, servingUnit: 'g', calories: 99, protein: 2, carbs: 1, fat: 10, fiber: 0 },
  { id: 'b-039', name: 'Parmesan Cheese (grated)', brand: null, category: 'Dairy', servingSize: 10, servingUnit: 'g', calories: 42, protein: 4, carbs: 0.3, fat: 3, fiber: 0 },
  { id: 'b-040', name: 'Swiss Cheese', brand: null, category: 'Dairy', servingSize: 28, servingUnit: 'g', calories: 106, protein: 8, carbs: 1.5, fat: 8, fiber: 0 },
  { id: 'b-041', name: 'Butter', brand: null, category: 'Dairy', servingSize: 14, servingUnit: 'g', calories: 102, protein: 0.1, carbs: 0, fat: 11.5, fiber: 0 },
  { id: 'b-042', name: 'Sour Cream', brand: null, category: 'Dairy', servingSize: 30, servingUnit: 'g', calories: 57, protein: 0.7, carbs: 1, fat: 5.5, fiber: 0 },
  { id: 'b-043', name: 'Heavy Cream', brand: null, category: 'Dairy', servingSize: 15, servingUnit: 'ml', calories: 52, protein: 0.3, carbs: 0.4, fat: 5.5, fiber: 0 },
  { id: 'b-044', name: 'American Cheese', brand: null, category: 'Dairy', servingSize: 1, servingUnit: 'slice', calories: 65, protein: 4, carbs: 1, fat: 5, fiber: 0 },
  { id: 'b-045', name: 'String Cheese', brand: null, category: 'Dairy', servingSize: 1, servingUnit: 'stick', calories: 80, protein: 7, carbs: 1, fat: 5, fiber: 0 },

  // ─── Grains & Bread ─────────────────────────────────────────────────────────
  { id: 'b-060', name: 'White Rice (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 206, protein: 4, carbs: 45, fat: 0.4, fiber: 0.6 },
  { id: 'b-061', name: 'Brown Rice (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 216, protein: 5, carbs: 45, fat: 1.8, fiber: 3.5 },
  { id: 'b-062', name: 'Quinoa (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 222, protein: 8, carbs: 39, fat: 3.5, fiber: 5 },
  { id: 'b-063', name: 'Pasta (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 220, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5 },
  { id: 'b-064', name: 'Whole Wheat Pasta (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 174, protein: 7, carbs: 37, fat: 0.8, fiber: 6 },
  { id: 'b-065', name: 'White Bread', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'slice', calories: 79, protein: 3, carbs: 15, fat: 1, fiber: 0.6 },
  { id: 'b-066', name: 'Whole Wheat Bread', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'slice', calories: 81, protein: 4, carbs: 14, fat: 1, fiber: 2 },
  { id: 'b-067', name: 'Tortilla (flour, 8")', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'tortilla', calories: 146, protein: 4, carbs: 25, fat: 3.5, fiber: 1.5 },
  { id: 'b-068', name: 'Tortilla (corn, 6")', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'tortilla', calories: 52, protein: 1, carbs: 11, fat: 0.7, fiber: 1.5 },
  { id: 'b-069', name: 'Oats (dry)', brand: null, category: 'Grains', servingSize: 40, servingUnit: 'g', calories: 150, protein: 5, carbs: 27, fat: 2.5, fiber: 4 },
  { id: 'b-070', name: 'Bagel (plain)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'bagel', calories: 270, protein: 10, carbs: 53, fat: 1.5, fiber: 2 },
  { id: 'b-071', name: 'English Muffin', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'muffin', calories: 132, protein: 5, carbs: 26, fat: 1, fiber: 2 },
  { id: 'b-072', name: 'Pita Bread', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'pita', calories: 165, protein: 5, carbs: 33, fat: 0.7, fiber: 1.3 },
  { id: 'b-073', name: 'Couscous (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 176, protein: 6, carbs: 36, fat: 0.3, fiber: 2 },
  { id: 'b-074', name: 'Hamburger Bun', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'bun', calories: 140, protein: 4, carbs: 26, fat: 2, fiber: 1 },
  { id: 'b-075', name: 'Hot Dog Bun', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'bun', calories: 120, protein: 4, carbs: 22, fat: 2, fiber: 1 },
  { id: 'b-076', name: 'Naan Bread', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'piece', calories: 262, protein: 9, carbs: 45, fat: 5, fiber: 2 },
  { id: 'b-077', name: 'Jasmine Rice (cooked)', brand: null, category: 'Grains', servingSize: 1, servingUnit: 'cup', calories: 213, protein: 4, carbs: 47, fat: 0.3, fiber: 0.6 },

  // ─── Fruits ─────────────────────────────────────────────────────────────────
  { id: 'b-090', name: 'Banana', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1 },
  { id: 'b-091', name: 'Apple', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4 },
  { id: 'b-092', name: 'Orange', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1 },
  { id: 'b-093', name: 'Strawberries', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3 },
  { id: 'b-094', name: 'Blueberries', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 84, protein: 1.1, carbs: 21, fat: 0.5, fiber: 3.6 },
  { id: 'b-095', name: 'Grapes', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.4 },
  { id: 'b-096', name: 'Watermelon', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 46, protein: 0.9, carbs: 11, fat: 0.2, fiber: 0.6 },
  { id: 'b-097', name: 'Mango', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6 },
  { id: 'b-098', name: 'Pineapple', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 82, protein: 0.9, carbs: 22, fat: 0.2, fiber: 2.3 },
  { id: 'b-099', name: 'Avocado', brand: null, category: 'Fruits', servingSize: 0.5, servingUnit: 'avocado', calories: 161, protein: 2, carbs: 9, fat: 15, fiber: 7 },
  { id: 'b-100', name: 'Raspberries', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 64, protein: 1.5, carbs: 15, fat: 0.8, fiber: 8 },
  { id: 'b-101', name: 'Peach', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 59, protein: 1.4, carbs: 14, fat: 0.4, fiber: 2.3 },
  { id: 'b-102', name: 'Pear', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 101, protein: 0.7, carbs: 27, fat: 0.2, fiber: 5.5 },
  { id: 'b-103', name: 'Cantaloupe', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 54, protein: 1.3, carbs: 13, fat: 0.3, fiber: 1.4 },
  { id: 'b-104', name: 'Cherries', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'cup', calories: 87, protein: 1.5, carbs: 22, fat: 0.3, fiber: 2.9 },
  { id: 'b-105', name: 'Kiwi', brand: null, category: 'Fruits', servingSize: 1, servingUnit: 'medium', calories: 42, protein: 0.8, carbs: 10, fat: 0.4, fiber: 2.1 },
  { id: 'b-106', name: 'Grapefruit', brand: null, category: 'Fruits', servingSize: 0.5, servingUnit: 'fruit', calories: 52, protein: 0.9, carbs: 13, fat: 0.2, fiber: 2 },

  // ─── Vegetables ─────────────────────────────────────────────────────────────
  { id: 'b-120', name: 'Broccoli', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 55, protein: 3.7, carbs: 11, fat: 0.6, fiber: 5.1 },
  { id: 'b-121', name: 'Spinach (raw)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1, fiber: 0.7 },
  { id: 'b-122', name: 'Sweet Potato', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'medium', calories: 103, protein: 2, carbs: 24, fat: 0.1, fiber: 3.8 },
  { id: 'b-123', name: 'Potato (baked)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'medium', calories: 161, protein: 4, carbs: 37, fat: 0.2, fiber: 3.8 },
  { id: 'b-124', name: 'Carrots', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 52, protein: 1.2, carbs: 12, fat: 0.3, fiber: 3.6 },
  { id: 'b-125', name: 'Bell Pepper', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'medium', calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1 },
  { id: 'b-126', name: 'Tomato', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'medium', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5 },
  { id: 'b-127', name: 'Cucumber', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 16, protein: 0.7, carbs: 3.1, fat: 0.2, fiber: 0.5 },
  { id: 'b-128', name: 'Corn (canned)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 132, protein: 4, carbs: 30, fat: 1.6, fiber: 3.3 },
  { id: 'b-129', name: 'Green Beans', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 34, protein: 2, carbs: 8, fat: 0.1, fiber: 4 },
  { id: 'b-130', name: 'Mushrooms', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 21, protein: 3, carbs: 3, fat: 0.3, fiber: 1 },
  { id: 'b-131', name: 'Onion', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'medium', calories: 44, protein: 1.2, carbs: 10, fat: 0.1, fiber: 1.9 },
  { id: 'b-132', name: 'Zucchini', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 19, protein: 1.4, carbs: 3.5, fat: 0.2, fiber: 1.2 },
  { id: 'b-133', name: 'Kale (raw)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 33, protein: 2.9, carbs: 6, fat: 0.6, fiber: 1.3 },
  { id: 'b-134', name: 'Cauliflower', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 27, protein: 2, carbs: 5, fat: 0.3, fiber: 2.1 },
  { id: 'b-135', name: 'Asparagus', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 27, protein: 3, carbs: 5, fat: 0.2, fiber: 2.8 },
  { id: 'b-136', name: 'Lettuce (romaine)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 8, protein: 0.6, carbs: 1.5, fat: 0.1, fiber: 1 },
  { id: 'b-137', name: 'Brussels Sprouts', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 56, protein: 4, carbs: 11, fat: 0.8, fiber: 4.1 },
  { id: 'b-138', name: 'Celery', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 14, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6 },
  { id: 'b-139', name: 'Cabbage (raw)', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 22, protein: 1, carbs: 5, fat: 0.1, fiber: 2.2 },
  { id: 'b-140', name: 'Eggplant', brand: null, category: 'Vegetables', servingSize: 1, servingUnit: 'cup', calories: 35, protein: 1, carbs: 9, fat: 0.2, fiber: 2.5 },

  // ─── Legumes ────────────────────────────────────────────────────────────────
  { id: 'b-150', name: 'Black Beans (cooked)', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 227, protein: 15, carbs: 41, fat: 0.9, fiber: 15 },
  { id: 'b-151', name: 'Chickpeas (cooked)', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 269, protein: 15, carbs: 45, fat: 4.2, fiber: 12.5 },
  { id: 'b-152', name: 'Lentils (cooked)', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 230, protein: 18, carbs: 40, fat: 0.8, fiber: 15.6 },
  { id: 'b-153', name: 'Kidney Beans (cooked)', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 225, protein: 15, carbs: 40, fat: 0.9, fiber: 13 },
  { id: 'b-154', name: 'Pinto Beans (cooked)', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 245, protein: 15, carbs: 45, fat: 1.1, fiber: 15.4 },
  { id: 'b-155', name: 'Edamame', brand: null, category: 'Legumes', servingSize: 1, servingUnit: 'cup', calories: 188, protein: 18, carbs: 14, fat: 8, fiber: 8 },
  { id: 'b-156', name: 'Tofu (firm)', brand: null, category: 'Legumes', servingSize: 100, servingUnit: 'g', calories: 144, protein: 17, carbs: 3, fat: 8, fiber: 2 },
  { id: 'b-157', name: 'Hummus', brand: null, category: 'Legumes', servingSize: 2, servingUnit: 'tbsp', calories: 70, protein: 2, carbs: 6, fat: 4.5, fiber: 1.5 },

  // ─── Nuts & Seeds ───────────────────────────────────────────────────────────
  { id: 'b-170', name: 'Almonds', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5 },
  { id: 'b-171', name: 'Peanuts', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 161, protein: 7, carbs: 5, fat: 14, fiber: 2.4 },
  { id: 'b-172', name: 'Walnuts', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 185, protein: 4, carbs: 4, fat: 18, fiber: 1.9 },
  { id: 'b-173', name: 'Cashews', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 157, protein: 5, carbs: 9, fat: 12, fiber: 0.9 },
  { id: 'b-174', name: 'Peanut Butter', brand: null, category: 'Nuts & Seeds', servingSize: 2, servingUnit: 'tbsp', calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 2 },
  { id: 'b-175', name: 'Almond Butter', brand: null, category: 'Nuts & Seeds', servingSize: 2, servingUnit: 'tbsp', calories: 196, protein: 7, carbs: 6, fat: 18, fiber: 3.3 },
  { id: 'b-176', name: 'Chia Seeds', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 138, protein: 5, carbs: 12, fat: 9, fiber: 10 },
  { id: 'b-177', name: 'Flaxseeds (ground)', brand: null, category: 'Nuts & Seeds', servingSize: 2, servingUnit: 'tbsp', calories: 74, protein: 3, carbs: 4, fat: 6, fiber: 4 },
  { id: 'b-178', name: 'Sunflower Seeds', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 165, protein: 6, carbs: 6, fat: 14, fiber: 3 },
  { id: 'b-179', name: 'Pumpkin Seeds', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 151, protein: 7, carbs: 5, fat: 13, fiber: 1.7 },
  { id: 'b-180', name: 'Pecans', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 196, protein: 3, carbs: 4, fat: 20, fiber: 2.7 },
  { id: 'b-181', name: 'Macadamia Nuts', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 204, protein: 2, carbs: 4, fat: 21, fiber: 2.4 },
  { id: 'b-182', name: 'Pistachios', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 159, protein: 6, carbs: 8, fat: 13, fiber: 3 },
  { id: 'b-183', name: 'Trail Mix', brand: null, category: 'Nuts & Seeds', servingSize: 28, servingUnit: 'g', calories: 137, protein: 4, carbs: 13, fat: 9, fiber: 1.5 },

  // ─── Breakfast ──────────────────────────────────────────────────────────────
  { id: 'b-200', name: 'Pancake (plain)', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'pancake', calories: 86, protein: 2.4, carbs: 16, fat: 1.2, fiber: 0.5 },
  { id: 'b-201', name: 'Waffle (frozen)', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'waffle', calories: 98, protein: 2, carbs: 16, fat: 3, fiber: 0.5 },
  { id: 'b-202', name: 'Cereal (Cheerios)', brand: 'General Mills', category: 'Breakfast', servingSize: 1, servingUnit: 'cup', calories: 100, protein: 3, carbs: 20, fat: 2, fiber: 3 },
  { id: 'b-203', name: 'Granola', brand: null, category: 'Breakfast', servingSize: 0.5, servingUnit: 'cup', calories: 210, protein: 5, carbs: 30, fat: 8, fiber: 3 },
  { id: 'b-204', name: 'Maple Syrup', brand: null, category: 'Breakfast', servingSize: 2, servingUnit: 'tbsp', calories: 104, protein: 0, carbs: 27, fat: 0, fiber: 0 },
  { id: 'b-205', name: 'Honey', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'tbsp', calories: 64, protein: 0.1, carbs: 17, fat: 0, fiber: 0 },
  { id: 'b-206', name: 'Overnight Oats', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'cup', calories: 307, protein: 11, carbs: 49, fat: 8, fiber: 5.3 },
  { id: 'b-207', name: 'Breakfast Sausage Patty', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'patty', calories: 100, protein: 5, carbs: 1, fat: 8, fiber: 0 },
  { id: 'b-208', name: 'Hash Browns', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'cup', calories: 177, protein: 2, carbs: 22, fat: 9, fiber: 2 },
  { id: 'b-209', name: 'French Toast', brand: null, category: 'Breakfast', servingSize: 1, servingUnit: 'slice', calories: 149, protein: 5, carbs: 16, fat: 7, fiber: 0.7 },

  // ─── Snacks ─────────────────────────────────────────────────────────────────
  { id: 'b-230', name: 'Protein Bar', brand: null, category: 'Snacks', servingSize: 1, servingUnit: 'bar', calories: 210, protein: 20, carbs: 22, fat: 7, fiber: 3 },
  { id: 'b-231', name: 'Granola Bar', brand: null, category: 'Snacks', servingSize: 1, servingUnit: 'bar', calories: 100, protein: 2, carbs: 18, fat: 3, fiber: 1 },
  { id: 'b-232', name: 'Rice Cake', brand: null, category: 'Snacks', servingSize: 1, servingUnit: 'cake', calories: 35, protein: 0.7, carbs: 7, fat: 0.3, fiber: 0.4 },
  { id: 'b-233', name: 'Pretzels', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 108, protein: 3, carbs: 23, fat: 0.7, fiber: 0.9 },
  { id: 'b-234', name: 'Potato Chips', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 152, protein: 2, carbs: 15, fat: 10, fiber: 1.2 },
  { id: 'b-235', name: 'Tortilla Chips', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 140, protein: 2, carbs: 18, fat: 7, fiber: 1.5 },
  { id: 'b-236', name: 'Popcorn (air-popped)', brand: null, category: 'Snacks', servingSize: 3, servingUnit: 'cups', calories: 93, protein: 3, carbs: 19, fat: 1.1, fiber: 3.6 },
  { id: 'b-237', name: 'Dark Chocolate', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 155, protein: 2, carbs: 17, fat: 9, fiber: 2 },
  { id: 'b-238', name: 'Crackers (saltine)', brand: null, category: 'Snacks', servingSize: 5, servingUnit: 'crackers', calories: 62, protein: 1, carbs: 10, fat: 1.7, fiber: 0.3 },
  { id: 'b-239', name: 'Beef Jerky', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 82, protein: 7, carbs: 6, fat: 3.1, fiber: 0.4 },
  { id: 'b-240', name: 'Apple Sauce', brand: null, category: 'Snacks', servingSize: 1, servingUnit: 'cup', calories: 102, protein: 0.4, carbs: 28, fat: 0.1, fiber: 2.7 },
  { id: 'b-241', name: 'Dried Mango', brand: null, category: 'Snacks', servingSize: 40, servingUnit: 'g', calories: 128, protein: 0.4, carbs: 31, fat: 0.2, fiber: 1.3 },
  { id: 'b-242', name: 'Raisins', brand: null, category: 'Snacks', servingSize: 28, servingUnit: 'g', calories: 85, protein: 0.9, carbs: 22, fat: 0.1, fiber: 1 },

  // ─── Beverages ──────────────────────────────────────────────────────────────
  { id: 'b-260', name: 'Orange Juice', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 112, protein: 2, carbs: 26, fat: 0.5, fiber: 0.5 },
  { id: 'b-261', name: 'Apple Juice', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 114, protein: 0.3, carbs: 28, fat: 0.3, fiber: 0.5 },
  { id: 'b-262', name: 'Coca-Cola', brand: 'Coca-Cola', category: 'Beverages', servingSize: 12, servingUnit: 'oz', calories: 140, protein: 0, carbs: 39, fat: 0, fiber: 0 },
  { id: 'b-263', name: 'Sprite', brand: 'Coca-Cola', category: 'Beverages', servingSize: 12, servingUnit: 'oz', calories: 140, protein: 0, carbs: 38, fat: 0, fiber: 0 },
  { id: 'b-264', name: 'Gatorade', brand: 'Gatorade', category: 'Beverages', servingSize: 12, servingUnit: 'oz', calories: 80, protein: 0, carbs: 21, fat: 0, fiber: 0 },
  { id: 'b-265', name: 'Coffee (black)', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0 },
  { id: 'b-266', name: 'Latte (whole milk)', brand: null, category: 'Beverages', servingSize: 16, servingUnit: 'oz', calories: 190, protein: 10, carbs: 15, fat: 10, fiber: 0 },
  { id: 'b-267', name: 'Almond Milk (unsweetened)', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 30, protein: 1, carbs: 1, fat: 2.5, fiber: 0 },
  { id: 'b-268', name: 'Oat Milk', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 120, protein: 3, carbs: 16, fat: 5, fiber: 2 },
  { id: 'b-269', name: 'Coconut Water', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 46, protein: 2, carbs: 9, fat: 0.5, fiber: 2.6 },
  { id: 'b-270', name: 'Green Tea', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'cup', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'b-271', name: 'Protein Shake (whey)', brand: null, category: 'Beverages', servingSize: 1, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 },
  { id: 'b-272', name: 'Smoothie (mixed berry)', brand: null, category: 'Beverages', servingSize: 16, servingUnit: 'oz', calories: 210, protein: 4, carbs: 45, fat: 2, fiber: 4 },
  { id: 'b-273', name: 'Iced Coffee (sweetened)', brand: null, category: 'Beverages', servingSize: 16, servingUnit: 'oz', calories: 120, protein: 2, carbs: 22, fat: 2.5, fiber: 0 },
  { id: 'b-274', name: 'Beer (regular)', brand: null, category: 'Beverages', servingSize: 12, servingUnit: 'oz', calories: 153, protein: 2, carbs: 13, fat: 0, fiber: 0 },
  { id: 'b-275', name: 'Wine (red)', brand: null, category: 'Beverages', servingSize: 5, servingUnit: 'oz', calories: 125, protein: 0.1, carbs: 4, fat: 0, fiber: 0 },
  { id: 'b-276', name: 'Wine (white)', brand: null, category: 'Beverages', servingSize: 5, servingUnit: 'oz', calories: 121, protein: 0.1, carbs: 4, fat: 0, fiber: 0 },

  // ─── Fast Food ──────────────────────────────────────────────────────────────
  { id: 'b-300', name: 'Cheeseburger', brand: 'McDonald\'s', category: 'Fast Food', servingSize: 1, servingUnit: 'burger', calories: 300, protein: 15, carbs: 33, fat: 12, fiber: 2 },
  { id: 'b-301', name: 'Big Mac', brand: 'McDonald\'s', category: 'Fast Food', servingSize: 1, servingUnit: 'burger', calories: 550, protein: 25, carbs: 45, fat: 30, fiber: 3 },
  { id: 'b-302', name: 'Chicken McNuggets (6 pc)', brand: 'McDonald\'s', category: 'Fast Food', servingSize: 6, servingUnit: 'pieces', calories: 250, protein: 15, carbs: 15, fat: 15, fiber: 1 },
  { id: 'b-303', name: 'French Fries (medium)', brand: 'McDonald\'s', category: 'Fast Food', servingSize: 1, servingUnit: 'serving', calories: 320, protein: 4, carbs: 43, fat: 15, fiber: 4 },
  { id: 'b-304', name: 'Whopper', brand: 'Burger King', category: 'Fast Food', servingSize: 1, servingUnit: 'burger', calories: 657, protein: 28, carbs: 49, fat: 40, fiber: 2 },
  { id: 'b-305', name: 'Chicken Sandwich (spicy)', brand: 'Chick-fil-A', category: 'Fast Food', servingSize: 1, servingUnit: 'sandwich', calories: 455, protein: 29, carbs: 44, fat: 18, fiber: 2 },
  { id: 'b-306', name: 'Chicken Nuggets (8 pc)', brand: 'Chick-fil-A', category: 'Fast Food', servingSize: 8, servingUnit: 'pieces', calories: 250, protein: 27, carbs: 11, fat: 11, fiber: 0 },
  { id: 'b-307', name: 'Burrito Bowl (chicken)', brand: 'Chipotle', category: 'Fast Food', servingSize: 1, servingUnit: 'bowl', calories: 665, protein: 45, carbs: 52, fat: 25, fiber: 12 },
  { id: 'b-308', name: 'Steak Burrito', brand: 'Chipotle', category: 'Fast Food', servingSize: 1, servingUnit: 'burrito', calories: 890, protein: 48, carbs: 95, fat: 30, fiber: 15 },
  { id: 'b-309', name: 'Sub (Turkey & Cheese, 6")', brand: 'Subway', category: 'Fast Food', servingSize: 1, servingUnit: 'sub', calories: 290, protein: 18, carbs: 46, fat: 4, fiber: 4 },
  { id: 'b-310', name: 'Sub (Italian BMT, 6")', brand: 'Subway', category: 'Fast Food', servingSize: 1, servingUnit: 'sub', calories: 410, protein: 20, carbs: 46, fat: 16, fiber: 4 },
  { id: 'b-311', name: 'Pepperoni Pizza (1 slice)', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'slice', calories: 298, protein: 13, carbs: 34, fat: 12, fiber: 2.3 },
  { id: 'b-312', name: 'Cheese Pizza (1 slice)', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'slice', calories: 272, protein: 12, carbs: 34, fat: 10, fiber: 2 },
  { id: 'b-313', name: 'Taco (beef, hard shell)', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'taco', calories: 156, protein: 9, carbs: 14, fat: 7, fiber: 1.5 },
  { id: 'b-314', name: 'Hot Dog', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'hot dog', calories: 290, protein: 10, carbs: 24, fat: 17, fiber: 1 },
  { id: 'b-315', name: 'Fried Chicken (breast)', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'piece', calories: 320, protein: 33, carbs: 12, fat: 15, fiber: 0 },
  { id: 'b-316', name: 'Quesadilla (chicken)', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'quesadilla', calories: 530, protein: 30, carbs: 40, fat: 27, fiber: 2 },
  { id: 'b-317', name: 'Fish & Chips', brand: null, category: 'Fast Food', servingSize: 1, servingUnit: 'serving', calories: 585, protein: 22, carbs: 48, fat: 34, fiber: 3 },
  { id: 'b-318', name: 'Crunchwrap Supreme', brand: 'Taco Bell', category: 'Fast Food', servingSize: 1, servingUnit: 'wrap', calories: 530, protein: 16, carbs: 71, fat: 21, fiber: 4 },

  // ─── Condiments & Sauces ────────────────────────────────────────────────────
  { id: 'b-340', name: 'Ketchup', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 20, protein: 0, carbs: 5, fat: 0, fiber: 0 },
  { id: 'b-341', name: 'Mustard', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tsp', calories: 3, protein: 0.2, carbs: 0.3, fat: 0.2, fiber: 0.2 },
  { id: 'b-342', name: 'Mayonnaise', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 94, protein: 0.1, carbs: 0, fat: 10, fiber: 0 },
  { id: 'b-343', name: 'Ranch Dressing', brand: null, category: 'Condiments', servingSize: 2, servingUnit: 'tbsp', calories: 129, protein: 0.4, carbs: 2, fat: 13, fiber: 0 },
  { id: 'b-344', name: 'Soy Sauce', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 9, protein: 1, carbs: 1, fat: 0, fiber: 0 },
  { id: 'b-345', name: 'Hot Sauce', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tsp', calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'b-346', name: 'Olive Oil', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 119, protein: 0, carbs: 0, fat: 14, fiber: 0 },
  { id: 'b-347', name: 'Salsa', brand: null, category: 'Condiments', servingSize: 2, servingUnit: 'tbsp', calories: 10, protein: 0, carbs: 2, fat: 0, fiber: 0.5 },
  { id: 'b-348', name: 'BBQ Sauce', brand: null, category: 'Condiments', servingSize: 2, servingUnit: 'tbsp', calories: 52, protein: 0.2, carbs: 13, fat: 0.2, fiber: 0.2 },
  { id: 'b-349', name: 'Guacamole', brand: null, category: 'Condiments', servingSize: 2, servingUnit: 'tbsp', calories: 50, protein: 0.6, carbs: 3, fat: 4.5, fiber: 2 },
  { id: 'b-350', name: 'Italian Dressing', brand: null, category: 'Condiments', servingSize: 2, servingUnit: 'tbsp', calories: 86, protein: 0.1, carbs: 3, fat: 8.3, fiber: 0 },
  { id: 'b-351', name: 'Balsamic Vinegar', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 14, protein: 0.1, carbs: 2.7, fat: 0, fiber: 0 },
  { id: 'b-352', name: 'Sriracha', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tsp', calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0 },
  { id: 'b-353', name: 'Teriyaki Sauce', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 16, protein: 1, carbs: 3, fat: 0, fiber: 0 },
  { id: 'b-354', name: 'Coconut Oil', brand: null, category: 'Condiments', servingSize: 1, servingUnit: 'tbsp', calories: 121, protein: 0, carbs: 0, fat: 14, fiber: 0 },
  { id: 'b-355', name: 'Marinara Sauce', brand: null, category: 'Condiments', servingSize: 0.5, servingUnit: 'cup', calories: 66, protein: 2, carbs: 10, fat: 2, fiber: 2 },
  { id: 'b-356', name: 'Alfredo Sauce', brand: null, category: 'Condiments', servingSize: 0.25, servingUnit: 'cup', calories: 110, protein: 2, carbs: 3, fat: 10, fiber: 0 },

  // ─── Prepared Meals & Common Dishes ─────────────────────────────────────────
  { id: 'b-380', name: 'Grilled Chicken Salad', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'bowl', calories: 350, protein: 35, carbs: 15, fat: 16, fiber: 5 },
  { id: 'b-381', name: 'Caesar Salad (no chicken)', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'bowl', calories: 200, protein: 5, carbs: 10, fat: 16, fiber: 2 },
  { id: 'b-382', name: 'Chicken Stir Fry', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 186, protein: 19, carbs: 10, fat: 8, fiber: 2 },
  { id: 'b-383', name: 'Spaghetti with Meat Sauce', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 329, protein: 15, carbs: 44, fat: 11, fiber: 4 },
  { id: 'b-384', name: 'Chicken Fried Rice', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 238, protein: 12, carbs: 32, fat: 7, fiber: 1.3 },
  { id: 'b-385', name: 'Mac and Cheese', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 310, protein: 12, carbs: 31, fat: 15, fiber: 1 },
  { id: 'b-386', name: 'Beef Chili', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 264, protein: 20, carbs: 23, fat: 10, fiber: 6 },
  { id: 'b-387', name: 'Chicken Soup', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 75, protein: 6, carbs: 9, fat: 2.5, fiber: 1 },
  { id: 'b-388', name: 'Clam Chowder', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 200, protein: 8, carbs: 20, fat: 10, fiber: 1 },
  { id: 'b-389', name: 'Mashed Potatoes', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 237, protein: 4, carbs: 35, fat: 9, fiber: 3 },
  { id: 'b-390', name: 'Coleslaw', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 175, protein: 1.5, carbs: 15, fat: 13, fiber: 2 },
  { id: 'b-391', name: 'Fried Rice', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 238, protein: 6, carbs: 38, fat: 7, fiber: 1 },
  { id: 'b-392', name: 'Pad Thai', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 357, protein: 14, carbs: 42, fat: 15, fiber: 3 },
  { id: 'b-393', name: 'Chicken Tikka Masala', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 300, protein: 22, carbs: 12, fat: 18, fiber: 2 },
  { id: 'b-394', name: 'Ramen (instant, cooked)', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'packet', calories: 380, protein: 10, carbs: 52, fat: 14, fiber: 2 },
  { id: 'b-395', name: 'Beef Stew', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'cup', calories: 220, protein: 16, carbs: 20, fat: 8, fiber: 3 },
  { id: 'b-396', name: 'Sushi Roll (California)', brand: null, category: 'Prepared', servingSize: 8, servingUnit: 'pieces', calories: 255, protein: 9, carbs: 38, fat: 7, fiber: 2.8 },
  { id: 'b-397', name: 'Egg Salad', brand: null, category: 'Prepared', servingSize: 0.5, servingUnit: 'cup', calories: 265, protein: 11, carbs: 2, fat: 24, fiber: 0 },
  { id: 'b-398', name: 'Tuna Salad', brand: null, category: 'Prepared', servingSize: 0.5, servingUnit: 'cup', calories: 192, protein: 16, carbs: 10, fat: 10, fiber: 0 },
  { id: 'b-399', name: 'Chicken Parmesan', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'piece', calories: 430, protein: 36, carbs: 22, fat: 22, fiber: 2 },
  { id: 'b-400', name: 'Grilled Cheese Sandwich', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'sandwich', calories: 366, protein: 14, carbs: 28, fat: 22, fiber: 1 },
  { id: 'b-401', name: 'BLT Sandwich', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'sandwich', calories: 344, protein: 12, carbs: 29, fat: 20, fiber: 2 },
  { id: 'b-402', name: 'PB&J Sandwich', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'sandwich', calories: 376, protein: 13, carbs: 50, fat: 15, fiber: 3 },
  { id: 'b-403', name: 'Turkey Club Sandwich', brand: null, category: 'Prepared', servingSize: 1, servingUnit: 'sandwich', calories: 430, protein: 28, carbs: 34, fat: 20, fiber: 2 },

  // ─── Supplements ────────────────────────────────────────────────────────────
  { id: 'b-420', name: 'Whey Protein Isolate', brand: null, category: 'Supplements', servingSize: 1, servingUnit: 'scoop', calories: 110, protein: 25, carbs: 1, fat: 0.5, fiber: 0 },
  { id: 'b-421', name: 'Casein Protein', brand: null, category: 'Supplements', servingSize: 1, servingUnit: 'scoop', calories: 120, protein: 24, carbs: 3, fat: 1, fiber: 0 },
  { id: 'b-422', name: 'Mass Gainer', brand: null, category: 'Supplements', servingSize: 1, servingUnit: 'scoop', calories: 650, protein: 32, carbs: 110, fat: 8, fiber: 3 },
  { id: 'b-423', name: 'Creatine Monohydrate', brand: null, category: 'Supplements', servingSize: 5, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'b-424', name: 'BCAA Powder', brand: null, category: 'Supplements', servingSize: 1, servingUnit: 'scoop', calories: 10, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  { id: 'b-425', name: 'Plant Protein Powder', brand: null, category: 'Supplements', servingSize: 1, servingUnit: 'scoop', calories: 120, protein: 21, carbs: 6, fat: 2, fiber: 2 },
  { id: 'b-426', name: 'Collagen Peptides', brand: null, category: 'Supplements', servingSize: 2, servingUnit: 'scoops', calories: 70, protein: 18, carbs: 0, fat: 0, fiber: 0 },

  // ─── Desserts & Sweets ──────────────────────────────────────────────────────
  { id: 'b-440', name: 'Ice Cream (vanilla)', brand: null, category: 'Desserts', servingSize: 0.5, servingUnit: 'cup', calories: 137, protein: 2, carbs: 16, fat: 7, fiber: 0.5 },
  { id: 'b-441', name: 'Brownie', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'piece', calories: 227, protein: 3, carbs: 36, fat: 9, fiber: 1 },
  { id: 'b-442', name: 'Chocolate Chip Cookie', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'cookie', calories: 78, protein: 1, carbs: 10, fat: 4, fiber: 0.3 },
  { id: 'b-443', name: 'Donut (glazed)', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'donut', calories: 269, protein: 4, carbs: 31, fat: 14, fiber: 1 },
  { id: 'b-444', name: 'Cheesecake (1 slice)', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'slice', calories: 401, protein: 7, carbs: 31, fat: 28, fiber: 0.3 },
  { id: 'b-445', name: 'Muffin (blueberry)', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'muffin', calories: 265, protein: 4, carbs: 37, fat: 11, fiber: 1 },
  { id: 'b-446', name: 'Frozen Yogurt', brand: null, category: 'Desserts', servingSize: 0.5, servingUnit: 'cup', calories: 114, protein: 3, carbs: 22, fat: 2, fiber: 0 },
  { id: 'b-447', name: 'Halo Top Ice Cream', brand: 'Halo Top', category: 'Desserts', servingSize: 0.5, servingUnit: 'cup', calories: 70, protein: 5, carbs: 14, fat: 2, fiber: 3 },
  { id: 'b-448', name: 'Chocolate Cake', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'slice', calories: 352, protein: 5, carbs: 51, fat: 15, fiber: 2 },
  { id: 'b-449', name: 'Apple Pie', brand: null, category: 'Desserts', servingSize: 1, servingUnit: 'slice', calories: 296, protein: 2, carbs: 43, fat: 14, fiber: 2 },
]

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Search the bundled food database by name or brand.
 * Case-insensitive substring match.
 *
 * @param query - Search string
 * @param limit - Max results (default 25)
 * @returns Matching FoodItem array
 */
export function searchFoods(query: string, limit = 25): FoodItem[] {
  if (!query.trim()) return []

  const lower = query.toLowerCase()
  const results: FoodItem[] = []

  for (const food of FOOD_DATABASE) {
    if (results.length >= limit) break
    const nameMatch = food.name.toLowerCase().includes(lower)
    const brandMatch = food.brand?.toLowerCase().includes(lower) ?? false
    const categoryMatch = food.category.toLowerCase().includes(lower)
    if (nameMatch || brandMatch || categoryMatch) {
      results.push(food)
    }
  }

  return results
}

/**
 * Get all unique food categories in the database.
 * @returns Sorted array of category strings
 */
export function getFoodCategories(): string[] {
  const categories = new Set(FOOD_DATABASE.map((f) => f.category))
  return Array.from(categories).sort()
}

/**
 * Get foods by category.
 * @param category - Category string
 * @returns FoodItem array for that category
 */
export function getFoodsByCategory(category: string): FoodItem[] {
  return FOOD_DATABASE.filter((f) => f.category === category)
}

/**
 * Get a food item by its bundled ID.
 * @param id - Bundled food ID (e.g., 'b-001')
 * @returns FoodItem or undefined
 */
export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id)
}
