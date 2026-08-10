"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateActivationKey = exports.generateApplicantId = exports.generateCertificateNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates an authentic-looking certificate number (e.g. NDLEA/DT/054981)
 */
const generateCertificateNumber = () => {
    const digits = Math.floor(0 + Math.random() * 10000).toString().padStart(4, '0'); // 4 digits
    return `NDLEA/DT/0${digits}`;
};
exports.generateCertificateNumber = generateCertificateNumber;
/**
 * Generates an authentic-looking applicant ID (e.g. NDLEA/0000047890)
 */
const generateApplicantId = () => {
    const digits = Math.floor(0 + Math.random() * 100000).toString().padStart(5, '0'); // 5 digits
    return `NDLEA/00000${digits}`;
};
exports.generateApplicantId = generateApplicantId;
/**
 * Generates a cryptographically secure activation key (e.g. DT-ABCD-EFGH-IJKL)
 */
const generateActivationKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => {
        let result = '';
        const bytes = crypto_1.default.randomBytes(4);
        for (let i = 0; i < 4; i++) {
            result += chars[bytes[i] % chars.length];
        }
        return result;
    };
    return `DT-${segment()}-${segment()}-${segment()}`;
};
exports.generateActivationKey = generateActivationKey;
