import "./custom-styles.css";
import barba from "@barba/core";
import Lenis from "lenis";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import PostDataFetcher from "./utils/PostDataFetcher";
// Overlay scrollbar
import "overlayscrollbars/overlayscrollbars.css";
import { OverlayScrollbars } from "overlayscrollbars";

function barbaJS() {
	CustomEase.create("custom", "M0,0 C0.204,0 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");

	// Transition in function after next container is added to DOM
	function transitionIn(data) {
		return new Promise((resolve) => {
			const prevContainer = data.current.container;
			const nextContainer = data.next.container;
			const overlay = prevContainer.querySelector(".transition_overlay");
			const nextFooter = data.next.container.querySelector('[data-footer-parallax="content"]');
			const logo = document.querySelector('[data-logo-animation="logo"]');

			// Use the `logoWidth` set by the view
			const targetLogoWidth = data.next.logoWidth || "auto";

			let tl = gsap.timeline({
				onComplete: () => {
					gsap.set(nextContainer, {
						position: "relative",
						zIndex: 1,
						// Removing inline transform because it acts as new stacking context for fixed elements (footer)
						clearProps: "transform",
					});
					lenis.scrollTo(0, { immediate: true, force: true });
					lenis.start();
					resolve();
				},
			});

			tl.set(overlay, {
				display: "block",
			})
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
						ease: "custom",
					},
					"<"
				)
				.to(
					logo,
					{
						width: targetLogoWidth,
						duration: 1.8,
						ease: "custom",
					},
					"<"
				)
				.from(
					nextContainer,
					{
						y: "100vh",
						duration: 1.8,
						ease: "custom",
					},
					"<"
				);
		});
	}

	// Setting styles of next container
	function prepareNextContainer(data) {
		return new Promise((resolve) => {
			gsap.set(data.next.container, {
				position: "fixed",
				top: 0,
				zIndex: 2,
			});
			resolve();
		});
	}

	barba.init({
		preventRunning: true,
		prevent: ({ el }) => el.hasAttribute("data-barba-prevent"),
		debug: true,
		views: [
			{
				namespace: "small-logo",
				beforeEnter(data) {
					data.next.logoWidth = "2rem";
				},
			},
		],
		transitions: [
			{
				name: "slide-transition",

				async beforeLeave(data) {
					await window.fsAttributes.destroy();

					lenis.stop();
				},

				async beforeEnter(data) {
					initBeforeEnter();
					await prepareNextContainer(data);
				},

				// 2. Run transition
				async enter(data) {
					// Awaiting to complete transitionIn before barba removes previous container
					await transitionIn(data);
				},
				async after() {
					projectsFilters();

					initAfterEnter();
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
// Global overlay instance
let osInstance;
function overlayScrollbar() {
	// Simple initialization with an element
	osInstance = OverlayScrollbars(document.body, {});
}

function setActiveUrl() {
	const menuLinks = document.querySelectorAll("[data-menu-link]");
	if (!menuLinks.length) return;

	const currentUrl = window.location.href;
	menuLinks.forEach((link) => {
		const navUrl = link.href;
		if (currentUrl === navUrl) {
			link.classList.add("is-current");
		} else {
			link.classList.remove("is-current");
		}
	});
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
				top: "0.5rem",
				right: "0.5rem",
				width: 0,
				height: 0,
			},
			{
				top: "-0.25rem",
				right: "-0.25rem",
				width: "auto",
				height: "auto",
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
				stagger: 0.1,
				ease: "custom",
				onComplete: () => {
					// Clear GSAP's inline transform style
					menuText.forEach((el) => {
						gsap.set(el, { clearProps: "transform" });
					});
				},
			},
			"<+0.15"
		);

	function toggleMenu() {
		if (!menuOpen) {
			tl.timeScale(1).play();
			menuOpen = true;
		} else {
			tl.timeScale(1.5).reverse();
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
			const scrollSpeedFactor = Math.max(1, velocity / 150); // Scale speed proportionally to velocity
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
	const footers = document.querySelectorAll("footer");
	if (!footers.length) return;

	footers.forEach((footer, index) => {
		if (footers.length > 1 && index === 0) {
			return;
		}

		const footerContent = footer.querySelector('[data-footer-parallax="content"]');

		const footerHeight = footerContent.getBoundingClientRect().height;
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
				yPercent: -50,
				ease: "linear",
			},

			"<"
		);
	});
}

async function totalProjectsCount() {
	const projectsCounters = document.querySelectorAll('[data-projects-count="counter"]');
	if (!projectsCounters.length) return;

	const dataFetcher = new PostDataFetcher("/cms-data");
	const data = await dataFetcher.init();
	const projectsCount = data.postsCount;

	projectsCounters.forEach((counter) => {
		counter.textContent = projectsCount;
	});
}

async function projectCategoryCounter() {
	const categoryCounters = document.querySelectorAll("[data-category-counter]");

	if (!categoryCounters.length) return;

	const dataFetcher = new PostDataFetcher("/cms-data");
	const data = await dataFetcher.init();

	categoryCounters.forEach((counterEl) => {
		const counterCategory = counterEl.getAttribute("data-category-counter");
		counterEl.textContent = data["categoriesCount"][counterCategory];
	});
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
				top: "0.5rem",
				left: "0.5rem",
				width: 0,
				height: 0,
			},
			{
				top: "-0.25rem",
				left: "-0.25rem",
				width: "auto",
				height: "auto",
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
				ease: "custom",
				onComplete: () => {
					// Clear GSAP's inline transform style
					menuText.forEach((el) => {
						gsap.set(el, { clearProps: "transform" });
					});
				},
			},
			"<+0.15"
		);

	function filtersDropdown() {
		if (!filtersOpen) {
			tl.timeScale(1).play();
			filtersOpen = true;
		} else {
			tl.timeScale(1.5).reverse();
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

function textMaskRevealAnimation(delay = false) {
	const maskWraps = document.querySelectorAll('[data-mask-reveal="wrap"]');
	if (!maskWraps.length) return;
	let tl;
	let delayValue = 0;

	maskWraps.forEach((wrap) => {
		const lines = wrap.querySelectorAll(".line");
		const isInstant = wrap.hasAttribute("data-instant-animation");

		if (isInstant) {
			tl = gsap.timeline();
			if (delay) {
				delayValue = 0.3;
			}
		} else {
			tl = gsap.timeline({
				scrollTrigger: {
					trigger: wrap,
					start: "top 90%",
				},
			});
		}

		tl.to(lines, {
			y: 0,
			stagger: 0.12,
			duration: 0.8,
			delay: delayValue,
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
			duration: 0.8,
			ease: "power3.out",
		}).to(
			target,
			{
				opacity: 1,
				duration: 0.8,
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
			duration: 2,
			ease: "custom",
		}).to(
			verticalDividers,
			{
				scaleY: 1,
				duration: 2,
				ease: "custom",
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

function projectHideCMS() {
	const collections = document.querySelectorAll("[data-hide-cms-value]");
	if (!collections.length) return;

	collections.forEach((collection) => {
		const hideValue = collection.getAttribute("data-hide-cms-value");
		const posts = collection.querySelectorAll(".w-dyn-item");

		posts.forEach((post) => {
			const postName = post.querySelector("[data-hide-cms-name]").getAttribute("data-hide-cms-name");
			if (postName === hideValue) post.remove();
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
		const images = wrap.querySelectorAll("img");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top bottom",
				end: "bottom top",
				scrub: true,
			},
		});

		tl.to(images, {
			top: "0%",
			ease: "linear",
		});
	});
}

function accordionAnimation() {
	const accordionItems = document.querySelectorAll('[data-accordion="item"]');
	if (!accordionItems.length) return;

	accordionItems.forEach((item) => {
		const trigger = item.querySelector('[data-accordion="trigger"]');
		const expand = item.querySelector('[data-accordion="expand"]');
		const content = item.querySelector('[data-accordion="content"]');

		let openTl = gsap.timeline({
			paused: true,
			onComplete: () => {
				ScrollTrigger.refresh();
			},
		});
		openTl
			.from(expand, {
				height: 0,
				duration: 0.6,
				ease: "power3.inOut",
			})
			.from(
				content,
				{
					opacity: 0,
					duration: 0.4,
					ease: "linear",
				},
				"-=0.3"
			);

		let closeTl = gsap.timeline({
			paused: true,
			onComplete: () => {
				ScrollTrigger.refresh();
			},
		});
		closeTl
			.to(expand, {
				height: 0,
				duration: 0.6,
				ease: "power3.inOut",
			})
			.set(content, {
				opacity: 0,
				duration: 0.4,
				ease: "linear",
			});

		function accordionHandler() {
			trigger.classList.toggle("is-open");
			const isOpen = trigger.classList.contains("is-open");

			if (isOpen) {
				closeTl.pause();
				openTl.restart();
			} else {
				openTl.pause();
				closeTl.restart();
			}
		}

		trigger.addEventListener("click", accordionHandler);
	});
}

function categoriesImagesHover() {
	const categoryLinks = document.querySelectorAll("[data-category-link]");
	if (!categoryLinks.length) return;

	const images = document.querySelectorAll(`[data-category-image]`);

	let timelines = [];
	let activeTl;
	let activeImg;

	function setActiveCategory(tl) {
		if (tl === activeTl) return;

		if (activeTl) {
			activeTl.reverse();
		}

		tl.play();
		activeTl = tl;
	}

	function changeImage(image) {
		if (activeImg) {
			gsap.set(activeImg, {
				opacity: 0,
			});
		}
		gsap.set(image, {
			opacity: 1,
		});
		activeImg = image;
	}

	categoryLinks.forEach((link, index) => {
		const categoryName = link.getAttribute("data-category-link");
		const image = document.querySelector(`[data-category-image="${categoryName}"]`);

		let tl = gsap.timeline({ paused: true });

		tl.to(link, {
			opacity: 1,
			duration: 0.1,
			ease: "linear",
		});

		timelines.push(tl);

		link.addEventListener("mouseenter", () => {
			changeImage(image);
			setActiveCategory(tl);
		});

		if (index === 0) {
			changeImage(image);
			setActiveCategory(tl);
		}
	});
}

function horizontalScroll() {
	const tracks = document.querySelectorAll('[data-horizontal-scroll="track"]');
	if (!tracks.length) return;

	tracks.forEach((track) => {
		const frame = track.querySelector('[data-horizontal-scroll="frame"]');
		const progressBar = track.querySelector('[data-horizontal-scroll="progress-bar"]');

		const frameWidth = frame.scrollWidth;
		const viewportWidth = window.innerWidth;

		track.style.height = `calc(100vh + ${frameWidth}px)`;

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: track,
				start: "top top",
				end: "bottom bottom",
				scrub: true,
				onUpdate: (self) => {
					const progress = self.progress;
					gsap.to(progressBar, {
						scaleX: progress,
						ease: "none",
						duration: 0,
					});
				},
			},
		});

		tl.to(frame, {
			x: -(frameWidth - viewportWidth),
			ease: "linear",
		});
	});
}

function changingImages() {
	const images = document.querySelectorAll('[data-changing-images="image"]');
	if (!images.length) return;

	let currentIndex = 0; // Start with the first image

	images.forEach((image, index) => {
		image.style.zIndex = index === 0 ? 1 : 0; // First image on top
	});

	// Function to change the z-index
	function changeImage() {
		images.forEach((image) => (image.style.zIndex = 0));

		currentIndex = (currentIndex + 1) % images.length;
		images[currentIndex].style.zIndex = 1;
	}

	setInterval(changeImage, 1000);
}

function hideEmptyCareerSection() {
	const careerSection = document.querySelector('[data-career-hide="section"]');
	if (!careerSection) return;

	const careerList = document.querySelector('[data-career-hide="list"]');

	if (!careerList) {
		careerSection.style.display = "none";
	}
}

function startProjectPopup() {
	const popupWrap = document.querySelector('[data-project-popup="wrap"]');
	const popupTriggers = document.querySelectorAll('[data-project-popup="trigger"]');
	if (!popupWrap || !popupTriggers.length) return;

	const popup = popupWrap.querySelector('[data-project-popup="popup"]');
	const overlay = popupWrap.querySelector('[data-project-popup="overlay"]');
	const popupClose = popupWrap.querySelectorAll('[data-project-popup="close"]');

	// Open timeline with animation
	let openTl = gsap.timeline({ paused: true });
	openTl
		.set(popupWrap, {
			display: "flex",
		})
		.from(overlay, {
			opacity: 0,
			duration: 0.3,
			ease: "linear",
		})
		.from(
			popup,
			{
				opacity: 0,
				y: 32,
				duration: 0.5,
				ease: "power3.out",
			},
			"<"
		);

	// Close action without animation
	const closePopup = () => {
		lenis.start();
		gsap.set(popupWrap, {
			display: "none",
		});
	};

	// Trigger the opening animation
	popupTriggers.forEach((popupTrigger) => {
		popupTrigger.addEventListener("click", () => {
			lenis.stop();
			openTl.restart();
		});
	});

	// Trigger the close action
	popupClose.forEach((btn) => {
		btn.addEventListener("click", closePopup);
	});
}

const customFormValidation = function () {
	const $form = $('[data-form-validation="form"]'); // Use jQuery selector

	if (!$form.length) return;

	$.validator.setDefaults({
		ignore: [], // DON'T IGNORE PLUGIN HIDDEN SELECTS, CHECKBOXES, AND RADIOS!!!
	});

	$.validator.addMethod(
		"requireCheckbox",
		function (value, element) {
			return $(element).is(":checked");
		},
		"You must agree to the Privacy Policy."
	);

	// Fix: Correctly check if at least one checkbox in the group is selected
	$.validator.addMethod(
		"checkone",
		function (value, element) {
			// Use jQuery to find the closest .form_options-row
			const $optionsRow = $(element).closest(".form_options-row");

			// Look for any checked checkbox inside the closest .form_options-row
			return $optionsRow.find("input[type='checkbox']").is(":checked");
		},
		"Please select at least one project type"
	);

	// Initialize validation
	$form.validate({
		groups: {
			projectType: "Corporate-website E-commerce Digital-product Mobile-app",
			services: "UX-Audit UX-UI-Design Development Full-project Not-sure",
		},
		rules: {
			Name: {
				required: true,
				minlength: 3,
			},
			Email: {
				required: true,
				email: true,
			},
			"Privacy-policy": {
				requireCheckbox: true, // Use the custom rule for the checkbox
			},
			"Budget-range": {
				required: true,
			},
		},

		messages: {
			"Budget-range": "Please select at least one option",
		},

		errorPlacement: function (error, element) {
			error.addClass("body-style-2");
			// Ensure the error for the group is appended only once
			if ($(element).closest(".form_field-wrap").length) {
				const $labelWrap = $(element).closest(".form_field-wrap").find(".form_label-wrap");

				if (!$labelWrap.find(".error").length) {
					$labelWrap.append(error); // Append the error once
				}
			} else {
				return false; // Prevent error messages from displaying under fields
			}
		},
		highlight: function (element) {
			if (element.name === "Name" || element.name === "Email") {
				$(element).addClass("error-field").removeClass("valid-field");
			} else if (element.name === "Privacy-policy") {
				$(".form_privacy-field").addClass("error-field");
			}
		},
		unhighlight: function (element) {
			if (element.name === "Name" || element.name === "Email") {
				$(element).removeClass("error-field").addClass("valid-field");
			} else if (element.name === "Privacy-policy") {
				$(".form_privacy-field").removeClass("error-field");
			}
		},
	});

	// Dynamically add the "checkone" rule to all checkboxes in .form_options-row
	$form.find('.form_options-row input[type="checkbox"]').each(function () {
		$(this).rules("add", {
			checkone: true, // Apply the custom "checkone" rule
		});
	});
};

function projectsListHover(link) {
	const projectListLinks = document.querySelectorAll('[data-projects-list="link"]');
	if (!projectListLinks.length) return;

	function linkHoverIn(currentLink) {
		const image = currentLink.querySelector('[data-projects-list="image"]');

		projectListLinks.forEach((link) => {
			const content = link.querySelector('[data-projects-list="content"]');

			if (link !== currentLink) {
				gsap.to(content, {
					opacity: 0.4,
					duration: 0.3,
					ease: "linear",
				});
			} else {
				gsap.to(content, {
					opacity: 1,
					duration: 0.2,
					ease: "linear",
				});
			}
		});

		gsap.set(image, {
			display: "block",
		});
	}

	function linkHoverOut(currentLink) {
		const image = currentLink.querySelector('[data-projects-list="image"]');

		projectListLinks.forEach((link) => {
			const content = link.querySelector('[data-projects-list="content"]');

			gsap.to(content, {
				opacity: 1,
				duration: 0.3,
				ease: "linear",
			});
		});

		gsap.set(image, {
			display: "none",
		});
	}

	projectListLinks.forEach((link) => {
		link.addEventListener("mouseover", () => {
			linkHoverIn(link);
		});

		link.addEventListener("mouseout", () => {
			linkHoverOut(link);
		});
	});
}

async function projectsFilters() {
	const cmsList = document.querySelector('[fs-cmsfilter-element="list"]');
	if (!cmsList) return;
	const filtersTag = document.querySelector('[data-filters-tag="wrap"]');
	const filtersTagName = filtersTag.querySelector('[data-filters-tag="name"]');
	const filtersTagCounter = filtersTag.querySelector('[data-filters-tag="counter"]');

	// Re-initialize CMSFilter
	const filterInstances = await window.fsAttributes.cmsfilter.init();
	const [filterInstance] = filterInstances;

	function toggleTag() {
		const [filterData] = filterInstance.filtersData;
		const filterCount = filterInstance.listInstance.validItems.length;
		const [filterValue] = filterData.values;

		console.log(filterValue);

		if (!filterValue) {
			filtersTag.classList.add("display-none");
		} else {
			// 1. Get active filter name and use it inside tag
			filtersTagName.textContent = filterValue;
			// 2. Get filter count and use it inside tag
			filtersTagCounter.textContent = filterCount;

			// 3. Display tag if filters are active
			filtersTag.classList.remove("display-none");
		}
	}

	filtersTag.addEventListener("click", () => {
		filterInstance.resetFilters();
	});

	filterInstance.listInstance.on("renderitems", (renderedItems) => {
		toggleTag();
		projectsListHover();
		setTimeout(() => {
			ScrollTrigger.refresh();
		}, 510);
	});
}

function categoryListURLs() {
	const categoryLinks = document.querySelectorAll("[data-category-link]");
	if (!categoryLinks.length) return;

	function constructParam(categoryName) {
		const params = new URLSearchParams({ category: categoryName });
		return params.toString();
	}

	categoryLinks.forEach((link) => {
		const categoryName = link.getAttribute("data-category-link");
		const categoryParam = constructParam(categoryName);
		const url = "/work-grid?" + categoryParam;

		link.href = url;
	});
}

function initBeforeEnter() {
	// Kill all ScrollTriggers but keep inline styles
	ScrollTrigger.getAll().forEach((trigger) => trigger.kill(false));
	setActiveUrl();
	splitTextIntoLines();
	wrapLinesInMask();
	textMaskRevealAnimation(true);
	textFadeInAnimation();
	totalProjectsCount();
	projectCategoryCounter();
	filtersDropdownAnimation();
}

function initAfterEnter() {
	footerParallax();
	partnersMarqueeAnimation();
	logoShrinkAnimation();
	customCursorAnimation();
	borderAnimation();
	projectParallaxAnimation();
	projectImageMarquee();
	componentVideoURL();
	accordionAnimation();
	categoriesImagesHover();
	horizontalScroll();
	changingImages();
	hideEmptyCareerSection();
	startProjectPopup();
	customFormValidation();
	projectsListHover();
	categoryListURLs();
	imageParallaxAnimation();
	ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", () => {
	gsap.registerPlugin(ScrollTrigger);
	gsap.registerPlugin(CustomEase);
	barbaJS();
	smoothScroll();
	colorModeToggle();
	menuAnimation();
	overlayScrollbar();
	projectsFilters();

	// Init on page load
	initBeforeEnter();
	initAfterEnter();
});
