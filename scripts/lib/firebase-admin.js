"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDb = void 0;
exports.getAdminDb = getAdminDb;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Inicializa la aplicación de Firebase Admin SDK
 * @returns Instancia de Firebase App
 * @throws Error si faltan credenciales o son inválidas
 */
function getAdminApp() {
    if ((0, app_1.getApps)().length > 0) {
        return (0, app_1.getApp)();
    }
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    // Diagnostic log (safe — no secrets revealed)
    console.log('[firebase-admin] env check:', {
        hasBase64: !!b64,
        base64Length: b64?.length || 0,
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKeyRaw,
        privateKeyLength: privateKeyRaw?.length || 0,
    });
    if (b64 && b64.trim().length > 10) {
        try {
            const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
            if (!sa.project_id) {
                throw new Error('Service account missing project_id');
            }
            console.log('[firebase-admin] initialized with base64 credentials');
            return (0, app_1.initializeApp)({ credential: (0, app_1.cert)(sa) });
        }
        catch (error) {
            throw new Error(`Failed to parse base64 service account: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    if (!projectId || !clientEmail || !privateKeyRaw) {
        throw new Error('[firebase-admin] Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
    }
    const privateKey = privateKeyRaw
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n');
    if (privateKey.length < 100) {
        throw new Error('[firebase-admin] Private key appears to be invalid (too short)');
    }
    console.log('[firebase-admin] initialized with environment credentials');
    return (0, app_1.initializeApp)({ credential: (0, app_1.cert)({ projectId, privateKey, clientEmail }) });
}
/**
 * Instancia singleton de Firestore
 * Se inicializa de forma lazy para evitar errores durante el build
 */
let _db = null;
/**
 * Obtiene la instancia de Firestore
 * @returns Instancia de Firestore
 */
function getAdminDb() {
    if (!_db) {
        _db = (0, firestore_1.getFirestore)(getAdminApp());
    }
    return _db;
}
/**
 * Proxy para backward compatibility
 * @deprecated Usar getAdminDb() directamente
 */
exports.adminDb = new Proxy({}, {
    get(_target, prop) {
        const db = getAdminDb();
        return Reflect.get(db, prop);
    },
});
