import { AppDataSource } from "../config/data-source";
import { Role } from "../entities/Role";
import { User } from "../entities/User";
import { Category, CategoryType } from "../entities/Category";
import { Tag } from "../entities/Tag";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");

    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);
    const categoryRepository = AppDataSource.getTreeRepository(Category);
    const tagRepository = AppDataSource.getRepository(Tag);

    // Create Roles
    console.log("Creating roles...");
    let adminRole = await roleRepository.findOne({ where: { name: "admin" } });
    if (!adminRole) {
      adminRole = roleRepository.create({
        name: "admin",
        description: "Administrator with full access",
        permissions: JSON.stringify({
          articles: [
            "create",
            "read",
            "update",
            "delete",
            "approve",
            "reject",
            "publish",
          ],
          users: ["create", "read", "update", "delete"],
          categories: ["create", "read", "update", "delete"],
          tags: ["create", "read", "update", "delete"],
        }),
      });
      await roleRepository.save(adminRole);
      console.log("Admin role created");
    }

    let userRole = await roleRepository.findOne({ where: { name: "user" } });
    if (!userRole) {
      userRole = roleRepository.create({
        name: "user",
        description: "Regular user with limited access",
        permissions: JSON.stringify({
          articles: ["create", "read", "update", "submit"],
        }),
      });
      await roleRepository.save(userRole);
      console.log("User role created");
    }

    // Create Admin User
    console.log("Creating admin user...");
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminEmail = process.env.ADMIN_EMAIL || "admin@vietsov.com";

    let adminUser = await userRepository.findOne({
      where: { username: adminUsername },
    });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = userRepository.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        fullName: "Administrator",
        roleId: adminRole.id,
        isActive: true,
      });
      await userRepository.save(adminUser);
      console.log(`Admin user created: ${adminUsername} / ${adminPassword}`);
    }

    // Create Sample Categories
    console.log("Creating sample categories...");
    const categories = [
      { name: "Tin tức", slug: "tin-tuc", type: CategoryType.NEWS_TYPE },
      { name: "Sự kiện", slug: "su-kien", type: CategoryType.EVENT },
      { name: "Thông báo", slug: "thong-bao", type: CategoryType.NEWS_TYPE },
    ];

    for (const catData of categories) {
      let category = await categoryRepository.findOne({
        where: { slug: catData.slug },
      });
      if (!category) {
        // Use raw query to insert category and closure table entry
        const result = await AppDataSource.query(
          `INSERT INTO categories (name, slug, type, isActive, [order], createdAt, updatedAt)
           OUTPUT INSERTED.id
           VALUES (@0, @1, @2, 1, 0, GETDATE(), GETDATE())`,
          [catData.name, catData.slug, catData.type]
        );
        
        const categoryId = result[0].id;
        
        // Insert self-reference into closure table
        await AppDataSource.query(
          `INSERT INTO categories_closure (id_ancestor, id_descendant) VALUES (@0, @0)`,
          [categoryId]
        );
        
        console.log(`Category created: ${catData.name}`);
      }
    }

    // Create Sample Tags
    console.log("Creating sample tags...");
    const tags = [
      { name: "Việt Nam", slug: "viet-nam" },
      { name: "Nga", slug: "nga" },
      { name: "Hợp tác", slug: "hop-tac" },
      { name: "Kinh tế", slug: "kinh-te" },
    ];

    for (const tagData of tags) {
      let tag = await tagRepository.findOne({ where: { slug: tagData.slug } });
      if (!tag) {
        tag = tagRepository.create(tagData);
        await tagRepository.save(tag);
        console.log(`Tag created: ${tagData.name}`);
      }
    }

    console.log("Seeding completed successfully!");
    await AppDataSource.destroy();
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
