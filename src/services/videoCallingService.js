const AgoraAccessToken = require("agora-access-token");
const {
  RtcTokenBuilder,
  RtmTokenBuilder,
  RtcRole,
  RtmRole,
} = require("agora-token");

exports.generateToken = async (appId, appCertificate, channelName, uid) => {
  try {
    // const expirationTimeInSeconds = 36000; // 1 hour (adjust as needed)
    // const token = AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
    //     appId,
    //     appCertificate,
    //     channelName,
    //     uid,
    //     AgoraAccessToken.RtcRole.PUBLISHER,
    //     expirationTimeInSeconds
    // );

    // Rtc Examples
    // const appId = '';
    // const appCertificate = '';
    // const channelName = '';
    // const uid;
    const userAccount = "";
    const role = RtcRole.PUBLISHER;

    const expirationTimeInSeconds = 36000;

    const currentTimestamp = Math.floor(Date.now() / 1000);

    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // IMPORTANT! Build token with either the uid or with the user account. Comment out the option you do not want to use below.

    // Build token with uid
    const tokenA = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    console.log("Token With Integer Number Uid: " + tokenA);

    // Build token with user account
    const tokenB = RtcTokenBuilder.buildTokenWithUserAccount(
      appId,
      appCertificate,
      channelName,
      userAccount,
      role,
      privilegeExpiredTs
    );
    console.log("Token With UserAccount: " + tokenB);

    return tokenB;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

exports.getChannelName = async (number) => {
  try {
    if (number < 1 || number > 10000000 || isNaN(number)) {
      throw new Error("Number must be between 1 and 10,000,000");
    }

    // Convert the number to a string
    const numberString = String(number);

    // Calculate the number of leading zeros needed
    const leadingZeros = "0".repeat(8 - numberString.length);

    // Concatenate leading zeros and the number
    const eightCharString = leadingZeros + numberString;

    return eightCharString;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};
