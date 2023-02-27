/**
 * @file main.js: Entry point to a path converter program.
 * @author Ghashy.
 */

"use strict";

import { argv } from "process";
import { exit } from "process";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";

import { colours as colors } from "./src/Colors.js";


let dir_path = get_dir_path();
const files = await getFiles(dir_path);
let allowed = await is_safe_to_process();

if (allowed) {
    let counter = 0;
    // Create output directory
    let out_dir = path.join(dir_path, "..", "Grooves");
    await fs.promises.mkdir(out_dir, { recursive: true }, (err) => {
        if (err) { throw err; }
        else { console.log("Created output directory: ", out_dir); }
    });
    console.log("\n");
    let log_stream = fs.createWriteStream(path.join(out_dir, "log.txt"), {flags : "a"});
    // Write all midi files
    for (let i = 0; i < files.length; i++) {

        let element = files[i];

        if (is_midi(element)) {

            let filepath = get_new_path(element, out_dir);
            if (filepath === null) { continue; }

            fs.mkdirSync(path.join(filepath, ".."), { recursive: true }, );
            fs.copyFileSync(element, filepath, fs.constants.COPYFILE_EXCL);
            counter++;
            log_stream.write(`${counter} : ${filepath}\n`);
        }
    }
    console.log("Total files:", counter);
}

// Helper functions

async function is_safe_to_process() {
    // Print files count from path
    console.log("Found", files.length, `files in ${dir_path}`);
    // Found first .mid file
    let midi_element = await Readable.from(files).find((elem) => {
        return is_midi(elem);
    });
    
    // Check if there are midi files
    if (midi_element === undefined) {
        print_error();
        console.log("There are no midi files!\n");
        exit();
    }
    console.log("First found midi element:", colors.fg.magenta, midi_element, colors.reset);

    // Check if there are foreign files
    await is_safe_files();
    return true;
}

function deepness_level(file) {
    let mid_deep_level = file.split(path.sep).length;
    let dir_deep_level = dir_path.split(path.sep).length;
    return mid_deep_level - dir_deep_level;
}

function get_dir_path() {
    if (argv.length !== 3) {
        print_error();
        console.log("Should be only",
            colors.fg.cyan, "2",
            colors.reset, "arguments after 'node' command:",
            colors.fg.cyan, "main.js",
            colors.reset, "and",
            colors.fg.cyan, "path",
            colors.reset, "to midi folder:"
        );
        console.log("node main.js midifolder=/User/Username/MIDI/\n");
        exit(1);
    }
    else if (!argv[2].startsWith("midifolder=", 0)) {
        print_error();
        console.log("Missing second argument:",
            colors.fg.cyan, "midifolder=<dir>",
            colors.reset, "\n"
        );
        exit(1);
    }
    let dir_path = argv[2].slice(11);
    if (!fs.existsSync(dir_path)) {
        print_error();
        console.log("This directory is not exists!");
        exit();
    }
    console.log("Succesesfully found path:",
        colors.fg.green, dir_path, colors.reset);
    return dir_path;
}

async function getFiles(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        dirents.map((dirent) => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        })
    );
    return Array.prototype.concat(...files); // or files.flat()
}

function print_error() {
    console.log("\n", colors.fg.red, "ERROR:", colors.reset);
}

async function is_safe_files() {
    // Detect all filetypes in directory
    let types = [];
    files.forEach((element) => {
        const extension = path.extname(element).toLowerCase();
        if (types.find((type) => extension === type) === undefined) {
            types.push(extension);
        }
    });
    console.log("Found filetypes:", types);

    // Check if there are no user's files
    types.forEach((element) => {
        if (!is_allowed_ext(element)) {
            print_error();
            console.log(
                `Foreign filetype found: ${element} \nFurther work may remove your files, so we're exiting...\n`
            );
            exit();
        }
    });
}

function is_allowed_ext(extension) {
    switch (extension) {
        case "": case ".mid": case ".head": case ".txt": return true;
        default: return false;
    }
}

function is_midi(file) {
    return path.extname(file).toLowerCase() == ".mid";
}

function get_new_path(file, out_dir) {
    let filename = path.basename(file);
    let prt_dir = path.basename(path.join(file, ".."));
    let sng_dir = path.basename(path.join(file, "..", ".."));
    let lib_dir = "";
    if (deepness_level(file) > 2) {
        lib_dir = path.basename(path.join(file, "..", "..", ".."));
    } else if (deepness_level(file) > 1) {
        lib_dir = sng_dir.concat("_library");
    } else if (deepness_level > 0) {
        lib_dir = prt_dir.concat("_library");
        sng_dir = prt_dir.concat("_song");
    } else { return null; }
    prt_dir = normalize_dir_name(prt_dir).concat(".prt");
    sng_dir = normalize_dir_name(sng_dir).concat(".sng");
    lib_dir = normalize_dir_name(lib_dir).concat(".lib");
    return path.join(out_dir, lib_dir, sng_dir, prt_dir, filename);
}

function normalize_dir_name(dirname) {
    if (dirname.search("@") !== -1) {
        dirname = dirname.replace("@", "_");
    }
    while (dirname.at(0) == "0") {
        dirname = dirname.substring(1);
    }
    return dirname.toLowerCase();
}
