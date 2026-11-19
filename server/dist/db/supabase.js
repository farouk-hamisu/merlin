"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Supabase project configuration (hard-coded)
const SUPABASE_URL = 'https://edysfmrlvjewvnbcdwvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeXNmbXJsdmpld3ZuYmNkd3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNzM3NjIsImV4cCI6MjExMDY0OTc2Mn0.m99bxz6g_gYFaHyYafgMD_N_giWMJMnN4U_qBb4w5dg';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeXNmbXJsdmpld3ZuYmNkd3Z2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTA3Mzc2MiwiZXhwIjoyMTEwNjQ5NzYyfQ.7xWawtghcICaExKP9Va4dfDwL_R9N1ZQ7duTIXb81lE';
// Standard client that respects RLS (for operations representing the user)
exports.supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY);
// Admin client that bypasses RLS (for background operations, admin tasks, key consumption)
exports.supabaseAdmin = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
