const db = require("../models");
const {
  generateToken,
  getChannelName,
} = require("../services/videoCallingService");
const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;

exports.getVideoCallingToken = async (req, res) => {
  try {
    const { task_id } = req.params;
    const channelName = await getChannelName(task_id);
    const uid = task_id;

    const token = await generateToken(appId, appCertificate, channelName, uid);

    res.status(200).json({ token, channelName });
  } catch (error) {
    console.error(error);
    //   res.status(500).json({ error: 'Failed to get pincode information' });
    res.status(500).json({ message: error.message });
  }
};
