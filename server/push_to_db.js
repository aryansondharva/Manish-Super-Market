import 'dotenv/config';
import fs from 'fs';
import connectDB from './configs/db.js';
import Product from './models/Product.js';
import Category from './models/Category.js';

async function pushToDatabase() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await connectDB();
    console.log('Database connected successfully!');

    // Read full categories
    const categoriesData = JSON.parse(fs.readFileSync('data/fullCategories.json', 'utf8'));
    console.log(`Preparing to update ${categoriesData.length} categories...`);

    // Upsert categories
    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { path: cat.path },
        {
          name: cat.name,
          text: cat.text,
          path: cat.path,
          image: cat.image,
          bgColor: cat.bgColor,
          description: cat.description
        },
        { upsert: true, new: true }
      );
    }
    const totalCategories = await Category.countDocuments();
    console.log(`Categories updated! Total categories in DB: ${totalCategories}`);

    // Read 229 products
    const productsData = JSON.parse(fs.readFileSync('data/products229.json', 'utf8'));
    console.log(`Preparing to push ${productsData.length} products to database...`);

    // Remove existing seed products if any, then insert all 229 products
    await Product.deleteMany({});
    console.log('Cleared old products.');

    const insertResult = await Product.insertMany(productsData);
    console.log(`Successfully inserted ${insertResult.length} products into MongoDB!`);

    const verifiedCount = await Product.countDocuments();
    console.log(`Verification: Total products now in database = ${verifiedCount}`);

    // Log sample verification
    const sample = await Product.findOne({ name: /Bubbly/i });
    console.log('Verification sample product:', {
      id: sample._id,
      name: sample.name,
      category: sample.category,
      price: sample.price,
      offerPrice: sample.offerPrice,
      imagesCount: sample.image.length
    });

    console.log('DATABASE PUSH COMPLETE!');
    process.exit(0);
  } catch (error) {
    console.error('Error pushing to database:', error);
    process.exit(1);
  }
}

pushToDatabase();
