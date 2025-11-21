const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");
const { sendEmail } = require("../services/emailService");
const {
  getChannelName,
  generateToken,
} = require("../services/videoCallingService");
dotenv.config();

const { RtmTokenBuilder, RtmRole } = require("agora-access-token");

const env = process.env.NODE_ENV || "development";
// console.log("⏺️ Using config for:", env);
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
  logging: false,
});

exports.getChatToken = async (req, res) => {
  try {
    const { user_id, task_id } = req.query;
    // const taskId = parseInt(task_id);

    if (!user_id) return res.status(400).send("user_id is required");
    if (!task_id) return res.status(400).send("task_id is required");

    const appId = process.env.TEST_AGORA_APP_ID;
    const appCertificate = process.env.TEST_AGORA_APP_CERTIFICATE;

    // const appId = process.env.AGORA_APP_ID;
    // const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    // const uid = `TASK${task_id}`;
    const uid = `1234`;
    // console.log(uid);

    const channelName = await getChannelName(task_id);
    // const uid = taskId;
    // const token = await generateToken(appId, appCertificate, channelName, uid);

    const role = RtmRole.Rtm_User;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      uid,
      role,
      privilegeExpiredTs
    );

    console.log("APPID:", appId);
    console.log("TOKEN", token);
    console.log("UIID:", "1234");

    return res.json({ token, channelName });

    // res.send({ token, channelName });
  } catch (error) {
    return res.status(200).json(error);
  }
};
