import fs from "node:fs";
import path from "node:path";
import * as utils from "poopgen/utils";
import * as p from "@clack/prompts";
import { stripIndent } from "common-tags";

// helpers

/**
 * @returns {never}
 */
function cancel() {
	p.cancel("cancelled");
	process.exit(0);
}

/**
 * @param {string} destPath
 */
async function initGit(destPath) {
	const spinner = p.spinner();

	spinner.start("Initializing Git repo...");

	const dirIsInsideGitRepo = await utils.dirIsInsideGitRepo(destPath);

	if (dirIsInsideGitRepo) {
		spinner.message("Docs are inside a Git repo, skipping");

		return;
	}

	try {
		await utils.initGit({
			cwd: destPath,
		});
	} catch {
		spinner.stop("Failed to initialize Git repo, skipping");
	}

	spinner.stop("Successfully intialized Git repo");
}

/** @type{import("poopgen").BeforeFn} */
export async function before(ctx) {
	p.intro("create-mint");

	const nameInput = await p.text({
		message: "What would you like your docs to be called?",
		defaultValue: "Mint Starter Kit",
	});

	if (p.isCancel(nameInput)) {
		cancel();
	}

	const { name, dir } = utils.parseProjectName(nameInput, ctx.dir.path);

	// set the output directory
	ctx.dir.path = dir;

	if (fs.existsSync(dir)) {
		if (fs.readdirSync(dir).length > 0) {
			p.cancel(`Directory '${dir}' already exists and is not empty, aborting`);
			process.exit(1);
		}
	}

	const themeInput = await p.select({
		message: "Which theme would you like to use?",
		options: [
			{
				value: "mint",
				label: "Mint",
				hint: "Classic documentation theme with time-tested layouts and familiar navigation",
			},
			{
				value: "almond",
				label: "Almond",
				hint: "Card-based organization meets minimalist design for intuitive navigation.",
			},
			{
				value: "aspen",
				label: "Aspen",
				hint: "Modern documentation crafted for complex navigation and custom components.",
			},
			{
				value: "linden",
				label: "Linden",
				hint: "Retro terminal vibes with monospace fonts for that 80s hacker aesthetic.",
			},
			{
				value: "maple",
				label: "Maple",
				hint: "Modern, clean aesthetics perfect for AI and SaaS products",
			},
			{
				value: "palm",
				label: "Palm",
				hint: "Sophisticated fintech theme with deep customization for enterprise documentation",
			},
			{
				value: "willow",
				label: "Willow",
				hint: "Stripped-back essentials for distraction-free documentation",
			},
		],
	});

	if (p.isCancel(themeInput)) {
		cancel();
	}

	// build the `docs.json` file

	const configFileEntry = /** @type {import("poopgen").FileEntry} */ (
		ctx.dir.entries.find((entry) => entry.path === "docs.json")
	);

	const config = JSON.parse(configFileEntry.content);

	config.name = name;
	config.theme = themeInput;

	// replace the contents with the updated docs.json
	configFileEntry.content = JSON.stringify(config, null, "\t");
}

/** @type{import("poopgen").AfterFn} */
export async function after(ctx) {
	const destDir = ctx.dir.path;

	p.log.success("Created docs!");

	const shouldInitGit = await p.confirm({
		message: "Would you like to init a Git repo?",
	});

	if (p.isCancel(shouldInitGit)) {
		cancel();
	}

	if (shouldInitGit) {
		await initGit(destDir);
	}

	// log next steps

	const docsPath = path.relative(process.cwd(), destDir);

	p.outro(
		stripIndent`
			Next steps:
			    1. cd ${docsPath}
			    2. mint dev
		`
	);
}
