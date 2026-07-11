"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const helpers_1 = require("../utils/helpers");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Apply admin protection to all routes in this router
router.use(auth_1.requireAuth);
router.use(auth_1.requireAdmin);
// 1. Dashboard Analytics
router.get('/analytics', async (req, res) => {
    try {
        // Fetch counts in parallel
        const [usersRes, testsRes, keysRes, logsRes] = await Promise.all([
            supabase_1.supabaseAdmin.from('profiles').select('status', { count: 'exact' }),
            supabase_1.supabaseAdmin.from('drug_tests').select('*', { count: 'exact', head: true }),
            supabase_1.supabaseAdmin.from('activation_keys').select('is_used', { count: 'exact' }),
            supabase_1.supabaseAdmin.from('verification_logs').select('*', { count: 'exact', head: true })
        ]);
        if (usersRes.error)
            throw usersRes.error;
        if (testsRes.error)
            throw testsRes.error;
        if (keysRes.error)
            throw keysRes.error;
        if (logsRes.error)
            throw logsRes.error;
        // Calculate details
        const profiles = usersRes.data || [];
        const totalUsers = profiles.length;
        const activeUsers = profiles.filter(p => p.status === 'active').length;
        const suspendedUsers = profiles.filter(p => p.status === 'suspended').length;
        const totalTests = testsRes.count || 0;
        const keys = keysRes.data || [];
        const totalKeys = keys.length;
        const usedKeys = keys.filter(k => k.is_used).length;
        const remainingKeys = totalKeys - usedKeys;
        const totalVerifications = logsRes.count || 0;
        // Fetch recent activity
        const [recentTests, recentRedeemedKeys, recentScans] = await Promise.all([
            supabase_1.supabaseAdmin
                .from('drug_tests')
                .select('id, name, created_at, certificate_number')
                .order('created_at', { ascending: false })
                .limit(5),
            supabase_1.supabaseAdmin
                .from('activation_keys')
                .select('key, used_at, used_by')
                .eq('is_used', true)
                .order('used_at', { ascending: false })
                .limit(5),
            supabase_1.supabaseAdmin
                .from('verification_logs')
                .select('id, scanned_at, ip_address, drug_tests(name, certificate_number)')
                .order('scanned_at', { ascending: false })
                .limit(5)
        ]);
        res.json({
            summary: {
                totalUsers,
                activeUsers,
                suspendedUsers,
                totalTests,
                totalKeys,
                usedKeys,
                remainingKeys,
                totalVerifications
            },
            recentActivity: {
                recentTests: recentTests.data || [],
                recentRedeemedKeys: recentRedeemedKeys.data || [],
                recentScans: recentScans.data || []
            }
        });
    }
    catch (err) {
        logger_1.logger.error(`Error fetching admin analytics: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// 2. User Management: List & Search Users
router.get('/users', async (req, res) => {
    const search = req.query.search || '';
    try {
        let query = supabase_1.supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (search) {
            query = query.ilike('email', `%${search}%`);
        }
        const { data: users, error } = await query;
        if (error)
            throw error;
        res.json(users);
    }
    catch (err) {
        logger_1.logger.error(`Error listing users: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// User Management: Update User Status (Suspend/Activate)
router.patch('/users/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'active' && status !== 'suspended') {
        return res.status(400).json({ error: 'Invalid status value' });
    }
    if (id === req.user?.id) {
        return res.status(400).json({ error: 'You cannot suspend your own account' });
    }
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update({ status })
            .eq('id', id);
        if (error)
            throw error;
        logger_1.logger.info(`Admin ${req.user?.id} updated user ${id} status to ${status}`);
        res.json({ success: true, message: `User status successfully updated to ${status}` });
    }
    catch (err) {
        logger_1.logger.error(`Error updating user status: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// User Management: Reset Password
router.post('/users/:id/reset-password', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    try {
        const { error } = await supabase_1.supabaseAdmin.auth.admin.updateUserById(id, {
            password: password
        });
        if (error)
            throw error;
        logger_1.logger.info(`Admin ${req.user?.id} reset password for user ${id}`);
        res.json({ success: true, message: 'Password reset successfully' });
    }
    catch (err) {
        logger_1.logger.error(`Error resetting user password: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// User Management: Delete User
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    if (id === req.user?.id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    try {
        // Delete user from Auth.users, trigger cascades or deletes profiles
        const { error } = await supabase_1.supabaseAdmin.auth.admin.deleteUser(id);
        if (error)
            throw error;
        logger_1.logger.info(`Admin ${req.user?.id} deleted user ${id}`);
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (err) {
        logger_1.logger.error(`Error deleting user: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// 3. Activation Keys: Generate Keys (Bulk/Single)
router.post('/keys/generate', async (req, res) => {
    const count = parseInt(req.body.count) || 1;
    const adminId = req.user?.id;
    if (count <= 0 || count > 100) {
        return res.status(400).json({ error: 'Please generate between 1 and 100 keys at a time' });
    }
    try {
        const keysToInsert = [];
        for (let i = 0; i < count; i++) {
            keysToInsert.push({
                key: (0, helpers_1.generateActivationKey)(),
                is_used: false,
                created_by: adminId
            });
        }
        const { data: generatedKeys, error } = await supabase_1.supabaseAdmin
            .from('activation_keys')
            .insert(keysToInsert)
            .select();
        if (error)
            throw error;
        logger_1.logger.info(`Admin ${adminId} generated ${count} activation keys`);
        res.status(201).json(generatedKeys);
    }
    catch (err) {
        logger_1.logger.error(`Error generating activation keys: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Activation Keys: List & Search Keys
router.get('/keys', async (req, res) => {
    const search = req.query.search || '';
    const filter = req.query.filter || 'all'; // 'all', 'used', 'unused'
    try {
        let query = supabase_1.supabaseAdmin
            .from('activation_keys')
            .select('*, used_by_profile:profiles!used_by(email)')
            .order('created_at', { ascending: false });
        if (search) {
            query = query.ilike('key', `%${search}%`);
        }
        if (filter === 'used') {
            query = query.eq('is_used', true);
        }
        else if (filter === 'unused') {
            query = query.eq('is_used', false);
        }
        const { data: keys, error } = await query;
        if (error)
            throw error;
        res.json(keys);
    }
    catch (err) {
        logger_1.logger.error(`Error fetching keys: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Activation Keys: Delete Key
router.delete('/keys/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('activation_keys')
            .delete()
            .eq('id', id);
        if (error)
            throw error;
        res.json({ success: true, message: 'Activation key deleted successfully' });
    }
    catch (err) {
        logger_1.logger.error(`Error deleting key: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// 4. Drug Tests: List & Search
router.get('/tests', async (req, res) => {
    const search = req.query.search || '';
    try {
        let query = supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('*, profiles(email)')
            .order('created_at', { ascending: false });
        if (search) {
            // Search by name or certificate number
            query = query.or(`name.ilike.%${search}%,certificate_number.ilike.%${search}%`);
        }
        const { data: tests, error } = await query;
        if (error)
            throw error;
        res.json(tests);
    }
    catch (err) {
        logger_1.logger.error(`Error listing tests: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Drug Tests: Delete Test
router.delete('/tests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Find the record first to get the passport URL to delete it from storage
        const { data: test, error: findError } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('passport_url')
            .eq('id', id)
            .single();
        if (findError || !test) {
            return res.status(404).json({ error: 'Drug test not found' });
        }
        // Delete record from database (verification logs will delete on cascade)
        const { error: deleteErr } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .delete()
            .eq('id', id);
        if (deleteErr)
            throw deleteErr;
        // Delete file from Supabase Storage (extract filename from URL)
        try {
            const fileName = test.passport_url.split('/').pop();
            if (fileName) {
                await supabase_1.supabaseAdmin.storage.from('passports').remove([fileName]);
            }
        }
        catch (storageErr) {
            logger_1.logger.warn(`Could not delete storage file: ${storageErr}`);
        }
        logger_1.logger.info(`Admin ${req.user?.id} deleted drug test ${id}`);
        res.json({ success: true, message: 'Drug test deleted successfully' });
    }
    catch (err) {
        logger_1.logger.error(`Error deleting test: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Drug Tests: View Verification History
router.get('/tests/:id/history', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: logs, error } = await supabase_1.supabaseAdmin
            .from('verification_logs')
            .select('*')
            .eq('document_id', id)
            .order('scanned_at', { ascending: false });
        if (error)
            throw error;
        res.json(logs);
    }
    catch (err) {
        logger_1.logger.error(`Error loading verification history: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// 5. Platform Settings: Get
router.get('/settings', async (req, res) => {
    try {
        const { data: settings, error } = await supabase_1.supabaseAdmin
            .from('settings')
            .select('*');
        if (error)
            throw error;
        // Map to object
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    }
    catch (err) {
        logger_1.logger.error(`Error loading platform settings: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Platform Settings: Update Telegram Link/Username
router.post('/settings', async (req, res) => {
    const { telegram_username } = req.body;
    if (!telegram_username) {
        return res.status(400).json({ error: 'Telegram username is required' });
    }
    try {
        const { error } = await supabase_1.supabaseAdmin
            .from('settings')
            .upsert({
            key: 'telegram_username',
            value: telegram_username
        });
        if (error)
            throw error;
        logger_1.logger.info(`Admin ${req.user?.id} updated telegram link to ${telegram_username}`);
        res.json({ success: true, message: 'Settings updated successfully' });
    }
    catch (err) {
        logger_1.logger.error(`Error updating settings: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
