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
			const prevContent = prevContainer.querySelector(".barba-content");
			const nextContainer = data.next.container;
			const overlay = prevContainer.querySelector(".transition_overlay");
			const nextFooter = data.next.container.querySelector('[data-footer-parallax="content"]');
			const logo = document.querySelector('[data-logo-animation="logo"]');

			// Use the logoWidth set by the view
			const targetLogoWidth = data.next.logoWidth || "auto";
			gsap.to(
				logo,
				{
					width: targetLogoWidth,
					duration: 0.8,
					ease: "power2.inOut",
					onComplete: () => {
						lenis.start();
					},
				},
				"<"
			);

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
					oldLenis = lenis;
					await window.fsAttributes.destroy();
					await prepareCurrentContainer(data);
					oldLenis.stop();
				},

				async beforeEnter(data) {
					initBeforeEnter(data);
					await new Promise((resolve) => setTimeout(resolve, 100));
				},

				// 2. Run transition
				async enter(data) {
					// Awaiting to complete transitionIn before barba removes previous container
					lenis.stop();
					await transitionIn(data);
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

	const wrapper = nextContainer ? nextContainer : container.querySelector(".main-wrapper");
	const content = container.querySelector(".main-content");

	lenis = new Lenis({
		lerp: 0.1,
		wrapper: wrapper,
		content: content,
		eventsTarget: window,
	});

	lenis.on("scroll", ScrollTrigger.update);

	gsap.ticker.add((time) => {
		lenis.raf(time * 1000);
	});

	gsap.ticker.lagSmoothing(0);
}

// Global overlay instance
let osInstance;
let oldOsInstance;
function overlayScrollbar(data) {
	const nextContainer = data?.next?.container;
	const container = nextContainer ? nextContainer : document.querySelector(".main-wrapper");
	// Simple initialization with an element
	osInstance = OverlayScrollbars(container, {});
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
	const button = menu.querySelector('[data-menu-animation="button"]');
	const menuLinks = menu.querySelectorAll("[data-menu-link]");

	let tl = gsap.timeline({ paused: true }); // Persistent timeline

	function animateDropdown(expand) {
		// Clear the timeline and define new animation based on the state
		tl.clear();

		if (expand) {
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
				.set(".menu_dropdown", { display: "none" }); // Hide dropdown
		}

		// Play the timeline
		tl.play();
	}

	menuLinks.forEach((link) => {
		link.addEventListener("click", () => {
			animateDropdown(false);
		});
	});

	// Event listeners for hover interactions
	menu.addEventListener("mouseenter", () => {
		animateDropdown(true); // Expand if not already expanded or reversing
	});

	menu.addEventListener("mouseleave", () => {
		animateDropdown(false); // Contract if expanded or reversing
	});
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
	const dropdown = filters.querySelector('[data-filters-dropdown="dropdown"]');
	const filtersBtns = filters.querySelectorAll('[data-filters-dropdown="filter"]');

	let tl = gsap.timeline({ paused: true }); // Persistent timeline

	function animateDropdown(expand) {
		// Clear the timeline and define new animation based on the state
		tl.clear();

		if (expand) {
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
				.fromTo(".filters_form-block", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "linear" }, "<+0.3");
		} else {
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

	// Event listeners for hover interactions
	filters.addEventListener("mouseenter", () => {
		animateDropdown(true); // Expand if not already expanded or reversing
	});

	filters.addEventListener("mouseleave", () => {
		animateDropdown(false); // Contract if expanded or reversing
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
	let delayValue = 0;

	maskWraps.forEach((wrap) => {
		let tl;
		const lines = wrap.querySelectorAll(".line");
		const isInstant = wrap.hasAttribute("data-instant-animation");

		if (isInstant) {
			tl = gsap.timeline();
			delayValue = 0.5;
		} else {
			tl = gsap.timeline({
				scrollTrigger: {
					trigger: wrap,
					start: "top bottom",
				},
			});
		}

		tl.to(lines, {
			y: 0,
			stagger: 0.12,
			duration: 0.6,
			delay: delayValue,
			ease: "custom",
		});
	});
}

function textFadeInAnimation(data) {
	const container = data && data.next ? data.next.container : document;
	const targets = container.querySelectorAll('[data-fade-reveal="target"]');
	if (!targets.length) return;

	targets.forEach((target) => {
		const isInstant = target.hasAttribute("data-instant-animation");
		let tl;

		if (isInstant) {
			tl = gsap.timeline();
		} else {
			tl = gsap.timeline({
				scrollTrigger: {
					trigger: target,
					start: "top bottom",
				},
			});
		}

		tl.to(target, {
			y: 0,
			delay: 0.5,
			duration: 0.8,
			ease: "power3.out",
		});
		tl.to(
			target,
			{
				opacity: 1,
				duration: 0.6,
				ease: "linear",
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
				start: "top bottom",
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

function filterImageParallaxAnimation() {
	const imageWraps = document.querySelectorAll("[data-filter-image-parallax]");
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
	const categoryLinks = document.querySelectorAll("[data-category-link]");
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
	const headerTrigger = document.querySelector('[data-project-popup="trigger-header"]');
	if (!popupWrap || !headerTrigger) return;

	const popup = popupWrap.querySelector('[data-project-popup="popup"]');
	const overlay = popupWrap.querySelector('[data-project-popup="overlay"]');
	const popupClose = popupWrap.querySelectorAll('[data-project-popup="close"]');

	// Create the timeline for popup animation if it doesn't exist
	openTl = gsap.timeline({ paused: true, overwrite: true });
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

	// Close popup action
	const closePopup = () => {
		lenis.start();
		gsap.set(popupWrap, {
			display: "none",
		});
	};

	// Attach event listener to header trigger
	headerTrigger.addEventListener("click", () => {
		lenis.stop();
		openTl.restart();
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

function projectsListHover() {
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

	// Creating parallax image animation for each project
	filterImageParallaxAnimation();

	const [filterInstance] = filterInstances;

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
				// y: 24, // Optional: slight offset for reveal animation
			});
		});

		// 3. Reinitialize ScrollTriggers for filtered items
		filterImageParallaxAnimation();

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

		// Optional: Call other relevant functions
		toggleTag();
		projectsListHover();

		setTimeout(() => {
			ScrollTrigger.refresh();
		}, 50);
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
	const logo = document.querySelector('[data-disable-url="logo"]');
	if (!logo) return;

	pageUrl = window.location.href;
	logoUrl = logo.href;

	if (pageUrl === logoUrl) {
		logo.style.pointerEvents = "none";
	} else {
		logo.style.pointerEvents = "auto";
	}
}

let oldScrollTriggers;

function initBeforeEnter(data) {
	// Kill all ScrollTriggers but keep inline styles
	// ScrollTrigger.getAll().forEach((trigger) => trigger.kill(false));
	oldScrollTriggers = ScrollTrigger.getAll();
	setGSAPScroller(data);
	projectsFilters();
	imageParallaxAnimation(data);
	// overlayScrollbar(data);
	smoothScroll(data);
	logoShrinkAnimation(data);
	setActiveUrl();
	splitTextIntoLines(data);
	textMaskRevealAnimation(data);
	wrapLinesInMask(data);
	textFadeInAnimation(data);
	totalProjectsCount();
	projectCategoryCounter();
	filtersDropdownAnimation();
	disableLogoURL();
}

function initAfterEnter() {
	if (oldScrollTriggers) {
		oldScrollTriggers.forEach((trigger) => trigger.kill(false));
	}
	footerParallax();
	partnersMarqueeAnimation();
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
	customFormValidation();
	projectsListHover();
	categoryListURLs();
	initPageSpecificPopupTriggers();
	ScrollTrigger.refresh();
}

document.addEventListener("DOMContentLoaded", () => {
	gsap.registerPlugin(ScrollTrigger);
	gsap.registerPlugin(CustomEase);
	barbaJS();
	colorModeToggle();
	menuAnimation();
	initPersistentPopup();
	// Init on page load
	initBeforeEnter();
	initAfterEnter();
});
