import { AppDataSource } from "../config/data-source";
import { Category, CategoryType } from "../entities/Category";
import { TreeRepository } from "typeorm";

export class CategoryService {
  private static getRepository(): TreeRepository<Category> {
    return AppDataSource.getTreeRepository(Category);
  }

  static async getTree(type?: CategoryType): Promise<Category[]> {
    try {
      const repository = this.getRepository();
      
      // Get all categories with relations
      const allCategories = await repository.find({
        where: type ? { type } : undefined,
        relations: ["parent"],
        order: { order: "ASC", name: "ASC" },
      });

      // Build tree structure manually
      const categoryMap = new Map<number, Category & { children: Category[] }>();
      const roots: Category[] = [];

      // First pass: create map with empty children arrays
      allCategories.forEach((cat) => {
        categoryMap.set(cat.id, {
          ...cat,
          children: [],
        });
      });

      // Second pass: build tree structure
      allCategories.forEach((cat) => {
        const category = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          parent.children.push(category);
        } else {
          roots.push(category);
        }
      });

      return roots;
    } catch (error) {
      console.error("Error in CategoryService.getTree:", error);
      throw error;
    }
  }

  static async getChildren(id: number): Promise<Category> {
    const repository = this.getRepository();
    const parent = await repository.findOne({ where: { id } });
    if (!parent) {
      throw new Error("Category not found");
    }
    return repository.findDescendantsTree(parent);
  }

  static async moveCategory(id: number, newParentId: number | null): Promise<Category> {
    const repository = this.getRepository();
    const category = await repository.findOne({ where: { id } });
    if (!category) {
      throw new Error("Category not found");
    }

    if (newParentId) {
      const newParent = await repository.findOne({ where: { id: newParentId } });
      if (!newParent) {
        throw new Error("Parent category not found");
      }
      category.parent = newParent;
    } else {
      category.parent = undefined;
    }

    return repository.save(category);
  }
}

