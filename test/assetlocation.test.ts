import * as fs from 'fs'
import * as path from 'path'
import { expect, test } from 'vitest'

const getAllFilesInDirectory = async (directory: string): Promise<string[]> => {
	return await fs.readdirSync(directory).map((file) => path.join(directory, file))
}

const extractImageLinks = (content: string): string[] => {
	let links: string[] = []
	const regex = /!\[[^\]]*\]\(([^)\s]+(?:\s[^)]+)?)\)/gm
	let m

	while ((m = regex.exec(content)) !== null) {
		// This is necessary to avoid infinite loops with zero-width matches
		if (m.index === regex.lastIndex) {
			regex.lastIndex++
		}

		if (m.length > 1) {
			let link = m[1]
			links.push(link)
		}
	}

	/*
	../../assets/img/posts/thriving-chaos/cycle.png 'iteration cycle'
	will become
	../../assets/img/posts/thriving-chaos/cycle.png
	*/
	links = links.map((link) => {
		if (link.endsWith("'")) {
			return link.split(" '")[0]
		}
		return link
	})

	return links
}

test('Page should link assets correctly', async () => {
	const files = await getAllFilesInDirectory('./src/content/blog')
	for (let file of files) {
		const fileContent = fs.readFileSync(file, 'utf8')
		expect(fileContent, `file ${file} should not contain references to /src/assets`).to.not.contain(
			'/src/assets'
		)
		for (let link of extractImageLinks(fileContent)) {
			expect(link, `Not allowed link: ${link}`).to.not.contain(' ')
		}
	}
})
