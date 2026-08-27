import fs from "fs";
import path from "path";

const srcDir = "c:/Users/hqsav/OneDrive/Desktop/busapk/backend/functions";
const destDir = "c:/Users/hqsav/OneDrive/Desktop/busapk/supabase/functions";

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

copyRecursiveSync(srcDir, destDir);
console.log("ALL FUNCTIONS SYNCED TO ROOT supabase/functions SUCCESSFULLY!");
