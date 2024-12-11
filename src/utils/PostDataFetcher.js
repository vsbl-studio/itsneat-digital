export default class PostDataFetcher {
	constructor(dataPageUrl) {
		this.dataPageUrl = dataPageUrl;
		this.postsData = {};
	}

	async fetchData() {
		try {
			const response = await fetch(this.dataPageUrl);

			if (!response.ok) {
				throw new Error(`Failed to fetch data: ${response.status}`);
			}
			const html = await response.text();
			return html;
		} catch {
			console.error("Error fetching data");
		}
	}

	parseHTML(html) {
		const parser = new DOMParser();
		const dataDoc = parser.parseFromString(html, "text/html");

		// List of all created project categories
		const categoriesHTML = dataDoc.querySelectorAll("[data-project-category]");

		// List of all project categories inside posts
		const postsHTML = dataDoc.querySelectorAll("[data-categories-post");
		return { categoriesHTML, postsHTML };
	}

	storeCategories(categoriesHTML) {
		const categoriesList = [];
		categoriesHTML.forEach((el) => {
			const categoryName = el.getAttribute("data-project-category");
			categoriesList.push(categoryName);
			this.postsData["categories"] = categoriesList;
		});
	}

	// Insert post count into postsData
	storeProjectsCount(posts) {
		this.postsData["postsCount"] = posts.length;
	}

	storeCategoriesCount(posts) {
		// Initialize counter object
		const categoryCounts = {};
		const categories = this.postsData.categories;
		categories.forEach((category) => {
			categoryCounts[category] = 0;
		});

		// Count posts in each category
		posts.forEach((post) => {
			const postCategories = post.querySelectorAll("[data-post-category]");
			postCategories.forEach((category) => {
				const categoryValue = category.getAttribute("data-post-category");
				categoryCounts[categoryValue]++;
			});
		});

		// Insert the data to postsData
		this.postsData["categoriesCount"] = categoryCounts;
	}

	// Method to calculate posts per category
	calculateCategoryCounts(categories, posts) {
		const categoryCounts = {};

		// Initialize counts for all categories
		categories.forEach((category) => {
			categoryCounts[category] = 0;
		});

		// Count posts in each category
		posts.forEach((postCategory) => {
			if (categoryCounts[postCategory] !== undefined) {
				categoryCounts[postCategory]++;
			}
		});

		this.postsData.categoryCounts = categoryCounts; // Store category counts
	}

	async init() {
		// 1. Getting HTML from the data page
		const html = await this.fetchData();

		// 2. Parsing HTML
		const { categoriesHTML, postsHTML } = this.parseHTML(html);

		// 3. Get categories values
		this.storeCategories(categoriesHTML);

		// 4. Get total projects count inside postsData
		this.storeProjectsCount(postsHTML);

		// 5. Count projects in each category
		this.storeCategoriesCount(postsHTML);

		return this.postsData;
	}
}
