import pkg from 'agora-access-token';
const { RtcRole, RtcTokenBuilder } = pkg;

const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const generateRTCToken = (channelName, uid, role = "publisher") => {
    // Token expiration time (24 hours from now)
    const expirationTimeInSeconds = 86400; // 24 hours
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Role
    const roleMap = {
        publisher: RtcRole.PUBLISHER, // Can publish and subscribe
        subscriber: RtcRole.SUBSCRIBER, // Can only subscribe
    };
    const rtcRole = roleMap[role] || RtcRole.PUBLISHER;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        rtcRole,
        privilegeExpiredTs,
    );

    return token;
};

export { generateRTCToken };
