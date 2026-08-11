/*
 * Yes, this code isn't great, but it's small and works even in IE10.
 * I wasn't configuring babel/webpack for a one off fun project.
 */

(function() {
	var contestants = [];
	var main = document.querySelector("main");
	var playButton = document.querySelector("#play-button");
	var datasetOptions = ["Choose CSV", "Season"];

	for (var i = 1; i <= 13; ++i) {
		datasetOptions.push("Episode " + i);
	}

	function getImageUrl(imageName) {
		// Try to find the image as .png first, then .gif
		var basePath = "./images/participants/";
		var imagePath = basePath + imageName;
		var pngPath = imagePath.endsWith(".png") || imagePath.endsWith(".gif") ? imagePath : imagePath + ".png";
		var gifPath = pngPath.replace(".png", ".gif");

		return new Promise(function(resolve) {
			var img = new Image();
			img.onload = function() {
				resolve(pngPath);
			};
			img.onerror = function() {
				resolve(gifPath);
			};
			img.src = pngPath;
		});
	}

	function addContestantFromData(imageUrl, score) {
		var contestant = {};
		contestant.image = imageUrl;
		contestant.score = score;
		contestant.oldScore = score;
		contestants.push(contestant);
		return contestants.length;
	}

	function createContestantEl(con, id) {
		var el = document.createElement("div");
		el.classList.add("contestant");

		var frameScaler = document.createElement("div");
		frameScaler.classList.add("frame-scaler");

		var frameContainer = document.createElement("div");
		frameContainer.classList.add("frame-container");
		frameContainer.style.webkitAnimationDelay = -id * 1.25 + "s";
		frameContainer.style.animationDelay = -id * 1.25 + "s";

		var fill = document.createElement("div");
		fill.classList.add("fill");
		fill.style.backgroundImage = "url(" + con.image + ")";

		var shadow = document.createElement("div");
		shadow.classList.add("shadow");

		var frame = document.createElement("img");
		frame.src = "./images/frame.png";
		frame.classList.add("frame");
		frame.removeAttribute("width");
		frame.removeAttribute("height");

		fill.appendChild(shadow);
		frameContainer.appendChild(fill);
		frameContainer.appendChild(frame);
		frameScaler.appendChild(frameContainer);

		var scoreContainer = document.createElement("div");
		scoreContainer.classList.add("score-container");

		var seal = document.createElement("img");
		seal.classList.add("seal");
		seal.src = "./images/seal.png";
		seal.removeAttribute("width");
		seal.removeAttribute("height");

		var score = document.createElement("h1");
		score.classList.add("score");
		score.innerText = con.score;

		scoreContainer.appendChild(seal);
		scoreContainer.appendChild(score);

		el.appendChild(frameScaler);
		el.appendChild(scoreContainer);

		return el;
	}

	function transformContestants() {
		if (!contestants || contestants.length === 0) return;

		contestants.sort(function(first, second) {
			return first.score - second.score;
		});

		var maxScore = contestants[contestants.length - 1].score;
		var maxCount = 1;

		for (var i = contestants.length - 1; i > 0; --i) {
			var conPrev = contestants[i - 1];
			if (conPrev.score == maxScore) {
				++maxCount;
			}
		}

		for (var i = 0, l = contestants.length; i < l; ++i) {
			var con = contestants[i];

			con.el.style.msTransform = "translateX(" + (275 * i + 30) + "px)";
			con.el.style.transform = "translateX(" + (275 * i + 30) + "px)";

			if (con.score == maxScore) {
				if (maxCount > 2) {
					con.el.children[0].classList.remove("larger");
					con.el.children[0].classList.add("large");
				} else {
					con.el.children[0].classList.remove("large");
					con.el.children[0].classList.add("larger");
				}
			} else {
				con.el.children[0].classList.remove("large");
				con.el.children[0].classList.remove("larger");
			}
		}
	}

	function refreshContestants() {
		main.innerHTML = "";

		for (var i = 0; i < contestants.length; ++i) {
			var con = contestants[i];
			var cEl = createContestantEl(con, i + 1);
			con.el = cEl;
		}

		if (contestants.length > 0) transformContestants();

		for (var j = 0; j < contestants.length; ++j) {
			main.appendChild(contestants[j].el);
		}
	}

	function parseCSV(text) {
		var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
		var promises = [];

		for (var i = 0; i < lines.length; ++i) {
			var parts = lines[i].split(",");
			if (parts.length < 2) continue;
			var imageName = parts[0].trim();
			var scoreVal = parseFloat(parts[1].trim());
			if (!imageName || isNaN(scoreVal)) continue;
			
			(function(name, score) {
				promises.push(
					getImageUrl(name).then(function(url) {
						addContestantFromData(url, score);
					})
				);
			})(imageName, scoreVal);
		}

		return Promise.all(promises);
	}

	function getDatasetPath(optionValue) {
		if (!optionValue || optionValue === "Season") {
			return "./scores/season.csv";
		}

		var episodeNumber = parseInt(optionValue.replace("Episode ", ""), 10);
		if (isNaN(episodeNumber)) {
			return "./scores/season.csv";
		}

		return "./scores/episode-" + String(episodeNumber).padStart(2, "0") + ".csv";
	}

	function loadCSV(url, label) {
		var fileLabel = label || url;
		contestants = [];
		fetch(url).then(function(res) {
			if (!res.ok) throw new Error("HTTP " + res.status);
			return res.text();
		}).then(function(text) {
			return parseCSV(text);
		}).then(function() {
			if (contestants.length === 0) {
				showFallback('No valid entries found in ' + fileLabel);
				return;
			}
			refreshContestants();
			resize();
		}).catch(function(err) {
			console.error("Failed to load " + fileLabel + ":", err);
			showFallback('Failed to load ' + fileLabel + '. Choose another CSV file or pick a different season/episode.');
		});
	}

	function loadCSVFromFile(file) {
		var reader = new FileReader();
		reader.onload = function(evt) {
			contestants = [];
			parseCSV(evt.target.result).then(function() {
				if (contestants.length === 0) {
					showFallback('No valid entries found in that CSV file');
					return;
				}
				refreshContestants();
				resize();
			});
		};
		reader.readAsText(file);
	}

	function showFallback(msg) {
		main.innerHTML = "";
		var controls = document.createElement('div');
		controls.style.display = 'flex';
		controls.style.alignItems = 'center';
		controls.style.justifyContent = 'center';
		controls.style.gap = '12px';
		controls.style.flexWrap = 'wrap';
		controls.style.padding = '30px 20px';
		controls.style.boxSizing = 'border-box';
		controls.style.width = '100%';
		controls.style.maxWidth = '760px';
		controls.style.margin = '0 auto';

		var fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.csv';
		fileInput.style.display = 'none';
		fileInput.addEventListener('change', function() {
			if (fileInput.files && fileInput.files[0]) {
				loadCSVFromFile(fileInput.files[0]);
			}
		});

		var button = document.createElement('button');
		button.innerText = 'Choose CSV file';
		button.style.padding = '12px 18px';
		button.style.fontSize = '18px';
		button.style.cursor = 'pointer';
		button.style.display = 'none';
		button.addEventListener('click', function() {
			fileInput.click();
		});

		var select = document.createElement('select');
		select.style.padding = '12px 18px';
		select.style.fontSize = '18px';
		select.style.cursor = 'pointer';
		select.style.minWidth = '170px';
		datasetOptions.forEach(function(optionName) {
			var option = document.createElement('option');
			option.value = optionName;
			option.textContent = optionName;
			select.appendChild(option);
		});
		select.value = 'Choose CSV';
		button.style.display = 'inline-block';
		select.addEventListener('change', function() {
			var selected = select.value;
			button.style.display = selected === 'Choose CSV' ? 'inline-block' : 'none';
			if (selected === 'Choose CSV') {
				return;
			}
			var path = getDatasetPath(selected);
			if (selected === 'Season') {
				loadCSV(path, 'scores/season.csv');
				return;
			}
			loadCSV(path, 'scores/' + selected.replace(' ', '-') + '.csv');
		});

		controls.appendChild(button);
		controls.appendChild(select);
		main.appendChild(controls);

		var el = document.createElement('div');
		el.className = 'csv-fallback';
		el.style.padding = '10px 40px 40px';
		el.style.textAlign = 'center';
		el.style.color = '#fff';
		el.style.fontFamily = 'veteran_typewriter, sans-serif';
		el.style.fontSize = '20px';
		el.innerText = msg + '\n\nUse a CSV file with lines: image_name,score';
		main.appendChild(el);
		main.appendChild(fileInput);
	}

	function resize() {
		var w = window.innerWidth;
		var h = window.innerHeight;

		var wm = 1400 * ((contestants.length) / 5);

		var m = Math.min(w / wm, h / 1080);

		main.style.msTransform = "scale(" + m + ")";
		main.style.transform = "scale(" + m + ")";

		main.style.left = (w - wm * m) / 2 + "px";
	}

	if (playButton) playButton.style.display = "none";

	window.addEventListener("resize", resize);

	showFallback('Select a CSV file or choose a season/episode from the dropdown.');
})();