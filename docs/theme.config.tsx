import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
	logo: <span>📑 Documentation</span>,
	project: {
		link: "https://github.com/shuding/nextra-docs-template",
	},
	docsRepositoryBase: "https://gitlab.com/StevenSermeus/projet-unamur-secu-app",
	footer: {
		text: "Documentation powered by Nextra",
	},
	toc: {
		float: true,
	},
};

export default config;
