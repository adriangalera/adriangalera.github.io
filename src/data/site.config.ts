interface SiteConfig {
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	shareMessage: string
	paginationSize: number
}

export const siteConfig: SiteConfig = {
	author: 'Adrian Galera', // Site author
	title: 'agalera.eu', // Site title.
	description:
		'Adrian Galera’s blog, agalera.eu, offers insightful software development articles and practical coding tips for modern developers',
	lang: 'en-GB',
	ogLocale: 'en_GB',
	shareMessage: 'Share this post', // Message to share a post on social media
	paginationSize: 6 // Number of posts per page
}
