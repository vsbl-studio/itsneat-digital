import "./custom-styles.css";
import barba from "@barba/core";
import Lenis from "lenis";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

function barbaJS() {
	CustomEase.create("custom", "M0,0 C0.204,0 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");
	// Transition out function
	function transitionOut(data) {
		const prevContainer = data.current.container;
		const overlay = prevContainer.querySelector(".transition_overlay");
		const nextContainer = data.next.container;

		let tl = gsap.timeline();

		tl.set(overlay, {
			display: "block",
		})
			// debugger;
			.to(
				overlay,
				{
					opacity: 0.6,
					duration: 0.8,
					ease: "linear",
				},
				"<"
			)
			.to(
				prevContainer,
				{
					y: -400,
					duration: 1.8,
					// ease: "power3.inOut",
					ease: "custom",
				},
				"<"
			);
	}

	// Transition in function
	function transitionIn(data) {
		return new Promise((resolve) => {
			const prevContainer = data.current.container;
			const nextContainer = data.next.container;

			let tl = gsap.timeline({
				onComplete: () => {
					gsap.set(nextContainer, {
						position: "relative",
						zIndex: 1,
					});
					resolve();
				},
			});

			tl.to(nextContainer, {
				y: "0%",
				duration: 1.8,
				// ease: "power3.inOut",
				ease: "custom",
			});
		});
	}

	function setNextStyles(data) {
		return new Promise((resolve) => {
			gsap.set(data.next.container, {
				zIndex: 2,
				position: "fixed",
				y: "100vh",
				onComplete: () => {
					resolve();
				},
			});
		});
	}

	barba.init({
		preventRunning: true,
		debug: true,
		transitions: [
			{
				name: "slide-transition",
				sync: true,
				async beforeLeave(data) {
					await setNextStyles(data);
				},
				leave(data) {
					transitionOut(data);
				},

				beforeEnter() {
					initAfterTransition();
				},
				async enter(data) {
					await transitionIn(data);
				},
				after() {
					ScrollTrigger.refresh();
				},
			},
		],
	});
}

// Global lenis instance
let lenis;
function smoothScroll() {
	lenis = new Lenis({
		lerp: 0.1,
	});

	// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
	lenis.on("scroll", ScrollTrigger.update);

	// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
	// This ensures Lenis's smooth scroll animation updates on each GSAP tick
	gsap.ticker.add((time) => {
		lenis.raf(time * 1000); // Convert time from seconds to milliseconds
	});

	// Disable lag smoothing in GSAP to prevent any delay in scroll animations
	gsap.ticker.lagSmoothing(0);
}

function colorModeToggle() {
	const toggleBtn = document.querySelector('[data-color-toggle="btn"]');
	if (!toggleBtn) return;
	const htmlElement = document.documentElement;

	function changeColors(colorObj) {
		gsap.to(htmlElement, {
			...colorObj,
			duration: 0.5,
		});
	}

	function changeMode(targetMode) {
		if (targetMode === "light") {
			changeColors(lightColors);
			localStorage.setItem("dark-mode", false);
		} else {
			changeColors(darkColors);
			localStorage.setItem("dark-mode", true);
		}
	}

	toggleBtn.addEventListener("click", () => {
		if (localStorage.getItem("dark-mode") === "true") {
			changeMode("light");
		} else {
			changeMode("dark");
		}
	});

	const prefersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
	prefersDarkTheme.addEventListener("change", (e) => {
		if (e.matches) {
			changeMode("dark");
		} else {
			changeMode("light");
		}
	});
}

function logoShrinkAnimation() {
	const logo = document.querySelector('[data-logo-animation="logo"]');
	if (!logo) return;

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: "body",
			start: "top top",
			end: "+=380",
			ease: "linear",
			scrub: true,
		},
	});

	tl.to(logo, {
		width: "2rem",
	});
}

function menuAnimation() {
	const menu = document.querySelector('[data-menu-animation="menu"]');
	if (!menu) return;
	const dropdown = document.querySelector('[data-menu-animation="dropdown"]');

	// first button text element of each button/link
	const menuText = document.querySelectorAll('[data-menu-animation="text"]');
	let menuOpen = false;

	const computedStyles = window.getComputedStyle(dropdown);
	const initialBorderRadius = parseFloat(computedStyles.borderRadius); // Parse as a number

	const tl = gsap.timeline({
		paused: true,
		onStart: () => {
			menu.classList.add("is-open");
		},
		onReverseComplete: () => {
			menu.classList.remove("is-open");
		},
	});

	// 1. Set menu to display block
	tl.set(dropdown, {
		display: "block",
	})

		// 2. Animate dropdown
		.fromTo(
			dropdown,
			{
				width: 0,
				height: 0,
			},
			{
				width: "auto",
				height: "auto",
				// ease: "power3.out",
				ease: "custom",
				duration: 1,
			}
		)
		.fromTo(
			menuText,
			{
				y: "100%",
			},
			{
				y: 0,
				duration: 0.5,
				// ease: "power3.out",
				ease: "custom",
				onComplete: () => {
					// Clear GSAP's inline transform style
					menuText.forEach((el) => {
						gsap.set(el, { clearProps: "transform" });
					});
				},
			},
			"<+0.2"
		);

	function toggleMenu() {
		if (!menuOpen) {
			tl.play();
			menuOpen = true;
		} else {
			tl.reverse();
			menuOpen = false;
		}
	}

	menu.addEventListener("mouseover", toggleMenu);
	menu.addEventListener("mouseout", toggleMenu);
}

function partnersMarqueeAnimation() {
	const marqueeContent = document.querySelector(".marquee_content");
	if (!marqueeContent) return;

	const marqueeWidth = marqueeContent.offsetWidth + 20;

	let marqueeTween = gsap.to(".marquee_content", {
		x: -marqueeWidth,
		duration: 20,
		ease: "linear",
		repeat: -1,
	});

	// Speed adjustment function
	const updateSpeed = (speedFactor) => {
		gsap.to(marqueeTween, {
			timeScale: speedFactor,
			duration: 0, // Smooth transition to new speed
			ease: "linear",
		});
	};

	// ScrollTrigger integration
	ScrollTrigger.create({
		trigger: ".marquee",
		start: "top bottom",
		end: "bottom top",
		scrub: true,
		onUpdate: (self) => {
			const velocity = Math.abs(self.getVelocity()); // Get absolute scroll velocity (handles both up and down scrolling)
			const scrollSpeedFactor = Math.max(1, velocity / 100); // Scale speed proportionally to velocity
			updateSpeed(scrollSpeedFactor); // Update marquee speed dynamically
		},
		onLeave: () => {
			updateSpeed(1);
		},
		onEnterBack: () => {
			updateSpeed(1);
		},
	});
}

function customCursorAnimation() {
	const cursor = document.querySelector(".cursor");
	if (!cursor) return;

	const cursorTextWrap = cursor.querySelector("[data-cursor-wrap]");
	const cursorTextEl = cursor.querySelector("[data-cursor-text]");
	const cursorTriggers = document.querySelectorAll("[data-cursor-trigger]");

	// Event listeners for hover
	cursorTriggers.forEach((trigger) => {
		const customText = trigger.getAttribute("data-cursor-trigger");

		trigger.addEventListener("mouseenter", () => {
			cursorTextEl.textContent = customText; // Update cursor text
			gsap.set(cursor, {
				autoAlpha: 1,
			});

			gsap.to(cursor, {
				width: () => cursorTextWrap.offsetWidth, // Dynamically calculate width
				duration: 0.3,
				ease: "power3.inOut",
				overwrite: "auto", // Prevent conflicting animations
			});
		});

		trigger.addEventListener("mouseleave", () => {
			gsap.to(cursor, {
				width: 0,
				duration: 0.3,
				ease: "power3.inOut",
				overwrite: "auto", // Prevent conflicting animations
				onComplete: () => {
					gsap.set(cursor, {
						autoAlpha: 0,
					});
				},
			});
		});
	});

	// Set initial state of the cursor
	gsap.set(cursor, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

	// Follow the cursor
	window.addEventListener("pointermove", (e) => {
		gsap.set(cursor, { x: e.clientX, y: e.clientY - 8 });
	});
}

function footerParallax() {
	const footer = document.querySelector("footer");
	if (!footer) return;

	const footerContent = document.querySelector('[data-footer-parallax="content"]');
	const footerHeight = footerContent.scrollHeight;
	footer.style.height = footerHeight + "px";

	let tl = gsap.timeline({
		scrollTrigger: {
			trigger: footer,
			start: "top bottom",
			end: "bottom bottom",
			scrub: 0.01,
		},
	});

	tl.from(
		footerContent,
		{
			y: "40%",
			ease: "linear",
		},

		"<"
	);
}

function totalProjectsCount() {
	const projects = document.querySelectorAll('[data-projects-count="project"]');
	const projectsCounters = document.querySelectorAll('[data-projects-count="counter"]');
	if (!projects.length && !projectsCounters.length) return;

	const projectsCount = projects.length;

	projectsCounters.forEach((counter) => {
		counter.textContent = projectsCount;
	});
}

function projectCategoryItemsCount() {
	const filtersWrap = document.querySelector('[fs-cmsfilter-element="filters"]');
	if (!filtersWrap) return;

	const filtersTag = document.querySelector('[data-filters-tag="wrap"]');
	const filtersTagName = filtersTag.querySelector('[data-filters-tag="name"]');
	const filtersTagCounter = filtersTag.querySelector('[data-filters-tag="counter"]');

	function getCollectionCount(filterName) {
		// Change to lower case so it always works
		filterName = filterName.toLowerCase();

		const collectionPosts = document.querySelectorAll(`[data-project-category="${filterName}"]`);
		const collectionCount = collectionPosts.length;

		if (collectionCount > 0) {
			return collectionCount;
		} else {
			return 0;
		}
	}

	function setFiltersCounters(counters, resultsCount) {
		counters.forEach((counter) => {
			counter.textContent = resultsCount;
		});
	}

	function setFilterCount(element) {
		const filterValue = element.value.toLowerCase();
		const filterDomElement = element.element;
		const filterWrap = filterDomElement.closest('[data-filter-counter="wrap"]');
		const filterCounters = filterWrap.querySelectorAll('[data-filter-counter="counter"]');

		// Get items count for that category
		const collectionCount = getCollectionCount(filterValue);

		// Set the coutner content for that filter
		setFiltersCounters(filterCounters, collectionCount);
	}

	function filterTagController(filtersData) {
		const [filterValue] = filtersData.values;
		if (!filterValue) {
			filtersTag.classList.add("display-none");
		} else {
			// 1. Get active filter name and use it inside tag
			filtersTagName.textContent = filterValue;
			// 2. Get filter count and use it inside tag
			const count = getCollectionCount(filterValue.toLowerCase());

			filtersTagCounter.textContent = count;

			// 3. Display tag if filters are active
			filtersTag.classList.remove("display-none");
		}
	}

	window.fsAttributes = window.fsAttributes || [];
	window.fsAttributes.push([
		"cmsfilter",
		(filterInstances) => {
			// The callback passes a `filterInstances` array with all the `CMSFilters` instances on the page.
			const [filterInstance] = filterInstances;
			const [filtersData] = filterInstance.filtersData;
			const filterElements = filtersData.elements;

			filtersTag.addEventListener("click", () => {
				filterInstance.resetFilters();
			});

			filterElements.forEach((element) => {
				setFilterCount(element);
			});

			const listInstance = filterInstance.listInstance;
			listInstance.itemsPerPage = 2;
			filterInstance.listInstance.on("renderitems", (renderedItems) => {
				const totalItems = listInstance.validItems;
				filterTagController(filtersData);
			});
		},
	]);
}

function filtersDropdownAnimation() {
	const filters = document.querySelector('[data-filters-dropdown="filters"]');
	if (!filters) return;

	const button = filters.querySelector('[data-filters-dropdown="button"]');
	const buttonText = filters.querySelector('[data-filters-dropdown="text"]');
	const buttonIcon = filters.querySelector('[data-filters-dropdown="icon"]');
	const dropdown = filters.querySelector('[data-filters-dropdown="dropdown"]');

	// first button text element of each button/link
	const menuText = document.querySelectorAll('[data-filters-dropdown="filter-text"]');
	let filtersOpen = false;

	const computedStyles = window.getComputedStyle(dropdown);
	const initialBorderRadius = parseFloat(computedStyles.borderRadius); // Parse as a number

	const tl = gsap.timeline({
		paused: true,
	});

	tl.set(dropdown, {
		display: "block",
	})
		.fromTo(
			dropdown,
			{
				width: 0,
				height: 0,
			},
			{
				width: "auto",
				height: "auto",
				ease: "power3.out",
				duration: 0.6,
			}
		)
		.fromTo(
			menuText,
			{
				y: "100%",
			},
			{
				y: 0,
				duration: 0.3,
				ease: "power3.out",
				onComplete: () => {
					// Clear GSAP's inline transform style
					menuText.forEach((el) => {
						gsap.set(el, { clearProps: "transform" });
					});
				},
			},
			"<+0.1"
		);

	function filtersDropdown() {
		if (!filtersOpen) {
			tl.play();
			filtersOpen = true;
		} else {
			tl.reverse();
			filtersOpen = false;
		}
	}

	filters.addEventListener("mouseover", () => {
		filtersDropdown();
	});
	filters.addEventListener("mouseout", filtersDropdown);
}

function splitTextIntoLines() {
	const splitTargets = document.querySelectorAll('[data-split-text="target"]');
	if (!splitTargets) return;

	splitTargets.forEach((target) => {
		const splitText = new SplitType(target, { types: "lines" });
	});
}

function wrapLinesInMask() {
	const lines = document.querySelectorAll(".line");
	if (!lines.length) return;

	lines.forEach((line) => {
		// Create a wrapper div
		const wrapper = document.createElement("div");
		wrapper.classList.add("mask-wrap");

		// Wrap the element
		line.parentNode.insertBefore(wrapper, line);
		wrapper.appendChild(line);
	});
}

function maskTextRevealAnimation() {
	const maskWraps = document.querySelectorAll('[data-mask-reveal="wrap"]');
	if (!maskWraps.length) return;

	maskWraps.forEach((wrap) => {
		console.log(wrap);
		const lines = wrap.querySelectorAll(".line");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top 90%",
			},
		});

		tl.to(lines, {
			y: 0,
			stagger: 0.12,
			duration: 0.8,
			// ease: "power3.inOut",
			ease: "custom",
		});
	});
}

function textFadeInAnimation() {
	const targets = document.querySelectorAll('[data-fade-reveal="target"]');
	if (!targets.length) return;

	targets.forEach((target) => {
		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: target,
				start: "top 90%",
			},
		});

		tl.to(target, {
			y: 0,
			duration: 1.2,
			ease: "power3.out",
		}).to(
			target,
			{
				opacity: 1,
				duration: 1.2,
				// ease: "linear",
				ease: "power3.inOut",
			},
			"<"
		);
	});
}

function borderAnimation() {
	const borderTargets = document.querySelectorAll('[data-border-animation="target"]');
	if (!borderTargets.length) return;

	borderTargets.forEach((target) => {
		const horizontalDividers = target.querySelectorAll(".horizontal-divider");
		const verticalDividers = target.querySelectorAll(".vertical-divider");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: target,
				start: "top 90%",
			},
		});

		tl.to(horizontalDividers, {
			scaleX: 1,
			duration: 1.2,
			ease: "power3.inOut",
		}).to(
			verticalDividers,
			{
				scaleY: 1,
				duration: 1,
				ease: "power3.inOut",
			},
			"<"
		);
	});
}

function projectParallaxAnimation() {
	const parallaxImages = document.querySelectorAll("[data-project-parallax]");
	if (!parallaxImages.length) return;

	parallaxImages.forEach((wrap) => {
		const directionAttribute = wrap.getAttribute("data-project-parallax");
		const gsapDirectionValue = directionAttribute === "down" ? "15%" : "-15%";
		const image = wrap.querySelector("img");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top bottom",
				end: "bottom top",
				scrub: true,
			},
		});

		tl.to(image, {
			y: gsapDirectionValue,
			ease: "linear",
		});
	});
}

function projectImageMarquee() {
	const marqueeRows = document.querySelectorAll("[data-image-scroll]");
	if (!marqueeRows.length) return;

	marqueeRows.forEach((row) => {
		const directionAttribute = row.getAttribute("data-image-scroll");
		const gsapDirectionValue = directionAttribute === "left" ? "-15%" : "15%";

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: row,
				start: "top bottom",
				end: "bottom top",
				scrub: true,
			},
		});

		tl.to(row, {
			x: gsapDirectionValue,
			ease: "linear",
		});
	});
}

function componentVideoURL() {
	const videoEmbeds = document.querySelectorAll("[data-component-video]");
	if (!videoEmbeds.length) return;

	videoEmbeds.forEach((embed) => {
		const videoURL = embed.getAttribute("data-component-video");
		const video = embed.querySelector("video");
		const embedSource = embed.querySelector("source");

		embedSource.src = videoURL;
		video.load();
	});
}

function imageParallaxAnimation() {
	const imageWraps = document.querySelectorAll("[data-image-parallax]");
	if (!imageWraps.length) return;

	imageWraps.forEach((wrap) => {
		const image = wrap.querySelector("img");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top bottom",
				end: "bottom top",
				scrub: true,
			},
		});

		tl.to(image, {
			top: "0%",
			ease: "linear",
		});
	});
}

function initAfterTransition() {
	// Kill All ScrollTrigger Instances
	ScrollTrigger.killAll();
	partnersMarqueeAnimation();
	logoShrinkAnimation();
	customCursorAnimation();
	totalProjectsCount();
	projectCategoryItemsCount();
	filtersDropdownAnimation();
	splitTextIntoLines();
	wrapLinesInMask();
	maskTextRevealAnimation();
	textFadeInAnimation();
	borderAnimation();
	projectParallaxAnimation();
	projectImageMarquee();
	componentVideoURL();
	imageParallaxAnimation();
	footerParallax();
}

document.addEventListener("DOMContentLoaded", () => {
	gsap.registerPlugin(ScrollTrigger);
	gsap.registerPlugin(CustomEase);
	barbaJS();
	smoothScroll();
	colorModeToggle();
	menuAnimation();
	// Init on page load
	initAfterTransition();
});
