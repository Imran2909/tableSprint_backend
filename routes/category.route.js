const express = require("express");
const categoryRouter = express.Router();
const categoryModel = require("../models/category.model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for Base64 conversion
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Add a new category
categoryRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { categoryName, sequence, image } = req.body;

    // Validate if all fields are provided
    if (!categoryName || !sequence || !image) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a directory for storing the Base64 images as text files
    const imageTextDir = path.join(__dirname, "../ImageText");
    fs.mkdirSync(imageTextDir, { recursive: true });

    // Generate a unique ID for the new category
    let id = Math.floor(Math.random() * 9000) + 1000;
    const filePath = path.join(imageTextDir, `${id}.txt`);

    // Save the Base64 image string to a text file
    fs.writeFileSync(filePath, image, "utf8");

    // Prepare the category data for insertion
    const categoryData = {
      categoryName,
      sequence,
      image: `ImageText/${id}.txt`, // Save image as Base64 text file path
      id,
    };

    // Insert the new category into the database
    const result = await categoryModel.create(categoryData);
    const newCategory = await categoryModel.findById(result.insertId);
    res.status(201).json(newCategory); // Return the newly created category
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Update a category
categoryRouter.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { categoryName, sequence, image, status } = req.body;
    const categoryId = req.params.id;

    // Validate required fields
    if (!categoryName || !sequence || !status) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    // Prepare the updated category data
    const updatedCategoryData = {
      categoryName,
      sequence,
      status,
      imageBase64: image, // Base64 string for image
    };

    // Update the category in the database
    const result = await categoryModel.update(categoryId, updatedCategoryData);

    // If no category was updated, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Fetch and return the updated category
    const updatedCategory = await categoryModel.findById(categoryId);
    res.status(200).json(updatedCategory);
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
categoryRouter.get("/", async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await categoryModel.getAll();

    // Map through categories and read the Base64 images from the files
    const categoriesWithImages = categories.map((category) => {
      const filePath = path.join(__dirname, "..", category.image);
      const imageBase64 = fs.readFileSync(filePath, "utf8");
      return {
        ...category,
        image: imageBase64, // Add the Base64 image string to the category object
      };
    });

    res.json(categoriesWithImages); // Return the categories with images
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

// Delete a category by ID
categoryRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if category ID is provided
    if (!id) {
      return res.status(400).json({ message: "Category ID is required." });
    }

    // Delete the category from the database
    const result = await categoryModel.delete(id);

    // If no category was deleted, return a 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Category not found." });
    }

    res.status(200).json({ message: "Category deleted successfully." }); // Return success message
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: error.message });
  }
});

module.exports = categoryRouter;
