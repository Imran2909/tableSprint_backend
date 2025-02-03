const { connection } = require("../db");
const fs = require("fs");
const path = require("path");

// Directory to store image text files for products
const IMAGE_TEXT_DIR = path.join(__dirname, "../ProductImages");

// Ensure the directory exists
if (!fs.existsSync(IMAGE_TEXT_DIR)) {
  fs.mkdirSync(IMAGE_TEXT_DIR);
}

const productModel = {
  // Save Base64 string as a text file and return the stored file path
  saveImageAsTextFile: (id, base64String) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    fs.writeFileSync(filePath, base64String, "utf8");
    return `/ProductImages/${id}.txt`;
  },

  // Read Base64 string from a stored text file
  readImageFromTextFile: (id) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  },

  // Create a new product entry in the database
  create: async (product) => {
    const query = `
      INSERT INTO products 
      (productName, categoryName, subcategoryName, image, status, id)
      VALUES (?, ?, ?, ?, 'Active', ?)
    `;

    const [result] = await connection.execute(query, [
      product.productName,
      product.categoryName,
      product.subcategoryName,
      product.image,
      product.id,
    ]);

    // If there's a Base64 image, store it separately
    if (product.imageBase64) {
      productModel.saveImageAsTextFile(result.insertId, product.imageBase64);
    }

    return result;
  },

  // Retrieve all products from the database
  getAll: async () => {
    const query = `SELECT * FROM products`;
    const [rows] = await connection.execute(query);

    // Attach Base64 images from files to the response
    return rows.map((row) => ({
      ...row,
      imageBase64: productModel.readImageFromTextFile(row.id),
    }));
  },

  // Update a product by ID
  update: async (id, updatedProductData) => {
    const query = `
      UPDATE products
      SET productName = ?, categoryName = ?, subcategoryName = ?, status = ?, image = ?
      WHERE id = ?
    `;

    let filePath = updatedProductData.image;

    // Store new Base64 image if provided
    if (updatedProductData.imageBase64) {
      filePath = productModel.saveImageAsTextFile(id, updatedProductData.imageBase64);
    }

    const values = [
      updatedProductData.productName,
      updatedProductData.categoryName,
      updatedProductData.subcategoryName,
      updatedProductData.status,
      filePath,
      id,
    ];

    const [result] = await connection.execute(query, values);
    return result;
  },

  // Delete a product by ID
  delete: async (id) => {
    const query = `DELETE FROM products WHERE id = ?`;
    const [result] = await connection.execute(query, [id]);

    // Remove associated image file if it exists
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  },

  // Find a product by ID
  findById: async (id) => {
    const query = `SELECT * FROM products WHERE id = ?`;
    const [rows] = await connection.execute(query, [id]);

    if (rows.length > 0) {
      return {
        ...rows[0],
        imageBase64: productModel.readImageFromTextFile(rows[0].id),
      };
    }

    return null;
  },
};

module.exports = productModel;
