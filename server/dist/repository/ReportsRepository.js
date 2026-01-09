"use strict";
// server/src/repository/ReportsRepository.ts
// Storage for generated team reports with 90-day retention
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const REPORTS_DIR = '/opt/render/project/src/data/reports';
const RETENTION_DAYS = 90;
class ReportsRepository {
    constructor() {
        this.ensureDir();
        this.cleanupOldReports();
    }
    /**
     * Ensure reports directory exists
     */
    ensureDir() {
        try {
            if (!fs.existsSync(REPORTS_DIR)) {
                fs.mkdirSync(REPORTS_DIR, { recursive: true });
                console.log(`Created reports directory: ${REPORTS_DIR}`);
            }
        }
        catch (error) {
            console.error('Error creating reports directory:', error);
        }
    }
    /**
     * Clean up reports older than retention period
     */
    cleanupOldReports() {
        try {
            if (!fs.existsSync(REPORTS_DIR))
                return;
            const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));
            const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
            let cleaned = 0;
            files.forEach(file => {
                try {
                    const filePath = path.join(REPORTS_DIR, file);
                    const stats = fs.statSync(filePath);
                    const ageMs = Date.now() - stats.mtimeMs;
                    if (ageMs > maxAgeMs) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                }
                catch (err) {
                    console.error(`Error checking report file ${file}:`, err);
                }
            });
            if (cleaned > 0) {
                console.log(`Cleaned up ${cleaned} old report(s)`);
            }
        }
        catch (error) {
            console.error('Error cleaning up reports:', error);
        }
    }
    /**
     * Save reports for a game
     */
    saveReports(gameId, gameName, winner, reports) {
        try {
            const data = {
                gameId,
                gameName,
                endedAt: new Date().toISOString(),
                totalTeams: reports.length,
                winner,
                reports,
            };
            const filePath = path.join(REPORTS_DIR, `${gameId}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved reports for game ${gameId} (${reports.length} teams)`);
            return true;
        }
        catch (error) {
            console.error(`Error saving reports for game ${gameId}:`, error);
            return false;
        }
    }
    /**
     * Get reports for a game
     */
    getReports(gameId) {
        try {
            const filePath = path.join(REPORTS_DIR, `${gameId}.json`);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return data;
        }
        catch (error) {
            console.error(`Error reading reports for game ${gameId}:`, error);
            return null;
        }
    }
    /**
     * Get a single team's report
     */
    getTeamReport(gameId, teamId) {
        const gameReports = this.getReports(gameId);
        if (!gameReports)
            return null;
        return gameReports.reports.find(r => r.teamId === teamId) || null;
    }
    /**
     * List all available report game IDs
     */
    listReports() {
        try {
            if (!fs.existsSync(REPORTS_DIR))
                return [];
            const files = fs.readdirSync(REPORTS_DIR).filter(f => f.endsWith('.json'));
            const reports = [];
            files.forEach(file => {
                try {
                    const filePath = path.join(REPORTS_DIR, file);
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    reports.push({
                        gameId: data.gameId,
                        gameName: data.gameName,
                        endedAt: data.endedAt,
                        totalTeams: data.totalTeams,
                    });
                }
                catch (err) {
                    // Skip corrupt files
                }
            });
            // Sort by date descending
            reports.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
            return reports;
        }
        catch (error) {
            console.error('Error listing reports:', error);
            return [];
        }
    }
    /**
     * Check if reports exist for a game
     */
    hasReports(gameId) {
        const filePath = path.join(REPORTS_DIR, `${gameId}.json`);
        return fs.existsSync(filePath);
    }
}
exports.reportsRepository = new ReportsRepository();
//# sourceMappingURL=ReportsRepository.js.map