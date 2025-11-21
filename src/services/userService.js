//  src/services/userService.js
const { User } = require('../models');

const getUserById = async (user_id) => {
  try {
    // Retrieve the user from the database by user ID
    const user = await User.findOne({ where: { user_id } });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    // Handle the error appropriately (e.g., logging, error handling)
    console.error(error)
    throw new Error('Failed to retrieve user');
  }
};

module.exports = {
  getUserById,
};