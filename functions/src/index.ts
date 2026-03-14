import { onCall } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const db = admin.database();

const getTransporter = () => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  
  console.log('SMTP config check:', { 
    user: smtpUser ? 'set' : 'missing', 
    pass: smtpPass ? 'set' : 'missing' 
  });
  
  if (!smtpUser || !smtpPass) {
    console.error('SMTP credentials missing!');
    throw new Error('SMTP credentials not configured');
  }
  
  return nodemailer.createTransport({
    service: "iCloud",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
};

// Send invitation to join a shared list
export const sendInvitation = onCall(async (request) => {
  const { listId, listName, ownerId, ownerName, email, message } = request.data;

  if (!listId || !email || !ownerId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  // Create invitation in database
  const invitationRef = db.ref("invitations").push();
  const invitationId = invitationRef.key;
  
  await invitationRef.set({
    listId,
    listName,
    ownerId,
    ownerName: ownerName || "Someone",
    email,
    message: message || `I'd like to share my shopping list "${listName}" with you.`,
    status: "pending",
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });

  // Check if user exists and get their userId
  console.log('Looking for user with email:', email);
  const userDataSnapshot = await db.ref("userData").once("value");
  let recipientUserId = null;
  
  if (userDataSnapshot.exists()) {
    const userData = userDataSnapshot.val();
    console.log('All user data keys:', Object.keys(userData));
    for (const [uid, data] of Object.entries(userData)) {
      const profile = (data as any)?.profile;
      console.log('Checking user:', uid, 'email:', profile?.email);
      if (profile?.email?.toLowerCase() === email.toLowerCase()) {
        recipientUserId = uid;
        console.log('Found matching user:', uid);
        break;
      }
    }
  }

  // If recipient has an account, create a notification
  if (recipientUserId) {
    console.log('Creating notification for:', recipientUserId);
    const notificationRef = db.ref(`userData/${recipientUserId}/notifications`).push();
    await notificationRef.set({
      type: "invitation",
      fromUserId: ownerId,
      fromName: ownerName || "Someone",
      listId,
      listName,
      invitationId,
      status: "pending",
      read: false,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
  }

  // Send email
  const acceptLink = `https://meat-and-potatoes-86149.web.app/accept-invitation/${invitationId}`;
  
  const transporter = getTransporter();

  const mailOptions = {
    from: "Meat & Potatoes <kester.simm@icloud.com>",
    to: email,
    subject: `${ownerName || "Someone"} wants to share a shopping list with you`,
    text: `
${message || `I'd like to share my shopping list "${listName}" with you.`}

Click here to accept: ${acceptLink}

${!recipientUserId ? "You'll need to create an account to join." : "You can view this in your inbox once you sign in."}

- Meat & Potatoes App
    `.trim(),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }

  return { success: true, invitationId };
});

// Accept invitation
export const acceptInvitation = onCall(async (request) => {
  const { invitationId, userId } = request.data;

  if (!invitationId || !userId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  const invitationRef = db.ref(`invitations/${invitationId}`);
  const snapshot = await invitationRef.once("value");
  
  if (!snapshot.exists()) {
    throw new functions.https.HttpsError("not-found", "Invitation not found");
  }

  const invitation = snapshot.val();
  
  if (invitation.status !== "pending") {
    throw new functions.https.HttpsError("failed-precondition", "Invitation already processed");
  }

  // Update invitation status
  await invitationRef.update({
    status: "accepted",
    acceptedAt: admin.database.ServerValue.TIMESTAMP,
    acceptedBy: userId,
  });

  // Add user to shared list access
  const sharedListRef = db.ref(`userData/${userId}/sharedLists/${invitation.listId}`);
  await sharedListRef.set({
    ownerId: invitation.ownerId,
    listId: invitation.listId,
    listName: invitation.listName,
    addedAt: admin.database.ServerValue.TIMESTAMP,
    role: "member",
  });

  // Add to owner's shared lists
  const ownerSharedRef = db.ref(`userData/${invitation.ownerId}/sharedLists/${invitation.listId}/members/${userId}`);
  await ownerSharedRef.set({
    addedAt: admin.database.ServerValue.TIMESTAMP,
    role: "member",
  });

  // Create notification for the owner
  const notificationRef = db.ref(`userData/${invitation.ownerId}/notifications`).push();
  await notificationRef.set({
    type: "invitation_accepted",
    fromUserId: userId,
    listId: invitation.listId,
    listName: invitation.listName,
    read: false,
    createdAt: admin.database.ServerValue.TIMESTAMP,
  });

  return { success: true };
});

// Decline invitation
export const declineInvitation = onCall(async (request) => {
  const { invitationId, userId } = request.data;

  if (!invitationId || !userId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  const invitationRef = db.ref(`invitations/${invitationId}`);
  await invitationRef.update({
    status: "declined",
    declinedAt: admin.database.ServerValue.TIMESTAMP,
    declinedBy: userId,
  });

  return { success: true };
});

// Get user notifications
export const getNotifications = onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "User ID is required");
  }

  const snapshot = await db.ref(`userData/${userId}/notifications`)
    .orderByChild("createdAt")
    .limitToLast(50)
    .once("value");

  if (snapshot.exists()) {
    const data = snapshot.val();
    const notifications = Object.entries(data).map(([id, value]: [string, any]) => ({
      id,
      ...value,
    })).reverse();
    return notifications;
  }

  return [];
});

// Mark notification as read
export const markNotificationRead = onCall(async (request) => {
  const { userId, notificationId } = request.data;

  if (!userId || !notificationId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
  }

  await db.ref(`userData/${userId}/notifications/${notificationId}`).update({
    read: true,
  });

  return { success: true };
});

// Get unread notification count
export const getUnreadCount = onCall(async (request) => {
  const { userId } = request.data;

  if (!userId) {
    throw new functions.https.HttpsError("invalid-argument", "User ID is required");
  }

  const snapshot = await db.ref(`userData/${userId}/notifications`)
    .orderByChild("read")
    .equalTo(false)
    .once("value");

  if (snapshot.exists()) {
    return Object.keys(snapshot.val()).length;
  }

  return 0;
});
