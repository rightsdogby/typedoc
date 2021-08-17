import { promises as fs } from "fs";
import { join, dirname } from "path";

/**
 * Get the longest directory path common to all files.
 */
export function getCommonDirectory(files: readonly string[]): string {
    if (!files.length) {
        return "";
    }

    const roots = files.map((f) => f.split(/\\|\//));
    if (roots.length === 1) {
        return roots[0].slice(0, -1).join("/");
    }

    let i = 0;

    while (new Set(roots.map((part) => part[i])).size === 1) {
        i++;
    }

    return roots[0].slice(0, i).join("/");
}

/**
 * Normalize the given path.
 *
 * @param path  The path that should be normalized.
 * @returns The normalized path.
 */
export function normalizePath(path: string) {
    return path.replace(/\\/g, "/");
}

/**
 * Write a file to disc.
 *
 * If the containing directory does not exist it will be created.
 *
 * @param fileName  The name of the file that should be written.
 * @param data  The contents of the file.
 * @param writeByteOrderMark  Whether the UTF-8 BOM should be written or not.
 * @param onError  A callback that will be invoked if an error occurs.
 */
export async function writeFile(fileName: string, data: string) {
    await fs.mkdir(dirname(normalizePath(fileName)), {
        recursive: true,
    });
    await fs.writeFile(fileName, data);
}

/**
 * Copy a file or directory recursively.
 */
export async function copy(src: string, dest: string): Promise<void> {
    const stat = await fs.stat(src);

    if (stat.isDirectory()) {
        const contained = await fs.readdir(src);
        await Promise.all(
            contained.map((file) => copy(join(src, file), join(dest, file)))
        );
    } else if (stat.isFile()) {
        await fs.mkdir(dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
    } else {
        // Do nothing for FIFO, special devices.
    }
}

/**
 * Equivalent to rm -rf
 * @param target
 */
export async function remove(target: string) {
    // Since v14.14
    if (fs.rm) {
        await fs.rm(target, { recursive: true, force: true });
    } else {
        await fs.rmdir(target, { recursive: true });
    }
}
