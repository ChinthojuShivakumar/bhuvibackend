// src/services/propertyService.js
const { Property } = require('../models');

exports.createProperty = async (propertyData, imagePaths, documentPaths) => {
  try {
    const property = await Property.create({
      ...propertyData,
      images: imagePaths,
      documents: documentPaths,
    });
    return property;
  } catch (error) {
    throw new Error('Failed to create property');
  }
};