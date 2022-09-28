//Fix the theme
const linkElement = document.getElementById('main-css-link');
if (window.localStorage.getItem('themeUrl') !== null) {
	const themeUrl = window.localStorage.getItem('themeUrl');
	linkElement.href = themeUrl;
}

//MathJax configuration
if (document.documentElement.getAttribute('data-enable-latex') === 'true') {
	window.MathJax = {
		tex: {
			inlineMath: [['[math]', '[/math]'], ['[eqn]', '[/eqn]']]
		},
		svg: {
			fontCache: 'global'
		}
	};
}

//Shows the element with id elementId next to the event target
function showElementOnMouseOver(elementId) {
	return function(event) {
		//Check if we haven't already created the hovering clone element
		const clone = document.getElementById('quote-preview');
		if (clone) {
			return;
		}

		const element = document.getElementById(elementId);
		const rect = element.getBoundingClientRect();

		//Check if the element is on the viewport
		if (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= document.documentElement.clientHeight &&
			rect.right <= document.documentElement.clientWidth
		) {
			//If it is we just highlight it
			element.classList.add('force-target');
		} else {
			//Otherwise we clone it and position it below the link
			//This is kind of half assed and I should copy what 4chan does later
			const clone = element.cloneNode(true);

			//Fix an ID for later removal
			clone.id = 'quote-preview';
			//Ensure it has a background
			clone.classList.remove('reisen-post-op');
			clone.classList.add('reisen-post-reply');
			clone.style.position = 'fixed';
			clone.style.marginBottom = '0px';

			const aRect = event.target.getBoundingClientRect();

			//Check if the link is further up or down and then
			//position accordingly
			//
			//inb4 'why are you dividing both sides by 2' because fuck you
			if (document.documentElement.clientHeight/2 < (aRect.top + aRect.bottom)/2) {
				clone.style.bottom = (document.documentElement.clientHeight - aRect.top) + 'px';
			} else {
				clone.style.top = aRect.bottom + 'px';
			}

			//Check if the link is further to the left or the right
			//and then position it accordingly
			if (document.documentElement.clientWidth/2 < (aRect.left + aRect.right)/2) {
				clone.style.right = (document.documentElement.clientWidth - aRect.right) + 'px';
			} else {
				clone.style.left = aRect.left + 'px';
			}

			//append it to the <body> element
			document.body.appendChild(clone);
		}
	}
}

//Hides the quote-preview
function hideElementOnMouseExit(elementId) {
	return function(event) {
		//Remove the highlight class
		const element = document.getElementById(elementId);
		element.classList.remove('force-target');

		//Remove the hovering clone
		const elementClone = document.getElementById('quote-preview');
		if (elementClone) {
			elementClone.parentElement.removeChild(elementClone);
		}
	}
}

//Ensures the quote-preview vanishes whenever the user scrolls
document.addEventListener('scroll', function(event) {
	const el = document.getElementById('quote-preview');

	if (el) {
		el.parentNode.removeChild(el);
	}
});

//Load event. Most of the code is in here
window.addEventListener('load', function(event) {
	//Global variables
	const quoteLinkRegex = /^>>\d+$/;
	const toggleRegex = /^toggle\('.*'\)$/;
	const board = document.documentElement.getAttribute('data-board');
	const oekakiUrl = document.documentElement.getAttribute('data-oekaki-url');
	const enableTegaki = document.documentElement.getAttribute('data-enable-tegaki') === 'true';
	const themeSelect = document.getElementById('theme-select');

	//Doing stuff proper
	for (const reisenPost of document.getElementsByClassName('reisen-post')) {
		const postNumber = reisenPost.id.substring(1);


		for (const deadLinkElement of reisenPost.getElementsByClassName('deadlink')) {
			const aElement = document.createElement('a');

			aElement.textContent = deadLinkElement.textContent;

			deadLinkElement.parentNode.replaceChild(aElement, deadLinkElement);
		}

		for (const aElement of reisenPost.getElementsByTagName('a')) {
			if (aElement.classList.contains('reisen-backlink')) {
				continue;
			} else if (aElement.textContent.match(quoteLinkRegex)) {
				const postNumberReferenced = aElement.textContent.substring(2);

				//Fix search quotelinks
				if (reisenPost.classList.contains('reisen-post-ambiguous') || reisenPost.classList.contains('reisen-thread')) {
					aElement.href = '/' + board + '/post/' + postNumberReferenced;
				} else if (reisenPost.classList.contains('reisen-post-op') || reisenPost.classList.contains('reisen-post-reply')) {
					const quoteLinksHolder = document.getElementById('quoteLinks' + postNumberReferenced);

					if (quoteLinksHolder) {
						//Ensure the link is correct.
						aElement.href = '#p' + postNumberReferenced;
						aElement.onmouseover = showElementOnMouseOver('p' + postNumberReferenced);
						aElement.onmouseleave = hideElementOnMouseExit('p' + postNumberReferenced);

						//Inject quotelink
						const quoteLink = document.createElement('a');

						quoteLink.textContent = '>>' + postNumber;
						quoteLink.href = '#' + reisenPost.id;
						quoteLink.onmouseover = showElementOnMouseOver(reisenPost.id);
						quoteLink.onmouseleave = hideElementOnMouseExit(reisenPost.id);
						quoteLink.classList.add('reisen-backlink');

						quoteLinksHolder.appendChild(quoteLink);
					} else {
						//Correct the link.
						aElement.href = '/' + board + '/post/' + postNumberReferenced;
					}
				}
			} else if (aElement.href.substring(0, 19) === 'javascript:oeReplay') {
				//Fix oekaki links
				if (enableTegaki) {
					const oekakiInternalHash = reisenPost.getAttribute('data-oekaki-internal-hash');
					//Point the href to the post element for convenience
					aElement.href = '#' + reisenPost.id;

					if (oekakiInternalHash) {
						//We need to do this song and dance
						//to inject the hash because of the for loop
						aElement.onclick = function(oekakiInternalHash) {
							return function() {
								Tegaki.open({
									replayMode: true,
									replayURL: `${oekakiUrl}/${oekakiInternalHash}`
								});
							}
						}(oekakiInternalHash);
					} else {
						aElement.textContent += ' (Unavailable)';
					}
				}
			} else if (aElement.getAttribute('onclick')) {
				//The href is something like 'javascript:void(0)',
				//which causes CSP issues with the onclick action.
				aElement.href = '#' + reisenPost.id;

				const rawOnclick = aElement.getAttribute('onclick');
				//CSP should, unless you've misconfigured it,
				//prevent the onclick from working (which is good and secure).
				//Hence, we need to fix it (but just toggles).
				if (rawOnclick.match(toggleRegex)) {
					const toggleId = rawOnclick.substring(8, rawOnclick.length - 2);
					aElement.onclick = function(toggleId) {
						return function() {
							const element = document.getElementById(toggleId);

							if (element) {
								element.classList.toggle('hidden');
							}
						}
					}(toggleId);
				}
			}
		}

		//Add in report button
		const postNameP = reisenPost.getElementsByClassName('post-name-p')[0];
		
		const reportButton = document.createElement('span');
		reportButton.textContent = 'Report';
		reportButton.classList.add('report-button');
		reportButton.onclick = function(board, postNumber) {
			return function() {
				window.open(`/${board}/report/${postNumber}`, '_blank', 'popup,width=400,height=310');
			}
		}(board, postNumber);

		postNameP.appendChild(reportButton);
	}

	//Hide the exif tables by default
	for (const exifTable of document.getElementsByClassName('exif')) {
		exifTable.classList.add('hidden');
	}

	const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		weekday: 'short',
		hour: 'numeric',
		hour12: false,
		minute: 'numeric',
		second: 'numeric',
		timeZoneName: 'shortOffset'
	});
	for (const postDate of document.getElementsByClassName('post-date')) {
		const d = new Date(postDate.getAttribute('data-json-time'));
		postDate.textContent = ` at ${dateTimeFormat.format(d)} `;
	}

	//Mark the correct theme in the select as selected
	if (window.localStorage.getItem('themeName') !== null) {
		const themeName = window.localStorage.getItem('themeName');

		for (const optionElement of themeSelect.getElementsByTagName('option')) {
			optionElement.selected = optionElement.textContent == themeName;

			//Patch the href link in case it's been modified
			if (optionElement.selected && linkElement.href != optionElement.value) {
				window.localStorage.setItem('themeUrl', optionElement.value);
				linkElement.href = optionElement.value;
			}
		}
	}

	themeSelect.onchange = function(event) {
		for (const optionElement of themeSelect.getElementsByTagName('option')) {
			if (optionElement.selected) {
				window.localStorage.setItem('themeUrl', optionElement.value);
				window.localStorage.setItem('themeName', optionElement.textContent);
				linkElement.href = optionElement.value;

				break;
			}
		}
	}
});

