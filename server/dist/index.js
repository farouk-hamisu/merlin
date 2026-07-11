"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const supabase_1 = require("./db/supabase");
// Import Routes
const auth_1 = __importDefault(require("./routes/auth"));
const documents_1 = __importDefault(require("./routes/documents"));
const verify_1 = __importDefault(require("./routes/verify"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allow iframes to load resources across ports
    contentSecurityPolicy: false,
    frameguard: false,
}));
// CORS configuration matching our React frontend Vite dev server origin
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
// Rate Limiter to prevent brute force and resource exhaustion
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
});
app.use('/api/', limiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Server health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Public settings route (for landing page info, e.g. Telegram Admin URL)
app.get('/api/settings/public', async (req, res) => {
    try {
        const { data: setting, error } = await supabase_1.supabaseAdmin
            .from('settings')
            .select('value')
            .eq('key', 'telegram_username')
            .single();
        if (error || !setting) {
            return res.json({ telegram_username: '@merlin_admin' });
        }
        res.json({ telegram_username: setting.value });
    }
    catch (err) {
        res.json({ telegram_username: '@merlin_admin' });
    }
});
// Connect Routes
app.use('/api/auth', auth_1.default);
app.use('/api/documents', documents_1.default);
app.use('/api/verify', verify_1.default);
app.use('/api/admin', admin_1.default);
// Global Unhandled Error Handler
app.use((err, req, res, next) => {
    logger_1.logger.error(`Unhandled Exception: ${err.message || err}`);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
exports.default = app;
