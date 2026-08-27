import fs from "fs";

const filePath = "c:/Users/hqsav/OneDrive/Desktop/busapk/BusTracker/src/components/schoolsinuppage.tsx";
let code = fs.readFileSync(filePath, "utf8");

code = code.replace(/import\s*\{\s*supabase\s*\}\s*from\s*"\.\.\/services\/supabase";/g, 'import { registerSchool } from "../services/authService";');

const regex = /try\s*\{\s*\/\/\s*Insert school registration into Supabase with 'pending' status[\s\S]*?console\.warn\("Supabase school insert error[\s\S]*?\}\s*\}\s*catch\s*\(err\)\s*\{[\s\S]*?console\.warn\("School registration network error:", err\);\s*\}/;

if (regex.test(code)) {
    code = code.replace(regex, `try {\n            await registerSchool(data);\n        } catch (err) {\n            console.warn("School registration network error:", err);\n        }`);
    fs.writeFileSync(filePath, code, "utf8");
    console.log("SUCCESSFULLY UPDATED schoolsinuppage.tsx!");
} else {
    console.log("Regex did not match.");
}
