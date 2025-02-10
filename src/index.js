import "./custom-styles.css";
import "./cookie-styles.css";
import barba from "@barba/core";
import Lenis from "lenis";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import PostDataFetcher from "./utils/PostDataFetcher";
// core version + navigation, pagination modules:
import Swiper from "swiper";
// import Swiper and modules styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

function barbaJS() {
	// Transition in function after next container is added to DOM
	function transitionAnimation(data) {
		return new Promise((resolve) => {
			const prevContainer = data.current.container;
			const prevContent = prevContainer.querySelector(".barba-content");
			const nextContainer = data.next.container;
			const overlay = prevContainer.querySelector(".transition_overlay");
			const nextFooter = data.next.container.querySelector('[data-footer-parallax="content"]');
			const logo = document.querySelector('[data-logo-animation="logo"]');

			// Use the logoWidth set by the view

			// On desktop logo shrinks on case-inner
			// On mobile logo grows on index
			let mm = gsap.matchMedia();

			// Desktop logo sizing
			mm.add("(min-width: 992px)", () => {
				const targetLogoWidth = data.next.desktopLogoWidth || "20rem";
				gsap.to(
					logo,
					{
						width: targetLogoWidth,
						duration: 0.8,
						ease: "power2.inOut",
					},
					"<"
				);
			});

			// Mobile logo sizing
			mm.add("(max-width: 991px)", () => {
				const targetLogoWidth = data.next.mobileLogoWidth || "2rem";
				gsap.to(
					logo,
					{
						width: targetLogoWidth,
						duration: 0.8,
						ease: "power2.inOut",
					},
					"<"
				);
			});

			let tl = gsap.timeline({
				onComplete: () => {
					gsap.set(nextContainer, {
						zIndex: 1,
						// Removing inline transform because it acts as new stacking context for fixed elements (footer)
						clearProps: "transform",
					});
					resolve();
				},
			});

			tl.set(nextContainer, {
				y: "100vh",
			})
				.set(nextContainer, {
					zIndex: 3,
				})
				.set(overlay, {
					display: "block",
				})
				.to(
					overlay,
					{
						opacity: 0.7,
						duration: 0.8,
						ease: "linear",
					},
					"<"
				)
				.to(
					prevContent,
					{
						scale: 0.95,
						duration: 1.8,
						ease: "custom",
					},
					"<"
				)
				.to(
					prevContent,
					{
						y: -300,
						duration: 1.8,
						ease: "custom",
					},
					"<"
				)

				.to(
					nextContainer,
					{
						y: "0vh",
						duration: 1.8,
						ease: "custom",
					},
					"<"
				);
		});
	}

	// Setting styles of next container
	function prepareCurrentContainer(data) {
		return new Promise((resolve) => {
			gsap.set(data.current.container, {
				zIndex: 2,
				onComplete: () => {
					resolve();
				},
			});
		});
	}

	barba.init({
		preventRunning: true,
		prevent: ({ el }) => el.hasAttribute("data-barba-prevent"),
		views: [
			{
				namespace: "desktop-small-logo",
				beforeEnter(data) {
					data.next.desktopLogoWidth = "2rem";
				},
			},
			{
				namespace: "mobile-large-logo",
				beforeEnter(data) {
					data.next.mobileLogoWidth = "10rem";
				},
			},
			{
				namespace: "projects-page",
				beforeEnter(data) {
					projectSwitcherDisplay(data);
				},
				afterLeave(data) {
					projectSwitcherDisplay(data, true);
				},
			},
		],
		transitions: [
			{
				name: "slide-transition",

				async beforeLeave(data) {
					oldLenis = lenis;
					await window.fsAttributes.destroy();
					await prepareCurrentContainer(data);
					oldLenis.stop();
				},

				async beforeEnter(data) {
					resetFooterLogoMenuStyles();
					initBeforeEnter(data);
					await new Promise((resolve) => setTimeout(resolve, 100));
				},

				// 2. Run transition
				async enter(data) {
					initEnter();
					// Awaiting to complete transitionAnimation before barba removes previous container
					lenis.stop();
					setTimeout(() => {
						lenis.start();
					}, 800);
					await transitionAnimation(data);
					oldLenis.destroy();
				},
				async after() {
					initAfterEnter();
				},
			},
		],
	});
}

function setGSAPScroller(data) {
	const nextContainer = data?.next?.container;
	const scroller = nextContainer ? nextContainer : ".main-wrapper";
	// Set Global Scroller for ScrollTrigger
	ScrollTrigger.defaults({
		scroller: scroller,
	});
}

// Global lenis instance
let lenis;
let oldLenis;
function smoothScroll(data) {
	const nextContainer = data?.next?.container;
	const container = nextContainer ? nextContainer : document;

	const body = document.querySelector("body");
	const wrapper = nextContainer ? nextContainer : container.querySelector(".main-wrapper");
	const content = container.querySelector(".main-content");

	lenis = new Lenis({
		lerp: 0.1,
		wrapper: wrapper,
		content: content,
		// eventsTarget: wrapper,
		eventsTarget: body,
	});

	lenis.on("scroll", ScrollTrigger.update);

	gsap.ticker.add((time) => {
		lenis.raf(time * 1000);
	});

	gsap.ticker.lagSmoothing(0);
}

function setActiveUrl() {
	const menuLinks = document.querySelectorAll("[data-menu-link]");
	if (!menuLinks.length) return;

	const currentUrl = window.location.href;

	menuLinks.forEach((link) => {
		const navUrl = link.href;

		// Check for "Work" pages (specific exception handling)
		const isWorkPage = currentUrl.includes("/work-grid") || currentUrl.includes("/work-list");

		// Handle "Work" nav link
		if (isWorkPage && navUrl.includes("/work-grid")) {
			link.classList.add("is-current");
		}
		// Handle general case: exact URL match
		else if (currentUrl === navUrl) {
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
		const htmlElement = document.documentElement;

		if (targetMode === "light") {
			htmlElement.setAttribute("data-theme", "light"); // Add light theme
			changeColors(lightColors);
			localStorage.setItem("dark-mode", false);
		} else {
			htmlElement.setAttribute("data-theme", "dark"); // Add dark theme
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

function logoShrinkAnimation(data) {
	const logo = document.querySelector('[data-logo-animation="logo"]');
	if (!logo) return;

	const nextContainer = data?.next?.container;
	const trigger = nextContainer ? nextContainer : ".main-wrapper";

	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: trigger,
			start: "top top",
			end: "+=380",
			ease: "linear",
			scrub: true,
		},
	});

	tl.to(logo, {
		width: "2rem",
		overwrite: "auto",
	});
}

function menuAnimation() {
	const menu = document.querySelector('[data-menu-animation="menu"]');
	if (!menu) return;
	const dropdown = menu.querySelector('[data-menu-animation="dropdown"]');
	const mobileBtnText = menu.querySelector('[data-menu-animation="mobile-btn-text"]');
	const button = menu.querySelector('[data-menu-animation="button"]');
	const menuLinks = menu.querySelectorAll("[data-menu-link]");

	let menuOpen = false;
	let tl = gsap.timeline({ paused: true }); // Persistent timeline

	function animateDropdown(expand) {
		// Clear the timeline and define new animation based on the state
		tl.clear();

		if (expand) {
			menuOpen = true;
			mobileBtnText.textContent = "close";
			button.classList.add("is-open");
			// Expand animation
			tl.set(".menu_dropdown", {
				pointerEvents: "auto",
			})
				.set(".menu_dropdown", { display: "block" }) // Ensure dropdown is visible
				.set(button, {
					color: "var(--brand--orange)",
					background: "var(--brand--black)",
				})
				.to(
					".menu_background",
					{
						top: 0,
						right: 0,
						width: "100%",
						height: "100%",
						ease: "custom",
						duration: 1,
					},
					"<"
				)
				.fromTo(".menu_wrap", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "linear" }, "<+0.4");
		} else {
			menuOpen = false;
			mobileBtnText.textContent = "menu";
			button.classList.remove("is-open");
			// Contract animation
			tl.set(".menu_dropdown", {
				pointerEvents: "none",
			});
			tl.to(".menu_background", {
				top: "0.5rem",
				right: "0.5rem",
				width: 0,
				height: 0,
				ease: "custom",
				duration: 1,
			})
				.to(".menu_wrap", { opacity: 0, duration: 0.1, ease: "linear" }, "<")
				.set(button, { color: "", background: "" }, "<")
				.set(".menu_dropdown", {
					display: "none",
				}); // Hide dropdown
		}

		// Play the timeline
		tl.play();
	}

	menuLinks.forEach((link) => {
		link.addEventListener("click", () => {
			animateDropdown(false);
		});
	});

	// Use gsap.matchMedia() for responsive behaviors
	const mm = gsap.matchMedia();

	mm.add(
		{
			// Define a desktop media query
			isDesktop: "(min-width: 992px)",
		},
		() => {
			// Desktop-specific event listeners
			menu.addEventListener("mouseenter", () => {
				animateDropdown(true);
			});

			menu.addEventListener("mouseleave", () => {
				animateDropdown(false);
			});

			// Cleanup function for when the media query no longer matches
			return () => {
				menu.removeEventListener("mouseenter", animateDropdown);
				menu.removeEventListener("mouseleave", animateDropdown);
			};
		}
	);

	button.addEventListener("click", () => {
		if (!menuOpen) {
			animateDropdown(true);
		} else {
			animateDropdown(false);
		}
	});

	// Click listener to close the dropdown when clicking outside
	document.addEventListener("click", (event) => {
		if (!menu.contains(event.target) && menuOpen) {
			animateDropdown(false); // Close dropdown
		}
	});
}

function partnersMarqueeAnimation() {
	const marqueeContent = document.querySelector(".marquee_content");
	if (!marqueeContent) return;

	const mm = gsap.matchMedia();

	mm.add("(min-width: 992px)", () => {
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
	});

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

		function setFooterSize() {
			const footerHeight = footerContent.getBoundingClientRect().height;
			footer.style.height = footerHeight + "px";
		}

		setFooterSize();

		const mm = gsap.matchMedia();

		mm.add("(min-width: 992px)", () => {
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

		window.addEventListener("resize", setFooterSize);
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

function filtersDropdownAnimation(data) {
	const nextContainer = data?.next?.container;
	const container = nextContainer ? nextContainer : document;

	const filters = container.querySelector('[data-filters-dropdown="filters"]');
	if (!filters) return;

	const button = filters.querySelector('[data-filters-dropdown="button"]');
	const dropdown = filters.querySelector('[data-filters-dropdown="dropdown"]');
	const filtersBtns = filters.querySelectorAll('[data-filters-dropdown="filter"]');

	let menuOpen = false;
	let tl = gsap.timeline({ paused: true }); // Persistent timeline

	function animateDropdown(expand) {
		// Clear the timeline and define new animation based on the state
		tl.clear();

		if (expand) {
			menuOpen = true;
			button.classList.add("is-open");

			// Expand animation
			tl.set(".filters_dropdown", {
				pointerEvents: "auto",
			})
				.set(dropdown, { display: "block" }) // Ensure dropdown is visible
				.set(button, {
					color: "var(--color--text-primary)",
					background: "var(--color--bg-primary)",
				})
				.to(
					".filters_background",
					{
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						ease: "custom",
						duration: 1,
					},
					"<"
				)
				.fromTo(".filters_form-block", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "linear" }, "<+0.4");
		} else {
			menuOpen = false;
			button.classList.remove("is-open");

			// Contract animation
			tl.set(".filters_dropdown", {
				pointerEvents: "none",
			});
			tl.to(".filters_background", {
				top: "0.5rem",
				left: "0.5rem",
				width: 0,
				height: 0,
				ease: "custom",
				duration: 1,
			})
				.to(".filters_form-block", { opacity: 0, duration: 0.1, ease: "linear" }, "<")
				.set(button, { color: "", background: "", duration: 0.2 }, "<")
				.set(dropdown, { display: "none" }); // Hide dropdown
		}

		// Play the timeline
		tl.play();
	}

	filtersBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			animateDropdown(false);
		});
	});

	// Use gsap.matchMedia() for responsive behaviors
	const mm = gsap.matchMedia();

	mm.add(
		{
			// Define a desktop media query
			isDesktop: "(min-width: 992px)",
		},
		() => {
			// Desktop-specific event listeners
			filters.addEventListener("mouseenter", () => {
				animateDropdown(true);
			});

			filters.addEventListener("mouseleave", () => {
				animateDropdown(false);
			});

			// Cleanup function for when the media query no longer matches
			return () => {
				filters.removeEventListener("mouseenter", animateDropdown);
				filters.removeEventListener("mouseleave", animateDropdown);
			};
		}
	);

	button.addEventListener("click", () => {
		if (!menuOpen) {
			animateDropdown(true);
		} else {
			animateDropdown(false);
		}
	});

	// Click listener to close the dropdown when clicking outside
	document.addEventListener("click", (event) => {
		if (!filters.contains(event.target) && menuOpen) {
			animateDropdown(false); // Close dropdown
		}
	});
}

function splitTextIntoLines(data) {
	const container = data && data.next ? data.next.container : document;

	const splitTargets = container.querySelectorAll('[data-split-text="target"]');
	if (!splitTargets) return;

	splitTargets.forEach((target) => {
		const splitText = new SplitType(target, { types: "lines" });
	});
}

function wrapLinesInMask(data) {
	const container = data && data.next ? data.next.container : document;

	const lines = container.querySelectorAll(".line");
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

function textMaskRevealAnimation(data) {
	const container = data && data.next ? data.next.container : document;
	const maskWraps = container.querySelectorAll('[data-mask-reveal="wrap"]');

	if (!maskWraps.length) return;

	maskWraps.forEach((wrap) => {
		let tl;
		const lines = wrap.querySelectorAll(".line");

		tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top 90%",
			},
		});

		tl.to(lines, {
			y: 0,
			stagger: 0.14,
			duration: 0.6,
			ease: "custom-3",
		});
	});
}

function textFadeInAnimation(data) {
	const container = data && data.next ? data.next.container : document;
	const fadeWraps = container.querySelectorAll('[data-fade-reveal="wrap"]');
	if (!fadeWraps.length) return;

	fadeWraps.forEach((wrap) => {
		const targets = wrap.querySelectorAll('[data-fade-reveal="target"]');

		if (!targets.length) return;

		tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top 90%",
			},
		});

		tl.to(targets, {
			opacity: 1,
			duration: 1,
			ease: "linear",
		});
	});
}

function borderAnimation(data) {
	const container = data && data.next ? data.next.container : document;
	const borderWraps = container.querySelectorAll('[data-border-animation="wrap"]');
	if (!borderWraps.length) return;

	borderWraps.forEach((wrap) => {
		const horizontalDividers = wrap.querySelectorAll(".horizontal-divider");
		const verticalDividers = wrap.querySelectorAll(".vertical-divider");

		let tl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: "top 90%",
			},
		});

		if (horizontalDividers.length) {
			tl.to(horizontalDividers, {
				scaleX: 1,
				duration: 1.8,
				ease: "custom",
			});
		}

		if (verticalDividers.length) {
			tl.to(
				verticalDividers,
				{
					scaleY: 1,
					duration: 1.8,
					ease: "custom",
				},
				"<"
			);
		}
	});
}

function projectParallaxAnimation() {
	const parallaxImages = document.querySelectorAll("[data-project-parallax]");
	if (!parallaxImages.length) return;

	parallaxImages.forEach((wrap) => {
		const directionAttribute = wrap.getAttribute("data-project-parallax");
		const gsapDirectionValue = directionAttribute === "down" ? "7%" : "-7%";
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

function imageParallaxAnimation(data) {
	const container = data && data.next ? data.next.container : document;
	const imageWraps = container.querySelectorAll("[data-image-parallax]");

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
			overwrite: true,
		});
	});
}

// Need this in order to kill/reset scrollTriggers when filtering
let oldParallaxImageTimelines = [];

function filterImageParallaxAnimation(data) {
	// Clearing this array when page changes, to avoid visible image shift when changing project view
	oldParallaxImageTimelines = [];

	const container = data && data.next ? data.next.container : document;

	const imageWraps = container.querySelectorAll("[data-filter-image-parallax]");
	if (!imageWraps.length) return;

	imageWraps.forEach((wrap) => {
		const images = wrap.querySelector("img");

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
			overwrite: true,
		});

		oldParallaxImageTimelines.push(tl);
	});
}

function categoriesImagesHover() {
	const categoryLinks = document.querySelectorAll('[data-category-hover="link"]');
	if (!categoryLinks.length) return;

	let activeCategory = {};
	let activeTimeline = null;

	function animateImage(newImage) {
		const previousImage = activeCategory.image;

		// Kill or complete any active timeline
		if (activeTimeline && activeTimeline.isActive()) {
			activeTimeline.progress(1); // Ensure the timeline finishes immediately
		}

		// Create a new timeline for the current animation
		activeTimeline = gsap.timeline();

		if (previousImage) {
			// Set the new image to be visible underneath the fading-out image
			activeTimeline
				.set(newImage, { autoAlpha: 1, zIndex: 0, scale: 1.1 }) // Make the new image visible underneath
				.to(newImage, { scale: 1, duration: 1.5, ease: "power4.out" })
				.to(
					previousImage,
					{
						opacity: 0,
						duration: 0.2,
						ease: "linear",
						onComplete: () => {
							gsap.set(previousImage, { autoAlpha: 0, zIndex: 0 });
						},
					},
					"<"
				)
				.set(newImage, { zIndex: 1 }); // Bring the new image to the front after fade-out
		} else {
			// If there's no previous image, simply set the new image as active
			activeTimeline.set(newImage, { autoAlpha: 1, zIndex: 1 });
		}

		activeCategory.image = newImage; // Update the active image
	}

	function animateLink(newLink) {
		// Animate the active and new links
		if (activeCategory.link) {
			gsap.to(activeCategory.link, {
				opacity: 0.5,
				duration: 0.1,
				ease: "linear",
			});
		}

		gsap.to(newLink, {
			opacity: 1,
			duration: 0.1,
			ease: "linear",
		});

		activeCategory.link = newLink;
	}

	categoryLinks.forEach((link, index) => {
		const categoryName = link.getAttribute("data-category-link");
		const image = document.querySelector(`[data-category-image="${categoryName}"]`);

		// Initially hide all images
		gsap.set(image, { autoAlpha: 0 });

		// Add hover event listener
		link.addEventListener("mouseenter", () => {
			if (activeCategory.link !== link || activeCategory.image !== image) {
				animateLink(link);
				animateImage(image);
			}
		});

		// Set the first category as active
		if (index === 0) {
			gsap.set(image, { zIndex: 1, autoAlpha: 1 });
			animateLink(link);
			animateImage(image);
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

		let mm = gsap.matchMedia();

		// Desktop horizontal scroll
		mm.add("(min-width: 992px)", () => {
			gsap.set(track, {
				height: `calc(100vh + ${frameWidth}px)`,
			});

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
							ease: "linear",
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

		// Mobile horizontal scroll
		mm.add("(max-width: 991px)", () => {
			// Calculate and update progress bar based on scroll position
			frame.addEventListener("scroll", () => {
				const scrollLeft = frame.scrollLeft;
				const maxScroll = frame.scrollWidth - frame.clientWidth;
				const progress = scrollLeft / maxScroll;

				gsap.to(progressBar, {
					scaleX: progress,
					ease: "linear",
					duration: 0,
				});
			});
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

let openTl; // Declare a global variable for the timeline

function initPersistentPopup() {
	const popupWrap = document.querySelector('[data-project-popup="wrap"]');
	const headerTrigger = document.querySelectorAll('[data-project-popup="trigger-header"]');
	if (!popupWrap || !headerTrigger.length) return;

	const popup = popupWrap.querySelector('[data-project-popup="popup"]');
	const overlay = popupWrap.querySelector('[data-project-popup="overlay"]');
	const popupClose = popupWrap.querySelectorAll('[data-project-popup="close"]');

	// Create the timeline for popup animation if it doesn't exist
	openTl = gsap.timeline({ paused: true, overwrite: true });
	openTl
		.set(popupWrap, {
			display: "block",
		})
		.from(overlay, {
			opacity: 0,
			duration: 0.2,
			ease: "linear",
		})
		.from(
			popup,
			{
				opacity: 0,
				y: 24,
				duration: 0.3,
				ease: "power3.out",
			},
			"<"
		);

	// Close popup action
	const closePopup = () => {
		lenis.start();
		gsap.set(popupWrap, {
			display: "none",
		});
	};

	// Attach event listener to header trigger
	headerTrigger.forEach((trigger) => {
		trigger.addEventListener("click", () => {
			lenis.stop();
			openTl.restart();
		});
	});

	// Attach event listeners to close buttons
	popupClose.forEach((btn) => {
		btn.addEventListener("click", closePopup);
	});
}

function initPageSpecificPopupTriggers() {
	const popupTriggers = document.querySelectorAll('[data-project-popup="trigger"]');
	if (!popupTriggers.length || !openTl) return; // Ensure triggers exist and the timeline is defined

	// Attach event listeners to page-specific triggers
	popupTriggers.forEach((popupTrigger) => {
		popupTrigger.addEventListener("click", () => {
			lenis.stop();
			openTl.restart(); // Reuse the persistent popup timeline
		});
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

// Store references to ensure we can remove listeners
let projectLinkHandlers = new Map();
function projectsListHover() {
	const projectListLinks = document.querySelectorAll('[data-projects-list="link"]');
	if (!projectListLinks.length) return;

	const floatingImageContainer = document.querySelector('[data-projects-list-floating="container"]');

	function linkHoverIn(currentLink) {
		const postName = currentLink.getAttribute("data-projects-list-post");
		const newImageSrc = document.querySelector(`[data-projects-list-image="${postName}"]`)?.src;

		if (!newImageSrc) {
			console.error("Image source not found!");
			return;
		}

		// Create a new image element
		const newImage = document.createElement("img");
		newImage.src = newImageSrc;
		newImage.style.position = "absolute";
		newImage.style.transform = "translateY(100%)";
		newImage.style.left = "0";
		newImage.style.top = "0";
		newImage.style.width = "100%";
		newImage.style.height = "100%";
		newImage.style.objectFit = "cover";

		// Append to container
		floatingImageContainer.appendChild(newImage);

		// Get previous image
		const oldImage = newImage.previousElementSibling;

		// Animate the new image in
		gsap.to(newImage, {
			y: "0%",
			duration: 0.75,
			ease: "custom-2",
		});

		if (oldImage) {
			gsap.to(oldImage, {
				y: "-50%",
				duration: 0.75,
				ease: "custom-2",
				onComplete: () => {
					oldImage.remove();
				},
			});
		}

		// 1. Animate content opacity
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
	}

	function handleMouseEnter(event) {
		const link = event.currentTarget;
		linkHoverIn(link);
	}

	function handleMouseLeave(event) {
		const link = event.currentTarget;
		linkHoverOut(link);
	}

	projectListLinks.forEach((link) => {
		// Remove old event listeners
		if (projectLinkHandlers.has(link)) {
			link.removeEventListener("mouseenter", projectLinkHandlers.get(link).handleMouseEnter);
			link.removeEventListener("mouseleave", projectLinkHandlers.get(link).handleMouseLeave);
		}

		// Store the new handler
		projectLinkHandlers.set(link, { handleMouseEnter, handleMouseLeave });

		// Add new event listeners
		link.addEventListener("mouseenter", handleMouseEnter);
		link.addEventListener("mouseleave", handleMouseLeave);
	});
}

function floatingProjectsListImage() {
	const floatingImage = document.querySelector("[data-projects-list-floating]");
	const floatingImageArea = document.querySelector('[data-projects-list="floating-area"]');

	if (!floatingImage || !floatingImageArea) return;

	const fullHeight = floatingImage.scrollHeight;

	function animateIn() {
		let tl = gsap.timeline();
		tl.to(floatingImage, {
			height: fullHeight,
			duration: 0.75,
			ease: "custom-2",
		});
	}

	function animateOut() {
		let tl = gsap.timeline();
		tl.to(floatingImage, {
			height: 0,
			duration: 0.75,
			ease: "custom-2",
		});
	}

	floatingImageArea.addEventListener("mouseenter", animateIn);

	floatingImageArea.addEventListener("mouseleave", animateOut);

	// Calculate image dimensions
	const imageHeight = floatingImage.offsetHeight;

	// Mousemove Event Listener
	window.addEventListener("mousemove", (event) => {
		// Get mouse position relative to the floating area
		const rect = floatingImageArea.getBoundingClientRect();
		const mouseX = event.clientX - rect.left; // X relative to floating area
		const mouseY = event.clientY - rect.top; // Y relative to floating area

		// Calculate image center point
		const centerX = rect.width / 2;
		const centerY = rect.height / 2;

		// Calculate offset from the center
		const offsetX = mouseX - centerX; // Offset from center horizontally
		const offsetY = mouseY - imageHeight / 2; // Center vertically

		// Apply movement with GSAP
		gsap.to(floatingImage, {
			x: offsetX,
			y: offsetY,
			duration: 1, // Shorter duration for snappier follow effect
			ease: "power2.out",
		});
	});
}

async function projectsFilters(data) {
	const nextContainer = data?.next?.container;
	const container = nextContainer ? nextContainer : document;

	const cmsList = container.querySelector('[fs-cmsfilter-element^="list"]');
	if (!cmsList) return;

	const viewSwitcherButtons = document.querySelectorAll('[data-project-view="link"]');

	const filtersTag = container.querySelector('[data-filters-tag="wrap"]');
	const filtersTagName = filtersTag.querySelector('[data-filters-tag="name"]');
	const filtersTagCounter = filtersTag.querySelector('[data-filters-tag="counter"]');

	// Re-initialize CMSFilter
	// NEED TO INIT ONLY THE NEW INSTANCE, NOT THE PREVIOUS ONE (try removing attributes)
	const oldContainer = data?.current?.container;
	if (oldContainer) {
		const fsFilterList = oldContainer.querySelector('[fs-cmsfilter-element^="list"]');

		if (fsFilterList) {
			fsFilterList.removeAttribute("fs-cmsfilter-element");
			fsFilterList.removeAttribute("fs-cmsfilter-showquery");
			fsFilterList.removeAttribute("fs-cmsfilter-duration");
			fsFilterList.removeAttribute("fs-cmsfilter-easing");
		}
	}

	const filterInstances = await window.fsAttributes.cmsfilter.init();

	filterInstances.forEach((filterInstance) => {
		const validItems = filterInstance.listInstance.validItems;

		const validElements = validItems.map((item) => item.element);
		gsap.to(validElements, {
			opacity: 1,
			duration: 1,
			ease: "linear",
			stagger: 0.2,
		});

		function toggleTag() {
			const [filterData] = filterInstance.filtersData;
			const filterCount = filterInstance.listInstance.validItems.length;
			const [filterValue] = filterData.values;

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

		function setSwitcherBtnUrl() {
			const urlParams = new URLSearchParams(window.location.search);
			const paramValue = urlParams.get("category");

			viewSwitcherButtons.forEach((btn) => {
				const url = new URL(btn.href);

				if (paramValue) {
					url.searchParams.set("category", paramValue);
				} else {
					url.search = "";
				}
				btn.href = url.toString();
			});
		}

		filtersTag.addEventListener("click", () => {
			filterInstance.resetFilters();
		});

		filterInstance.listInstance.on("renderitems", (renderedItems) => {
			// 1. Kill all previous ScrollTriggers and reset inline styles
			oldParallaxImageTimelines.forEach((tl) => {
				tl.pause(0).kill(true);
			});

			oldParallaxImageTimelines = []; // Clear the array

			// 2. Temporarily hide new filtered items
			renderedItems.forEach((item) => {
				const htmlEl = item.element;
				gsap.set(htmlEl, {
					opacity: 0,
				});
			});

			// 3. Reinitialize ScrollTriggers for filtered items
			filterImageParallaxAnimation(data);

			// 4. Smoothly reveal filtered items
			gsap.to(
				renderedItems.map((item) => item.element),
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: "power2.out",
					stagger: 0.1,
				}
			);

			// 5. Get active filter parameter for view switcher
			setSwitcherBtnUrl();

			// Optional: Call other relevant functions
			toggleTag();
			projectsListHover();

			setTimeout(() => {
				ScrollTrigger.refresh();
			}, 50);
		});
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

function disableLogoURL() {
	const logos = document.querySelectorAll('[data-disable-url="logo"]');
	if (!logos.length) return;

	pageUrl = window.location.href;

	logos.forEach((logo) => {
		logoUrl = logo.href;

		if (pageUrl === logoUrl) {
			logo.style.pointerEvents = "none";
		} else {
			logo.style.pointerEvents = "auto";
		}
	});
}

function anchorScrolls() {
	const anchorLinks = document.querySelectorAll('a[href^="#"]:not(a[href="#"])');

	if (!anchorLinks.length) return;

	anchorLinks.forEach((anchor) => {
		anchor.addEventListener("click", (e) => {
			e.preventDefault();

			// Find the closest <a> element in case of nested clicks
			const link = e.target.closest('a[href^="#"]');
			if (!link) return;

			const href = link.getAttribute("href");
			const target = document.querySelector(href);

			if (target) {
				// Use Lenis scrollTo method for smooth scrolling
				lenis.scrollTo(target, {
					duration: 1.25, // Duration of the scroll (in seconds)
					easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
				});
			}
		});
	});
}

function footerLogoMenu() {
	const logo = document.querySelector('[data-fade-logo="logo"]');
	const menu = document.querySelector('[data-footer-menu="menu"]');
	if (!logo) return;

	let tl = gsap.timeline({
		scrollTrigger: {
			trigger: "footer",
			start: `top 15%`,
			toggleActions: "play none none reverse",
			toggleClass: { targets: menu, className: "is-footer" },
		},
	});

	tl.to(logo, {
		opacity: 0,
		duration: 0.2,
		ease: "linear",
	});
}

function resetFooterLogoMenuStyles() {
	const menu = document.querySelector('[data-footer-menu="menu"]');
	const logo = document.querySelector('[data-fade-logo="logo"]');

	if (menu) {
		menu.classList.remove("is-footer");
	}

	if (logo) {
		gsap.to(logo, {
			opacity: 1,
			duration: 0.2,
			ease: "linear",
		});
	}
}

// Store references to ensure we can remove listeners
let modeLinkHandlers = new Map();
let activeLink;

function projectViewSwitcherAnimation() {
	const modeLinks = document.querySelectorAll('[data-project-view="link"]');
	if (!modeLinks.length) return;

	const navBlob = document.querySelector('[data-project-view="blob"]');

	const currentUrl = window.location.origin + window.location.pathname;

	function getLinkInfo(link) {
		return {
			width: link.offsetWidth,
			leftPosition: link.offsetLeft,
		};
	}

	function moveBlob(link) {
		const { width, leftPosition } = getLinkInfo(link);

		gsap.to(navBlob, {
			width: width,
			left: leftPosition,
			duration: 0.4,
			ease: "power1.out",
		});
	}

	function setActiveStyle(link) {
		// 1. Remove active style from previous
		if (activeLink) {
			activeLink.classList.remove("is-active");
			gsap.to(activeLink, {
				color: "var(--color--text-primary)",
				duration: 0.3,
				ease: "linear",
			});
		}

		// 2. Add style to new
		link.classList.add("is-active");
		gsap.to(link, {
			color: "var(--color--text-secondary)",
			duration: 0.5,
			ease: "linear",
		});

		// 3. Set activeLink to new
		activeLink = link;
	}

	function setActiveBtn(link) {
		moveBlob(link);
		setActiveStyle(link);
	}

	modeLinks.forEach((link) => {
		const linkUrl = link.href;
		// Set active button on initial load
		if (linkUrl === currentUrl) {
			setActiveBtn(link);
		}

		// Remove existing listener if any
		if (modeLinkHandlers.has(link)) {
			link.removeEventListener("click", modeLinkHandlers.get(link));
		}

		// Define the event handler
		const clickHandler = () => {
			if (barba.transitions.isRunning) return;
			setActiveBtn(link);
		};

		// Store the handler and add the event listener
		modeLinkHandlers.set(link, clickHandler);
		link.addEventListener("click", clickHandler);
	});
}

function projectSwitcherDisplay(data, leave = false) {
	const projectViewSwitch = document.querySelector('[data-display-switcher="switcher"]');
	if (!projectViewSwitch) return;

	const prevNamespace = data.current.namespace;
	const nextNamespace = data.next.namespace;

	function showSwitcher() {
		let tl = gsap.timeline();
		tl.to(projectViewSwitch, {
			autoAlpha: 1,
			duration: 0.5,
			delay: 0.8,
		});
	}

	function hideSwitcher() {
		let tl = gsap.timeline();
		tl.to(projectViewSwitch, {
			// opacity: 0,
			autoAlpha: 0,
			duration: 0.5,
		});
	}

	if (!leave && nextNamespace !== prevNamespace) {
		showSwitcher();
	}

	if (leave && nextNamespace !== prevNamespace) {
		hideSwitcher();
	}
}

function homePageLoader() {
	const hasLoaderRun = sessionStorage.getItem("homePageLoaderRun");
	const heroSection = document.querySelector('[data-index-loader="hero-section"]');

	if (heroSection && !hasLoaderRun) {
		// Title animation variables
		const titleWraps = heroSection.querySelectorAll('[data-index-loader="title-wrap"]');

		// Fade in elements
		const fadeInElements = document.querySelectorAll('[data-index-loader="fade"]');

		// Subheading animation variables
		const subheadingWrap = heroSection.querySelector('[data-index-loader="subheading-wrap"]');
		const subheadingLines = subheadingWrap.querySelectorAll(".line");

		// Creating master timeline
		const masterTl = gsap.timeline({
			onStart: () => {
				lenis.stop();
			},
			onComplete: () => {
				heroSection.remove();
			},
		});

		// Creating child timelines
		const linesTl = gsap.timeline();
		const subheadingTl = gsap.timeline();

		masterTl.set(heroSection, {
			autoAlpha: 1,
		});

		// There are multiple title wraps because of different mobile layout
		titleWraps.forEach((titleWrap) => {
			const titleLines = titleWrap.querySelectorAll(".home-loader_line");
			// Getting initial words for animation
			const initialWords = gsap.utils.toArray(titleWrap.querySelectorAll('[data-index-loader="initial-word"]'));

			// Add initial words tween for each titleWrap
			masterTl.from(
				initialWords,
				{
					y: "100%",
					stagger: 0.14,
					duration: 1.6,
					ease: "custom-3",
				},
				"<"
			);

			titleLines.forEach((line, index) => {
				const lineElements = line.querySelectorAll(".heading-style-h1:not(.is-initial), .title_icon");

				if (!lineElements.length) return;
				linesTl.from(
					lineElements,
					{
						y: "100%",
						duration: 1.6,
						ease: "custom-3",
					},
					index * 0.14
				);
			});

			masterTl.add(linesTl, "-=1");
		});

		masterTl.to(
			subheadingLines,
			{
				y: 0,
				stagger: 0.14,
				duration: 1.6,
				ease: "custom-3",
			},
			"<"
		);

		masterTl.from(
			fadeInElements,
			{
				opacity: 0,
				duration: 0.8,
				ease: "linear",
			},
			"<+0.4"
		);

		masterTl.add(() => {
			lenis.start();
		}, "<");
	}

	// Set the session flag to prevent rerunning
	sessionStorage.setItem("homePageLoaderRun", "true");
}

function externalUrlNewTab() {
	const links = document.querySelectorAll("a"); // Adjust selector if needed to target only specific CMS links

	if (!links.length) return;

	// Get the current site's domain
	const currentDomain = window.location.hostname;

	// Iterate over each link and check if it's external
	links.forEach((link) => {
		const url = link.href;

		// Check if the URL is external
		if (url && !url.includes(currentDomain)) {
			// Add target="_blank" for external links
			link.setAttribute("target", "_blank");
			link.setAttribute("rel", "noopener noreferrer"); // For security and performance
		}
	});
}

function footerProjectSwitcherHide() {
	const switcher = document.querySelector('[data-display-switcher="switcher"]');

	if (!switcher) return;

	let tl = gsap.timeline({
		scrollTrigger: {
			trigger: "footer",
			start: `top bottom`,
			toggleActions: "play none none reverse",
		},
	});

	tl.to(switcher, {
		opacity: 0,
		duration: 0.2,
		ease: "linear",
	});
}

function servicesMobileSwiper() {
	const swiperTarget = document.querySelector('[data-services-slider="target"]');

	if (!swiperTarget) return;

	const swiper = new Swiper(swiperTarget, {
		slidesPerView: 1.1,
		speed: 600,
		spaceBetween: 20,
		breakpoints: {
			768: {
				slidesPerView: 2.2,
			},
		},
	});
}

function cookieYesStyles() {
	function changeCloseIcon(cookiePopup) {
		const closeBtns = document.querySelectorAll(".cky-banner-btn-close, .cky-btn-close");

		closeBtns.forEach((closeBtn) => {
			const closeBtnImg = closeBtn.querySelector("img");
			closeBtnImg.remove();
			const iconWrap = document.createElement("div");
			iconWrap.innerHTML = `<svg width="100%" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M1 10.7959L11 1.00013" stroke="currentColor"/>
	<path d="M1 1.2041L11 10.9999" stroke="currentColor"/>
	</svg>
	`;
			closeBtn.appendChild(iconWrap);
		});
	}

	function enableOverflowScroll() {
		const overflowContainer = document.querySelector(".cky-preference-body-wrapper");
		overflowContainer.setAttribute("data-lenis-prevent", "");
	}

	function applyCustomCode(cookiePopup) {
		changeCloseIcon(cookiePopup);
		enableOverflowScroll();
	}

	// Mutation observer to wait for cookieYes banner to load
	const observer = new MutationObserver((mutationsList, observer) => {
		for (const mutation of mutationsList) {
			if (mutation.type === "childList") {
				const cookiePopup = document.querySelector(".cky-consent-container");
				// Check if the cookie banner is now in the DOM
				if (cookiePopup) {
					applyCustomCode(cookiePopup);
					observer.disconnect(); // Stop observing once the banner is found
					break;
				}
			}
		}
	});

	observer.observe(document.body, { childList: true, subtree: true });
}

function loadWebflowLottie() {
	// Reinitialize Webflow's Lottie animations'
	const lottie = Webflow.require("lottie");
	if (lottie) {
		lottie.init();
	}
}

function autoRefreshScrollTrigger(data) {
	const container = data && data.next ? data.next.container : document;
	const contentContainer = container.querySelector(".main-content");
	let lastHeight = contentContainer.scrollHeight;

	// Create a MutationObserver to detect changes in the DOM
	const observer = new MutationObserver(() => {
		const newHeight = contentContainer.scrollHeight;

		// If the height has changed, refresh ScrollTrigger
		if (newHeight !== lastHeight) {
			lastHeight = newHeight;
			ScrollTrigger.refresh();
		}
	});

	// Observe changes in the body and its subtree
	observer.observe(contentContainer, {
		childList: true, // Detect added/removed elements
		subtree: true, // Observe all child elements
		attributes: true, // Detect attribute changes (useful for CSS changes)
		characterData: true, // Detect text content changes
	});
}

let oldScrollTriggers;

function initBeforeEnter(data) {
	oldScrollTriggers = ScrollTrigger.getAll();

	autoRefreshScrollTrigger(data);
	projectsListHover();
	floatingProjectsListImage();
	setGSAPScroller(data);
	imageParallaxAnimation(data);
	filterImageParallaxAnimation(data);
	projectsFilters(data);
	smoothScroll(data);
	logoShrinkAnimation(data);
	setActiveUrl();
	totalProjectsCount();
	projectCategoryCounter();
	filtersDropdownAnimation(data);
	disableLogoURL();
	splitTextIntoLines(data);
	wrapLinesInMask(data);
	setTimeout(() => {
		loadWebflowLottie();
		textMaskRevealAnimation(data);
		borderAnimation(data);
		textFadeInAnimation(data);
	}, 500);
	homePageLoader();
}

function initEnter() {
	document.fonts.ready.then(() => {
		projectViewSwitcherAnimation();
	});
}

function initAfterEnter() {
	if (oldScrollTriggers) {
		oldScrollTriggers.forEach((trigger) => trigger.kill(false));
	}

	footerParallax();
	partnersMarqueeAnimation();
	customCursorAnimation();
	projectParallaxAnimation();
	projectImageMarquee();
	componentVideoURL();
	accordionAnimation();
	categoriesImagesHover();
	horizontalScroll();
	changingImages();
	hideEmptyCareerSection();
	customFormValidation();
	categoryListURLs();
	initPageSpecificPopupTriggers();
	anchorScrolls();
	footerLogoMenu();
	footerProjectSwitcherHide();
	servicesMobileSwiper();
	externalUrlNewTab();

	ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", () => {
	gsap.registerPlugin(ScrollTrigger);
	gsap.registerPlugin(CustomEase);
	CustomEase.create("custom", "M0,0 C0.204,0 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");
	CustomEase.create("custom-2", "M0,0 C0.204,0 0.192,0.6 0.35,0.75 0.5,0.9 0.7,0.98 1,1");
	CustomEase.create("custom-3", "M0,0 C0.204,0 0.231,0.447 0.323,0.618 0.368,0.702 0.51,0.878 0.606,0.918 0.668,0.943 0.801,1 1,1 ");

	// Set opacity from 0 - this prevents flickering of other animations
	gsap.set("body", {
		autoAlpha: 1,
	});
	barbaJS();
	colorModeToggle();
	menuAnimation();
	initPersistentPopup();
	cookieYesStyles();
	// Init on page load
	initBeforeEnter();
	initEnter();
	initAfterEnter();
});
