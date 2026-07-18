"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const helpers_1 = require("../utils/helpers");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
const base64Cache = {};
const getBase64FromUrl = async (url) => {
    if (!url)
        return '';
    if (base64Cache[url]) {
        return base64Cache[url];
    }
    try {
        const res = await global.fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to fetch image: status ${res.status}`);
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/png';
        const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
        base64Cache[url] = base64;
        return base64;
    }
    catch (err) {
        logger_1.logger.error(`Error converting image url to base64: ${err.message} for url ${url}`);
        return url;
    }
};
const getBase64FromFile = (filePath) => {
    try {
        const absolutePath = path_1.default.resolve(__dirname, filePath);
        const buffer = fs_1.default.readFileSync(absolutePath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    catch (err) {
        logger_1.logger.error(`Error reading local file to base64: ${err.message} for path ${filePath}`);
        return '';
    }
};
// Helper to ensure bucket exists
const ensureBucketExists = async () => {
    try {
        const { data: buckets, error } = await supabase_1.supabaseAdmin.storage.listBuckets();
        if (error)
            throw error;
        const exists = buckets.some(b => b.name === 'passports');
        if (!exists) {
            await supabase_1.supabaseAdmin.storage.createBucket('passports', { public: true });
            logger_1.logger.info('Created "passports" storage bucket.');
        }
    }
    catch (err) {
        logger_1.logger.warn(`Could not verify/create storage bucket: ${err.message}`);
    }
};
// Generate a new drug test certificate
router.post('/generate', auth_1.requireAuth, upload_1.upload.single('passport'), async (req, res) => {
    const { name } = req.body;
    const userId = req.user?.id;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'Passport photograph is required' });
    }
    try {
        // 1. Get user profile and verify balance
        const { data: profile, error: profileErr } = await supabase_1.supabaseAdmin
            .from('profiles')
            .select('generation_balance, status')
            .eq('id', userId)
            .single();
        if (profileErr || !profile) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        if (profile.status === 'suspended') {
            return res.status(403).json({ error: 'Your account has been suspended' });
        }
        if (profile.generation_balance <= 0) {
            return res.status(403).json({ error: 'You do not have any active drug test generation rights. Please purchase or redeem an activation key.' });
        }
        // Ensure passports bucket exists
        await ensureBucketExists();
        // 2. Upload passport photo to Supabase Storage
        const fileExtension = req.file.originalname.split('.').pop() || 'jpg';
        const storageFileName = `passport_${userId}_${Date.now()}.${fileExtension}`;
        const { error: uploadErr } = await supabase_1.supabaseAdmin.storage
            .from('passports')
            .upload(storageFileName, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600',
            upsert: true
        });
        if (uploadErr) {
            logger_1.logger.error(`Storage upload error: ${uploadErr.message}`);
            return res.status(500).json({ error: 'Failed to upload passport photo to storage' });
        }
        const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
            .from('passports')
            .getPublicUrl(storageFileName);
        // 3. Generate dynamic barcode (QR code) pointing directly to the rendered certificate page
        const documentId = crypto_1.default.randomUUID();
        const certificateUrl = `${req.protocol}://${req.get('host')}/api/documents/${documentId}/render`;
        // Generate base64 data URI of QR code
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(certificateUrl, {
            width: 100,
            margin: 1,
            errorCorrectionLevel: 'H'
        });
        const certificateNumber = (0, helpers_1.generateCertificateNumber)();
        const applicantId = (0, helpers_1.generateApplicantId)();
        // 4. Save drug test record in database
        const { data: drugTest, error: dbErr } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .insert({
            id: documentId,
            user_id: userId,
            name: name.trim().toUpperCase(),
            passport_url: publicUrl,
            applicant_id: applicantId,
            certificate_number: certificateNumber,
            qr_code_url: qrCodeDataUrl
        })
            .select()
            .single();
        if (dbErr) {
            logger_1.logger.error(`Database insertion error: ${dbErr.message}`);
            // Cleanup uploaded file from storage
            await supabase_1.supabaseAdmin.storage.from('passports').remove([storageFileName]);
            return res.status(500).json({ error: 'Failed to save drug test record' });
        }
        // 5. Decrement user's generation rights balance
        const { error: balanceErr } = await supabase_1.supabaseAdmin
            .from('profiles')
            .update({
            generation_balance: profile.generation_balance - 1
        })
            .eq('id', userId);
        if (balanceErr) {
            logger_1.logger.error(`Balance decrement error: ${balanceErr.message}`);
            // Note: We don't rollback database insertion since the certificate was generated successfully
        }
        logger_1.logger.info(`User ${userId} generated drug test ${documentId} (Cert: ${certificateNumber})`);
        res.status(201).json(drugTest);
    }
    catch (err) {
        logger_1.logger.error(`Error in /generate: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Get all tests generated by the authenticated user
router.get('/my-tests', auth_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { data: tests, error } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        res.json(tests);
    }
    catch (err) {
        logger_1.logger.error(`Error in /my-tests: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Get specific drug test JSON metadata
router.get('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const { data: test, error } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !test) {
            return res.status(404).json({ error: 'Drug test not found' });
        }
        // Secure access check: Must be owner or admin
        if (test.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: You do not own this drug test' });
        }
        res.json(test);
    }
    catch (err) {
        logger_1.logger.error(`Error in GET /:id: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Render the certificate template as HTML
router.get('/:id/render', async (req, res) => {
    try {
        const { id } = req.params;
        // Fetch the drug test details (publicly accessible for rendering/verification)
        const { data: test, error } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !test) {
            return res.status(404).send('<h1>Drug Test Not Found</h1>');
        }
        // Read index/certificate template file
        const templatePath = path_1.default.join(__dirname, '../../templates/certificate.html');
        if (!fs_1.default.existsSync(templatePath)) {
            return res.status(500).send('<h1>Template Engine Missing</h1>');
        }
        let html = fs_1.default.readFileSync(templatePath, 'utf8');
        // Format Validity Period (1 Year duration)
        const createdDate = new Date(test.created_at);
        const expiryDate = new Date(createdDate);
        expiryDate.setFullYear(createdDate.getFullYear() + 1);
        const startStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endStr = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const validityPeriod = `${startStr} - ${endStr}`;
        // Fetch base64 representations for images
        const signatureUrl = 'https://drugandvisa.ndlea.gov.ng/SuperDeck/signatures/0000000468/signature.png';
        const NDLEA_LOGO_URL = 'https://res.cloudinary.com/uf6qp7jz/image/upload/f_auto,q_auto/ndlealogo_l2rdji';
        const [watermarkBase64, signatureBase64, passportBase64] = await Promise.all([
            getBase64FromUrl(NDLEA_LOGO_URL),
            getBase64FromUrl(signatureUrl),
            getBase64FromUrl(test.passport_url)
        ]);
        // Interpolate placeholders
        const sanitizedCertNum = test.certificate_number.replace(/\//g, '-');
        const sanitizedAppId = test.applicant_id.replace(/\//g, '-');
        const randomStr = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
        const fileName = `CERT-${sanitizedCertNum}_APP-${sanitizedAppId}_${randomStr}`;
        html = html.replace(/\{\{FILE_NAME\}\}/g, fileName);
        html = html.replace(/\{\{CERTIFICATE_NUMBER\}\}/g, test.certificate_number);
        html = html.replace(/\{\{NAME\}\}/g, test.name);
        html = html.replace(/\{\{APPLICANT_ID\}\}/g, test.applicant_id);
        html = html.replace(/\{\{PASSPORT_URL\}\}/g, passportBase64 || test.passport_url);
        html = html.replace(/\{\{QR_CODE_URL\}\}/g, test.qr_code_url);
        html = html.replace(/\{\{VALIDITY_PERIOD\}\}/g, validityPeriod);
        html = html.replace(/\{\{BACKGROUND_WATERMARK_BASE64\}\}/g, watermarkBase64);
        html = html.replace(/\{\{SIGNATURE_BASE64\}\}/g, signatureBase64);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (err) {
        logger_1.logger.error(`Error in /:id/render: ${err.message}`);
        res.status(500).send('<h1>Internal Server Error</h1>');
    }
});
// Increment download count
router.post('/:id/download', auth_1.requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Get current download count
        const { data: test, error } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .select('download_count')
            .eq('id', id)
            .single();
        if (error || !test) {
            return res.status(404).json({ error: 'Drug test not found' });
        }
        // Update count
        const { error: updateErr } = await supabase_1.supabaseAdmin
            .from('drug_tests')
            .update({ download_count: test.download_count + 1 })
            .eq('id', id);
        if (updateErr)
            throw updateErr;
        res.json({ success: true, new_count: test.download_count + 1 });
    }
    catch (err) {
        logger_1.logger.error(`Error in /:id/download: ${err.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.default = router;
