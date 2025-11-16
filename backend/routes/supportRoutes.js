import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// @route   POST /api/support/contact
// @desc    Submit a support request form
// @access  Private
router.post('/contact', protect, async (req, res) => {
    try {
        const { message, groupId } = req.body;
        const user = req.user; // from protect middleware
        
        if (!message || message.trim() === '') {
            res.status(400);
            throw new Error('A message is required to submit a support request.');
        }
        
        let groupInfo = '';
        if (groupId) {
            groupInfo = `<p><strong>Group ID:</strong> ${groupId}</p>`;
        }
        
        const supportEmailAddress = 'jinkaramakrishna@gmail.com';
        const subject = `Support Request from User: ${user.email}`;
        const emailBody = `
            <p>A new support request has been submitted from the MyTennisTeam application.</p>
            <h3>User Details:</h3>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>` + 
            groupInfo +
            `
            <h3>Issue Description:</h3>
            <p>${message}</p>'
        `;
        
        await sendEmail({ email: supportEmailAddress, subject, message: emailBody });
        
        res.status(200).json({ msg: 'Your support request has been sent successfully. We will get back to you shortly.' });

    } catch (error) {
        console.error('Error submitting support contact info', error);
        res.status(500).json({ msg: 'Server Error' });
    }

    
});


export default router;