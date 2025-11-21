// src/controllers/userProfileController.js
const db = require('../models');
const { getUserById } = require('../services/userService');
const { handleUploadedFiles } = require('../utils/utils');

// // Save or update the user profile
// exports.addUserProfile = async (req, res) => {
//   try {
//     let { user_id } = req.user;
//     const userProfileData = req.body;
    
//     await db.UserProfile.create({ user_id, ...userProfileData });

//     res.status(200).json({ message: 'User profile created successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to save user profile' });
//   }
// };

// Save or update the user profile
exports.editUserProfile = async (req, res) => {
  try {
    const reqUser = req.user;
    let { user_id } = req.params;
    user_id = parseInt(user_id);

    // reqUser.user_id is number and user_id from params is string
    if (!(reqUser.user_id === user_id || reqUser.is_superadmin || reqUser.is_admin)) {
        throw Error ("You do not have access to update this User profile.")
    }

    const user = await getUserById(user_id);

    const userProfileData = { 
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile: user.mobile,
        ...req.body
    };

    let userProfile = await db.UserProfile.findOne({ where: { user_id } });

    if (!userProfile) {
         userProfile = await db.UserProfile.create({ user_id, ...userProfileData });
    } else {
        await userProfile.update(userProfileData);
    }

    const images = req.files && req.files['images'] ? req.files['images'] : [];

    if (images?.length) {
      await handleUploadedFiles(images, 'profile_image', user_id, userProfile);
      await userProfile.save();
    }

    // Use the upsert method to save or update the user profile
    // await db.UserProfile.update({ user_id, ...userProfileData },{ where: { user_id } });

    res.status(200).json({ message: 'User profile saved successfully', userProfile });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to save user profile' });
    res.status(500).json({ message: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // const user_id = req.user.user_id;
    let { user_id } = req.params;
    user_id = user_id ? parseInt(user_id) : req.user.user_id;

    const userProfile = await db.UserProfile.findOne({ where: { user_id } });

    if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
    }

    userProfile.image = userProfile.image ? JSON.parse(userProfile.image) : [];

    res.status(200).json({ userProfile });
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get user profile' });
    }
};
exports.getUserData = async (req, res) => {
  try {
    const reqUser = req.user;
    let { user_id } = req.params;
    user_id = parseInt(user_id);

    const user = await getUserById(user_id);

    res.status(200).json({userData:user});
  } catch (error) {
    console.error(error);
    // res.status(500).json({ error: 'Failed to save user profile' });
    res.status(500).json({ message: error.message });
  }
};