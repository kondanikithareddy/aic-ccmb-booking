const nodemailer = require('nodemailer');

const createTransporter = () => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    return transporter;
};

const sendApprovalEmail = async (userEmail, userName) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: '"AIC-CCMB Admin" <instruments.aicccmb@gmail.com>',
            to: userEmail,
            subject: 'Your AIC-CCMB Account Has Been Approved!',
            html: `<h3>Hello ${userName},</h3><p>Your account for the AIC-CCMB booking system has been approved. You can now log in.</p>`
        };
        await transporter.sendMail(mailOptions);
        console.log(`Approval email successfully sent to ${userEmail} via Gmail.`);
    } catch (error) {
        console.error(`ERROR SENDING GMAIL:`, error);
    }
};

const sendNewUserAdminNotification = async (adminEmails, newUserName, newUserEmail) => {
    // If there are no admins, don't do anything.
    if (!adminEmails || adminEmails.length === 0) {
        console.log('No admins found to notify.');
        return;
    }

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: '"AIC-CCMB System" <instruments.aicccmb@gmail.com>',
            // Nodemailer can send to an array of emails directly
            to: adminEmails,
            subject: 'New User Registration - Action Required',
            html: `
                <h3>New User Pending Approval</h3>
                <p>A new user has registered for the AIC-CCMB Equipment Booking system and is waiting for approval.</p>
                <ul>
                    <li><strong>Name:</strong> ${newUserName}</li>
                    <li><strong>Email:</strong> ${newUserEmail}</li>
                </ul>
                <p>Please log in to the Admin Dashboard to review and approve or reject their registration.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`New user notification sent to ${adminEmails.length} admin(s).`);
    } catch (error) {
        console.error(`Error sending new user notification to admins:`, error);
    }
};

// --- NEW FUNCTION ---
const sendRejectionEmail = async (userEmail, userName) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: '"AIC-CCMB Admin" <instruments.aicccmb@gmail.com>',
            to: userEmail,
            subject: 'Update on Your AIC-CCMB Account Registration',
            html: `
                <p>Hello ${userName},</p>
                <p>Thank you for registering for the AIC-CCMB Equipment Booking system. After a review, we are unable to approve your account at this time.</p>
                <p>If you believe this is an error, please contact an AIC-CCMB administrator directly.</p>
                <p>Thank you,</p>
                <p>The AIC-CCMB Team</p>
            `
        };
        await transporter.sendMail(mailOptions);
        console.log(`Rejection email sent to ${userEmail}`);
    } catch (error) {
        console.error(`Error sending rejection email:`, error);
    }
};

// --- KEY CHANGE: Export both functions ---
module.exports = { sendApprovalEmail, sendRejectionEmail, sendNewUserAdminNotification };