import fs from "fs";
import path from "path";

const LOG_FILE_PATH = path.join(process.cwd(), "inventory-changes.txt");

export type ChangeType = "add" | "edit" | "delete";

export type ChangeLogEntry = {
  timestamp: string;
  type: ChangeType;
  user: string;
  itemId?: number;
  itemDescription?: string;
  changes?: Record<string, { old: string; new: string }>;
};

export function logInventoryChange(
  type: ChangeType,
  user: string,
  itemId?: number,
  itemDescription?: string,
  changes?: Record<string, { old: string; new: string }>
) {
  const entry: ChangeLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    user,
    itemId,
    itemDescription,
    changes,
  };

  let logLine = `[${entry.timestamp}] ${entry.type.toUpperCase()} by ${entry.user}`;
  if (entry.itemId) logLine += ` | Item ID: ${entry.itemId}`;
  if (entry.itemDescription) logLine += ` | ${entry.itemDescription}`;
  
  if (entry.changes) {
    logLine += "\n  Changes:";
    for (const [field, { old: oldVal, new: newVal }] of Object.entries(entry.changes)) {
      logLine += `\n    - ${field}: "${oldVal}" → "${newVal}"`;
    }
  }
  
  logLine += "\n\n";

  fs.appendFileSync(LOG_FILE_PATH, logLine);
}