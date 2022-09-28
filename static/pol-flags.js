window.addEventListener("load", function (event) {
	const boardFlags = {
		"ac": "Anarcho-Capitalist",
		"an": "Anarchist",
		"bl": "Black Nationalist",
		"cf": "Confederate",
		"cm": "Communist",
		"ct": "Catalonia",
		"dm": "Democrat",
		"eu": "European",
		"fc": "Fascist",
		"gn": "Gadsden",
		"gy": "Gay",
		"jh": "Jihadi",
		"kn": "Kekistani",
		"mf": "Muslim",
		"nb": "National Bolshevik",
		"nz": "Nazi",
		"pc": "Hippie",
		"pr": "Pirate",
		"re": "Republican",
		"tm": "Templar",
		"tr": "Tree Hugger",
		"un": "United Nations",
		"wp": "White Supremacist",
		"nt": "NATO",
		"mz": "Task Force Z"
	};

	for (const iElement of document.getElementsByClassName("board-flag")) {
		const boardFlag = iElement.getAttribute("data-board-flag");
		const boardFlagDescription = boardFlags[boardFlag];

		if (boardFlagDescription !== undefined) {
			iElement.setAttribute("title", boardFlagDescription);
		}
	}
});
