const { connection } = require("../db");
const fs = require("fs");
const path = require("path");

// Directory to store image text files for subcategories
const IMAGE_TEXT_DIR = path.join(__dirname, "../ImageText");

// Ensure the directory exists
if (!fs.existsSync(IMAGE_TEXT_DIR)) {
  fs.mkdirSync(IMAGE_TEXT_DIR);
}

const subCategoryModel = {
  // Save Base64 string as a text file and return the stored file path
  saveImageAsTextFile: (id, base64String) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    fs.writeFileSync(filePath, base64String, "utf8");
    return `/ImageText/${id}.txt`;
  },

  // Read Base64 string from a stored text file
  readImageFromTextFile: (id) => {
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  },

  // Create a new subcategory
  create: async (subCategory) => {
    const query = `
      INSERT INTO subcategories 
      (subcategoryName, categoryName, image, sequence, status, id) 
      VALUES (?, ?, ?, ?, 'Active', ?)
    `;

    const [result] = await connection.execute(query, [
      subCategory.subcategoryName,
      subCategory.categoryName,
      subCategory.image,
      subCategory.sequence,
      subCategory.id,
    ]);

    // Store the image as a text file if provided
    if (subCategory.imageBase64) {
      subCategoryModel.saveImageAsTextFile(result.insertId, subCategory.imageBase64);
    }

    return result;
  },

  // Get all subcategories from the database
  getAll: async () => {
    const query = `SELECT * FROM subcategories`;
    const [rows] = await connection.execute(query);

    // Attach Base64 images from files to the response
    return rows.map((row) => ({
      ...row,
      imageBase64: subCategoryModel.readImageFromTextFile(row.id),
    }));
  },

  // Update a subcategory by ID
  update: async (id, subCategory) => {
    const query = `
      UPDATE subcategories 
      SET subcategoryName = ?, categoryName = ?, image = ?, sequence = ?, status = ?
      WHERE id = ?
    `;

    let filePath = subCategory.image;

    // Store the updated image if a new Base64 string is provided
    if (subCategory.imageBase64) {
      filePath = subCategoryModel.saveImageAsTextFile(id, subCategory.imageBase64);
    }

    const [result] = await connection.execute(query, [
      subCategory.subcategoryName,
      subCategory.categoryName,
      filePath,
      subCategory.sequence,
      subCategory.status,
      id,
    ]);

    return result;
  },

  // Delete a subcategory by ID
  delete: async (id) => {
    const query = `DELETE FROM subcategories WHERE id = ?`;
    const [result] = await connection.execute(query, [id]);

    // Remove associated image file if it exists
    const filePath = path.join(IMAGE_TEXT_DIR, `${id}.txt`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  },

  // Find a subcategory by ID
  findById: async (id) => {
    const query = `SELECT * FROM subcategories WHERE id = ?`;
    const [rows] = await connection.execute(query, [id]);

    if (rows.length > 0) {
      return {
        ...rows[0],
        imageBase64: subCategoryModel.readImageFromTextFile(rows[0].id),
      };
    }

    return null;
  },
};

module.exports = subCategoryModel;
