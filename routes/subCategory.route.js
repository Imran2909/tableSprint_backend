const express = require("express");
const subCategoryRouter = express.Router();
const subCategoryModel = require("../models/subCategory.model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Multer setup for handling image uploads (not used directly here)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

// Add a new subcategory
subCategoryRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { subcategoryName, categoryName, sequence, image } = req.body;

    // Check if all required fields are provided
    if (!subcategoryName || !categoryName || !sequence || !image) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a directory to store the Base64 images as text files
    const imageTextDir = path.join(__dirname, "../ImageText");
    fs.mkdirSync(imageTextDir, { recursive: true });
    const id = Math.floor(Math.random() * 9000) + 1000;
    const filePath = path.join(imageTextDir, `${id}.txt`);

    // Save the image data as a text file
    fs.writeFileSync(filePath, image, "utf8");

    // Prepare subcategory data for insertion
    const subCategoryData = {
      subcategoryName,
      categoryName,
      sequence,
      image: `ImageText/${id}.txt`, // Save image file path
      id,
    };

    // Insert the new subcategory into the database
    const result = await subCategoryModel.create(subCategoryData);
    const newSubCategory = await subCategoryModel.findById(result.insertId);
    res.status(201).json(newSubCategory); // Return the newly created subcategory
  } catch (error) {
    // Handle server errors
    console.error("Error saving subcategory:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update an existing subcategory
subCategoryRouter.put("/:id", async (req, res) => {
  try {
    const { subcategoryName, categoryName, sequence, status, image } = req.body;
    const subCategoryId = req.params.id;

    // Check if all required fields are provided
    if (!subcategoryName || !categoryName || !sequence || !status) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Prepare the updated subcategory data
    const updatedSubCategoryData = {
      subcategoryName,
      categoryName,
      sequence,
      status,
      imageBase64: image, // Ensure image is saved properly
    };

    // Update the subcategory in the database
    const result = await subCategoryModel.update(subCategoryId, updatedSubCategoryData);

    // If no subcategory was updated, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    // Fetch and return the updated subcategory
    const updatedSubCategory = await subCategoryModel.findById(subCategoryId);
    res.status(200).json(updatedSubCategory);
  } catch (error) {
    // Handle server errors
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get all subcategories
subCategoryRouter.get("/", async (req, res) => {
  try {
    // Fetch all subcategories from the database
    const subCategories = await subCategoryModel.getAll();

    // Map through subcategories and decode Base64 image data
    const subCategoriesWithImages = subCategories.map((subCategory) => {
      const filePath = path.join(__dirname, "..", subCategory.image);
      const imageBase64 = fs.readFileSync(filePath, "utf8");

      return {
        ...subCategory,
        image: imageBase64,
      };
    });

    res.json(subCategoriesWithImages); // Return the subcategories with images
  } catch (error) {
    // Handle server errors
    console.error("Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a subcategory by ID
subCategoryRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the ID is provided
    if (!id) {
      return res.status(400).json({ message: "Subcategory ID is required." });
    }

    // Delete the subcategory from the database
    const result = await subCategoryModel.delete(id);

    // If no subcategory was deleted, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subcategory not found." });
    }

    res.status(200).json({ message: "Subcategory deleted successfully." }); // Return success message
  } catch (error) {
    // Handle server errors
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = subCategoryRouter;
