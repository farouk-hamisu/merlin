"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Get current user profile details
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: profile, error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error || !profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    }
    catch (err) {
        logger_1.logger.error(`Error in /me: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Redeem an activation key
router.post('/activate', auth_1.requireAuth, async (req, res) => {
    const { key } = req.body;
    const userId = req.user?.id;
    if (!key) {
        return res.status(400).json({ error: 'Key is required' });
    }
    try {
        // 1. Check if key exists and is not used
        const { data: keyRecord, error: keyErr } = await supabase_1.supabaseAdmin
            .from('activation_keys')
            .select('*')
            .eq('key', key.trim())
            .single();
        if (keyErr || !keyRecord) {
            return res.status(400).json({ error: 'Invalid activation key' });
        }
        if (keyRecord.is_used) {
            return res.status(400).json({ error: 'This activation key has already been used' });
        }
        // 2. Get user's current profile
        const { data: profile, error: profileErr } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('generation_balance, status')
            .eq('id', userId)
            .single();
        if (profileErr || !profile) {
            return res.status(400).json({ error: 'User profile not found' });
        }
        if (profile.status === 'suspended') {
            return res.status(403).json({ error: 'Your account is suspended' });
        }
        // 3. Mark key as used
        const { error: keyUpdateErr } = await supabase_1.supabaseAdmin
            .from('activation_keys')
            .update({
            is_used: true,
            used_by: userId,
            used_at: new Date().toISOString(),
        })
            .eq('id', keyRecord.id);
        if (keyUpdateErr) {
            logger_1.logger.error(`Key update error: ${keyUpdateErr.message}`);
            return res.status(500).json({ error: 'Failed to update activation key status' });
        }
        // 4. Increment user balance
        const { error: profileUpdateErr } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update({
            generation_balance: profile.generation_balance + 1,
        })
            .eq('id', userId);
        if (profileUpdateErr) {
            logger_1.logger.error(`Profile balance update error: ${profileUpdateErr.message}`);
            // Revert key status
            await supabase_1.supabaseAdmin
                .from('activation_keys')
                .update({
                is_used: false,
                used_by: null,
                used_at: null,
            })
                .eq('id', keyRecord.id);
            return res.status(500).json({ error: 'Failed to update user generation rights balance' });
        }
        logger_1.logger.info(`User ${userId} successfully redeemed key ${key}`);
        res.json({
            message: 'Activation successful! You have been granted 1 drug test generation right.',
            balance: profile.generation_balance + 1,
        });
    }
    catch (err) {
        logger_1.logger.error(`Error in /activate: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
