/*
 * Yes, this code isn't great, but it's small and works even in IE10.
 * I wasn't configuring babel/webpack for a one off fun project.
 */

(function() {
	// Non-interactive scoreboard: load contestants from ./scores.csv
	var contestants = [];

	var main = document.querySelector("main");
	var playButton = document.querySelector("#play-button");

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

		for (var i = 0; i < lines.length; ++i) {
			var parts = lines[i].split(",");
			if (parts.length < 2) continue;
			var imageName = parts[0].trim();
			var scoreVal = parseFloat(parts[1].trim());
			if (!imageName || isNaN(scoreVal)) continue;
			addContestantFromData("./images/participants/" + imageName, scoreVal);
		}
	}

	function loadCSV() {
		fetch("./scores.csv").then(function(res) {
			if (!res.ok) throw new Error("HTTP " + res.status);
			return res.text();
		}).then(function(text) {
			parseCSV(text);
			if (contestants.length === 0) {
				showFallback('No valid entries found in scores.csv');
				return;
			}
			refreshContestants();
			resize();
		}).catch(function(err) {
			console.error("Failed to load scores.csv:", err);
			showFallback('Failed to load scores.csv. If you are opening index.html directly from disk, use a local HTTP server or load a CSV file below.');
		});
	}

	function loadCSVFromFile(file) {
		var reader = new FileReader();
		reader.onload = function(evt) {
			contestants = [];
			parseCSV(evt.target.result);
			if (contestants.length === 0) {
				showFallback('No valid entries found in that CSV file');
				return;
			}
			refreshContestants();
			resize();
		};
		reader.readAsText(file);
	}

	function showFallback(msg) {
		main.innerHTML = "";
		var el = document.createElement('div');
		el.className = 'csv-fallback';
		el.style.padding = '40px';
		el.style.textAlign = 'center';
		el.style.color = '#fff';
		el.style.fontFamily = 'veteran_typewriter, sans-serif';
		el.style.fontSize = '20px';
		el.innerText = msg + '\n\nUse a scores.csv file with lines: image_name,score';
		main.appendChild(el);

		var fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = '.csv';
		fileInput.style.display = 'none';
		fileInput.addEventListener('change', function() {
			if (fileInput.files && fileInput.files[0]) {
				loadCSVFromFile(fileInput.files[0]);
			}
		});
		main.appendChild(fileInput);

		var button = document.createElement('button');
		button.innerText = 'Choose scores.csv file';
		button.style.marginTop = '16px';
		button.style.padding = '12px 18px';
		button.style.fontSize = '18px';
		button.style.cursor = 'pointer';
		button.addEventListener('click', function() {
			fileInput.click();
		});
		main.appendChild(button);
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

	loadCSV();
})();