"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// Public verification endpoint
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Retrieve the certificate data
        const { data: test, error } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !test) {
            return res.status(404).json({ verified: false, error: 'Document not found or invalid barcode' });
        }
        // 2. Extract client details for logging
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        // 3. Log the verification scan event asynchronously
        const { error: logErr } = await supabase_1.supabaseAdmin
            .from('verification_logs')
            .insert({
            document_id: id,
            ip_address: ipAddress,
            user_agent: userAgent,
        });
        if (logErr) {
            logger_1.logger.warn(`Failed to insert verification log: ${logErr.message}`);
        }
        else {
            logger_1.logger.info(`Verification log recorded for document ${id} from IP ${ipAddress}`);
        }
        // 4. Return the verified document metadata
        res.json({
            verified: true,
            scanned_at: new Date().toISOString(),
            test,
        });
    }
    catch (err) {
        logger_1.logger.error(`Error in public verify route: ${err.message}`);
        res.status(500).json({ verified: false, error: 'Internal Server Error' });
    }
});
exports.default = router;
