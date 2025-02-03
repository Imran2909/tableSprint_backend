const { connection } = require("../db");
const fs = require("fs");
const path = require("path");

// Directory to store image text files
const IMAGE_TEXT_DIR = path.join(__dirname, "../ImageText");

// Ensure the directory exists
if (!fs.existsSync(IMAGE_TEXT_DIR)) {
  fs.mkdirSync(IMAGE_TEXT_DIR);
}

const categoryModel = {
  // Saves a Base64 string as a text file and returns the file path
  saveImageAsTextFile: (id, base64String) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    fs.writeFileSync(filePath, base64String, "utf8");
    return `/ImageText/${id}.txt`;
  },

  // Reads a Base64 string from a text file
  readImageFromTextFile: (id) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  },

  // Creates a new category entry in the database
  create: async (category) => {
    const query = `INSERT INTO categories (categoryName, image, sequence, status, id) VALUES (?, ?, ?, 'Active', ?)`;
    const [result] = await connection.execute(query, [
      category.categoryName,
      category.image, // Image file path
      category.sequence,
      category.id
    ]);

    // Save image as a text file if provided
    if (category.imageBase64) {
      categoryModel.saveImageAsTextFile(result.insertId, category.imageBase64);
    }

    return result;
  },

  // Retrieves all categories from the database
  getAll: async () => {
    const query = `SELECT * FROM categories`;
    const [rows] = await connection.execute(query);
    
    // Attach Base64 image data to each category
    return rows.map((row) => ({
      ...row,
      imageBase64: categoryModel.readImageFromTextFile(row.id),
    }));
  },

  // Updates an existing category by ID
  update: async (id, category) => {
    const query = `UPDATE categories SET categoryName = ?, image = ?, sequence = ?, status = ? WHERE id = ?`;
    let filePath = category.image;

    // Update image file if a new Base64 image is provided
    if (category.imageBase64) {
      filePath = categoryModel.saveImageAsTextFile(id, category.imageBase64);
    }

    const [result] = await connection.execute(query, [
      category.categoryName,
      filePath, // Updated image file path
      category.sequence,
      category.status,
      id,
    ]);

    return result;
  },

  // Deletes a category and its associated image file
  delete: async (id) => {
    const query = `DELETE FROM categories WHERE id = ?`;
    const [result] = await connection.execute(query, [id]);

    // Remove the corresponding image file if it exists
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  },

  // Finds a category by ID
  findById: async (id) => {
    const query = `SELECT * FROM categories WHERE id = ?`;
    const [rows] = await connection.execute(query, [id]);

    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        imageBase64: categoryModel.readImageFromTextFile(row.id), // Include Base64 image data
      };
    }

    return null;
  },
};

module.exports = categoryModel;
