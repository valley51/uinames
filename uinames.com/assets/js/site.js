function addListener(li, ev, fn) {
	var ev = ev.split(' ');

	for (var i = 0, l = ev.length; i < l; i++) {
		if (li && window.addEventListener) {
			li.addEventListener(ev[i], fn, false);
		} else if (li && window.attachEvent) {
			li.attachEvent('on' + ev[i], fn);
		}
	}
}

function hasClass(elem, klass) {
	return (' ' + elem.className + ' ').indexOf(' ' + klass + ' ') > -1;
}

function addClass(elem, klass) {
	if (!hasClass(elem, klass)) {
		elem.className += (elem.className === '') ? klass : (' ' + klass);
	}
}

function removeClass(elem, klass) {
	if (hasClass(elem, klass)) {
		var pattern = new RegExp('(^| )' + klass + '( |$)');
		elem.className = elem.className.replace(pattern,'$1').replace(/ $/,'');
	}
}

function clearClasses(array, length, class_string) {
	while (length--) {
		removeClass(array[length], class_string);
	}
}

function setAttribute(array, length, attribute, class_string) {
	while (length--) {
		var value = hasClass(array[length], class_string);
		array[length].setAttribute(attribute, value);
	}
}

function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function selectThis(elem) {
	var range, selection,
		elem = (elem instanceof Element) ? elem : this;
	if (document.body.createTextRange) {
		range = document.body.createTextRange();
		range.moveToElementText(elem);
		range.select();
	} else if (window.getSelection) {
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(elem);
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

(function() {
	var body = document.getElementsByTagName('body')[0],
		nameContainer = document.getElementById('name'),
		genders = document.getElementById('genderSelect').getElementsByTagName('a'),
		infoToggle = document.getElementsByClassName('info')[0],
		regionSelect = document.getElementsByClassName('icon region')[0],
		regionBox = document.getElementById('region'),
		searchInput = region.getElementsByTagName('input')[0],
		availableRegions = regionBox.getElementsByTagName('li'),
		infoBox = document.getElementById('info');

	// so we don't tab into invisible things
	infoBox.style.display = 'none';
	regionBox.style.display = 'none';

	// MOUSE DETECTION
	addListener(body, 'mousedown keydown', function(e) {
		return (e.type == 'mousedown') ? addClass(body,'mouseDetected') : removeClass(body,'mouseDetected');
	});

	// REGION SWITCHER
	function regionToggle(elem) {
		var l = availableRegions.length,
			current = (elem.nodeType == 1) ? elem : this;

		clearClasses(availableRegions, l, 'active');
		addClass(current, 'active');
		
		// switch to new region
		var regionName = current.getElementsByClassName('region-label')[0].innerHTML,
			b = regionSelect.getElementsByTagName('b')[0];
		localStorage.setItem('region', regionName);
		
		// update the flag in the region icon
		regionSelect.getElementsByTagName('img')[0].src = current.getElementsByTagName('img')[0].getAttribute('data-src');

		// update the textual name in the region icon
		b.innerHTML = regionName + ' selected';
		
		// wait 250ms so the user can see the region being switched
		setTimeout(function() {
			closePopup();
		}, 250);
	}
	
	for (var i = 0; i < availableRegions.length; i++) {
		addListener(availableRegions[i], 'click', regionToggle);
	}

	// select region from local storage if saved
	var storedRegion = localStorage.getItem('region');
	if (storedRegion) {
		for (var i = 0, n = availableRegions.length; i < n; i++) {
			if (storedRegion == availableRegions[i].getElementsByClassName('region-label')[0].innerHTML) {
				availableRegions[i].click();
				break;
			}
		}
	}
	
	// CONNECTION TO THE API
	var namesRequested = 0,
		maxNamesRequested = 25,
		data, oldRegion, oldGender;
	
	function getName(e) {
		// set parameters based on settings
		var region = regionBox.getElementsByClassName('active')[0].getElementsByClassName('region-label')[0].innerHTML.toLowerCase().replace(/ /g, '+'),
			gender = genders[0].parentNode.getElementsByClassName('active')[0].hash.substr(1),
			bulkToggle = document.getElementById('bulk').getElementsByClassName('icon')[0];
		
		// function that injects all the data on the page
		function injectData(data, offset) {
			var specs = document.getElementById('data');
			
			// insert name into page
			nameContainer.innerHTML = '<h1>' + data[offset]['name'] + ' ' + data[offset]['surname'] + '</h1>';
			
			// insert additional data into page
			var specsData = '';
			specsData += '<li><span class="label">Gender:</span> <span class="click-to-select">' + capitalize(data[offset]['gender']) + '</span></li>';
			specsData += '<li><span class="label">Region:</span> <span class="click-to-select">' + data[offset]['region'] + '</span></li>';
			specsData += '<li><span class="label">Phone:</span> <span class="click-to-select">' + data[offset]['phone'] + '</span></li>';
			specsData += '<li><span class="label">Birthday:</span> <span class="click-to-select">' + data[offset]['birthday']['dmy'] + '</span></li>';
			specsData += '<li><span class="label">Email:</span> <span class="click-to-select">' + data[offset]['email'] + '</span></li>';
			specsData += '<li><span class="label">Password:</span> <span class="click-to-select">' + data[offset]['password'] + '</span></li>';
			
			var photo = '<div class="photo-container"><a href="' + data[offset]['photo'] + '" target="_blank" class="photo"><img src="' + data[offset]['photo'].replace(/http:\/\/uinames\.com\//, '') + '" /></a><a href="http://uifaces.com" target="_blank">More</a></div>';
			
			specs.innerHTML = '<a id="data-open">Show Details</a><div>' + photo + '<ul>' + specsData + '</ul><a id="data-exit"></a></div>';
			
			var dataVals = document.getElementsByClassName('click-to-select');
			for (var i = 0; i < dataVals.length; i++) {
				addListener(dataVals[i], 'click', selectThis);
			}
			
			addListener(document.getElementById('data-exit'), 'click', function() {
				addClass(specs, 'closed');
			});
			
			addListener(document.getElementById('data-open'), 'click', function() {
				removeClass(specs, 'closed');
			});
			
			// if bulk mode, add the other 24
			if (hasClass(bulkToggle, 'active')) {
				namesRequested = maxNamesRequested;
				nameContainer.innerHTML = '';
				
				if (!hasClass(body, 'bulk')) {
					addClass(body, 'bulk');
				}
				
				// inject names, genders and regions into page
				for (var i = 0; i < namesRequested; i++) {
					nameContainer.innerHTML += '<h1>' + data[i]['name'] + ' ' + data[i]['surname'] + '</h1><p>' + capitalize(data[i]['gender']) + ' from ' + data[i]['region'] + '</p>';
				}

				// pause requests to stop overly excited users
				addClass(body, 'bulkPause');

				// bulk toggle count-down
				var bulkCache = bulkToggle.innerHTML,
					count = 11;

				var interval = setInterval(function() {
					bulkToggle.innerHTML = count - 1;
					bulkToggle.style.lineHeight = '200%';
					if (count <= 0 || !hasClass(bulkToggle, 'active')) {
						bulkToggle.innerHTML = bulkCache;
						removeClass(body, 'bulkPause');
						bulkToggle.style.lineHeight = '';
						clearInterval(interval);
					}
					count--;
				}, 600);

				// reset name node and count
				namesRequested = maxNamesRequested;
			} else {
				removeClass(body, 'bulk');
			}

			nameContainer.style.display = '';
			specs.style.display = '';

			// count generated name
			var getJSON = new XMLHttpRequest();
			getJSON.open('POST', 'api/counter.php', true);
			getJSON.send();
		}

		function injectNewData() {
			// get new names from api
			var getJSON = new XMLHttpRequest();
			getJSON.onreadystatechange = function() {
				if (getJSON.readyState == 4 && getJSON.status == 200) {
					data = JSON.parse(getJSON.responseText);
					injectData(data, 0);
				}
			};

			// send the request
			getJSON.open('GET', 'api/?ext&amount=' + maxNamesRequested + '&region=' + region + '&gender=' + gender, true);
			getJSON.send();

			// reset counter
			namesRequested = 0;
		}

		// detect end of road or a change in settings
		if (namesRequested == 0 || namesRequested >= maxNamesRequested || oldRegion != region || oldGender != gender || hasClass(bulkToggle, 'active')) {
			injectNewData();
		} else {
			injectData(data, namesRequested);
		}

		// update flags
		namesRequested++;
		oldRegion = region;
		oldGender = gender;
	}
	
	// GENDER TOGGLE
	function toggleGender(e) {
		e.preventDefault();
		e.stopPropagation();
		
		if (!hasClass(this, 'active')) {
			var l = genders.length;
			clearClasses(genders, l, 'active');
			addClass(this, 'active');
			setAttribute(genders, l, 'aria-pressed', 'active');
		}
	}
    
	for (var i = 0; i < genders.length; i++) {
		addListener(genders[i], 'click', toggleGender);
	}
	
	// BULK TOGGLE
	var bulk = document.getElementById('bulk').getElementsByClassName('icon bulk')[0];

	function toggleBulk(e) {
		e.preventDefault();
		e.stopPropagation();
		
		if (hasClass(bulk, 'active')) {
			removeClass(bulk, 'active');
		} else {
			addClass(bulk, 'active');
		}
		bulk.setAttribute('aria-pressed', hasClass(bulk, 'active'));
	}
    
	addListener(bulk, 'click', toggleBulk);
	
	// whoever opens popups, to get the focus when they're closed
	var trigger;
	
	// POPUP CLOSER
	function closePopup() {
		var name = body.getAttribute('data-popup'),
			popup = document.getElementById(name);
		
		if (name == 'region') {
			regionBox.getElementsByTagName('input')[0].blur();
			document.getElementById('destination').focus();
			searchInput.removeEventListener('keyup', search);
		}
		// no popup onload, prevent tabbing through invisibles
		if (popup) {
			popup.style.display = 'none';
		}
		// no trigger onload, prevent hocus-focus
		if (trigger && !hasClass(body, 'mouseDetected')) {
			trigger.focus();
		}
		
		body.removeAttribute('data-popup');
	}
	
	// POPUP TOGGLE
	function togglePopup(e) {
		e.preventDefault();
		e.stopPropagation();
		
		// reassign each time
		trigger = this;
	
		var name = (this.hash) ? this.hash.substr(1) : this.getAttribute('data-href'),
			box = document.getElementById(name),
			overlay = document.getElementById('overlay');
		
		if (body.getAttribute('data-popup') == name) {
			closePopup();
		} else {
			// lazy load images
			var lazyImages = document.getElementById(name).getElementsByClassName('lazy');
			for (var i = 0; i < lazyImages.length; i++) {
				(function(i) {
					setTimeout(function() {
						lazyImages[i].src = lazyImages[i].getAttribute('data-src');
					}, i*15);
				})(i);
			}
			
			// stopPropagation isn't really the right tool
			// sometimes still passes on to search input which now
			// listens to 'Enter'. So this nasty hack instead.
			if (name == 'region') {
				setTimeout(function() {
					addListener(searchInput, 'keyup', search);
				}, 150);
			}
			
			// let transitions work
			box.style.display = 'block';
			
			// show popup
			setTimeout(function() {
				body.setAttribute('data-popup', name);
			}, 50);
			
			// let's focus the input field if it's the region popup
			if (name == 'region') {
				regionBox.getElementsByTagName('input')[0].focus();
			}
		}
		
		addListener(overlay, 'click', closePopup);
	}
	
	addListener(infoToggle, 'click', togglePopup);
	addListener(regionSelect, 'click', togglePopup);

	// INFO TABS TOGGLE
	var tabs = document.getElementById('tabs').getElementsByTagName('a');

	function toggleTab(e) {
		e.preventDefault();
		e.stopPropagation();

		body.setAttribute('data-tab', this.getAttribute('data-set'));

		// let non-visual users know which tab is selected
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i],
				b = tab.getElementsByTagName('b')[0];

			b.innerHTML = '';
			if (tab == this) {
				b.innerHTML = '(Selected)';
			}
		}
	}
    
	for (var i = 0; i < tabs.length; i++) {
		addListener(tabs[i], 'click', toggleTab);
	}

	// REGION SEARCH
	var regions = regionBox.getElementsByTagName('li'),
		regionCount = regionBox.getElementsByClassName('regionCount')[0],
		contribute = regionBox.getElementsByClassName('contribute')[0];

	// REGION KEYBOARD NAVIGATION
	function comboNav(k, currentMatches) {
		var current, // array position
			length = currentMatches.length;

		for (var i = 0; i < length; i++) {
			var r = currentMatches[i];
			if (hasClass(r, 'highlight')) {
				current = i;
				break;
			}
		}
		if (current == undefined) {
			addClass(currentMatches[0], 'highlight');
			current = 0;
			return;
		}

		function next() {
			current = (current !== (length - 1)) ? (current + 1) : 0;
			clearClasses(currentMatches, length, 'highlight');
			addClass(currentMatches[current], 'highlight');
		}

		function prev() {
			current = (current !== 0) ? (current - 1) : (length - 1);
			clearClasses(currentMatches, length, 'highlight');
			addClass(currentMatches[current], 'highlight');
		}

		if (length > 1) {
			switch (k) {
				case 36:
					clearClasses(currentMatches, length, 'highlight');
					addClass(currentMatches[0], 'highlight');
					current = 0;
					break;
				case 35:
					clearClasses(currentMatches, length, 'highlight');
					addClass(currentMatches[length-1], 'highlight');
					current = length; 
					break;
				case 38:
					prev();
					break;
				case 40:
					next();
					break;
				default:
					break;
			}
		}

		searchInput.setAttribute('aria-activedescendant', currentMatches[current].id);

		if (k == 13) {
			regionToggle(document.getElementById(currentMatches[current].id));
		}
	}

	function search(e) {
		var k = e.which,
			regionMatches = regions.length;

		for (var i = 0, l = regions.length; i < l; i++) {
			var region = regions[i],
				regionValue = region.getElementsByClassName('region-label')[0].innerHTML.toLowerCase();
			
			if (regionValue.indexOf(searchInput.value.toLowerCase(), 0) == 0) {
				removeClass(region, 'inactive');
				regionMatches = regionMatches + 1;
			} else {
				if (!hasClass(region, 'inactive')) {
					addClass(region, 'inactive');
				}
				regionMatches = regionMatches - 1;
			}
		}

		regionCount.innerHTML = regionMatches / 2 + '/' + regions.length;
		contribute.style.display = (regionMatches == 0) ? '' : 'none';

		if (k == 35 || k == 36 || k == 38 || k == 40 || k == 13) {
			var currentMatches = [];

			for (var i = 0, l = regions.length; i < l; i++) {
				var r = regions[i];
				if (!hasClass(r, 'inactive')) {
					currentMatches.push(r);
				}
			}
			return comboNav(k, currentMatches);
		}
	}

	// SHORTCUTS
	addListener(window, 'click keyup touchstart', function(e) {
		var num = e.which || e.keyCode || e.type === 'touchstart' || 0;
		
		if (body.getAttribute('data-popup') != 'region' || num == 27) {
			if (num == 27) {
				closePopup();
			} else if (num == 32 && !body.getAttribute('data-popup') && !hasClass(body, 'bulkPause')) {
				getName(e);
			} else if (num == 'touchstart') {
				if (/(EM|H1)/.test(e.target.tagName) || e.target == body) {
					getName(e);
				}
			} else if (num == 48) {
				infoToggle.click();
			} else if (num == 49) {
				document.getElementsByClassName('icon random')[0].click();
			} else if (num == 50) {
				document.getElementsByClassName('icon male')[0].click();
			} else if (num == 51) {
				document.getElementsByClassName('icon female')[0].click();
			} else if (num == 52) {
				regionSelect.click();
			} else if (num == 53) {
				document.getElementsByClassName('icon bulk')[0].click();
			} else if (e.type == 'click' && e.target.tagName == 'H1') {
				selectThis(nameContainer);
			} else if (num == 67) {
				if (!hasClass(body, 'touch-device') && !hasClass(body, 'bulk') && !nameContainer.getElementsByTagName('em')[0]) {
					selectThis(nameContainer);
				}
			}
		}
	});
})();

(function() {

	var title = document.title;
	addListener(document, 'visibilitychange webkitvisibilitychange mozvisibilitychange msvisibilitychange', function() {
		document.title = document.hidden ? '👀 ' + title : title;
	});

})();

// STALKING CODE
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-46677803-1']);
_gaq.push(['_trackPageview']);

(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();